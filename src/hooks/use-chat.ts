"use client"

import { useState, useCallback } from "react"

export type ModelType = "claude" | "deepseek"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
}

interface ApiError {
  error: string
  details?: string
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

    setMessages(prevMessages => [...prevMessages, userMessage])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          model: selectedModel,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = (data as ApiError).details || (data as ApiError).error || "Failed to send message"
        throw new Error(errorMessage)
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: "assistant"
      }

      setMessages(prevMessages => [...prevMessages, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
      
      // Remove the user message if the API call failed
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== userMessage.id))
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
