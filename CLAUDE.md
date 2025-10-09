# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ZKsync Easy On-Ramp is a monorepo that simplifies fiat on-ramping for ZKsync applications. It consists of three main packages:

1. **SDK** (`packages/sdk/`) - NPM package (`zksync-easy-onramp`) that provides frontend integration for fiat purchases and token swaps
2. **Server** (`packages/server/`) - NestJS-based API server that aggregates quotes from on-ramp providers and manages order tracking
3. **Demo** (`apps/demo/`) - Vue 3 application demonstrating SDK implementation

## Development Commands

### Initial Setup

```bash
npm install                        # Install all dependencies
npm run setup:api                  # Build server and run database migrations
```

### Development

```bash
npm run dev                        # Start API server and SDK (concurrent watch mode)
npm run dev:demo                   # Start demo app, API server, and SDK (all in watch mode)
npm run dev:api                    # Start only the API server
npm run dev:sdk                    # Start only the SDK in watch mode
```

### Building

```bash
npm run -w zksync-easy-onramp build          # Build SDK package
npm run -w server build                       # Build server (builds both api and db libs)
```

### Testing

```bash
npm run -w server test:perf       # Run performance tests with Artillery
```

### Linting and Formatting

```bash
npm run lint                       # Lint all workspaces
npm run lint:fix                   # Fix linting issues across all workspaces
npm run -w zksync-easy-onramp typecheck     # Type check SDK
```

### Database Migrations

```bash
npm run -w server migration:create --name=migration_name    # Create new migration
npm run -w server migration:generate --name=migration_name  # Generate migration from entities
npm run -w server migration:run                             # Run pending migrations
npm run -w server migration:revert                          # Revert last migration
```

### Release Management

```bash
npm run prepare-release            # Create a changeset for version updates (uses Changesets)
npm run publish-package            # Build and publish SDK to NPM (maintainers only)
```

## Architecture

### SDK Architecture (`packages/sdk/`)

The SDK provides a multi-step execution framework for on-ramp flows:

- **Core Execution** (`src/core/`):
  - `execution.ts` - Main entry point for `executeRoute()`, `resumeRouteExecution()`, `stopRouteExecution()`
  - `executionState.ts` - Manages execution state and hooks
  - `StepManager.ts` - Orchestrates multi-step route execution
  - `executors/` - Step-specific executors:
    - `TransakStepExecutor.ts` - Handles Transak on-ramp provider integration
    - `LifiStepExecutor.ts` - Handles LI.FI swap steps using viem for transaction signing

- **API Client** (`src/api.ts`) - Communicates with the server for quotes and config

- **Types** (`src/types/`) - Shared TypeScript types for SDK and server communication

The SDK exports quote fetching (`fetchQuotes`), route execution (`executeRoute`), and utility functions for filtering/sorting quotes.

### Server Architecture (`packages/server/`)

NestJS monorepo using a library-based architecture:

- **Main Application** (`apps/api/src/`):
  - `app.module.ts` - Root module importing all library modules
  - Controllers: `QuoteController`, `ConfigController`, `OrderStatusController`, `HealthController`
  - `QuoteService` - Aggregates quotes from multiple providers

- **Libraries** (`libs/`):
  - `db/` - TypeORM configuration, entities, repositories, and migrations
  - `providers/` - Provider abstraction layer:
    - `providers-registry.service.ts` - Registry of available on-ramp providers
    - `providers-quote.service.ts` - Fetches quotes from providers
    - `providers-update.service.ts` - Background worker to update provider availability
    - `providers/transak/` - Transak-specific implementation
  - `tokens/` - Token data management and caching
  - `swaps/` - LI.FI swap integration
  - `common/` - Shared utilities
  - `logger/` - Winston-based logging

- **Background Workers**: The server runs background workers (started in `app.module.ts`):
  - `TokensDataSaverService` - Periodically updates token data
  - `ProvidersUpdateService` - Periodically checks provider availability

- **Database**: Uses PostgreSQL with TypeORM. All entities are in `libs/db/src/entities/`. Migrations in `libs/db/src/migrations/`.

### Demo Application (`apps/demo/`)

Vue 3 + TypeScript application using:
- Vite for build tooling
- Reown AppKit (formerly WalletConnect) for wallet integration
- Wagmi/viem for Ethereum interactions
- TanStack Query for data fetching
- Pinia for state management
- Tailwind CSS for styling

## Code Conventions

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/) format:
- `feat(scope): description` - New feature
- `fix(scope): description` - Bug fix
- `docs(scope): description` - Documentation updates
- `ci(scope): description` - CI/CD changes
- `chore(scope): description` - Maintenance tasks

PR titles must follow this format (enforced by GitHub workflow).

### Version Management

Use Changesets for versioning:
1. Run `npm run prepare-release` to create a changeset
2. Commit the changeset with your PR
3. Changesets bot will create a release PR when merged
4. Merging the release PR publishes to NPM

## Important Dependencies

- **SDK**: `@lifi/sdk` (swap integration), `viem` (peer dependency for Ethereum interactions)
- **Server**: NestJS framework, TypeORM, PostgreSQL, `@lifi/sdk`, `viem`
- **Demo**: Vue 3, `@reown/appkit`, `@wagmi/vue`, `viem`

## Environment Configuration

- **Server**: Requires `.env` file in `packages/server/` (see `.env.example`)
- **SDK**: Requires `.env` file in `packages/sdk/` (see `.env.example`)
- **Database**: Requires PostgreSQL database named `easy-onramp`

## Notes

- The project uses NPM workspaces; always use `-w <workspace-name>` flag for workspace-specific commands
- Server uses NestJS CLI monorepo mode (`nest-cli.json` defines projects)
- SDK is published as dual ESM/CJS package with TypeScript definitions
- All packages use flat ESLint config (eslint.config.js/mjs)
- TypeScript path aliases: SDK uses `@sdk/*`, server uses `@app/*`
