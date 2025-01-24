# LLMSwitch

A modern React/Next.js application for seamlessly switching between Deepseek and Claude LLMs with a sleek chat interface.

## Features

- 🎨 Modern UI with smooth transitions and responsive layout
- 🔄 Easy switching between Deepseek and Claude LLMs
- 💾 Persistent chat history with SQLite
- 🚀 Built with Next.js 14 and TypeScript
- 🎯 Real-time chat interface
- 🔒 Secure API key management
- ♿ Accessibility compliant
- 🌙 Dark mode support

## Tech Stack

- **Framework:** Next.js 14 with TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** SQLite with Prisma ORM
- **State Management:** React Query + Context
- **UI Components:** Radix UI primitives
- **Animations:** Framer Motion

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd llmswitch
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Add your API keys to `.env`:
```
CLAUDE_API_KEY=your-claude-api-key
DEEPSEEK_API_KEY=your-deepseek-api-key
```

5. Initialize the database:
```bash
pnpm prisma generate
pnpm prisma db push
```

6. Start the development server:
```bash
pnpm dev
```

Visit `http://localhost:3000` to see the application.

## Project Structure

```
src/
├── app/              # Next.js App Router pages and layouts
├── components/       # React components
│   ├── chat/        # Chat-specific components
│   └── ui/          # Shared UI components
├── lib/             # Utility functions and configurations
└── hooks/           # Custom React hooks
prisma/              # Database schema and migrations
docs/               # Project documentation
```

## Documentation

- [Deployment Guide](docs/deployment.md)
- [Project Roadmap](docs/projectRoadmap.md)
- [Technical Stack](docs/techStack.md)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
