# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: Session-based (express-session + connect-pg-simple)
- **Password hashing**: bcrypt
- **Frontend**: React + Vite + Tailwind + shadcn/ui + framer-motion

## Application: NexusPay — Debit Card Manager

A fintech-style platform for managing top-up debit cards. Features:
- User registration and login (email/password, session-based auth)
- Dashboard showing all cards, total balance
- Card management (create, view, freeze/unfreeze, delete)
- Top-up functionality per card
- Transaction history (per-card and across all cards)
- Profile/settings management
- Support ticket creation and tracking

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── card-manager/       # React + Vite frontend (NexusPay)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

- `users` — user accounts (email, hashed password, profile info)
- `cards` — debit cards per user (number, balance, status, color)
- `transactions` — ledger of topup/payment/refund events
- `support_tickets` — user support tickets with status tracking
- `sessions` — express-session persistence (created automatically)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes are split by domain in `src/routes/`.

- Auth: `src/routes/auth.ts` — register, login, logout, /me
- Users: `src/routes/users.ts` — profile update, change password
- Cards: `src/routes/cards.ts` — CRUD, top-up, freeze/unfreeze
- Transactions: `src/routes/transactions.ts` — all transactions for user
- Support: `src/routes/support.ts` — ticket management
- Session middleware: `src/lib/session.ts`
- Auth middleware: `src/middlewares/requireAuth.ts`

### `artifacts/card-manager` (`@workspace/card-manager`)

React + Vite frontend. Mobile-first responsive design with Telegram Mini App support.

**Layout**:
- Desktop (≥768px): Sidebar navigation via shadcn `SidebarProvider`
- Mobile (<768px): Fixed bottom navigation bar (5 icons), compact top header with logo
- Layout component: `src/components/layout.tsx`

**Telegram Mini App**:
- Telegram WebApp script loaded in `index.html`
- `src/hooks/use-telegram.tsx` — calls `WebApp.ready()` + `WebApp.expand()`, sets CSS vars from theme
- `useTelegramBackButton()` hook for hardware back button integration
- Viewport meta: `user-scalable=no, viewport-fit=cover`

**Responsive Dialogs**:
- `src/components/responsive-dialog.tsx` — uses `Dialog` on desktop, `Drawer` (vaul) on mobile
- All modals (top-up, create card, balance, delete, support ticket) use `ResponsiveDialog`

**Pages** under `src/pages/`:
- `login.tsx`, `register.tsx` — auth pages (full-width on mobile, side image on desktop)
- `dashboard.tsx` — card overview + total balance + quick actions
- `cards.tsx` — card list + create card + top-up
- `card-details.tsx` — single card with 4-col action tiles (mobile) or 2-col (desktop)
- `transactions.tsx` — card list view on mobile, table on desktop
- `settings.tsx` — comprehensive settings: profile (read-only + edit/save), security (change password), appearance (theme toggle), legal (T&C/Privacy), help (contact support)
- `support.tsx` — support tickets
- `profile.tsx` — DEPRECATED, /profile redirects to /settings

**Navigation**:
- Desktop sidebar: logo + collapse trigger in header, nav items, user dropdown footer (Settings, Support, Theme cycle, Logout)
- Mobile: top header (back button on sub-pages, logo, user avatar dropdown), floating pill nav bar (Dashboard, Cards, Transactions) — centered ~340px pill, 56px tall, 12px above bottom edge, active item expands to show icon+label in dark pill (#474747), inactive items show icon-only
- No standalone theme button; theme cycling integrated into user dropdowns on both mobile and desktop
- Top-up presets: $50, $100, $1000, "Other" (reveals custom input) — consistent across dashboard, cards, and card-details pages

**CSS**:
- Safe area insets via `safe-area-bottom` / `safe-area-top` classes
- 44px minimum tap targets on mobile
- 16px font-size on inputs to prevent iOS zoom
- Telegram theme CSS variables support

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec + Orval codegen config. Run codegen:
`pnpm --filter @workspace/api-spec run codegen`
