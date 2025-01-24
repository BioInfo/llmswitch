"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
}

interface MessageListProps {
  messages: Message[]
}

const BotIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
  >
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M15 13v2" />
    <path d="M9 13v2" />
  </svg>
)

const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

export function MessageList({ messages }: MessageListProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (!messages.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <p className="text-lg font-medium">Welcome to LLMSwitch!</p>
        <p className="text-sm text-muted-foreground text-center">
          Start a conversation by typing a message below.
          <br />
          You can switch between Deepseek and Claude using the selector above.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-4">
      {messages.map((message, index) => (
        <div
          key={message.id}
          className={cn(
            "flex items-start gap-4 rounded-lg px-4 py-2 transition-colors",
            message.role === "assistant" 
              ? "bg-primary/5 text-foreground" 
              : "bg-background"
          )}
        >
          <div className={cn(
            "rounded-full p-2",
            message.role === "assistant" 
              ? "bg-primary/10 text-primary" 
              : "bg-muted text-muted-foreground"
          )}>
            {message.role === "assistant" ? <BotIcon /> : <UserIcon />}
          </div>
          <div className="flex-1 space-y-2 overflow-hidden">
            <p className={cn(
              "text-sm leading-relaxed break-words",
              index === messages.length - 1 && message.role === "assistant" 
                ? "animate-in fade-in-50" 
                : ""
            )}>
              {message.content}
            </p>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}