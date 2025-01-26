import { NextResponse } from "next/server"
import { callClaude } from "@/lib/claude"
import { callDeepseek } from "@/lib/deepseek"
import { claudeWithReasoning } from "@/lib/claude-reasoning"

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY

const TIMEOUT = 290000 // 290 seconds, just under Vercel's 300s limit

async function fetchWithTimeout(promise: Promise<any>) {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Request timed out'))
    }, TIMEOUT)
  })
  
  return Promise.race([promise, timeout])
}

async function callClaude(message: string) {
  try {
    if (!CLAUDE_API_KEY) {
      throw new Error("Claude API key not configured")
    }

    console.log("Using Claude API key:", CLAUDE_API_KEY?.slice(0, 10) + "...")

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01" // Required header
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 1024,
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: message
          }
        ]
      })
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`Claude API error: ${response.status} ${response.statusText} - ${errorBody}`)
    }

    console.log("Claude API response status:", response.status)
    const data = await response.json()
    console.log("Claude API response data:", data)
    
    if (!data.content?.[0]?.text) {
      console.error("Unexpected Claude API response:", data)
      throw new Error("Invalid response format from Claude API")
    }

    // Return in the same format as Deepseek for consistency
    return {
      content: data.content[0].text,
      reasoning: null
    }
  } catch (error) {
    console.error("Claude API error:", error)
    throw error
  }
}

async function callDeepseek(message: string) {
  try {
    console.log("Attempting Deepseek API call with key:", DEEPSEEK_API_KEY?.slice(0, 10) + "...")
    
    if (!DEEPSEEK_API_KEY) {
      throw new Error("Deepseek API key not configured")
    }

    const requestBody = {
      model: "deepseek-reasoner",
      messages: [{ role: "user", content: message }],
      max_tokens: 4096 // Default for reasoner model
    }
    
    console.log("Deepseek request body:", JSON.stringify(requestBody))

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
          "Accept": "application/json"
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
        cache: 'no-cache'
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorBody = await response.text()
        console.error("Deepseek API error response:", {
          status: response.status,
          statusText: response.statusText,
          body: errorBody
        })
        throw new Error(`Deepseek API error: ${response.status} ${response.statusText} - ${errorBody}`)
      }

      const data = await response.json()
      console.log("Deepseek API response:", data)
      
      // Handle the reasoner model's specific response format
      if (!data.choices?.[0]?.message?.content) {
        console.error("Unexpected Deepseek API response format:", data)
        throw new Error("Invalid response format from Deepseek API")
      }
      
      // Clean up response formatting
      let cleanedContent = data.choices[0].message.content
        .replace(/\\\(|\\\)/g, '') // Remove LaTeX delimiters
        .replace(/\\boxed{([^}]+)}/g, '$1') // Remove boxed formatting
        .replace(/\*\*Answer:\*\*|\*\*/g, '') // Remove markdown bold and "Answer:" text
        .replace(/\\times/g, 'x') // Replace LaTeX multiplication
        .replace(/\\frac{([^}]+)}{([^}]+)}/g, '$1/$2') // Convert fractions to simple division
        .trim()
      
      // Return both content and reasoning in a structured format
      return {
        content: cleanedContent,
        reasoning: data.choices[0].message.reasoning_content || null
      }
      
    } catch (error: any) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error("Request timed out after 30 seconds")
        }
        if (error instanceof TypeError && error.message.includes('fetch failed')) {
          console.error("Network error details:", error)
          throw new Error("Failed to connect to Deepseek API. Please check your network connection and API endpoint.")
        }
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }
  } catch (error) {
    console.error("Deepseek API error:", error)
    throw error
  }
}

async function claudeWithReasoning(message: string) {
  try {
    // First, get reasoning from Deepseek
    const deepseekResponse = await callDeepseek(message)
    const reasoning = deepseekResponse.reasoning

    if (!reasoning) {
      throw new Error("No reasoning generated from Deepseek")
    }

    // Construct enhanced prompt for Claude using RAT methodology
    const enhancedPrompt = `I want you to consider this question carefully: "${message}"

Here's a step-by-step reasoning process to consider:
${reasoning}

Based on this reasoning process, please provide a comprehensive and accurate response. 
Your response should be clear and direct, incorporating the insights from the reasoning while maintaining a natural conversational tone.
You don't need to explicitly reference the reasoning steps - just use them to inform your response.`

    // Call Claude with enhanced prompt
    const claudeResponse = await callClaude(enhancedPrompt)
    
    // Return both the enhanced response and the reasoning that led to it
    return {
      content: claudeResponse.content,
      reasoning: reasoning // Include the Deepseek reasoning that enhanced Claude's response
    }
  } catch (error) {
    console.error("Claude with reasoning error:", error)
    throw error
  }
}

export const maxDuration = 300 // Set max duration to 300 seconds

export async function POST(req: Request) {
  try {
    const { prompt, models } = await req.json()

    if (!prompt || !models || !Array.isArray(models)) {
      return NextResponse.json(
        { error: "Invalid request format - missing prompt or models array" },
        { status: 400 }
      )
    }

    console.log(`Processing request for models: ${models.join(", ")}`)
    const newResponses: Record<string, any> = {}

    try {
      await Promise.all(
        models.map(async (model) => {
          console.log(`Fetching response for ${model}...`)
          let response
          
          try {
            switch (model) {
              case "claude":
                response = await callClaude(prompt)
                break
              case "deepseek":
                response = await callDeepseek(prompt)
                break
              case "claude_reasoning":
                response = await claudeWithReasoning(prompt)
                break
              default:
                throw new Error(`Unknown model: ${model}`)
            }
            
            console.log(`Got response for ${model}:`, response)
            newResponses[model] = response
          } catch (error) {
            console.error(`Error fetching response from ${model}:`, error)
            throw error
          }
        })
      )

      return NextResponse.json(newResponses, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      })
    } catch (error) {
      console.error("Error processing models:", error)
      return NextResponse.json(
        { error: `Error processing models: ${error instanceof Error ? error.message : String(error)}` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("API route error:", error)
    return NextResponse.json(
      { error: "Invalid request format or server error" },
      { status: 400 }
    )
  }
}
