const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY

export async function callClaude(prompt: string) {
  if (!CLAUDE_API_KEY) {
    throw new Error("CLAUDE_API_KEY is not configured")
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 290000) // 290 seconds

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
        messages: [{ role: "user", content: prompt }]
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Claude API error: ${error}`)
    }

    const data = await response.json()
    
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
      throw error
    }
    throw new Error("Unknown error occurred while calling Claude API")
  }
} 