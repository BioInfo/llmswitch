const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY

export async function claudeWithReasoning(prompt: string) {
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
        messages: [
          { 
            role: "user", 
            content: `${prompt}\n\nPlease provide your response in two parts:\n1. Your direct answer\n2. Your reasoning process, including key considerations and assumptions`
          }
        ]
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Claude API error: ${error}`)
    }

    const data = await response.json()
    const fullResponse = data.content[0].text
    
    // Split response into content and reasoning
    const parts = fullResponse.split(/\n\s*2\.\s*(?:Your )?[Rr]easoning/);
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
      throw error
    }
    throw new Error("Unknown error occurred while calling Claude API")
  }
} 