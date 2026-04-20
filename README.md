# MUD World Editor

A visual node-graph editor for MUD (Multi-User Dungeon) world building. Create, connect, and manage scenes, NPC templates, and item templates with data persisted to Supabase.

For detailed documentation in Chinese, see [README_zh.md](./README_zh.md).

## Quick Start

```bash
# Install dependencies
npm install

# Copy and configure environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase URL and anon key

# Start dev server
npm run dev

# Build for production
npm run build
```

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** build tool
- **[@xyflow/react](https://reactflow.dev/)** visual node-flow engine
- **[Supabase](https://supabase.com/)** database (PostgreSQL)
