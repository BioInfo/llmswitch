import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { 
  SessionWithMessages, 
  ModelResponse, 
  ModelType, 
  MessageRole,
  DbChatSession,
  convertDbSessionToSession,
  isValidModelType 
} from "@/lib/types/models"
import { callDeepseek } from "@/lib/models/deepseek"
import { callClaude, claudeWithReasoning } from "@/lib/models/claude"
import { withTimeout, DB_TIMEOUT } from "@/lib/utils/async"

export const maxDuration = 300 // Set max duration to 300 seconds

async function saveMessages(sessionId: string, prompt: string, response: ModelResponse, model: ModelType) {
  // Save user message
  await withTimeout(
    prisma.message.create({
      data: {
        content: prompt,
        role: "user" as MessageRole,
        chatSessionId: sessionId
      }
    }),
    DB_TIMEOUT
  )

  // Save assistant message
  await withTimeout(
    prisma.message.create({
      data: {
        content: response.content,
        role: "assistant" as MessageRole,
        reasoning: response.reasoning,
        chatSessionId: sessionId
      }
    }),
    DB_TIMEOUT
  )

  // Update session timestamp
  await withTimeout(
    prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() }
    }),
    DB_TIMEOUT
  )
}

export async function POST(req: Request) {
  try {
    const { sessionId, prompt, models } = await req.json()

    if (!sessionId || !prompt || !models || !Array.isArray(models)) {
      return NextResponse.json(
        { error: "Invalid request format - missing required fields" },
        { status: 400 }
      )
    }

    // Validate models are all valid ModelTypes
    if (!models.every(isValidModelType)) {
      return NextResponse.json(
        { error: "Invalid model type specified" },
        { status: 400 }
      )
    }

    // Log the models array here
    console.log("[Chat API] models array:", models)

    let session: SessionWithMessages | null = null

    // Special handling for comparison and analysis requests
    if (sessionId.startsWith('comparison') || sessionId.startsWith('analysis')) {
      // Create a temporary session
      const dbSession = await withTimeout(
        prisma.chatSession.create({
          data: {
            id: sessionId,
            title: `Temporary ${sessionId.startsWith('comparison') ? 'Comparison' : 'Analysis'} Session`,
            modelType: models[0], // Use first model as the session type
          },
          include: { messages: true }
        }),
        DB_TIMEOUT
      ) as DbChatSession

      session = convertDbSessionToSession(dbSession)
    } else {
      // For regular chat sessions, get existing session
      const dbSession = await withTimeout(
        prisma.chatSession.findUnique({
          where: { id: sessionId },
          include: { messages: true }
        }),
        DB_TIMEOUT
      ) as DbChatSession | null

      if (!dbSession) {
        return NextResponse.json(
          { error: "Chat session not found" },
          { status: 404 }
        )
      }

      session = convertDbSessionToSession(dbSession)
    }

    console.log(`Processing request for models: ${models.join(", ")}`)
    const newResponses: Record<string, ModelResponse> = {}

    // Get Deepseek's response first if needed for Claude+Reasoning
    let deepseekReasoning: string | undefined
    if (models.includes("deepseek") || models.includes("claude_reasoning")) {
      try {
        console.log("Getting Deepseek response for reasoning...")
        const deepseekResponse = await callDeepseek(prompt)
        if (models.includes("deepseek")) {
          newResponses["deepseek"] = deepseekResponse
          // Save Deepseek messages to database
          await saveMessages(sessionId, prompt, deepseekResponse, "deepseek")
        }
        deepseekReasoning = deepseekResponse.reasoning || undefined
        console.log("Got Deepseek reasoning:", deepseekReasoning)
      } catch (error) {
        console.error("Error getting Deepseek response:", error)
        if (models.includes("deepseek")) {
          const errorResponse = {
            content: `Error: ${error instanceof Error ? error.message : String(error)}`,
            reasoning: null
          }
          newResponses["deepseek"] = errorResponse
          // Save error response to database
          await saveMessages(sessionId, prompt, errorResponse, "deepseek")
        }
      }
    }

    // Process remaining models
    for (const model of models) {
      if (model === "deepseek") continue // Already handled
      
      console.log(`[Chat API] Processing model: ${model}`)
      try {
        let response: ModelResponse
        switch (model) {
          case "claude":
            response = await callClaude(prompt)
            break
          case "claude_reasoning":
            response = await claudeWithReasoning(prompt, deepseekReasoning)
            break
          default:
            throw new Error(`Unknown model: ${model}`)
        }
        console.log(`Got response for ${model}:`, response)
        newResponses[model] = response

        // Save messages to database
        await saveMessages(sessionId, prompt, response, model)

      } catch (error) {
        console.error(`Error fetching response from ${model}:`, error)
        const errorResponse = {
          content: `Error: ${error instanceof Error ? error.message : String(error)}`,
          reasoning: null
        }
        newResponses[model] = errorResponse
        // Save error response to database
        await saveMessages(sessionId, prompt, errorResponse, model)
      }
    }

    // Clean up temporary sessions after we're done
    if (sessionId.startsWith('comparison') || sessionId.startsWith('analysis')) {
      try {
        await withTimeout(
          prisma.chatSession.delete({
            where: { id: sessionId }
          }),
          DB_TIMEOUT
        )
      } catch (error) {
        console.error('Error cleaning up temporary session:', error)
        // Don't throw - this is cleanup code
      }
    }

    return NextResponse.json(newResponses, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    })
  } catch (error) {
    console.error("Error processing models:", error)
    return NextResponse.json(
      { error: `Error processing models: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  } 
}
