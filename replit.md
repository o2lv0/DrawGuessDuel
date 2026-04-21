# Overview

This is a real-time multiplayer drawing and guessing game built for two players with Arabic language support (RTL). Players take turns drawing and guessing words, with an AI-powered referee using OpenAI's GPT-5 to validate guesses intelligently. The game features a canvas-based drawing interface with multiple tools (brush, fill bucket, eyedropper), real-time WebSocket synchronization, and a comprehensive scoring system.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server with HMR support
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management

**UI Component System**
- Shadcn/ui components built on Radix UI primitives
- Tailwind CSS with custom RTL configuration for Arabic layout
- Custom design tokens for consistent theming across light/dark modes
- Arabic-first typography using Cairo, Tajawal, and IBM Plex Sans Arabic fonts

**State Management**
- WebSocket-based real-time state synchronization between clients
- Local React state for drawing canvas and UI interactions
- Custom hook (`useGameWebSocket`) encapsulates all WebSocket communication logic
- Undo/redo system with stroke history management (50-step limit)

**Drawing Canvas**
- HTML5 Canvas API with touch and mouse event support
- Three tool modes: draw, fill (flood fill algorithm), and eyedropper
- Real-time stroke transmission via WebSocket
- Color picker with RGB sliders and hex input
- Multiple brush sizes and predefined color palette

**RTL Support**
- HTML dir="rtl" attribute at document root
- Tailwind configured for RTL-first layout
- All UI components mirror appropriately for Arabic text flow
- Canvas controls positioned for natural right-to-left interaction

## Backend Architecture

**Server Framework**
- Express.js with TypeScript for API server
- HTTP server upgraded to WebSocket server using 'ws' library
- Custom middleware for request logging and JSON body parsing

**WebSocket Communication**
- Dedicated WebSocket path (`/ws`) to avoid conflicts with Vite HMR
- Message-based protocol with typed payloads (TypeScript shared types)
- Connection tracking via Map structure linking WebSocket to player/room
- Real-time broadcasting of game state, drawing strokes, and guess results
- Automatic reconnection with exponential backoff (1s, 2s, 4s, 8s, 16s)
- Player ID persistence via localStorage for seamless reconnection
- Server validates reconnection and preserves game state

**Game State Management**
- In-memory game manager (GameManager class) tracking all active rooms
- Room-based architecture supporting exactly 2 players per room
- Turn-based system with automatic role switching (drawer ↔ guesser)
- Round progression with score tracking and win detection (first to 5 points)
- Automatic cleanup of inactive rooms after 1 hour of inactivity
- Activity tracking updates on: player join, reconnect, draw, guess submission
- Cleanup runs every 5 minutes to remove stale rooms

**Game Flow**
1. Player creates room → receives unique 6-digit room code
2. Second player joins using room code
3. Game auto-starts when both players connected
4. Drawer receives random word from 20-word Arabic bank
5. Guesser submits guesses → validated by OpenAI
6. Correct guess awards points and triggers role swap
7. Game ends when player reaches 5 points

**Word Bank**
- 20 curated Arabic nouns across 4 categories (animals, food, objects, nature)
- Random selection for each round
- Simple words optimized for drawing difficulty

## External Dependencies

**AI Integration - OpenAI GPT-5**
- Referee system for intelligent guess validation
- Accepts synonyms, handles spelling variations, ignores diacritics
- JSON-structured responses with correctness flag and Arabic explanation
- Fallback to simple string comparison on API errors
- API key required via `OPENAI_API_KEY` environment variable

**Database - PostgreSQL (Neon)**
- Drizzle ORM configured for PostgreSQL dialect
- Database schema defined in `shared/schema.ts`
- Currently only defines User table (not actively used in game flow)
- Migration support via Drizzle Kit
- Connection via `@neondatabase/serverless` driver
- Requires `DATABASE_URL` environment variable

**Session Management**
- Express sessions with PostgreSQL backing (connect-pg-simple)
- Session store configuration prepared but user authentication not implemented

**Type Safety**
- Shared TypeScript types between client and server (`shared/schema.ts`)
- Drizzle-Zod integration for runtime validation
- Type-safe WebSocket message protocol

**Development Tools**
- Replit-specific plugins for error overlay and dev banner
- Cartographer plugin for code navigation in Replit environment
- ESBuild for server-side bundling in production

**Notable Architectural Decisions**

1. **In-Memory Game State**: Chose Map-based in-memory storage over database persistence for real-time performance and simplicity. Trade-off: rooms lost on server restart.

2. **WebSocket over HTTP Polling**: Enables true real-time drawing synchronization with minimal latency. Essential for smooth collaborative drawing experience.

3. **AI-Powered Validation**: OpenAI integration allows flexible guess matching (synonyms, typos) vs rigid string comparison. Enhances game playability but adds external dependency and API costs.

4. **Monorepo Structure**: Client and server share types via `shared/` directory. Simplifies development but requires careful path aliasing configuration.

5. **Arabic-First Design**: RTL layout, Arabic fonts, and Arabic game content treated as primary (not localization). Tailwind customization ensures proper RTL support throughout.

6. **Canvas-Based Drawing**: HTML5 Canvas chosen over SVG for performance with many drawing strokes and pixel manipulation (fill tool). Better suited for free-form drawing.