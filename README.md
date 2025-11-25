# Coroutine Visualizer - Frontend

A modern React application for visualizing Kotlin coroutine execution in real-time.

## Tech Stack

See [TECH_STACK.MD](./TECH_STACK.MD) for the complete technology overview.

### Core Technologies
- **React 19** + **TypeScript** - Modern UI with type safety
- **Vite 6** with SWC - Fast build tooling
- **TanStack Router** - Type-safe file-based routing
- **TanStack Query** - Server state management
- **HeroUI** - Beautiful component library
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations

## Getting Started

### Prerequisites

- Node.js >= 24.0.0
- pnpm >= 9.0.0

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx
│   ├── SessionDetails.tsx
│   ├── CoroutineTree.tsx
│   ├── EventsList.tsx
│   └── ...
├── hooks/              # Custom React hooks
│   ├── use-sessions.ts
│   ├── use-scenarios.ts
│   └── use-event-stream.ts
├── lib/                # Utilities and client libraries
│   ├── api-client.ts
│   ├── query-client.ts
│   └── utils.ts
├── routes/             # File-based routing (TanStack Router)
│   ├── __root.tsx
│   ├── index.tsx
│   ├── sessions/
│   └── scenarios/
├── types/              # TypeScript type definitions
│   └── api.ts
├── mocks/              # MSW mock handlers
│   ├── browser.ts
│   └── handlers.ts
├── main.tsx            # Application entry point
└── index.css           # Global styles
```

## Features

### 1. Session Management
- Create and manage visualization sessions
- View active sessions with coroutine counts
- Delete sessions when done

### 2. Real-time Event Streaming
- Connect to sessions via Server-Sent Events (SSE)
- Live updates as coroutines are created, started, and completed
- Visual indicators for connection status

### 3. Coroutine Tree Visualization
- Hierarchical view of parent-child relationships
- Color-coded states (Created, Active, Completed, Cancelled)
- Animated transitions for better UX

### 4. Event Timeline
- Chronological list of all coroutine events
- Filter events by coroutine ID or event type
- Relative timestamps for easy comparison

### 5. Scenario Execution
- Run pre-built coroutine scenarios
- Configure parameters (e.g., nesting depth)
- Automatically navigate to session results

## API Integration

The frontend connects to the backend API at `http://localhost:8080/api`:

- `GET /api/sessions` - List all sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions/:id` - Get session details
- `DELETE /api/sessions/:id` - Delete session
- `GET /api/sessions/:id/stream` - SSE event stream
- `GET /api/scenarios` - List available scenarios
- `POST /api/scenarios/:id` - Run scenario

## Development

### Mock Service Worker (MSW)

For local development without the backend:

1. Initialize MSW:
   ```bash
   npx msw init public/
   ```

2. Enable mocking in `main.tsx`:
   ```typescript
   if (import.meta.env.DEV) {
     const { worker } = await import('./mocks/browser')
     worker.start()
   }
   ```

### Code Quality

```bash
# Lint code
pnpm lint

# Format code
pnpm format
```

## Key Hooks

### `useSessions()`
Fetch all sessions with automatic refetching and caching.

### `useSession(sessionId)`
Get details for a specific session including coroutines and events.

### `useEventStream(sessionId, enabled)`
Connect to SSE stream for real-time event updates.

### `useRunScenario()`
Execute scenarios and navigate to results.

## Styling

The app uses Tailwind CSS with the HeroUI component library:

- Dark/light mode support
- Responsive design with mobile-first approach
- Custom container utilities (`container-custom`)
- Framer Motion for smooth animations

## Performance

- Route-based code splitting
- Optimistic updates with TanStack Query
- Virtualized lists for large datasets (planned)
- Debounced filters and search

## Contributing

1. Follow the existing code structure
2. Use TypeScript strictly (no `any` types)
3. Write accessible components
4. Test with both real backend and MSW mocks

## License

MIT

