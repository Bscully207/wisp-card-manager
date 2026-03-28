# Wisp — Debit Card Manager

## Overview

Wisp is a fintech debit card management platform built as a Telegram Mini App (mobile-first, desktop-compatible). It's a pnpm workspace monorepo using TypeScript throughout. Each package manages its own dependencies.

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
- **Frontend**: React 19 + Vite 7 + Tailwind CSS v4 + shadcn/ui
- **Routing**: Wouter (lightweight client-side router)
- **State management**: TanStack React Query v5
- **Animations**: Framer Motion (selective usage — see gotchas below)
- **Drag & Drop**: @dnd-kit/core + @dnd-kit/sortable
- **Telegram SDK**: @twa-dev/sdk
- **External Card Issuer**: Kiml Cards API (not yet connected — all operations are local stubs)

## Features

- User registration and login (email/password, session-based auth)
- Dashboard showing all cards, total balance, quick actions
- Card management (create virtual/physical, view, freeze/unfreeze, delete, change PIN, update contacts)
- 3D Secure settings with OTP delivery method selection
- Top-up functionality per card
- Transaction history (per-card and across all cards) with type filtering
- Balance history (top-ups, fees, refunds) separated from transactions
- CSV export for transactions (per-card and cross-card with date range filtering)
- Physical card activation (activation code) and shipping tracking
- Telegram account linking per card
- Secure card detail viewing (iframe-based, stubbed until Kiml connected)
- Async job polling for card creation
- Notification center with individual/bulk read and notification preferences
- Profile/settings management with appearance theming (light/dark/system)
- Support ticket creation and tracking
- PWA installable (Chrome desktop)
- Drag-and-drop card reordering with localStorage persistence

## Structure

