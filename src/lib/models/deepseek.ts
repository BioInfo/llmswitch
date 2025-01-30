import axios from "axios"
import { ModelResponse } from "../types/models"

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const TIMEOUT = 290000 // 290 seconds

interface DeepseekResponse {
  choices: Array<{
    message: {
      content: string
      reasoning_content?: string
    }
  }>
}

export async function callDeepseek(message: string): Promise<ModelResponse> {
  const model = "deepseek"
  try {
    if (!DEEPSEEK_API_KEY) {
      throw new Error("Deepseek API key not configured")
    }

    console.log(`Calling ${model} API with key:`, DEEPSEEK_API_KEY?.slice(0, 10) + "...")

    const axiosConfig = {
      timeout: TIMEOUT,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
        "Accept": "application/json"
      }
    }

    const axiosInstance = axios.create(axiosConfig)

    // Add retry interceptor with exponential backoff
    axiosInstance.interceptors.response.use(undefined, async (err) => {
      const config = err.config

      if (!config) {
        return Promise.reject(err)
      }

      config.retry = config.retry ?? 3
      config.retryCount = config.retryCount ?? 0
      config.retryDelay = config.retryDelay ?? 1000

      if (config.retryCount >= config.retry) {
        return Promise.reject(err)
      }

      config.retryCount += 1
      console.log(`${model} API retry attempt ${config.retryCount}/${config.retry}...`)

      const delay = config.retryDelay * Math.pow(2, config.retryCount - 1)
      await new Promise(resolve => setTimeout(resolve, delay))

      return axiosInstance(config)
    })

    const requestBody = {
      model: "deepseek-reasoner", // Use the reasoner model
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that provides thoughtful and well-reasoned responses. Before giving your answer, use Chain of Thought reasoning to think through the problem step by step."
        },
        { 
          role: "user", 
          content: message 
        }
      ],
      max_tokens: 4096,
      stream: false
    }

    // Log request details (without sensitive data)
    console.log(`${model} API request:`, {
      url: "https://api.deepseek.com/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": "Bearer [REDACTED]"
      },
      data: {
        ...requestBody,
        messages: requestBody.messages.map(m => ({ role: m.role, content: m.content.slice(0, 50) + "..." }))
      }
    })

    const response = await axiosInstance.post<DeepseekResponse>(
      "https://api.deepseek.com/v1/chat/completions",
      requestBody
    )

    // Log response details for debugging
    console.log(`${model} API response status:`, response.status)
    console.log(`${model} API response headers:`, response.headers)

    // Validate response data
    if (!response.data) {
      console.error(`${model} API empty response data`)
      throw new Error(`Empty response from ${model} API`)
    }

    console.log(`${model} API raw response:`, JSON.stringify(response.data, null, 2))

    if (!response.data.choices?.[0]?.message?.content) {
      console.error(`${model} API invalid response format:`, response.data)
      throw new Error(`Invalid response format from ${model} API`)
    }

    const { content, reasoning_content } = response.data.choices[0].message

    // Ensure we have valid content
    if (!content || content.trim() === '') {
      console.error(`${model} API empty content`)
      throw new Error(`Empty content from ${model} API`)
    }

    // Return both the response and reasoning
    return { 
      content: content.trim(), 
      reasoning: reasoning_content?.trim() || null
    }

  } catch (error) {
    // Enhanced error logging
    console.error(`${model} API error:`, {
      error,
      requestConfig: {
        url: "https://api.deepseek.com/v1/chat/completions",
        timeout: TIMEOUT,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": "Bearer [REDACTED]"
        }
      },
      errorDetails: axios.isAxiosError(error) ? {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      } : undefined
    })

    if (axios.isAxiosError(error)) {
      throw new Error(
        `${model} API error: ${error.response?.status} ${error.response?.statusText} - ${JSON.stringify(error.response?.data || error.message)}`
      )
    }
    throw error
  }
}