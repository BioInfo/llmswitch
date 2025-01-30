import axios from "axios"
import { ModelResponse } from "../types/models"

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY
const TIMEOUT = 290000 // 290 seconds

export async function callClaude(message: string): Promise<ModelResponse> {
  const model = "claude"
  try {
    if (!CLAUDE_API_KEY) {
      throw new Error("Claude API key not configured")
    }

    console.log(`Calling ${model} API with key:`, CLAUDE_API_KEY?.slice(0, 10) + "...")

    const axiosInstance = axios.create({
      timeout: TIMEOUT,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01"
      }
    })

    const response = await axiosInstance.post("https://api.anthropic.com/v1/messages", {
      model: "claude-3-sonnet-20240229",
      max_tokens: 4096,
      messages: [{ role: "user", content: message }]
    })

    if (!response.data?.content?.[0]?.text) {
      throw new Error(`Invalid response format from ${model} API`)
    }

    return {
      content: response.data.content[0].text,
      reasoning: null
    }
  } catch (error) {
    console.error(`${model} API error:`, error)
    throw error
  }
}

export async function claudeWithReasoning(message: string, deepseekReasoning?: string): Promise<ModelResponse> {
  const model = "claude_reasoning"
  try {
    if (!CLAUDE_API_KEY) {
      throw new Error("Claude API key not configured")
    }

    console.log(`Calling ${model} API with key:`, CLAUDE_API_KEY?.slice(0, 10) + "...")

    const axiosInstance = axios.create({
      timeout: TIMEOUT,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01"
      }
    })

    // Only enhance the prompt if we have Deepseek's reasoning
    const enhancedPrompt = deepseekReasoning 
      ? `I'll share an analysis of this question, along with the reasoning process that led to it. Consider this reasoning and use it to inform your own response, while maintaining your independent judgment:

${deepseekReasoning}

With that reasoning process in mind, please provide your own analysis of this question:

${message}

Note: While you should consider the reasoning provided above, please form your own independent analysis and conclusions. You may agree or disagree with aspects of the reasoning, and should explain your own thought process.`
      : message

    const response = await axiosInstance.post("https://api.anthropic.com/v1/messages", {
      model: "claude-3-sonnet-20240229",
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: enhancedPrompt
      }]
    })

    if (!response.data?.content?.[0]?.text) {
      throw new Error(`Invalid response format from ${model} API`)
    }

    return {
      content: response.data.content[0].text.trim(),
      reasoning: deepseekReasoning || null // Store the Deepseek reasoning that enhanced this response
    }
  } catch (error) {
    console.error(`${model} with reasoning error:`, error)
    throw error
  }
}