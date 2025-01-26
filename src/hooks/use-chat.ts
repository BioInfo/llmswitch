"use client"

import { useState, useCallback } from "react"

export type ModelType = "claude" | "deepseek" | "claude_reasoning"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  reasoning?: string | null
}

interface ApiError {
  error: string
  details?: string
}

interface ModelResponse {
  content: string
  reasoning?: string | null
}

interface ApiResponse {
  [key: string]: ModelResponse
}

// Utility function to handle fetch with timeout
const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 295000) => {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(id)
    return response
  } catch (error) {
    clearTimeout(id)
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out - the model is taking too long to respond. Please try again.')
      }
    }
    throw error
  }
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ModelType>("claude")
  const [error, setError] = useState<string | null>(null)

  const updateModel = useCallback((model: ModelType) => {
    console.log('useChat updateModel:', model)
    setSelectedModel(model)
    setMessages([])
    setError(null)
    setIsLoading(false)
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    if (isLoading) return
    if (!content.trim()) return

    setIsLoading(true)
    setError(null)

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user"
    }

    setMessages((prevMessages: Message[]) => [...prevMessages, userMessage])

    try {
      const response = await fetchWithTimeout("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache"
        },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({
          prompt: content,
          models: [selectedModel],
        }),
      })

      // Handle non-JSON responses
      const text = await response.text()
      let data: ApiResponse
      try {
        data = JSON.parse(text)
      } catch (e) {
        console.error('Failed to parse response:', text)
        throw new Error(text.includes('FUNCTION_INVOCATION_TIMEOUT') 
          ? 'The request timed out. The model is taking too long to respond. Please try again with a shorter prompt.'
          : `Invalid response format: ${text.slice(0, 100)}...`)
      }

      if (!response.ok) {
        const errorMessage = (typeof data === 'object' && 'error' in data && typeof data.error === 'string') 
          ? data.error 
          : text || "Failed to send message"
        throw new Error(errorMessage)
      }
      
      const modelResponse = data[selectedModel]
      if (!modelResponse) {
        throw new Error("No response received from model")
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: modelResponse.content,
        reasoning: modelResponse.reasoning || null,
        role: "assistant"
      }

      setMessages((prevMessages: Message[]) => [...prevMessages, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
      
      // Remove the user message if the API call failed
      setMessages((prevMessages: Message[]) => prevMessages.filter((msg: Message) => msg.id !== userMessage.id))
    } finally {
      setIsLoading(false)
    }
  }, [selectedModel, isLoading])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
    setIsLoading(false)
  }, [])

  return {
    messages,
    isLoading,
    selectedModel,
    setSelectedModel: updateModel,
    sendMessage,
    clearMessages,
    error
  }
}
