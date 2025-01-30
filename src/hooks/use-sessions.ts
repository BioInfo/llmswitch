"use client"

import { useState, useCallback } from "react"
import { ChatSession, ModelType } from "@/lib/types/chat"
import { fetchWithTimeout, getErrorMessage, DEFAULT_HEADERS } from "@/lib/utils/api"
import {
  getCachedSessions,
  setCachedSessions,
  invalidateSessionCache
} from "@/lib/utils/cache"

export function useSessions() {
  // State declarations
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    if (typeof window === 'undefined') return []
    return getCachedSessions() || []
  })
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<ModelType>("claude")
  const [isNewChat, setIsNewChat] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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
          headers: DEFAULT_HEADERS
        })
        const data = await response.json()
        
        const filteredSessions = data.sessions.filter((session: ChatSession) => session.messages.length > 0)
        setSessions(filteredSessions)
        setCachedSessions(filteredSessions)
        
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
        throw error
      }
    }

    try {
      await attemptLoad()
    } catch (error) {
      setError(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [activeSessionId, isNewChat])

  const createNewSession = useCallback(async (model: ModelType, title: string = "New Chat") => {
    try {
      setError(null)
      const response = await fetchWithTimeout("/api/sessions", {
        method: "POST",
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({ 
          model_type: model,
          title
        }),
      })
      
      const newSession = await response.json()
      setSessions(prev => [...prev, newSession])
      setActiveSessionId(newSession.id)
      setSelectedModel(model)
      setIsNewChat(false)
      return newSession
    } catch (error) {
      console.error("Error creating new session:", error)
      setError(getErrorMessage(error))
      return null
    }
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
      setSessions(prevSessions => prevSessions.filter(session => session.id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null)
        setSelectedModel("claude")
        setIsNewChat(true)
      }
    } catch (error) {
      console.error("Error deleting session:", error)
      setError(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [activeSessionId])

  const switchSession = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      setActiveSessionId(sessionId)
      setSelectedModel(session.model_type)
      setError(null)
      setIsNewChat(false)
    }
  }, [sessions])

  const startNewChat = useCallback(() => {
    setActiveSessionId(null)
    setSelectedModel("claude")
    setIsNewChat(true)
  }, [])

  return {
    sessions,
    setSessions,
    activeSessionId,
    selectedModel,
    setSelectedModel,
    isNewChat,
    error,
    setError,
    isLoading,
    loadSessions,
    createNewSession,
    deleteSession,
    switchSession,
    startNewChat
  }
}