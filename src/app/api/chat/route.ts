import { NextResponse } from "next/server"

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY

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
        model: "claude-3-opus-20240229", // Updated model name
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
    return data.content[0].text
  } catch (error) {
    console.error("Claude API error:", error)
    throw error
  }
}

async function callDeepseek(message: string) {
  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: message }],
        max_tokens: 1024
      })
    })

    if (!response.ok) {
      throw new Error(`Deepseek API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error("Deepseek API error:", error)
    throw error
  }
}

export async function POST(req: Request) {
  try {
    const { message, model } = await req.json()

    if (!message) {
      return new NextResponse("Message is required", { status: 400 })
    }

    if (model === "claude" && !CLAUDE_API_KEY) {
      return new NextResponse(
        JSON.stringify({ error: "Claude API key not configured" }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (model !== "claude" && !DEEPSEEK_API_KEY) {
      return new NextResponse(
        JSON.stringify({ error: "Deepseek API key not configured" }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${model} request:`, message.slice(0, 50))

    const response = model === "claude" 
      ? await callClaude(message)
      : await callDeepseek(message)

    return NextResponse.json({
      response,
      conversationId: "test-conversation"
    })
  } catch (error) {
    console.error("API Error:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    })

    return new NextResponse(
      JSON.stringify({ 
        error: "API Error",
        details: error instanceof Error ? error.message : "Unknown error"
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}
