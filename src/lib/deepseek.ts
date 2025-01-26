const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY

export async function callDeepseek(prompt: string) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY is not configured")
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 290000) // 290 seconds

  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 4096
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Deepseek API error: ${error}`)
    }

    const data = await response.json()
    
    return {
      content: data.choices[0].message.content,
      reasoning: null
    }
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Deepseek API request timed out after 290 seconds")
      }
      throw error
    }
    throw new Error("Unknown error occurred while calling Deepseek API")
  }
} 