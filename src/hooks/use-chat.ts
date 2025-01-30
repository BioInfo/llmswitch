"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import {
  getCachedSessions,
  setCachedSessions,
  getCachedMessages,
  setCachedMessages,
  invalidateSessionCache,
  invalidateMessageCache
} from "@/lib/utils/cache"

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
  const PAGE_SIZE = 20 // Number of messages to load per page

  // State declarations
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    if (typeof window === 'undefined') return []
    return getCachedSessions() || []
  })
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ModelType>("claude")
  const [error, setError] = useState<string | null>(null)
  const [isNewChat, setIsNewChat] = useState(true)
  const [hasMoreMessages, setHasMoreMessages] = useState(false)

  // Refs for pagination
  const currentPage = useRef(0)
  
  // Get current session's messages with pagination
  const messages = activeSessionId
    ? sessions.find(s => s.id === activeSessionId)?.messages || []
    : []
  const loadSessionMessages = useCallback(async (sessionId: string, page: number = 0) => {
    try {
      const cachedMessages = getCachedMessages(sessionId)
      if (cachedMessages) {
        const session = sessions.find(s => s.id === sessionId)
        if (session) {
          session.messages = cachedMessages
          setSessions([...sessions])
          return
        }
      }

      const response = await fetchWithTimeout(`/api/messages?sessionId=${sessionId}&page=${page}&pageSize=${PAGE_SIZE}`, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        }
      })
      const data = await response.json()
      
      if (data.messages) {
        const session = sessions.find(s => s.id === sessionId)
        if (session) {
          session.messages = page === 0 ? data.messages : [...session.messages, ...data.messages]
          setSessions([...sessions])
          setCachedMessages(sessionId, session.messages)
          setHasMoreMessages(data.messages.length === PAGE_SIZE)
        }
      }
    } catch (error) {
      console.error("Error loading session messages:", error)
      setError(error instanceof Error ? error.message : "Failed to load messages")
    }
  }, [sessions])

  const loadSessions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    let retryAttempt = 0

    const attemptLoad = async (): Promise<void> => {
      try {
        // First check cache
        const cachedSessions = getCachedSessions()
        if (cachedSessions) {
          setSessions(cachedSessions)
          if (!activeSessionId && !isNewChat && cachedSessions.length > 0) {
            const mostRecent = cachedSessions.reduce((latest: ChatSession | null, session: ChatSession) => {
              return !latest || new Date(session.updated_at) > new Date(latest.updated_at)
                ? session
                : latest
            }, null)
            if (mostRecent) {
              setActiveSessionId(mostRecent.id)
              setSelectedModel(mostRecent.model_type)
            }
          }
          return
        }

        // If no cache, fetch from API
        const response = await fetchWithTimeout("/api/sessions", {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
          }
        })
        const data = await response.json()
        
        // Filter and process sessions
        const filteredSessions = data.sessions.filter((session: ChatSession) => session.messages.length > 0)
        setSessions(filteredSessions)
        setCachedSessions(filteredSessions)
        
        // Set active session if needed
        if (!activeSessionId && !isNewChat && filteredSessions.length > 0) {
          const mostRecent = filteredSessions.reduce((latest: ChatSession | null, session: ChatSession) => {
            return !latest || new Date(session.updated_at) > new Date(latest.updated_at)
              ? session
              : latest
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

      // Ensure we have a valid session ID
      if (!currentSessionId) {
        throw new Error("No active session ID")
      }

      // Create the user message object
      const userMessage: Message = {
        id: crypto.randomUUID(),
        content,
        role: "user",
        chatSessionId: currentSessionId,
        createdAt: new Date().toISOString()
      }

      // Optimistically update local state and cache
      const currentSession = sessions.find(s => s.id === currentSessionId)
      if (currentSession) {
        currentSession.messages = [...currentSession.messages, userMessage]
        setSessions([...sessions])
        setCachedMessages(currentSessionId, currentSession.messages)
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

      // Create the assistant message object
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        content: modelResponse.content,
        role: "assistant",
        reasoning: modelResponse.reasoning,
        chatSessionId: currentSessionId,
        createdAt: new Date().toISOString()
      }

      // Update local state and cache with the assistant's response
      if (currentSession) {
        currentSession.messages = [...currentSession.messages, assistantMessage]
        setSessions([...sessions])
        setCachedMessages(currentSessionId, currentSession.messages)
      }

      // Reset pagination for the active session
      currentPage.current = 0
      setHasMoreMessages(false)

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

  const loadMoreMessages = useCallback(async () => {
    if (!activeSessionId || !hasMoreMessages || isLoading) return;
    
    const nextPage = currentPage.current + 1;
    setIsLoading(true);
    
    try {
      await loadSessionMessages(activeSessionId, nextPage);
      currentPage.current = nextPage;
    } catch (error) {
      console.error("Error loading more messages:", error);
      setError(error instanceof Error ? error.message : "Failed to load more messages");
    } finally {
      setIsLoading(false);
    }
  }, [activeSessionId, hasMoreMessages, isLoading, loadSessionMessages]);

  // Reset pagination when switching sessions
  useEffect(() => {
    currentPage.current = 0;
    setHasMoreMessages(false);
    if (activeSessionId) {
      loadSessionMessages(activeSessionId, 0);
    }
  }, [activeSessionId, loadSessionMessages]);

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
    isNewChat,
    hasMoreMessages,
    loadMoreMessages
  }
}
