"use client"

import { useState, useCallback, useEffect } from "react"

export type ModelType = "claude" | "deepseek" | "claude_reasoning"

export interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  reasoning?: string | null
  chatSessionId: string
  createdAt: string
}

export interface ChatSession {
  id: string
  title: string
  model_type: ModelType
  messages: Message[]
  created_at: string
  updated_at: string
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

const API_TIMEOUT = 30000 // 30 seconds timeout for API calls
const MAX_RETRIES = 3

async function fetchWithTimeout(url: string, options: RequestInit) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      let errorMessage = "Failed to fetch"
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorData.details || response.statusText
      } catch {
        errorMessage = response.statusText
      }
      throw new Error(errorMessage)
    }

    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Request timed out")
      }
    }
    throw error
  }
}

export function useChat() {
  // State declarations
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ModelType>("claude")
  const [error, setError] = useState<string | null>(null)
  const [isNewChat, setIsNewChat] = useState(true) // Start in new chat state by default

  // Get current session's messages
  const messages = activeSessionId 
    ? sessions.find(s => s.id === activeSessionId)?.messages || []
    : []
const loadSessions = useCallback(async () => {

    setIsLoading(true)
    setError(null)
    let retryAttempt = 0

    const attemptLoad = async (): Promise<void> => {
      try {
        const response = await fetchWithTimeout("/api/sessions", {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
          }
        })
        const data = await response.json()
        // Filter out sessions with no messages
        const filteredSessions = data.sessions.filter((session: ChatSession) => session.messages.length > 0)
        setSessions(filteredSessions)
        
        // Set active session to most recent if none selected and not in new chat state
        if (!activeSessionId && !isNewChat && filteredSessions.length > 0) {
          const mostRecent = filteredSessions.reduce((latest: ChatSession | null, session: ChatSession) => {
            if (!latest || new Date(session.updated_at) > new Date(latest.updated_at)) {
              return session
            }
            return latest
          }, null)
          if (mostRecent) {
            setActiveSessionId(mostRecent.id)
            setSelectedModel(mostRecent.model_type)
          }
        }
      } catch (error) {
        console.error("Error loading sessions:", error)
        if (retryAttempt < MAX_RETRIES) {
          retryAttempt++
          const delay = Math.pow(2, retryAttempt) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
          return attemptLoad()
        }
        setError(error instanceof Error ? error.message : "Failed to load chat history")
      }
    }

    await attemptLoad()
    setIsLoading(false)
  }, [activeSessionId, isNewChat])

  const createNewSession = useCallback(async (model: ModelType, title: string = "New Chat") => {
    try {
      setError(null)
      const response = await fetchWithTimeout("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          model_type: model,
          title
        }),
      })
      
      const newSession = await response.json()
      setSessions(prev => [...prev, newSession])
      setActiveSessionId(newSession.id)
      setSelectedModel(model)
      setIsNewChat(false) // Clear new chat state when creating a session
      return newSession
    } catch (error) {
      console.error("Error creating new session:", error)
      setError(error instanceof Error ? error.message : "Failed to create new chat session")
      return null
    }
  }, [])

  const updateModel = useCallback((model: ModelType) => {
    setSelectedModel(model)
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    if (isLoading || !content.trim()) return
    setIsLoading(true)
    setError(null)

    try {
      // If no active session, create a new one
      let currentSessionId = activeSessionId
      if (!currentSessionId) {
        // Create new session with first message as title
        const title = content.slice(0, 50) + (content.length > 50 ? "..." : "")
        const newSession = await createNewSession(selectedModel, title)
        if (!newSession) {
          throw new Error("Failed to create new chat session")
        }
        currentSessionId = newSession.id
        setActiveSessionId(currentSessionId)
        setIsNewChat(false) // Clear new chat state when sending first message
      }

      const response = await fetchWithTimeout("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
        body: JSON.stringify({
          sessionId: currentSessionId,
          prompt: content,
          models: [selectedModel],
        }),
      })

      const data = await response.json()
      const modelResponse = data[selectedModel]
      if (!modelResponse) {
        throw new Error("No response received from model")
      }

      // Reload sessions to get updated messages
      await loadSessions()

    } catch (error) {
      console.error("Error sending message:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }, [activeSessionId, selectedModel, isLoading, loadSessions, createNewSession])

  const switchSession = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      setActiveSessionId(sessionId)
      setSelectedModel(session.model_type)
      setError(null)
      setIsNewChat(false) // Clear new chat state when switching sessions
    }
  }, [sessions])

  const startNewChat = useCallback(() => {
    setActiveSessionId(null)
    setSelectedModel("claude")
    setIsNewChat(true) // Set new chat flag to prevent auto-loading most recent session
  }, [])

  const deleteSession = useCallback(async (sessionId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetchWithTimeout(`/api/sessions?id=${sessionId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete session");
      }
      // Optimistically update sessions state
      setSessions(prevSessions => prevSessions.filter(session => session.id !== sessionId));
      if (activeSessionId === sessionId) {
        startNewChat(); // Start new chat if the active session was deleted
      }
    } catch (error) {
      console.error("Error deleting session:", error)
      setError(error instanceof Error ? error.message : "Failed to delete chat session");
    } finally {
      setIsLoading(false);
    }
  }, [activeSessionId, startNewChat])

  // Load sessions on mount
  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  return {
    messages,
    sessions,
    setSessions,
    activeSessionId,
    isLoading,
    selectedModel,
    setSelectedModel: updateModel,
    sendMessage,
    switchSession,
    startNewChat,
    deleteSession,
    error,
    setError,
    isNewChat
  }
}
