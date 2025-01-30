# Codebase Summary

This document provides a concise overview of the project's codebase, including its key components, their interactions, data flow, and external dependencies. It also captures recent significant changes to the codebase structure.

## Key Components and Their Interactions

The project is a web application built using Next.js, React, and TypeScript. It provides a chat interface that allows users to interact with different AI models (Claude and Deepseek).

**Frontend:**

-   **`src/app/page.tsx`:** The main entry point for the application. It renders the `ChatInterface` component.
-   **`src/app/compare/page.tsx`:** The page for comparing responses from different models. It includes logic for generating comparative analyses.
-   **`src/components/chat/chat-interface.tsx`:** The main chat interface component. It handles user input, displays messages, manages chat sessions, and interacts with the `useChat` hook.
-   **`src/components/chat/chat-input.tsx`:** The input field for sending messages.
-   **`src/components/chat/message-list.tsx`:** Displays the list of messages for the active chat session, including reasoning when available.
-   **`src/components/chat/model-selector.tsx`:** A dropdown menu for selecting the AI model to use.
-   **`src/hooks/use-chat.ts`:** A custom React hook that manages the chat state, including sessions, messages, loading state, selected model, and error handling. It also provides functions for interacting with the API routes.
-   **`src/components/ui/*`:** Reusable UI components (e.g., `button.tsx`, `card.tsx`, `command.tsx`, `dialog.tsx`, `loading-spinner.tsx`, `popover.tsx`, `select.tsx`, `tooltip.tsx`).

**Backend:**

-   **`src/app/api/chat/route.ts`:** API route for sending messages to the selected AI model and saving them to the database. It now uses modular handlers from `src/lib/models`.
-   **`src/app/api/sessions/route.ts`:** API route for managing chat sessions (GET, POST, DELETE, PATCH).
-   **`src/app/api/messages/route.ts`:** API route for fetching messages (not actively used after implementing chat sessions).
-   **`src/lib/db.ts`:** Initializes and exports the Prisma client for database interactions.
-   **`prisma/schema.prisma`:** Defines the database schema using Prisma.
-   **`src/lib/models/claude.ts`:** Handles API interactions with the Claude model.
-   **`src/lib/models/deepseek.ts`:** Handles API interactions with the Deepseek model, including reasoning extraction.
-   **`src/lib/types/models.ts`:** Defines shared TypeScript types for models, messages, and sessions.
-   **`src/lib/utils/async.ts`:** Provides utility functions for handling asynchronous operations, such as timeouts.

## Data Flow

1. **User Interface:** The user interacts with the `ChatInterface` component, which uses the `useChat` hook to manage the chat state.
2. **Sending Messages:** When the user sends a message, the `sendMessage` function in `useChat` is called.
    -   If there's no active session or the model has changed, `createNewSession` is called to create a new session.
    -   `sendMessage` then makes a `POST` request to `/api/chat` with the session ID, prompt, and selected model(s).
3. **API Route (`/api/chat`):**
    -   The `POST` function in `route.ts` receives the request and extracts the session ID, prompt, and models.
    -   It retrieves the chat session from the database using Prisma.
    -   It calls the appropriate function from `src/lib/models` to interact with the selected AI model's API (either `callClaude`, `callDeepseek`, or `claudeWithReasoning`).
    -   It saves the user's message and the AI's response (including reasoning, if available) to the database using Prisma.
    -   It updates the session's `updated_at` timestamp.
    -   It returns the AI's response to the client.
4. **API Route (`/api/sessions`):**
    -   The `GET` function retrieves all chat sessions from the database using Prisma.
    -   The `POST` function creates a new chat session.
    -   The `DELETE` function deletes a chat session.
    -   The `PATCH` function updates a chat session (currently used for renaming).
5. **Updating State:** The `useChat` hook updates the `sessions` and `messages` state based on the API responses, triggering a re-render of the `ChatInterface` component.
6. **Displaying Messages:** The `MessageList` component receives the `messages` array from `useChat` and renders them in the chat interface, including the reasoning content when available.
7. **Comparative Analysis:** The `ComparePage` component fetches responses from multiple models and uses Deepseek to generate a comparative analysis, which is then displayed.

