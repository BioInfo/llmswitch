"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { useChat, ModelType, ChatSession as ChatSessionType } from "@/hooks/use-chat"
import { MessageList } from "@/components/chat/message-list"
import { ChatInput } from "@/components/chat/chat-input"
import { ModelSelector } from "@/components/chat/model-selector"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { XCircle, Plus, MessageCircle, MoreVertical, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"

export function ChatInterface() {
  const {
    messages,
    sessions,
    setSessions,
    activeSessionId,
    isLoading,
    selectedModel,
    setSelectedModel,
    sendMessage,
    switchSession,
    startNewChat,
    error,
    setError,
    deleteSession,
    isNewChat
  } = useChat()

  const handleModelChange = React.useCallback((model: ModelType) => {
    console.log('Changing model to:', model)
    setSelectedModel(model)
  }, [setSelectedModel])

  const handleNewChat = React.useCallback(() => {
    startNewChat()
  }, [startNewChat])

  const handleDeleteSession = React.useCallback((sessionId: string) => {
    console.log("Deleting session:", sessionId);
    deleteSession(sessionId)
  }, [deleteSession])

  const handleRenameSession = React.useCallback(async (sessionId: string) => {
    const newTitle = prompt("Enter new title for the chat session:");
    if (newTitle) {
      try {
        const response = await fetch(`/api/sessions?id=${sessionId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: newTitle }),
        });
  
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to rename session");
        }
  
        // Update the sessions state to reflect the new title
        setSessions((prevSessions) =>
          prevSessions.map((session) =>
            session.id === sessionId ? { ...session, title: newTitle } : session
          )
        );
      } catch (error) {
        console.error("Error renaming session:", error);
        setError(error instanceof Error ? error.message : "Failed to rename chat session");
      }
    }
  }, [setSessions, setError]);

  // Memoize grouped sessions
  const sessionsByModel = React.useMemo(() => {
    const groups: { [key: string]: typeof sessions } = {}
    sessions.forEach(session => {
      const key = session.model_type
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(session)
    })
    // Sort sessions by updated_at date within each model group
    Object.values(groups).forEach(modelSessions => {
      modelSessions.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
    })
    return groups
  }, [sessions])

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left Sidebar - Chat History */}
      <div className="w-64 border-r bg-muted/10">
        <div className="p-4">
          <Button
            onClick={handleNewChat}
            className={cn(
              "w-full mb-4 gap-2",
              isNewChat && "bg-accent/50"
            )}
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>

          {/* Chat History by Model */}
          <div className="space-y-4">
            {Object.entries(sessionsByModel).map(([model, modelSessions]) => (
              <div key={model} className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    {model}
                  </div>
                </div>
                {modelSessions.map((session) => (
                  <div key={session.id} className="relative group">
                    <button
                      className={cn(
                        "w-full text-left truncate p-2 hover:bg-muted/20 rounded-lg text-sm",
                        session.id === activeSessionId && "bg-muted/20"
                      )}
                      onClick={() => switchSession(session.id)}
                    >
                      <span className="flex items-center justify-between">
                        {session.title}
                      </span>
                    </button>
                    <TooltipProvider>
                      <Tooltip delayDuration={500}>
                        <TooltipTrigger asChild>
                          <div className="absolute right-1 top-1.5">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="opacity-0 hover:opacity-100 group-hover:opacity-100">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={() => {
                                  console.log("Deleting session:", session.id);
                                  handleDeleteSession(session.id);
                                }}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  console.log("Renaming session:", session.id);
                                  handleRenameSession(session.id);
                                }}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Rename
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Options</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="space-y-1">
              <h3 className="font-semibold leading-none tracking-tight">
                {isNewChat ? "New Chat" : "Chat"}
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
              {!isNewChat && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNewChat}
                  className="h-8 w-8"
                  title="New chat"
                >
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">New chat</span>
                </Button>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-auto p-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive mb-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  <p>{error}</p>
                </div>
              </div>
            )}
            <div className="flex gap-4 h-full">
              <div className="flex-1 overflow-auto rounded-md border bg-muted/50 p-4">
                <MessageList messages={messages} selectedModel={selectedModel} />
              </div>
              {(selectedModel === "deepseek" || selectedModel === "claude_reasoning") && (
                <div className="w-80 overflow-auto rounded-md border bg-muted/50 p-4">
                  <div className="sticky top-0 bg-muted/50 pb-2 mb-2 border-b">
                    <h4 className="font-semibold text-sm">
                      {selectedModel === "deepseek" ? "Reasoning Process" : "Enhanced with Reasoning"}
                    </h4>
                  </div>
                  <div className="space-y-4 text-sm">
                    {messages
                      .filter(msg => msg.role === "assistant")
                      .map((message) => (
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
          </div>

          {/* Input Area */}
          <div className="p-4 border-t">
            <div className="relative">
              {isLoading && (
                <div className="absolute right-4 top-3 z-10">
                  <LoadingSpinner size="sm" className="text-muted-foreground" />
                </div>
              )}
              <ChatInput 
                onSend={sendMessage} 
                isLoading={isLoading}
                placeholder={isNewChat ? `Send a message to start a new chat with ${selectedModel}...` : "Send a message..."}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
