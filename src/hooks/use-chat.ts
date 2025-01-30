"use client"

import { useEffect } from "react"
import { Message } from "@/lib/types/chat"
import { useSessions } from "./use-sessions"
import { useMessages } from "./use-messages"

export type { Message, ChatSession, ModelType } from "@/lib/types/chat"

export function useChat() {
  const {
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
  } = useSessions()

  const {
    messages,
    hasMoreMessages,
    loadSessionMessages,
    loadMoreMessages,
    sendMessage
  } = useMessages({
    activeSessionId,
    selectedModel,
    isLoading,
    createNewSession
  })

  // Load sessions on mount
  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  // Load messages when session changes
  useEffect(() => {
    if (activeSessionId) {
      loadSessionMessages(activeSessionId, 0)
    }
  }, [activeSessionId, loadSessionMessages])

  return {
    // Session-related
    sessions,
    setSessions,
    activeSessionId,
    selectedModel,
    setSelectedModel,
    isNewChat,
    switchSession,
    startNewChat,
    deleteSession,

    // Message-related
    messages,
    sendMessage,
    hasMoreMessages,
    loadMoreMessages,

    // Status
    isLoading,
    error,
    setError
  }
}