## External Dependencies

-   **Next.js:** React framework for building the application.
-   **React:** JavaScript library for building user interfaces.
-   **Prisma:** ORM for interacting with the database.
-   **PostgreSQL:** Database used to store chat sessions and messages.
-   **Axios:** HTTP client for making API requests to AI models.
-   **Radix UI:** UI component library for building accessible and customizable UI elements.
-   **Lucide React:** Library for icons.
-   **Class Variance Authority:** Utility for creating reusable component variants.
-   **clsx:** Utility for conditionally joining class names.
-   **Tailwind CSS:** Utility-first CSS framework for styling.
-   **Framer Motion:** Animation library.

## Recent Significant Changes (2025-01-29)

-   **Refactored API Route:**
    -   Moved model-specific API handling to `src/lib/models/claude.ts` and `src/lib/models/deepseek.ts`.
    -   Created shared types in `src/lib/types/models.ts`.
    -   Added async utilities in `src/lib/utils/async.ts`.
    -   Updated `src/app/api/chat/route.ts` to use the new modular structure.
-   **Improved Deepseek Integration:**
    -   Updated to use `deepseek-reasoner` model.
    -   Added proper handling of `reasoning_content` in API response.
    -   Enhanced error handling and logging.
    -   Added robust response validation and parsing.
-   **Enhanced Comparative Analysis:**
    -   Modified `src/app/compare/page.tsx` to use a more detailed analysis prompt.
    -   Added specific instructions for analysis content.
    -   Improved error handling and display.
-   **Fixed Data Consistency Issues:**
    -   Added type guards and conversion utilities for database and application types.
    -   Ensured proper handling of `modelType` and `reasoning` fields.
    -   Updated `MessageList` component to display reasoning content.
-   **Improved Error Handling and Logging:**
    -   Added comprehensive error logging throughout the API route and model handlers.
    -   Improved error messages and added context to error logs.
    -   Implemented better timeout and retry logic.

## Database Schema

The database schema is defined in `prisma/schema.prisma` and includes the following models:

-   **ChatSession:**
    -   `id` (String, @id, @default(uuid()))
    -   `title` (String, @default("New Chat"))
    -   `modelType` (String, @map("model_type"))
    -   `createdAt` (DateTime, @default(now()), @map("created_at"))
    -   `updatedAt` (DateTime, @updatedAt, @map("updated_at"))
    -   `messages` (Message[])
-   **Message:**
    -   `id` (String, @id, @default(uuid()))
    -   `content` (String)
    -   `role` (String)
    -   `reasoning` (String?, optional)
    -   `createdAt` (DateTime, @default(now()), @map("created_at"))
    -   `chatSession` (ChatSession, @relation(fields: [chatSessionId], references: [id], onDelete: Cascade))
    -   `chatSessionId` (String, @map("chat_session_id"))

## User Feedback Integration

User feedback has been actively incorporated throughout the development process. The following changes were made based on user feedback:

-   Implemented chat sessions to persist conversations.
-   Improved error handling and added timeouts to prevent the application from hanging.
-   Enhanced the UI/UX of the chat history sidebar, including removing the model name from the dropdown and adding tooltips.
-   Fixed various bugs and issues reported by the user.
-   Refactored code to improve readability and maintainability.
-   Added the ability to compare responses from different models.
-   Implemented a mechanism to use Deepseek's reasoning to enhance Claude's responses.

## Related Documents

-   [Project Roadmap](docs/projectRoadmap.md)
-   [Current Task](docs/currentTask.md)
-   [Tech Stack](docs/techStack.md)
-   [Database Schema](docs/databaseSchema.md)
-   [Session Tracker (2025-01-26)](docs/sessionTracker-2025-01-26.md)
-   [Session Tracker (2025-01-27)](docs/sessionTracker-2025-01-27.md)
-   [Session Tracker (2025-01-28)](docs/sessionTracker-2025-01-28.md)
-   [Session Tracker (2025-01-29)](docs/sessionTracker-2025-01-29.md)