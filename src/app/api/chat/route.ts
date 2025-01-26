import { NextResponse } from "next/server"

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY

const TIMEOUT = 290000 // 290 seconds, just under Vercel's 300s limit

interface ModelResponse {
  content: string
  reasoning: string | null
}

async function callClaude(message: string): Promise<ModelResponse> {
  try {
    if (!CLAUDE_API_KEY) {
      throw new Error("Claude API key not configured")
    }

    console.log("Using Claude API key:", CLAUDE_API_KEY?.slice(0, 10) + "...")

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT)

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": CLAUDE_API_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-sonnet-20240229",
          max_tokens: 4096,
          messages: [{ role: "user", content: message }]
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`Claude API error: ${response.status} ${response.statusText} - ${errorBody}`)
      }

      const data = await response.json()
      
      if (!data.content?.[0]?.text) {
        console.error("Unexpected Claude API response:", data)
        throw new Error("Invalid response format from Claude API")
      }

      return {
        content: data.content[0].text,
        reasoning: null
      }
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error("Claude API request timed out after 290 seconds")
        }
      }
      throw error
    }
  } catch (error) {
    console.error("Claude API error:", error)
    throw error
  }
}

async function callDeepseek(message: string): Promise<ModelResponse> {
  try {
    if (!DEEPSEEK_API_KEY) {
      throw new Error("Deepseek API key not configured")
    }

    console.log("Using Deepseek API key:", DEEPSEEK_API_KEY?.slice(0, 10) + "...")

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT)

    try {
      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
          "Accept": "application/json"
        },
        body: JSON.stringify({
          model: "deepseek-reasoner",
          messages: [{ role: "user", content: message }],
          max_tokens: 4096
        }),
        signal: controller.signal,
        cache: 'no-cache'
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`Deepseek API error: ${response.status} ${response.statusText} - ${errorBody}`)
      }

      const data = await response.json()
      
      if (!data.choices?.[0]?.message?.content) {
        console.error("Unexpected Deepseek API response:", data)
        throw new Error("Invalid response format from Deepseek API")
      }

      // Clean up response formatting
      let cleanedContent = data.choices[0].message.content
        .replace(/\\\(|\\\)/g, '')
        .replace(/\\boxed{([^}]+)}/g, '$1')
        .replace(/\*\*Answer:\*\*|\*\*/g, '')
        .replace(/\\times/g, 'x')
        .replace(/\\frac{([^}]+)}{([^}]+)}/g, '$1/$2')
        .trim()

      return {
        content: cleanedContent,
        reasoning: data.choices[0].message.reasoning_content || null
      }
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error("Deepseek API request timed out after 290 seconds")
        }
      }
      throw error
    }
  } catch (error) {
    console.error("Deepseek API error:", error)
    throw error
  }
}

async function claudeWithReasoning(message: string): Promise<ModelResponse> {
  try {
    if (!CLAUDE_API_KEY) {
      throw new Error("Claude API key not configured")
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT)

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": CLAUDE_API_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-sonnet-20240229",
          max_tokens: 4096,
          messages: [
            { 
              role: "user", 
              content: `${message}\n\nPlease provide your response in two parts:\n1. Your direct answer\n2. Your reasoning process, including key considerations and assumptions`
            }
          ]
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`Claude API error: ${response.status} ${response.statusText} - ${errorBody}`)
      }

      const data = await response.json()
      const fullResponse = data.content[0].text
      
      // Split response into content and reasoning
      const parts = fullResponse.split(/\n\s*2\.\s*(?:Your )?[Rr]easoning/)
      const content = parts[0].replace(/1\.\s*(?:Your )?(?:[Dd]irect )?[Aa]nswer:?\s*/i, '').trim()
      const reasoning = parts[1]?.trim() || null

      return {
        content,
        reasoning
      }
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error("Claude API request timed out after 290 seconds")
        }
      }
      throw error
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
    const newResponses: Record<string, ModelResponse> = {}

    try {
      await Promise.all(
        models.map(async (model) => {
          console.log(`Fetching response for ${model}...`)
          let response: ModelResponse
          
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