```text
/
├── artifacts/
│   ├── card-manager/       # React + Vite frontend (Telegram Mini App)
│   ├── api-server/         # Express.js REST API backend
│   └── mockup-sandbox/     # Component preview server (development only)
├── lib/
│   ├── db/                 # Drizzle ORM schema + database connection
│   ├── api-spec/           # OpenAPI specification (source of truth)
│   ├── api-zod/            # Zod validation schemas (auto-generated)
│   └── api-client-react/   # React Query hooks (auto-generated)
├── scripts/                # Utility scripts (post-merge, etc.)
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema (9 tables)

- `users` — user accounts (email, hashed password, profile info)
- `cards` — debit cards per user (number, balance, status, color, type: virtual/physical, activationCode, contactEmail/Phone, threeDsEnabled)
- `transactions` — ledger of topup/payment/refund/fee events with balance tracking
- `support_tickets` — user support tickets with status tracking
- `telegram_links` — links between cards and Telegram accounts (unique per card)
- `notifications` — user notifications (type, title, message, isRead)
- `notification_settings` — per-user notification preferences (transaction/topup/security/marketing alerts)
- `shipping` — shipping requests for physical cards (recipientName, address, city, country, zipCode, trackingNumber, status)
- `jobs` — async job tracking (type, status: pending/processing/completed/failed, result, error)
- `sessions` — express-session persistence (created automatically by connect-pg-simple)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes
- `pnpm --filter @workspace/db run push-force` — push with destructive changes

## Package Details

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Entry point: `src/index.ts` → `src/app.ts`. All routes under `/api`.

- **Auth routes** (`src/routes/auth.ts`): register, login, logout, /me
- **User routes** (`src/routes/users.ts`): profile update, change password
- **Card routes** (`src/routes/cards.ts`): full card lifecycle — CRUD, freeze, PIN, contacts, 3DS, activation, topup, access-url, transactions, balance-history, exports, telegram linking
- **Shipping routes** (`src/routes/shipping.ts`): create shipping request, list with pagination/status filter
- **Transaction routes** (`src/routes/transactions.ts`): all user transactions with type filter and CSV export
- **Notification routes** (`src/routes/notifications.ts`): list, mark read (single + all), preferences CRUD
- **Support routes** (`src/routes/support.ts`): ticket management
- **Telegram routes** (`src/routes/telegram.ts`): Telegram account linking/unlinking per card
- **Job routes** (`src/routes/jobs.ts`): async job creation and polling
- **Health check** (`src/routes/health.ts`): GET /healthz
- **Services**: `card.service.ts`, `job.service.ts`, `shipping.service.ts`, `telegram.service.ts`
- **Middleware**: `requireAuth.ts` (session check), `session.ts` (express-session config)

### `artifacts/card-manager` (`@workspace/card-manager`)

React + Vite frontend. Mobile-first responsive design with Telegram Mini App support.

- **Entry**: `src/main.tsx` → `src/App.tsx`
- **Router**: Wouter with `BASE_URL` prefix
- **Provider stack**: `QueryClientProvider` → `ThemeProvider` → `NotificationProvider` → `TooltipProvider` → `WouterRouter`
- **Layout**: `src/components/layout.tsx` — sidebar (desktop ≥768px) + bottom nav (mobile)
- **Pages**: login, register, dashboard, cards, card-details, transactions, notifications, settings, support, not-found
- **Fonts**: Manrope (Google Fonts)
- **CSS**: Tailwind v4 with custom HSL theme variables, container queries (built-in, no plugin), `tw-animate-css`

### `lib/db` (`@workspace/db`)

Drizzle ORM + PostgreSQL. Schema files in `src/schema/` (users, cards, transactions, support_tickets, telegram_links, notifications, shipping, jobs).

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec + Orval codegen config. Run `pnpm --filter @workspace/api-spec run codegen` to regenerate client.

### `lib/api-client-react` (`@workspace/api-client-react`)

Auto-generated TanStack Query hooks. Custom fetch in `src/custom-fetch.ts` handles session cookies (`credentials: "include"`), JSON parsing, and error wrapping via `ApiError` class.

### `lib/api-zod` (`@workspace/api-zod`)

Auto-generated Zod schemas from the OpenAPI spec.

## Demo Accounts

| Email | Password | Name |
|-------|----------|------|
| demo@testapp.com | 1234 | Alex Johnson |
| test@testapp.com | Test1234 | Sofia Martinez |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| DATABASE_URL | PostgreSQL connection string |
| PORT | Server port (set per artifact by Replit) |
| SESSION_SECRET | Express session secret (optional, has default) |
| KIML_API_KEY | Kiml Cards API key (needed for production integration) |

## Critical Gotchas

1. **Framer Motion in Telegram WebView**: NEVER use `AnimatePresence`/`motion.div` with step transitions inside `ResponsiveDialog` flows. Telegram WebView's `prefers-reduced-motion` or animation timers cause invisible content. Framer Motion is safe in standalone components (credit-card, pill-switcher, transaction-item).

2. **Container Queries (CreditCard)**: Tailwind v4 has container queries built-in — no `@tailwindcss/container-queries` plugin. The `CreditCard` component uses `@container` wrapper + `cqw` base units + stepped breakpoints (`@[280px]`, `@[380px]`, `@[480px]`).

3. **Sidebar collapsed mode**: Uses `group-data-[collapsible=icon]` Tailwind variant. Content padding switches to `px-0`, menu links get `justify-center px-0 gap-0`, and logo switches from full text to wind icon with `mix-blend-screen`/`mix-blend-lighten` for transparent background.

4. **useCardOrder infinite re-render prevention**: Uses `useRef` + `cardIds.join(",")` comparison to avoid re-running the ordering effect on every render.

5. **Login sync**: Both login and register forms use `queryClient.setQueryData(getGetMeQueryKey(), data.user ?? data)` synchronously on success to avoid a race condition with the auth check redirect.

6. **ResponsiveDialog**: Uses Radix `DialogPrimitive.Content` directly on mobile (full-screen overlay) to avoid CSS class merge conflicts with tailwind-merge. Desktop uses styled `DialogContent`.

## Kiml API Integration

The app is designed to work with Kiml Cards (`https://api.kimlcards.com`) as the card issuing provider. Currently all operations are locally stubbed. See `DOCUMENTATION.md` for the complete Kiml API integration guide with endpoint mapping, step-by-step checklist, and data model differences.

Reference: `attached_assets/kimlcards_api_reference_1774179317612.md`

## GitHub

Repository: https://github.com/Bscully207/wisp-card-manager
