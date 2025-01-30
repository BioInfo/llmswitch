# Tech Stack

This document outlines the key technology choices and architectural decisions made for the project.

## Frontend

- **Next.js:** React framework for building the application.
- **React:** JavaScript library for building user interfaces.
- **TypeScript:** Typed superset of JavaScript for improved code quality and maintainability.
- **Tailwind CSS:** Utility-first CSS framework for styling.
- **Radix UI:** Component library for building accessible and customizable UI elements.
- **Lucide React:** Library for icons.
- **Framer Motion:** Animation library (added for potential future use).
- **clsx:** Utility for conditionally joining class names.
- **class-variance-authority:** Utility for creating reusable component variants.

## Backend

- **Next.js API Routes:** Serverless functions for handling API requests.
- **Prisma:** ORM for interacting with the database.
- **PostgreSQL:** Relational database for storing chat sessions and messages.
- **Axios:** HTTP client for making API requests to AI models.

## AI Models

- **Claude:** API for interacting with the Claude AI model.
- **Deepseek:** API for interacting with the Deepseek AI model.

## Architectural Decisions

- **Monorepo:** The project uses a monorepo structure to manage both the frontend and backend code in a single repository.
- **Component-based UI:** The frontend is built using reusable React components for better code organization and maintainability.
- **Utility-first CSS:** Tailwind CSS is used for styling to promote consistency and reduce the need for custom CSS.
- **API Routes:** Next.js API routes are used to handle server-side logic and interact with the database and external APIs.
- **Prisma ORM:** Prisma is used to simplify database interactions and provide type safety.
- **Chat Sessions:** The application implements chat sessions to persist conversations and allow users to switch between different chats.
- **Error Handling and Timeouts:** The application includes error handling and timeout mechanisms to improve robustness and user experience.
- **Retry Logic:** The `useChat` hook implements retry logic with exponential backoff for fetching sessions and sending messages to handle temporary network or API issues.

## Recent Changes (2025-01-28)

- Added `@radix-ui/react-tooltip` for implementing tooltips.
- Updated `Button` component to use `React.forwardRef` for better integration with Radix UI components.
- Implemented `DropdownMenu` components using `@radix-ui/react-dropdown-menu`.
- Switched to `claude-3-sonnet-20240229` model for Claude API.
- Added retry logic to `callDeepseek` function in the API route.

## Justification

The chosen technologies and architectural decisions were made based on the following considerations:

- **Developer Experience:** Next.js, React, and TypeScript provide a good developer experience with features like hot reloading, type safety, and a large community.
- **Performance:** Next.js offers server-side rendering and other performance optimizations.
- **Scalability:** The monorepo structure and component-based architecture make it easier to scale the application as it grows.
- **Maintainability:** The use of linters, formatters, and type checking helps maintain code quality and consistency.
- **Accessibility:** Radix UI provides accessible components out of the box.
- **Flexibility:** The chosen stack allows for flexibility in terms of UI design and API integration.

## Alternatives Considered

- **Other UI Libraries:** Other UI libraries like Material UI, Ant Design, and Chakra UI were considered but Radix UI was chosen for its accessibility features and headless nature.
- **Other ORMs:** Other ORMs like TypeORM and Sequelize were considered but Prisma was chosen for its type safety, developer experience, and ease of use.
- **Other Databases:** Other databases like MongoDB and MySQL were considered but PostgreSQL was chosen for its maturity, reliability, and support for relational data.

## Future Considerations

- **User Authentication:** Implement user authentication to allow users to save their chat history and preferences.
- **Real-time Updates:** Use WebSockets or other real-time technologies to provide a more interactive chat experience.
- **Plugin System:** Implement a plugin system to allow developers to extend the functionality of the chat interface.
- **Advanced Chat Features:** Add support for features like message editing, deletion, and reactions.
- **Improved Error Handling:** Implement more granular error handling and provide more specific feedback to the user.
- **Performance Optimization:** Continuously monitor and optimize the performance of the application.