# Deployment Guide for LLMSwitch

## Prerequisites

- Node.js 18.x or higher
- SQLite3
- API keys for Claude and Deepseek LLMs

## Local Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd llmswitch
```

2. Install dependencies:
```bash
pnpm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```
Edit `.env` and add your API keys:
- `CLAUDE_API_KEY`: Your Claude API key
- `DEEPSEEK_API_KEY`: Your Deepseek API key

4. Initialize the database:
```bash
pnpm prisma generate
pnpm prisma db push
```

5. Start the development server:
```bash
pnpm dev
```

## Production Deployment

### Using Vercel (Recommended)

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy using default settings

### Manual Deployment

1. Build the application:
```bash
pnpm build
```

2. Start the production server:
```bash
pnpm start
```

## Environment Variables

- `DATABASE_URL`: SQLite database URL
- `CLAUDE_API_KEY`: Claude API key
- `DEEPSEEK_API_KEY`: Deepseek API key
- `NEXT_PUBLIC_APP_URL`: Your application URL

## Database Management

The application uses SQLite with Prisma ORM. To manage the database:

1. Update schema in `prisma/schema.prisma`
2. Apply migrations:
```bash
pnpm prisma db push
```

3. Generate Prisma client:
```bash
pnpm prisma generate
```

## Security Considerations

1. API Keys:
   - Never commit API keys to version control
   - Use environment variables for sensitive data
   - Rotate keys regularly

2. Database:
   - Backup SQLite database regularly
   - Implement proper access controls
   - Monitor database size and performance

3. API Rate Limiting:
   - Implement rate limiting for API routes
   - Monitor API usage
   - Handle errors gracefully

## Performance Optimization

1. Build Optimization:
   - Use production builds
   - Enable caching
   - Implement proper error boundaries

2. Code Splitting:
   - Lazy load components when possible
   - Use dynamic imports for large dependencies
   - Optimize images and assets

3. Caching Strategy:
   - Implement proper caching headers
   - Use SWR for data fetching
   - Cache API responses when appropriate

## Monitoring and Maintenance

1. Error Tracking:
   - Implement error logging
   - Monitor API responses
   - Track performance metrics

2. Updates:
   - Keep dependencies updated
   - Monitor security advisories
   - Update API integrations as needed

3. Backups:
   - Regular database backups
   - Configuration backups
   - Document all custom modifications