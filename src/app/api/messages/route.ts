import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Message } from "@/hooks/use-chat";
import { PrismaClient, Prisma } from "@prisma/client";

interface DatabaseResult {
  success: boolean;
  error?: string;
}

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

async function saveMessageToDatabase(message: Message & { chatSessionId: string }): Promise<DatabaseResult> {
  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      await tx.message.create({
        data: {
          id: message.id,
          content: message.content,
          role: message.role,
          reasoning: message.reasoning || null,
          chatSessionId: message.chatSessionId,
        },
      });
    });
    return { success: true };
    return { success: true };
  } catch (error) {
    console.error("Database error saving message:", error);
    return { success: false, error: "Database error" };
  }
}

async function getMessagesFromDatabase(sessionId: string, page: number = 0, pageSize: number = 20): Promise<{ messages: Message[]; hasMore: boolean }> {
  try {
    return await prisma.$transaction(async (tx: TransactionClient) => {
      // Get total count for pagination
      const totalCount = await tx.message.count({
        where: {
          chatSessionId: sessionId
        }
      });

      const messages = await tx.message.findMany({
        where: {
          chatSessionId: sessionId
        },
        orderBy: {
          createdAt: 'desc', // Most recent first
        },
        skip: page * pageSize,
        take: pageSize + 1, // Take one extra to check if there are more
        include: {
          chatSession: {
            select: {
              modelType: true,
            },
          },
        },
      });

      // Check if there are more messages
      const hasMore = messages.length > pageSize;
      const paginatedMessages = hasMore ? messages.slice(0, pageSize) : messages;

      return {
        messages: paginatedMessages.map(msg => ({
          id: msg.id,
          content: msg.content,
          role: msg.role as "user" | "assistant",
          reasoning: msg.reasoning,
          chatSessionId: msg.chatSessionId,
          createdAt: msg.createdAt.toISOString(),
        })).reverse(), // Reverse to get chronological order
        hasMore
      };
    });
  } catch (error) {
    console.error("Database error getting messages:", error);
    return { messages: [], hasMore: false };
  }
}

async function clearMessagesFromDatabase(): Promise<DatabaseResult> {
  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      await tx.message.deleteMany();
    });
    return { success: true };
  } catch (error) {
    console.error("Database error clearing messages:", error);
    return { success: false, error: "Database error" };
  }
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid request format - missing messages array" }, { status: 400 });
    }

    for (const message of messages) {
      const result = await saveMessageToDatabase(message);
      if (!result.success) {
        return NextResponse.json({ error: "Failed to save message", details: result.error }, { status: 500 });
      }
    }

    return NextResponse.json({ success: "Messages saved successfully" }, { status: 200 });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const page = parseInt(searchParams.get('page') || '0');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const { messages, hasMore } = await getMessagesFromDatabase(sessionId, page, pageSize);
    return NextResponse.json({ messages, hasMore }, { status: 200 });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const result = await clearMessagesFromDatabase();
    if (!result.success) {
      return NextResponse.json({ error: "Failed to clear messages", details: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: "Messages cleared successfully" }, { status: 200 });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}