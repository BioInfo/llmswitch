export type ModelType = "claude" | "deepseek" | "claude_reasoning"

export type MessageRole = "user" | "assistant"

export interface ModelResponse {
  content: string
  reasoning: string | null
}

// Database types
export interface DbMessage {
  id: string
  content: string
  role: string
  reasoning: string | null
  chatSessionId: string
  createdAt: Date
}

export interface DbChatSession {
  id: string
  title: string
  modelType: string
  messages: DbMessage[]
  createdAt: Date
  updatedAt: Date
}

// Application types
export interface Message {
  id: string
  content: string
  role: MessageRole
  reasoning?: string | null
  chatSessionId: string
  createdAt: string
  modelType?: ModelType
}

export interface ChatSession {
  id: string
  title: string
  modelType: ModelType
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export type SessionWithMessages = ChatSession & {
  messages: Message[]
}

// Type guards
export function isValidModelType(type: string): type is ModelType {
  return ["claude", "deepseek", "claude_reasoning"].includes(type)
}

export function isValidMessageRole(role: string): role is MessageRole {
  return ["user", "assistant"].includes(role)
}

// Type conversion utilities
export function convertDbMessageToMessage(dbMessage: DbMessage): Message {
  return {
    ...dbMessage,
    role: isValidMessageRole(dbMessage.role) ? dbMessage.role : "assistant",
    createdAt: dbMessage.createdAt.toISOString()
  }
}

export function convertDbSessionToSession(dbSession: DbChatSession): ChatSession {
  return {
    ...dbSession,
    modelType: isValidModelType(dbSession.modelType) ? dbSession.modelType : "claude",
    messages: dbSession.messages.map(convertDbMessageToMessage)
  }
}

export interface ComparisonState {
  [key: string]: ModelResponse
}