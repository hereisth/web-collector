# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Web Collector is a bookmark manager application with a React frontend and Go backend in a monorepo structure. The project uses pnpm workspaces for dependency management.

**Architecture:**
- Frontend: React 19 + TypeScript with Vite, TanStack Router (file-based routing), TanStack Query (server state), Zustand (client state), Tailwind CSS v4
- Backend: Go 1.21 + Gin framework following Clean Architecture with `cmd/` for entry points and `internal/` for private code
- Communication: RESTful API with `/api` prefix; Vite dev server proxies `/api` requests to Go backend on port 8080

**Repository Structure:**
```
apps/
  web/           # React frontend (runs on :3000)
  backend/       # Go backend (runs on :8080)
```

## Common Commands

### Development
```bash
# Start both frontend and backend (recommended)
make dev              # or pnpm dev

# Start individually
make dev-web          # Frontend only on :3000
make dev-backend      # Backend only on :8080
make dev-backend-hot  # Backend with hot reload using Air
```

### Building
```bash
make build            # Build all
make build-web        # Frontend production build to apps/web/dist/
make build-backend    # Backend binary to apps/backend/dist/backend
```

### Code Quality
```bash
make lint             # ESLint for frontend
make typecheck        # TypeScript type checking
pnpm format           # Prettier formatting
```

### Testing
```bash
make test             # Run all tests
make test-backend     # Go backend tests with go test
pnpm test             # Frontend tests
```

### Dependencies
```bash
make install          # Install pnpm deps + Go modules
```

### Database & Docker
```bash
make backend-migrate  # Run database migrations
make docker-build     # Build Docker images
make docker-up        # Start containers
```

## Architecture Notes

### Frontend (apps/web/)
- **Routing**: File-based routing via TanStack Router; routes defined in `src/routes/` with generated `routeTree.gen.ts`
- **State Management**: TanStack Query for API/server state, Zustand for client state
- **API Communication**: Proxy configured in [vite.config.ts](apps/web/vite.config.ts#L16-L21) forwards `/api` to `http://localhost:8080`
- **Path Aliases**: `@` maps to `src/` directory

### Backend (apps/backend/)
- **Entry Point**: [cmd/server/main.go](apps/backend/cmd/server/main.go)
- **Simplified Structure**: Following Go community best practices with minimal package structure
  - `internal/server/` - Server setup including config, middleware, and router (single package for related code)
- **API Structure**: Routes grouped under `/api/v1`
- **Configuration**: Environment variables loaded via godotenv; see [server.go](apps/backend/internal/server/server.go)
- **Hot Reload**: Use Air for development (configured in `.air.toml`)

## Development Workflow

1. Initial setup: `make install` (installs pnpm deps + Go modules)
2. Start development: `make dev` (runs both frontend and backend)
3. Frontend changes hot-reload via Vite
4. Backend changes: use `make dev-backend-hot` for Air hot reload, or restart manually
5. Production builds: `make build` creates optimized outputs in respective `dist/` directories

## Important Details

- **Package Manager**: pnpm (requires >=8.15.0)
- **Node Version**: >=18.0.0
- **Go Version**: 1.21+
- **License**: CC-BY-NC-SA-4.0 (non-commercial)
- **TypeScript**: Project references configured in root [tsconfig.json](tsconfig.json)
