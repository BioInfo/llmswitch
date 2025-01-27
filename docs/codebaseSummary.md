# Codebase Summary - MVP Version

## Key Components and Their Interactions

The application is built using Next.js and React, following a component-based architecture. Key components include:

- **`src/app/page.tsx`**: The main entry point for the application, rendering the comparison interface.
- **`src/app/compare/page.tsx`**:  The comparison page, containing the core logic for fetching and displaying model responses.
- **`src/components/chat/`**: Contains chat-related components such as `chat-input.tsx`, `chat-interface.tsx`, and `message-list.tsx`. These components handle user input, display chat messages, and manage the chat interface.
- **`src/components/ui/`**:  Contains reusable UI components built with ShadCN UI, such as buttons, cards, dialogs, and selects.
- **`src/hooks/use-chat.ts`**: A custom hook for managing chat state and logic, now including persistent chat history using Vercel Postgres.
- **`src/app/api/chat/route.ts`**:  Next.js API route for handling chat requests to the backend LLMs (Deepseek and Claude models).
- **`src/app/api/messages/route.ts`**: Next.js API route for handling chat message storage and retrieval from Vercel Postgres.
- **`src/lib/utils.ts`**: Utility functions used throughout the application, such as text formatting and other helper functions.

## Data Flow (Updated)

1. **User Input**: User interacts with the UI, sending a chat message via `src/app/page.tsx` or `src/app/compare/page.tsx`.
2. **Send Message to API**: The `sendMessage` function in `src/hooks/use-chat.ts` sends the user message to the `/api/chat` endpoint (`src/app/api/chat/route.ts`).
3. **Model Integration**: The API route `src/app/api/chat/route.ts` calls the Deepseek and Claude models to generate responses.
4. **Response Processing**: Responses are processed and cleaned in `src/app/api/chat/route.ts` and `src/lib/utils.ts`.
5. **UI Update**: Processed responses are sent back to `src/hooks/use-chat.ts`, the messages state is updated, and the UI re-renders in components like `src/components/chat/message-list.tsx`.
6. **Persistent Storage**: The `sendMessage` function in `src/hooks/use-chat.ts` then sends a POST request to `/api/messages` (`src/app/api/messages/route.ts`) to save the user and assistant messages to Vercel Postgres.
7. **Load Messages on Initialization**: When the `useChat` hook initializes, it calls `loadMessages` which fetches chat history from `/api/messages` (GET request to `src/app/api/messages/route.ts`) and populates the messages state.

## External Dependencies (Updated)

- **Next.js**: Frontend framework.
- **React**: UI library.
- **TypeScript**: Language for type safety.
- **Tailwind CSS**: Utility-first CSS framework.
- **ShadCN UI**: Component library.
- **Deepseek R1**: Primary LLM for responses and analysis.
- **Claude 3 Sonnet**: LLM for comparison responses.
- **Vercel**: Deployment platform.
- **pg**: PostgreSQL client for database interaction.
- **@types/pg**: TypeScript type declarations for `pg`.

## Recent Significant Changes

- **Persistent Chat History**: Implemented persistent chat history using Vercel Postgres. Chat messages are now saved to and loaded from a database, preserving conversation history across sessions.
  - **Database**: Vercel Postgres is integrated for persistent storage.
  - **API**: New API route `src/app/api/messages/route.ts` is created to handle database operations (save, load, clear messages).
  - **Hook**: `src/hooks/use-chat.ts` is updated to use the new API for saving and loading messages.
- **Updated Claude model to Sonnet**:  The Claude model has been updated to Claude 3 Sonnet for improved performance and capabilities.
- **Enhanced text cleaning and formatting**:  Improvements have been made to text processing to ensure cleaner and more consistent rendering of model responses.
- **Improved spacing and readability**:  UI adjustments have been made to improve spacing and readability across the application.
- **Better handling of mathematical expressions**:  Mathematical expressions in model responses are now handled more effectively.
- **Streamlined comparative analysis display**: The comparative analysis display has been streamlined for better visual clarity.

## User Feedback Integration

User feedback has been incorporated throughout the development process, particularly in refining the UI/UX and improving the clarity of the comparative analysis display. Further user feedback will be collected post-MVP to guide future enhancements.

## Database Integration Details

### Database Schema
- The database schema for chat messages is documented in `docs/databaseSchema.md`.
- The `chat_messages` table stores message `id`, `content`, `role`, `reasoning`, `model_type`, and `created_at`.

### API Modifications
- A new Next.js API route `src/app/api/messages/route.ts` is created to handle database interactions.
- **POST /api/messages**: Saves a new chat message to the database.
- **GET /api/messages**: Retrieves chat messages from the database, ordered by creation time.
- **DELETE /api/messages**: Clears all chat messages from the database.

### Implementation Details
- **Database Connection**: Vercel Postgres connection is established using environment variables via `pg` library in `src/app/api/messages/route.ts`.
- **Data Handling**: `src/hooks/use-chat.ts` is modified to call `/api/messages` to save and load chat messages, ensuring persistent chat history.
- **Error Handling**: Basic error handling is implemented in API routes and hook to catch database and network issues.

## Related Documents

- **`projectRoadmap.md`**: Outlines project goals and future enhancements.
- **`currentTask.md`**: Defines current development objectives.
- **`techStack.md`**: Describes the technology stack used in the project.
- **`docs/databaseSchema.md`**: Describes the database schema for chat messages.

This summary provides a comprehensive overview of the codebase structure and key aspects of the application, updated to include the persistent chat history feature. It should be updated as the codebase evolves.