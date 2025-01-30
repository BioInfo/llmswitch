# Database Schema

The project uses PostgreSQL as its database and Prisma as the ORM to interact with it. The database schema is defined in `prisma/schema.prisma`.

## Tables

### ChatSession

Stores information about each chat session.

| Column       | Type      | Modifiers                                 |
| ------------ | --------- | ----------------------------------------- |
| id           | String    | @id @default(uuid())                      |
| title        | String    | @default("New Chat")                      |
| modelType    | String    | @map("model_type")                        |
| createdAt    | DateTime  | @default(now()) @map("created_at")        |
| updatedAt    | DateTime  | @updatedAt @map("updated_at")             |
| messages     | Message[] |                                           |

**Indexes:**

-   `@@index([updatedAt(sort: Desc)])` on `updatedAt` for sorting sessions by last updated.

### Message

Stores individual messages within a chat session.

| Column          | Type        | Modifiers                                                     |
| --------------- | ----------- | ------------------------------------------------------------- |
| id              | String      | @id @default(uuid())                                          |
| content         | String      |                                                               |
| role            | String      |                                                               |
| reasoning       | String?     |                                                               |
| createdAt       | DateTime    | @default(now()) @map("created_at")                            |
| chatSession     | ChatSession | @relation(fields: [chatSessionId], references: [id], onDelete: Cascade) |
| chatSessionId   | String      | @map("chat_session_id")                                       |

**Indexes:**

-   `@@index([chatSessionId])` on `chatSessionId` for filtering messages by session.
-   `@@index([createdAt(sort: Desc)])` on `createdAt` for sorting messages within a session.

## Relationships

-   A `ChatSession` can have many `Message`s.
-   A `Message` belongs to one `ChatSession`.
-   The `onDelete: Cascade` option ensures that when a `ChatSession` is deleted, all associated `Message`s are also deleted.

## Notes

-   The `modelType` column in `ChatSession` stores the AI model used for the session (e.g., "claude", "deepseek", "claude_reasoning").
-   The `reasoning` column in `Message` is optional and stores the reasoning provided by the AI model (if available).
-   The `@map` attribute is used to map Prisma field names to different database column names.
-   The `@default(now())` attribute sets the default value of a column to the current timestamp.
-   The `@updatedAt` attribute automatically updates the column with the current timestamp whenever a record is updated.

## Example Schema (prisma/schema.prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("POSTGRES_PRISMA_URL")
}

model ChatSession {
  id         String    @id @default(uuid())
  title      String    @default("New Chat")
  modelType  String    @map("model_type")
  createdAt  DateTime  @default(now()) @map("created_at")
  updatedAt  DateTime  @updatedAt @map("updated_at")
  messages   Message[]

  @@index([updatedAt(sort: Desc)])
  @@map("chat_sessions")
}

model Message {
  id            String      @id @default(uuid())
  content       String
  role          String
  reasoning     String?
  createdAt     DateTime    @default(now()) @map("created_at")
  chatSession   ChatSession @relation(fields: [chatSessionId], references: [id], onDelete: Cascade)
  chatSessionId String      @map("chat_session_id")

  @@index([chatSessionId])
  @@index([createdAt(sort: Desc)])
  @@map("messages")
}