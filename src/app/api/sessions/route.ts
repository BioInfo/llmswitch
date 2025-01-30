import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const sessions = await prisma.chatSession.findMany({
      include: {
        messages: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })
    
    return NextResponse.json({ 
      sessions: sessions.map(session => ({
        ...session,
        model_type: session.modelType,
        created_at: session.createdAt,
        updated_at: session.updatedAt
      }))
    })
  } catch (error) {
    console.error("Error fetching sessions:", error)
    return NextResponse.json(
      { error: "Failed to fetch chat sessions", details: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const { model_type, title } = await req.json()
    
    const session = await prisma.chatSession.create({
      data: {
        modelType: model_type,
        title: title || "New Chat"
      },
      include: {
        messages: true
      }
    })
    
    return NextResponse.json({
      ...session,
      model_type: session.modelType,
      created_at: session.createdAt,
      updated_at: session.updatedAt
    })
  } catch (error) {
    console.error("Error creating session:", error)
    return NextResponse.json(
      { error: "Failed to create chat session", details: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('id')

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      )
    }

    await prisma.chatSession.delete({
      where: {
        id: sessionId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting session:", error)
    return NextResponse.json(
      { error: "Failed to delete chat session", details: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('id');
    const { title } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: "New title is required" },
        { status: 400 }
      );
    }

    const session = await prisma.chatSession.update({
      where: {
        id: sessionId,
      },
      data: {
        title,
      },
      include: {
        messages: true,
      },
    });

    return NextResponse.json({
      ...session,
      model_type: session.modelType,
      created_at: session.createdAt,
      updated_at: session.updatedAt,
    });
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json(
      { error: "Failed to update chat session", details: (error as Error).message },
      { status: 500 }
    );
  }
}