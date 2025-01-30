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

export interface ApiError {
  error: string
  details?: string
}

export interface ModelResponse {
  content: string
  reasoning?: string | null
}

export interface ApiResponse {
  [key: string]: ModelResponse
}