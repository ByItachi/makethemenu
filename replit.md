# RestoPOS - Restaurant Point of Sale System

## Overview

RestoPOS is a full-stack restaurant management and point-of-sale (POS) application built for cafes, restaurants, and food service businesses. It combines a public-facing marketing/landing page (in Turkish) with a protected internal dashboard for managing tables, orders, menus, and analytics. The application follows a monorepo structure with a React frontend, Express backend, and PostgreSQL database.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure
The project uses a three-directory monorepo pattern:
- **`client/`** — React SPA frontend
- **`server/`** — Express.js API backend
- **`shared/`** — Shared types, schemas, and route definitions used by both client and server

### Frontend (`client/`)
- **Framework**: React with TypeScript, bundled by Vite
- **Routing**: `wouter` (lightweight client-side router)
- **State Management**: TanStack React Query for server state; no global client state library
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Animations**: Framer Motion for page transitions and UI interactions
- **Charts**: Recharts for dashboard analytics
- **Forms**: React Hook Form with Zod resolvers for validation
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support). Color palette uses Zinc darks with Amber/Orange accents. Fonts: Inter (body), Outfit (display)
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Pages
- **Public pages**: Landing page (`/`), Login (`/login`), plus marketing pages (About, Features, Prices, Contact) — content is in Turkish
- **Protected pages** (require auth): Dashboard, POS, Tables, Orders, Menu Management, Settings
- **Auth guard**: `ProtectedRoute` component checks auth state and redirects to `/login` if unauthenticated

### Backend (`server/`)
- **Framework**: Express.js with TypeScript, run via `tsx` in development
- **HTTP Server**: Node.js `http.createServer` wrapping Express
- **API Pattern**: RESTful endpoints under `/api/` with route definitions shared via `shared/routes.ts`
- **Database**: PostgreSQL via `node-postgres` (`pg` Pool)
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-validation integration
- **Schema location**: `shared/schema.ts` (POS tables) and `shared/models/auth.ts` (auth tables)
- **Storage pattern**: `IStorage` interface in `server/storage.ts` with `DatabaseStorage` implementation — all DB operations go through this layer
- **Dev server**: Vite dev server middleware served through Express in development (`server/vite.ts`)
- **Production**: Static files served from `dist/public` via `server/static.ts`

### Database Schema (PostgreSQL)
Key tables defined in `shared/schema.ts`:
- **`tables`** — Restaurant floor tables (name, status, capacity)
- **`categories`** — Menu categories
- **`products`** — Menu items with price, description, category reference
- **`orders`** — Orders linked to tables with status tracking
- **`order_items`** — Line items for each order
- **`contact_messages`** — Landing page contact form submissions

Auth tables in `shared/models/auth.ts`:
- **`sessions`** — Express session storage (required for Replit Auth)
- **`users`** — User accounts (required for Replit Auth)

Schema migrations use `drizzle-kit push` (`npm run db:push`).

### Authentication
- **Replit Auth** via OpenID Connect (OIDC) — handles login/logout flows
- Session-based auth stored in PostgreSQL via `connect-pg-simple`
- Auth integration code lives in `server/replit_integrations/auth/`
- Login redirects to `/api/login` (Replit OIDC flow)
- User info endpoint: `GET /api/auth/user`
- Client-side auth hook: `useAuth()` in `client/src/hooks/use-auth.ts`

### API Route Definitions
Routes are defined declaratively in `shared/routes.ts` with Zod schemas for input validation and response types. The server registers these routes in `server/routes.ts`. This shared definition pattern ensures type safety between client and server.

### Build Process
- **Development**: `npm run dev` — runs Express + Vite HMR
- **Production build**: `npm run build` — Vite builds client to `dist/public`, esbuild bundles server to `dist/index.cjs`
- The build script (`script/build.ts`) bundles select server dependencies to reduce cold start times

## External Dependencies

### Database
- **PostgreSQL** — Primary data store, connected via `DATABASE_URL` environment variable
- **Drizzle ORM** — Query builder and schema management
- **drizzle-kit** — Schema push/migration tool

### Authentication
- **Replit Auth (OIDC)** — External identity provider via `openid-client`
- **Passport.js** — Authentication middleware
- **express-session** + **connect-pg-simple** — Session management backed by PostgreSQL

### Required Environment Variables
- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — Secret for session signing
- `ISSUER_URL` — OIDC issuer URL (defaults to `https://replit.com/oidc`)
- `REPL_ID` — Replit environment identifier

### Key NPM Packages
- **Frontend**: React, wouter, @tanstack/react-query, recharts, framer-motion, date-fns, react-hook-form, zod, shadcn/ui (Radix primitives + Tailwind)
- **Backend**: Express, drizzle-orm, pg, passport, openid-client, express-session, connect-pg-simple
- **Shared**: Zod (validation), drizzle-zod (schema-to-zod bridges)