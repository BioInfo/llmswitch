"use client"

import React from "react"
import { useChat, ModelType } from "@/hooks/use-chat"
import { MessageList } from "@/components/chat/message-list"
import { ChatInput } from "@/components/chat/chat-input"
import { ModelSelector } from "@/components/chat/model-selector"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { XCircle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ChatInterface() {
  const {
    messages,
    isLoading,
    selectedModel,
    setSelectedModel,
    sendMessage,
    clearMessages,
    error
  } = useChat()

  const handleModelChange = React.useCallback((model: ModelType) => {
    console.log('Changing model to:', model)
    clearMessages()
    setSelectedModel(model)
  }, [setSelectedModel, clearMessages])

  return (
    <div className="w-full rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
        <div className="space-y-1">
          <h3 className="font-semibold leading-none tracking-tight">
            Chat
          </h3>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Processing..." : "Ready to chat"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative z-50">
            <ModelSelector
              value={selectedModel}
              onChange={handleModelChange}
            />
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearMessages}
              className="h-8 w-8"
              title="Clear conversation"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Clear conversation</span>
            </Button>
          )}
        </div>
      </div>
      <div className="p-6 pt-0">
        <div className="h-[600px] space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                <p>{error}</p>
              </div>
            </div>
          )}
          <div className="flex gap-4 h-[calc(100%-80px)]">
            <div className="flex-1 overflow-auto rounded-md border bg-muted/50 p-4">
              <MessageList messages={messages} />
            </div>
            {(selectedModel === "deepseek" || selectedModel === "claude_reasoning") && (
              <div className="w-80 overflow-auto rounded-md border bg-muted/50 p-4">
                <div className="sticky top-0 bg-muted/50 pb-2 mb-2 border-b">
                  <h4 className="font-semibold text-sm">
                    {selectedModel === "deepseek" ? "Reasoning Process" : "Enhanced with Reasoning"}
                  </h4>
                </div>
                <div className="space-y-4 text-sm">
                  {messages.map((message) => (
                    message.reasoning && (
                      <div key={message.id} className="prose prose-sm max-w-none">
                        <div className="text-xs text-muted-foreground mb-1">
                          For message: {message.content.slice(0, 50)}...
                        </div>
                        {message.reasoning}
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            {isLoading && (
              <div className="absolute right-4 top-3 z-10">
                <LoadingSpinner size="sm" className="text-muted-foreground" />
              </div>
            )}
            <ChatInput onSend={sendMessage} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  )
}
