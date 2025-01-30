import { useState } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Message, ModelType } from "@/lib/types/models"

interface MessageListProps {
  messages: Message[]
  selectedModel?: ModelType
  isLoading?: boolean
}

export function MessageList({ messages, selectedModel, isLoading }: MessageListProps) {
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({})

  // Filter messages by selected model if one is specified
  const filteredMessages = selectedModel
    ? messages.filter(msg => !msg.modelType || msg.modelType === selectedModel)
    : messages

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-sm text-muted-foreground">Loading chat history...</p>
        </div>
      </div>
    )
  }

  const toggleReasoning = (messageId: string) => {
    setExpandedReasoning(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }))
  }

  return (
    <div className="space-y-4">
      {filteredMessages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.role === "assistant" ? "justify-start" : "justify-end"
          }`}
        >
          <div
            className={`rounded-lg px-4 py-2 max-w-[80%] ${
              message.role === "assistant"
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
          >
            <div className="prose prose-sm dark:prose-invert max-w-none break-words">
              {message.content}
              {message.reasoning && message.role === "assistant" && (
                <div className="mt-2 border-t border-primary-foreground/20 pt-2">
                  <button
                    onClick={() => toggleReasoning(message.id)}
                    className="flex items-center gap-1 text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  >
                    {expandedReasoning[message.id] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    Reasoning
                  </button>
                  {expandedReasoning[message.id] && (
                    <div className="mt-2 text-sm text-primary-foreground/90">
                      {message.reasoning}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      {!isLoading && filteredMessages.length === 0 && (
        <div className="text-center text-muted-foreground">
          No messages yet. Start a conversation!
        </div>
      )}
    </div>
  )
}