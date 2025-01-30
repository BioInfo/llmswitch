# Project Roadmap

## High-Level Goals

- [x] Implement basic chat functionality with a single AI model (Claude).
- [x] Implement chat sessions to persist conversations.
- [x] Improve error handling and timeouts.
- [x] Enhance UI/UX of the chat interface.
- [x] Add support for multiple AI models (Deepseek, Claude with reasoning).
- [x] Implement session management features (delete, rename).
- [ ] Add user authentication and authorization.
- [ ] Implement message editing and deletion.
- [ ] Add support for streaming responses from AI models.
- [ ] Implement a settings page to allow users to configure API keys and other settings.
- [ ] Add support for different chat modes (e.g., assistant, code interpreter, etc.).
- [ ] Implement a plugin system to extend the functionality of the chat interface.

## Key Features & Milestones

### Phase 1: Basic Chat Functionality

- [x] Set up project structure and dependencies.
- [x] Create basic chat interface with input field and message display.
- [x] Integrate with Claude API to send and receive messages.
- [x] Implement basic error handling.

### Phase 2: Chat Sessions

- [x] Design and implement database schema for chat sessions and messages.
- [x] Create API routes to handle CRUD operations for chat sessions.
- [x] Update `useChat` hook to manage chat sessions.
- [x] Modify `ChatInterface` component to display chat history and handle session switching.
- [x] Implement session creation when sending the first message or switching models.
- [x] Implement session deletion.
- [x] Implement session renaming.

### Phase 3: Enhanced UI/UX

- [x] Improve styling and layout of chat interface.
- [x] Add loading indicators for API requests.
- [x] Implement proper error display for API errors.
- [x] Add tooltips to UI elements.
- [x] Improve handling of long messages and code blocks.
- [x] Remove model name from chat history dropdown.
- [x] Make delete and rename options more subtle and user-friendly.

### Phase 4: Multiple AI Models

- [x] Add support for Deepseek API.
- [x] Add support for Claude with reasoning.
- [x] Implement model selection dropdown.
- [x] Update `useChat` hook to handle multiple models.
- [x] Update `ChatInterface` component to display the selected model.

### Phase 5: Advanced Features

- [ ] Implement user authentication and authorization.
- [ ] Add message editing and deletion.
- [ ] Add support for streaming responses.
- [ ] Create a settings page.
- [ ] Add support for different chat modes.
- [ ] Implement a plugin system.

## Completed Tasks

- **2025-01-26:** Initial project setup, basic chat interface, Claude API integration, basic error handling.
- **2025-01-27:** Implemented basic UI for sending and receiving messages, integrated with Claude API, added error handling for API requests.
- **2025-01-28:** Implemented chat sessions, improved error handling and timeouts, enhanced UI/UX, fixed various bugs, added support for multiple AI models, implemented session management features (delete, rename).

## Current Task

- **2025-01-28:** Document the work completed during the current session and update the session tracker.

## Future Tasks

- Implement user authentication and authorization.
- Add message editing and deletion.
- Add support for streaming responses.
- Create a settings page.
- Add support for different chat modes.
- Implement a plugin system.

## Notes

- The project is currently in active development.
- The roadmap is subject to change based on user feedback and development progress.
