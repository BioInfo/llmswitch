"use client"

import React from 'react'
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSend: (content: string) => void
  isLoading?: boolean
  placeholder?: string
}

export function ChatInput({ 
  onSend, 
  isLoading = false,
  placeholder = "Send a message..."
}: ChatInputProps) {
  const [input, setInput] = React.useState("")
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const handleSubmit = React.useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    onSend(input)
    setInput("")
    
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }, [input, isLoading, onSend])

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }, [handleSubmit])

  const handleTextareaChange = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target
    setInput(textarea.value)

    // Auto-resize textarea
    textarea.style.height = "auto"
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [])

  return (
    <form onSubmit={handleSubmit} className="relative">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={handleTextareaChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        disabled={isLoading}
        className={cn(
          "w-full resize-none rounded-lg border border-input bg-background px-4 py-3",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "min-h-[56px] max-h-[200px]",
          "pr-20" // Space for the send button
        )}
      />
      <button
        type="submit"
        disabled={!input.trim() || isLoading}
        className={cn(
          "absolute right-2 top-[13px]",
          "rounded-md px-3 py-2 text-sm font-semibold",
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:pointer-events-none disabled:opacity-50",
          "transition-opacity"
        )}
      >
        Send
      </button>
    </form>
  )
}