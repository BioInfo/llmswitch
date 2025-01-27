import { NextResponse } from "next/server";
import { Pool } from 'pg';

// Database connection pool
const pool = new Pool({
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432'),
  ssl: {
    rejectUnauthorized: false, // Required for Vercel Postgres
  },
});

async function saveMessageToDatabase(message: any) {
  try {
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO chat_messages (id, content, role, reasoning, model_type, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `;
      const values = [message.id, message.content, message.role, message.reasoning, message.model_type];
      await client.query(query, values);
    } finally {
      client.release();
    }
    return { success: true };
  } catch (error) {
    console.error("Database error saving message:", error);
    return { success: false, error: "Database error" };
  }
}


async function getMessagesFromDatabase() {
  try {
    const client = await pool.connect();
    try {
      const query = `
        SELECT id, content, role, reasoning, model_type
        FROM chat_messages
        ORDER BY created_at ASC
      `;
      const result = await client.query(query);
      return result.rows.map(row => ({
        id: row.id,
        content: row.content,
        role: row.role,
        reasoning: row.reasoning,
        model_type: row.model_type,
      }));
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Database error getting messages:", error);
    return [];
  }
}

async function clearMessagesFromDatabase() {
  try {
    const client = await pool.connect();
    try {
      const query = `DELETE FROM chat_messages`;
      await client.query(query);
      return { success: true };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Database error clearing messages:", error);
    return { success: false, error: "Database error" };
  }
}

export async function POST(req: Request) {
  try {
    const message = await req.json();
    if (!message) {
      return NextResponse.json({ error: "Invalid request format - missing message" }, { status: 400 });
    }

    const result = await saveMessageToDatabase(message);
    if (!result.success) {
      return NextResponse.json({ error: "Failed to save message", details: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: "Message saved successfully" }, { status: 200 });
  } catch (error) {
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
export async function GET(req: Request) {
  try {
    const messages = await getMessagesFromDatabase();
    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}