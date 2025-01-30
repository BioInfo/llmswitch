import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Message } from "@/hooks/use-chat";

async function saveMessageToDatabase(message: Message & { chatSessionId: string }) {
  try {
    await prisma.message.create({
      data: {
        id: message.id,
        content: message.content,
        role: message.role,
        reasoning: message.reasoning || null,
        chatSessionId: message.chatSessionId,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Database error saving message:", error);
    return { success: false, error: "Database error" };
  }
}

async function getMessagesFromDatabase() {
  try {
    const messages = await prisma.message.findMany({
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        chatSession: {
          select: {
            modelType: true,
          },
        },
      },
    });

    return messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      role: msg.role as "user" | "assistant",
      reasoning: msg.reasoning,
      model_type: msg.chatSession.modelType,
    }));
  } catch (error) {
    console.error("Database error getting messages:", error);
    return [];
  }
}

async function clearMessagesFromDatabase() {
  try {
    await prisma.message.deleteMany();
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
    const messages = await getMessagesFromDatabase();
    return NextResponse.json({ messages }, { status: 200 });
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