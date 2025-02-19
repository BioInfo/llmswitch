"use client"

import { useState, useCallback, useRef } from "react"
import { Message, ModelType } from "@/lib/types/chat"
import { fetchWithTimeout, getErrorMessage, DEFAULT_HEADERS } from "@/lib/utils/api"
import {
  getCachedMessages,
  setCachedMessages,
  invalidateMessageCache
} from "@/lib/utils/cache"

const PAGE_SIZE = 20 // Number of messages to load per page

interface UseMessagesProps {
  activeSessionId: string | null
  selectedModel: ModelType
  isLoading: boolean
  createNewSession: (model: ModelType, title: string) => Promise<any>
}

export function useMessages({
  activeSessionId,
  selectedModel,
  isLoading,
  createNewSession
}: UseMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const currentPage = useRef(0)

  const loadSessionMessages = useCallback(async (sessionId: string, page: number = 0) => {
    try {
      const cachedMessages = getCachedMessages(sessionId)
      if (cachedMessages) {
        setMessages(cachedMessages)
        return
      }

      const response = await fetchWithTimeout(`/api/messages?sessionId=${sessionId}&page=${page}&pageSize=${PAGE_SIZE}`, {
        headers: DEFAULT_HEADERS
      })
      const data = await response.json()
      
      if (data.messages) {
        setMessages(prevMessages => {
          const updatedMessages = page === 0
            ? data.messages
            : [...prevMessages, ...data.messages];
          setCachedMessages(sessionId, updatedMessages);
          return updatedMessages;
        });
        setHasMoreMessages(data.messages.length === PAGE_SIZE)
      }
    } catch (error) {
      console.error("Error loading session messages:", error)
      setError(getErrorMessage(error))
    }
  }, [messages])

  const loadMoreMessages = useCallback(async () => {
    if (!activeSessionId || !hasMoreMessages || isLoading) return;
    
    const nextPage = currentPage.current + 1;
    
    try {
      await loadSessionMessages(activeSessionId, nextPage);
      currentPage.current = nextPage;
    } catch (error) {
      console.error("Error loading more messages:", error);
      setError(getErrorMessage(error));
    }
  }, [activeSessionId, hasMoreMessages, isLoading, loadSessionMessages]);

  const sendMessage = useCallback(async (content: string) => {
    if (isLoading || !content.trim()) return
    let currentSessionId = activeSessionId

    try {
      if (!currentSessionId) {
        const title = content.slice(0, 50) + (content.length > 50 ? "..." : "")
        const newSession = await createNewSession(selectedModel, title)
        if (!newSession) {
          throw new Error("Failed to create new chat session")
        }
        currentSessionId = newSession.id
      }

      if (!currentSessionId) {
        throw new Error("No active session ID")
      }

      // Create and add user message
      const userMessage: Message = {
        id: crypto.randomUUID(),
        content,
        role: "user",
        chatSessionId: currentSessionId,
        createdAt: new Date().toISOString()
      }
      const sessionId = currentSessionId; // Create a new variable to hold the non-null value
      if (sessionId) {
        setMessages(prevMessages => {
          const updatedMessages = [...prevMessages, userMessage];
          setCachedMessages(sessionId, updatedMessages);
          return updatedMessages;
        });
      }

      // Send message to API
      const response = await fetchWithTimeout("/api/chat", {
        method: "POST",
        headers: DEFAULT_HEADERS,
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

      // Add assistant message
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        content: modelResponse.content,
        role: "assistant",
        reasoning: modelResponse.reasoning,
        chatSessionId: currentSessionId,
        createdAt: new Date().toISOString()
      }

      // Ensure we have a valid session ID before updating cache
      // Ensure we have a valid session ID before updating cache
      const sessionToUpdate = currentSessionId; // Use a different name for the temporary variable
      if (sessionToUpdate) {
        setMessages(prevMessages => {
          const updatedMessages = [...prevMessages, assistantMessage];
          setCachedMessages(sessionId, updatedMessages);
          return updatedMessages;
        });
      }

      // Reset pagination
      currentPage.current = 0
      setHasMoreMessages(false)

    } catch (error) {
      console.error("Error sending message:", error)
      setError(getErrorMessage(error))
    }
  }, [activeSessionId, selectedModel, isLoading, messages, createNewSession])

  return {
    messages,
    setMessages,
    hasMoreMessages,
    error,
    setError,
    loadSessionMessages,
    loadMoreMessages,
    sendMessage,
    currentPage
  }
}