# Wisp Card Manager — Complete Developer Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Getting Started](#getting-started)
4. [Monorepo Structure](#monorepo-structure)
5. [Database Schema](#database-schema)
6. [Backend (API Server)](#backend-api-server)
7. [Frontend (Card Manager)](#frontend-card-manager)
8. [API Endpoints Reference](#api-endpoints-reference)
9. [Authentication Flow](#authentication-flow)
10. [Key Design Patterns](#key-design-patterns)
11. [Critical Gotchas & Known Issues](#critical-gotchas--known-issues)
12. [Kiml API Integration Guide](#kiml-api-integration-guide)
13. [PWA Support](#pwa-support)
14. [Environment Variables](#environment-variables)

---

## Overview

Wisp is a fintech debit card management application built as a **Telegram Mini App** (mobile-first, desktop-compatible). Users can create virtual and physical debit cards, top up balances, freeze/unfreeze cards, manage PINs and 3D Secure settings, view transaction and balance history, export CSV reports, link Telegram accounts, track physical card shipments, and manage notification preferences.

**Current state**: The backend **simulates all card operations locally** using a PostgreSQL database. The architecture is designed to be swapped to the real Kiml Cards API (`https://api.kimlcards.com`) — see [Kiml API Integration Guide](#kiml-api-integration-guide) for the full migration plan.

**GitHub**: https://github.com/Bscully207/wisp-card-manager

---

## Architecture

### High-Level Data Flow

```
┌──────────────────┐     HTTP/JSON      ┌──────────────────┐     Drizzle ORM    ┌────────────┐
│  Card Manager    │ ◄─────────────────► │   API Server     │ ◄────────────────► │ PostgreSQL │
│  (React + Vite)  │   session cookies   │   (Express 5)    │                    │            │
│  Port: dynamic   │   /api/* routes     │   Port: dynamic  │                    └────────────┘
└──────────────────┘                     └──────────────────┘
        │                                        │
        │ @twa-dev/sdk                           │ (future)
        ▼                                        ▼
┌──────────────────┐                     ┌──────────────────┐
│ Telegram WebView │                     │ Kiml Cards API   │
│ (optional host)  │                     │ api.kimlcards.com│
└──────────────────┘                     └──────────────────┘
```

### Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | 24 |
| Package Manager | pnpm | 10+ |
| Language | TypeScript | 5.9 |
| Frontend Framework | React | 19 |
| Build Tool | Vite | 7 |
| CSS Framework | Tailwind CSS | v4 |
| UI Component Library | shadcn/ui (Radix UI primitives) | latest |
| State Management | TanStack React Query | v5 |
| Client Router | Wouter | latest |
| Animations | Framer Motion | latest |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable | latest |
| Backend Framework | Express | 5 |
| ORM | Drizzle ORM | latest |
| Database | PostgreSQL | (Replit-managed) |
| Session Store | connect-pg-simple | latest |
| Auth | bcrypt | latest |
| Telegram SDK | @twa-dev/sdk | latest |
| Validation | Zod (v4) + drizzle-zod | latest |
| API Codegen | Orval | latest |
| Backend Build | esbuild | latest |

---

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm 10+
- PostgreSQL database (auto-provisioned on Replit via `DATABASE_URL`)

### Install Dependencies

```bash
pnpm install
```

### Push Database Schema

```bash
pnpm --filter @workspace/db run db:push
# If destructive changes are needed:
pnpm --filter @workspace/db run db:push --force
```

### Start Development Servers

```bash
# API server (reads PORT from environment)
pnpm --filter @workspace/api-server run dev

# Frontend dev server (reads PORT from environment)
pnpm --filter @workspace/card-manager run dev
```

### Regenerate API Client (after OpenAPI spec changes)

```bash
pnpm --filter @workspace/api-spec run codegen
```

This regenerates both `lib/api-zod/` (Zod schemas) and `lib/api-client-react/` (React Query hooks) from the OpenAPI spec in `lib/api-spec/`.

### Typecheck

```bash
pnpm run typecheck
```

### Demo Accounts

| Email | Password | Name |
|-------|----------|------|
| demo@testapp.com | 1234 | Alex Johnson |
| test@testapp.com | Test1234 | Sofia Martinez |

---

## Monorepo Structure

```
/
├── artifacts/
│   ├── api-server/                    # Express API backend
│   │   ├── src/
│   │   │   ├── index.ts               # Server entry point (listens on PORT)
│   │   │   ├── app.ts                 # Express app setup (cors, json, sessions, routes)
│   │   │   ├── routes/
│   │   │   │   ├── index.ts           # Route aggregator — mounts all sub-routers
│   │   │   │   ├── auth.ts            # POST /auth/register, /auth/login, /auth/logout, GET /auth/me
│   │   │   │   ├── users.ts           # PUT /users/profile, POST /users/change-password
│   │   │   │   ├── cards.ts           # Full card lifecycle (20+ endpoints)
│   │   │   │   ├── transactions.ts    # GET /transactions, /transactions/export
│   │   │   │   ├── notifications.ts   # CRUD for notifications + preferences
│   │   │   │   ├── shipping.ts        # POST/GET /shipping
│   │   │   │   ├── support.ts         # POST/GET /support/tickets
│   │   │   │   ├── telegram.ts        # Telegram linking per card
│   │   │   │   ├── jobs.ts            # POST /jobs, GET /jobs/:id
│   │   │   │   └── health.ts          # GET /healthz
│   │   │   ├── services/
│   │   │   │   ├── card.service.ts    # Card business logic (create, topup, freeze, etc.)
│   │   │   │   ├── job.service.ts     # Async job lifecycle
│   │   │   │   ├── shipping.service.ts # Shipping request management
│   │   │   │   └── telegram.service.ts # Telegram link/unlink
│   │   │   ├── middlewares/
│   │   │   │   └── requireAuth.ts     # Session auth guard
│   │   │   └── lib/
│   │   │       └── session.ts         # express-session + connect-pg-simple config
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── card-manager/                  # React + Vite frontend
│   │   ├── src/
│   │   │   ├── main.tsx               # ReactDOM entry + service worker registration
│   │   │   ├── App.tsx                # Provider stack + router + Telegram back button
│   │   │   ├── index.css              # Tailwind v4 config + theme variables + custom classes
│   │   │   ├── pages/
│   │   │   │   ├── auth.tsx           # Shared auth layout (Login/Register tabs)
│   │   │   │   ├── login.tsx          # Login tab wrapper
│   │   │   │   ├── register.tsx       # Register tab wrapper
│   │   │   │   ├── dashboard.tsx      # Main dashboard (cards, balance, transactions)
│   │   │   │   ├── cards.tsx          # Card grid + create wizard + DnD reordering
│   │   │   │   ├── card-details.tsx   # Full card management (details/settings/history tabs)
│   │   │   │   ├── transactions.tsx   # Transaction history with type filters + export
│   │   │   │   ├── notifications.tsx  # Notification center (unread/all, mark read)
│   │   │   │   ├── settings.tsx       # Profile, security, appearance, notifications, legal
│   │   │   │   ├── support.tsx        # Support ticket list + create
│   │   │   │   └── not-found.tsx      # 404 page
│   │   │   ├── components/
│   │   │   │   ├── layout.tsx              # App shell: sidebar (desktop) + bottom nav (mobile)
│   │   │   │   ├── credit-card.tsx         # Visual debit card (container queries, gradients)
│   │   │   │   ├── card-creation-wizard.tsx # Multi-step card creation (6-7 steps)
│   │   │   │   ├── responsive-dialog.tsx   # Dialog (desktop) / full-screen (mobile)
│   │   │   │   ├── secure-card-viewer.tsx  # Iframe viewer for sensitive card data
│   │   │   │   ├── theme-provider.tsx      # Light/dark/system theme
│   │   │   │   ├── auth/
│   │   │   │   │   ├── login-form.tsx      # Email/password form
│   │   │   │   │   ├── register-form.tsx   # Registration form
│   │   │   │   │   ├── brand-panel.tsx     # Right-side branding (desktop)
│   │   │   │   │   ├── pill-switcher.tsx   # Login/Register tab pills
│   │   │   │   │   └── social-buttons.tsx  # Google/Telegram buttons (UI only)
│   │   │   │   ├── shared/
│   │   │   │   │   ├── top-up-dialog.tsx          # Top-up with presets
│   │   │   │   │   ├── freeze-card-button.tsx     # Freeze/unfreeze toggle
│   │   │   │   │   ├── transaction-item.tsx       # Transaction list item
│   │   │   │   │   ├── export-dialog.tsx          # CSV export date picker
│   │   │   │   │   ├── change-pin-dialog.tsx      # 6-digit PIN change
│   │   │   │   │   ├── activate-card-dialog.tsx   # Physical card activation
│   │   │   │   │   ├── shipping-address-form.tsx  # Shipping address entry
│   │   │   │   │   └── shipping-tracking.tsx      # Shipping status display
│   │   │   │   ├── settings/
│   │   │   │   │   ├── appearance-section.tsx      # Theme picker
│   │   │   │   │   ├── notification-preferences.tsx # Notification toggles
│   │   │   │   │   └── legal-dialogs.tsx          # Terms & Privacy dialogs
│   │   │   │   └── ui/                   # shadcn/ui primitives (button, card, dialog, etc.)
│   │   │   ├── hooks/
│   │   │   │   ├── use-card-order.ts      # DnD ordering + localStorage persistence
│   │   │   │   ├── use-mobile.tsx         # Media query breakpoint (768px)
│   │   │   │   ├── use-notifications.tsx  # Notification state + unread count
│   │   │   │   ├── use-telegram.tsx       # Telegram WebApp SDK integration
│   │   │   │   ├── use-telegram-link.ts   # Per-card Telegram linking hooks
│   │   │   │   ├── use-job-polling.ts     # Async job status polling
│   │   │   │   └── use-toast.ts           # shadcn toast hook
│   │   │   └── lib/
│   │   │       └── utils.ts              # cn(), formatCurrency(), formatCardNumber()
│   │   ├── public/
│   │   │   ├── favicon.png               # App favicon
│   │   │   ├── favicon.svg               # SVG favicon
│   │   │   ├── manifest.json             # PWA manifest
│   │   │   ├── sw.js                     # Minimal service worker
│   │   │   ├── icons/                    # PWA icons (192, 512, maskable)
│   │   │   └── images/
│   │   │       ├── wisp-logo-design-white_*.png  # Full logo (dark mode)
│   │   │       ├── wisp-logo-design-black_*.png  # Full logo (light mode)
│   │   │       ├── wisp-icon.png                 # Wind icon (sidebar collapsed)
│   │   │       └── auth-bg.png                   # Auth page background
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   └── mockup-sandbox/               # Component preview server (dev only)
│
├── lib/
│   ├── db/                            # Database layer
│   │   ├── src/
│   │   │   ├── index.ts               # DB connection (uses DATABASE_URL)
│   │   │   └── schema/
│   │   │       ├── index.ts           # Re-exports all tables
│   │   │       ├── users.ts
│   │   │       ├── cards.ts
│   │   │       ├── transactions.ts
│   │   │       ├── support_tickets.ts
│   │   │       ├── telegram_links.ts
│   │   │       ├── notifications.ts
│   │   │       ├── shipping.ts
│   │   │       └── jobs.ts
│   │   └── drizzle.config.ts
│   │
│   ├── api-spec/                      # OpenAPI specification
│   │   └── orval.config.ts            # Orval codegen configuration
│   │
│   ├── api-client-react/              # Auto-generated React Query hooks
│   │   └── src/
│   │       ├── custom-fetch.ts        # Fetch wrapper (credentials, error handling)
│   │       ├── generated/
│   │       │   ├── api.ts             # Generated query/mutation hooks
│   │       │   └── api.schemas.ts     # Generated TypeScript types
│   │       └── index.ts
│   │
│   └── api-zod/                       # Auto-generated Zod schemas
│       └── src/
│           ├── generated/
│           │   ├── api.ts
│           │   └── types/             # Individual Zod schemas per type
│           └── index.ts
│
├── scripts/                           # Utility scripts
├── pnpm-workspace.yaml                # Workspace package list
├── tsconfig.base.json                 # Shared TS config (composite: true)
├── tsconfig.json                      # Root project references
├── package.json                       # Root scripts (build, typecheck)
├── replit.md                          # Quick reference for AI agents
└── DOCUMENTATION.md                   # This file
```

---

## Database Schema

All tables are defined in `lib/db/src/schema/`. The database is PostgreSQL, accessed via Drizzle ORM.

### users

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | serial | PK | Auto-incrementing user ID |
| email | varchar(255) | NOT NULL, UNIQUE | Login email |
| password_hash | text | NOT NULL | bcrypt-hashed password |
| first_name | varchar(100) | nullable | User's first name |
| last_name | varchar(100) | nullable | User's last name |
| phone | varchar(50) | nullable | Phone number |
| address | text | nullable | Street address |
| city | varchar(100) | nullable | City |
| country | varchar(100) | nullable | Country |
| created_at | timestamptz | NOT NULL, default now() | Account creation time |
| updated_at | timestamptz | NOT NULL, auto-updated | Last update time |

### cards

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | serial | PK | Auto-incrementing card ID |
| user_id | integer | FK → users.id (CASCADE) | Owner |
| type | varchar(20) | NOT NULL, default "virtual" | "virtual" or "physical" |
| card_number | varchar(19) | NOT NULL, UNIQUE | Full 16-digit card number (locally generated) |
| cardholder_name | varchar(100) | NOT NULL | Name printed on card |
| expiry_month | integer | NOT NULL | Expiry month (1-12) |
| expiry_year | integer | NOT NULL | Expiry year (4-digit) |
| cvv | varchar(4) | NOT NULL | 3-digit CVV (locally generated) |
| balance | double precision | NOT NULL, default 0 | Current balance in card currency |
| currency | varchar(10) | NOT NULL, default "EUR" | Card currency (EUR, USD, GBP) |
| status | varchar(20) | NOT NULL, default "active" | "active", "frozen", "expired", "cancelled", "pending_activation" |
| label | varchar(100) | nullable | User-given nickname (e.g. "Travel Card") |
| color | varchar(50) | nullable | Theme color for card display (blue, black, silver, purple, green) |
| contact_email | varchar(255) | nullable | Per-card contact email |
| contact_phone | varchar(30) | nullable | Per-card contact phone |
| contact_phone_dial_code | varchar(10) | nullable | Phone dial code (e.g. "+1") |
| activation_code | varchar(20) | nullable | Physical card activation code (8-char alphanumeric) |
| three_ds_enabled | boolean | NOT NULL, default true | Whether 3D Secure is enabled |
| created_at | timestamptz | NOT NULL, default now() | Card creation time |
| updated_at | timestamptz | NOT NULL, auto-updated | Last update time |

### transactions

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | serial | PK | Transaction ID |
| card_id | integer | FK → cards.id (CASCADE) | Associated card |
| user_id | integer | FK → users.id (CASCADE) | Transaction owner |
| type | varchar(20) | NOT NULL | "topup", "payment", "refund", "fee" |
| amount | double precision | NOT NULL | Transaction amount |
| balance_before | double precision | NOT NULL | Card balance before transaction |
| balance_after | double precision | NOT NULL | Card balance after transaction |
| description | text | nullable | Human-readable description |
| status | varchar(20) | NOT NULL, default "completed" | Transaction status |
| created_at | timestamptz | NOT NULL, default now() | Transaction time |

### support_tickets

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | serial | PK | Ticket ID |
| user_id | integer | FK → users.id (CASCADE) | Ticket creator |
| subject | varchar(255) | NOT NULL | Ticket subject |
| message | text | NOT NULL | Ticket body |
| category | varchar(50) | NOT NULL | "billing", "card", "account", "technical", "other" |
| status | varchar(50) | NOT NULL, default "open" | "open", "in_progress", "resolved", "closed" |
| created_at | timestamptz | NOT NULL, default now() | Created time |
| updated_at | timestamptz | NOT NULL, auto-updated | Last update time |

### telegram_links

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | serial | PK | Link ID |
| card_id | integer | FK → cards.id (CASCADE), UNIQUE | One Telegram link per card |
| user_id | integer | FK → users.id (CASCADE) | Link owner |
| telegram_id | varchar(50) | NOT NULL | Telegram user ID |
| telegram_username | varchar(100) | nullable | Telegram @username |
| telegram_first_name | varchar(100) | nullable | Telegram display name |
| created_at | timestamptz | NOT NULL, default now() | Link creation time |

### notifications

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | serial | PK | Notification ID |
| user_id | integer | FK → users.id (CASCADE) | Recipient |
| type | varchar(50) | NOT NULL, default "info" | Notification type |
| title | varchar(255) | NOT NULL | Notification title |
| message | text | NOT NULL | Notification body |
| is_read | boolean | NOT NULL, default false | Read status |
| created_at | timestamptz | NOT NULL, default now() | Notification time |

### notification_settings

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | serial | PK | Settings ID |
| user_id | integer | FK → users.id (CASCADE), UNIQUE | One settings row per user |
| transaction_alerts | boolean | NOT NULL, default true | Receive transaction notifications |
| topup_alerts | boolean | NOT NULL, default true | Receive top-up notifications |
| security_alerts | boolean | NOT NULL, default true | Receive security notifications |
| marketing_alerts | boolean | NOT NULL, default true | Receive marketing notifications |

### shipping

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | serial | PK | Shipping ID |
| card_id | integer | FK → cards.id (CASCADE) | Physical card being shipped |
| user_id | integer | FK → users.id (CASCADE) | Requester |
| status | varchar(20) | NOT NULL, default "in_review" | "in_review", "dispatched", "shipped", "delivered", "cancelled" |
| recipient_name | varchar(200) | NOT NULL | Ship-to name |
| address | varchar(500) | NOT NULL | Ship-to address |
| city | varchar(100) | NOT NULL | Ship-to city |
| country | varchar(100) | NOT NULL | Ship-to country |
| zip_code | varchar(20) | NOT NULL | Ship-to postal code |
| tracking_number | varchar(100) | nullable | Courier tracking number |
| created_at | timestamptz | NOT NULL, default now() | Request time |
| updated_at | timestamptz | NOT NULL, auto-updated | Last status update |

### jobs

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | serial | PK | Job ID |
| user_id | integer | FK → users.id (CASCADE) | Job owner |
| type | varchar(50) | NOT NULL | Job type (e.g. "card_creation") |
| status | varchar(20) | NOT NULL, default "pending" | "pending", "processing", "completed", "failed" |
| result | jsonb | nullable | Completed job result data |
| error | text | nullable | Failure reason |
| created_at | timestamptz | NOT NULL, default now() | Job creation time |
| updated_at | timestamptz | NOT NULL, auto-updated | Last status change |

### sessions

Managed automatically by `connect-pg-simple`. Stores express-session data in PostgreSQL. No Drizzle schema — the table is created by the session middleware on first use.

---

## Backend (API Server)

### Entry Point

`artifacts/api-server/src/index.ts` starts the Express server on the port from `process.env.PORT`.

### App Configuration (`src/app.ts`)

```
Express app setup:
1. trust proxy (for Replit's reverse proxy)
2. CORS (origin: true, credentials: true)
3. JSON body parsing
4. URL-encoded body parsing
5. Cookie parser
6. Session middleware (PostgreSQL-backed)
7. All routes mounted under /api
```

### Route Modules

All routes are aggregated in `src/routes/index.ts` and mounted under `/api` in the app.

### Service Layer

Business logic is separated into service files in `src/services/`:

**card.service.ts** — Core card operations:

| Function | What It Does |
|----------|-------------|
| `generateCardNumber()` | Random 16-digit number in 4-digit segments |
| `generateCvv()` | Random 3-digit CVV |
| `generateActivationCode()` | 8-char alphanumeric code for physical cards |
| `toCardResponse(card)` | Formats DB record → API response shape |
| `getUserCards(userId)` | All cards for a user, ordered by creation date desc |
| `getCardByIdForUser(cardId, userId)` | Single card with ownership verification |
| `createCard({ userId, currency, label, color, type })` | Creates card with unique number retry (up to 5 attempts) |
| `topUpCard(cardId, userId, amount, description?)` | Adds balance + creates transaction (DB transaction for atomicity) |
| `freezeCard(cardId, userId, frozen)` | Toggles frozen/active status |
| `updateCardPin(cardId, userId, pin)` | Stubbed PIN update (returns success without changing anything) |
| `updateCardContacts(cardId, userId, email, phone, dialCode, applyToAll)` | Updates per-card contacts (optionally updates all user's cards) |
| `activatePhysicalCard(cardId, userId, code)` | Validates activation code → sets status to "active" |
| `deleteCard(cardId, userId)` | Hard-deletes card record |
| `getCard3ds(cardId, userId)` | Returns 3DS enabled status |
| `updateCard3ds(cardId, userId, enabled)` | Toggles 3DS flag |
| `getCardTransactions(cardId, userId, typeFilter?)` | Transactions with optional type filter |
| `getCardBalanceHistory(cardId, userId)` | Balance-affecting entries only (topup, fee, refund) |

**job.service.ts** — Async job management:

| Function | What It Does |
|----------|-------------|
| `createJob({ userId, type })` | Creates a "pending" job record |
| `getJobById(jobId, userId)` | Gets job with ownership check |
| `updateJobStatus(jobId, status, result?, error?)` | Updates status + optional result/error |
| `completeJobWithResult(jobId, result)` | Sets status = "completed" + stores result |
| `failJob(jobId, error)` | Sets status = "failed" + stores error message |

**shipping.service.ts** — Shipping requests:

| Function | What It Does |
|----------|-------------|
| `createShipping(...)` | Creates request (validates card is physical type) |
| `getShippingRequests(...)` | Paginated list with status filter |

**telegram.service.ts** — Telegram card linking:

| Function | What It Does |
|----------|-------------|
| `getTelegramLinkForCard(cardId, userId)` | Get link status |
| `linkTelegramToCard(cardId, userId, ...)` | Create link (unique per card) |
| `unlinkTelegramFromCard(cardId, userId)` | Remove link |

### Auth Middleware

`src/middlewares/requireAuth.ts` checks `req.session.userId`. If missing, returns 401. Used on all protected routes.

### Session Configuration

`src/lib/session.ts` sets up `express-session` with `connect-pg-simple` for PostgreSQL session storage. Session cookie config:
- `httpOnly: true`
- `secure: true` in production
- `sameSite: "lax"`
- 24-hour max age

---

## Frontend (Card Manager)

### Entry Point Chain

```
src/main.tsx
  → Registers service worker (PWA)
  → Renders <App />

src/App.tsx
  → QueryClientProvider (React Query, retry: 1, no refetch on focus)
    → ThemeProvider (light/dark/system, localStorage key: "wisp-ui-theme")
      → NotificationProvider (fetches + caches unread count)
        → TooltipProvider
          → WouterRouter (base = import.meta.env.BASE_URL stripped of trailing slash)
            → AppRouter (route definitions + Telegram back button management)
```

### Router & Routes

Uses **Wouter** as client-side router. The `base` is set to `import.meta.env.BASE_URL` (without trailing slash) so all routes work behind Replit's path-based proxy.

| Path | Component | Layout | Description |
|------|-----------|--------|-------------|
| `/login` | Login | No | Auth page, login tab |
| `/register` | Register | No | Auth page, register tab |
| `/dashboard` | Dashboard | Yes | Main dashboard with card carousel |
| `/cards` | Cards | Yes | Card grid with create wizard |
| `/cards/:id` | CardDetails | Yes | Full card management view |
| `/transactions` | Transactions | Yes | Filterable transaction history |
| `/notifications` | Notifications | Yes | Notification center |
| `/support` | Support | Yes | Support tickets |
| `/settings` | SettingsPage | Yes | Profile, security, appearance, etc. |
| `/profile` | Redirect → /settings | — | Legacy redirect |
| `*` (fallback) | Redirect → /login | — | Unauthenticated fallback |

`ROOT_PATHS` = `["/dashboard", "/cards", "/transactions"]` — used by Layout for Telegram back button logic (back button hidden on root pages).

### Layout Component (`layout.tsx`)

The `Layout` component wraps all authenticated pages and provides two navigation modes:

**Desktop (≥768px)**: Left sidebar using shadcn `SidebarProvider` / `Sidebar` / `SidebarMenuButton`. Features:
- Collapsible (icon-only mode) via a floating chevron button (`SidebarDividerTrigger`)
- Header: Full "Wisp" logo when expanded, wind icon when collapsed
- Navigation: Dashboard, Cards, Transactions
- Footer: User dropdown (profile, notifications, settings, support, theme, logout)
- Sidebar width: `16rem` expanded, `3rem` (icon-only) collapsed

**Mobile (<768px)**: Fixed bottom navigation bar with 5 icon buttons (Dashboard, Cards, Transactions, Notifications, Settings). Active state uses primary color fill. Content has `pb-24` to clear the bar.

**Auth guard**: `Layout` calls `useGetMe()`. If not authenticated, redirects to `/login`. Shows a spinner during loading.

### Page Details

**dashboard.tsx** — Main landing page after login:
- Greeting banner ("Good morning, {name}")
- Total balance across all cards
- Card carousel with DnD reordering (uses `useCardOrder` hook)
- "Create New Card" wizard trigger (opens `CardCreationWizard`)
- Recent transactions list
- Quick actions panel

**cards.tsx** — Card grid view:
- All user cards in a responsive grid (1-3 columns based on width)
- Each card shows the visual `CreditCard` component
- DnD reordering (shared `useCardOrder` hook, same order as dashboard)
- Per-card top-up and freeze buttons
- Card creation wizard trigger

**card-details.tsx** — Single card management (largest page, ~900 lines):
- **Tab system**: Top-Up / Details / Settings tabs
- **Details tab**: Secure card viewer (iframe, currently "Coming Soon"), card metadata, balance info
- **Settings tab**: Freeze/unfreeze, change PIN, 3D Secure (OTP method selector only, no on/off toggle), contact information (email + phone with "apply to all cards" checkbox), Telegram linking, delete card
- **Transaction History**: Sub-tabs for "Transactions" and "Balance History" with export buttons
- **Physical card features**: Activation dialog, shipping request form, shipping tracking

**transactions.tsx** — Full transaction history:
- Type filter tabs: All / Payments / Top-ups
- CSV export with date range picker
- Uses `TransactionItem` component (detailed variant)

**notifications.tsx** — Notification center:
- Unread / All toggle
- Per-notification "mark as read" button
- "Mark all as read" bulk action

**settings.tsx** — Profile and preferences:
- Profile form (name, email, phone, address)
- Password change
- Appearance (theme toggle)
- Telegram account section
- Notification preferences (4 toggle switches)
- Legal docs (Terms, Privacy Policy)

### Key Components

**CreditCard (`credit-card.tsx`)** — Visual debit card rendering:
- Uses **CSS container queries** (Tailwind v4 built-in, no plugin)
- Wrapper: `@container` class
- Text sizes: Base `cqw` units with stepped breakpoints `@[280px]`, `@[380px]`, `@[480px]`
- Aspect ratio: `aspect-[1.586/1]` (standard card ratio)
- Padding: `p-[8%]` (percentage-based, scales with container)
- Gradient themes: blue, black, silver, purple, green (with fallback)
- Frozen state: `opacity-75 grayscale-[50%]`
- Hover animation: `framer-motion` spring (y: -3, scale: 1.01)
- Shows: contactless icon, chip, cardholder name, masked number, expiry, Visa logo, balance

**CardCreationWizard (`card-creation-wizard.tsx`)** — Multi-step card creation:
- Virtual: 6 steps (Type → Details → Terms → Payment → Processing → Success)
- Physical: 7 steps (adds Shipping Address before Terms)
- Processing step polls job status via `useJobPolling` hook
- **No framer-motion for step transitions** (plain conditional rendering) — see Gotchas
- Referral code support with configurable discount tiers
- Issuance fee: $25 (displayed in Payment step)

**ResponsiveDialog (`responsive-dialog.tsx`)** — Adaptive dialog:
- Desktop: Radix `Dialog` with styled `DialogContent` (centered modal)
- Mobile: Radix `DialogPrimitive.Content` directly (full-screen, `100dvh`)
  - Custom header with title + X close button
  - Uses primitives directly to avoid CSS class merge conflicts with tailwind-merge
  - No swipe/drag-to-close (prevents accidental dismissal during multi-step flows)
- Determines mode via `useIsMobile()` hook

**SecureCardViewer (`secure-card-viewer.tsx`)** — Sensitive card data viewer:
- Requests a secure access URL from the API
- Renders URL in an iframe
- Currently detects `example.com` URLs and shows "Coming Soon" state
- Will display real Kiml secure URLs once integrated

### Custom Hooks

**useCardOrder (`use-card-order.ts`)**:
- Manages DnD card sort order
- Persists to `localStorage` key `"wisp-card-order"`
- Uses `useRef` + `cardIds.join(",")` to prevent infinite re-render when `cardIds` array reference changes
- Returns `{ orderedIds, sensors, handleDragEnd }`
- Shared between `dashboard.tsx` and `cards.tsx`

**useIsMobile (`use-mobile.tsx`)**:
- Media query hook with `768px` breakpoint
- **Synchronous initial value** (checks `window.matchMedia` immediately, not just on mount) to prevent layout flicker

**useNotifications (`use-notifications.tsx`)**:
- Context provider that fetches notifications from API
- Provides `unreadCount` for badge display
- Provides `markAsRead` and `markAllAsRead` functions
- Used by Layout (badge count) and Notifications page

**useTelegram (`use-telegram.tsx`)**:
- Detects Telegram WebApp environment
- Calls `WebApp.ready()` + `WebApp.expand()` on mount
- Sets CSS variables from Telegram theme colors
- Exposes `isTelegram`, `webApp`, `telegramUser`

**useTelegramLink (`use-telegram-link.ts`)**:
- React Query hooks for per-card Telegram linking
- `useGetCardTelegram(cardId)` — get link status
- `useLinkTelegram()` — link mutation
- `useUnlinkTelegram()` — unlink mutation

**useJobPolling (`use-job-polling.ts`)**:
- Polls `GET /api/jobs/:id` at configurable intervals (default 1500ms)
- Auto-stops on completion or failure
- Returns `{ job, status, isPolling, isCompleted, isFailed, error, retry }`
- Handles component unmount cleanup via `mountedRef`

### API Client (`lib/api-client-react`)

Auto-generated by Orval from the OpenAPI spec. The custom fetch wrapper (`src/custom-fetch.ts`):
- Adds `credentials: "include"` for session cookies
- Auto-sets `Content-Type: application/json` for JSON bodies
- Parses responses based on content type (JSON, text, blob)
- Wraps HTTP errors in `ApiError` class with structured error extraction
- Handles BOM stripping, empty bodies, and edge cases

### CSS & Theming

**Tailwind v4** with `@tailwindcss/vite` plugin. Configuration is in `src/index.css`:
- `@import "tailwindcss"` (v4 syntax)
- `@import "tw-animate-css"` for animations
- `@plugin "@tailwindcss/typography"` for prose styles
- Custom HSL theme variables via `@theme inline` block
- Light and dark mode variables in `:root` and `.dark` selectors
- Custom `@utility` classes: `safe-area-top`, `safe-area-bottom`, enlarged switch toggles
- Font: Manrope (Google Fonts)

**Container queries** are built into Tailwind v4 — no `@tailwindcss/container-queries` plugin needed. Used by `CreditCard` component.

---

## API Endpoints Reference

All endpoints prefixed with `/api`. Endpoints marked "Auth" require an active session.

### Authentication (`/auth`)

| Method | Path | Auth | Body/Query | Description |
|--------|------|------|------------|-------------|
| POST | /auth/register | No | `{ email, password, firstName, lastName, phone }` | Register new user |
| POST | /auth/login | No | `{ email, password }` | Login, start session |
| POST | /auth/logout | No | — | Destroy session |
| GET | /auth/me | Yes | — | Get current user profile |

### Users (`/users`)

| Method | Path | Auth | Body/Query | Description |
|--------|------|------|------------|-------------|
| PUT | /users/profile | Yes | `{ firstName, lastName, phone, address, city, country }` | Update profile |
| POST | /users/change-password | Yes | `{ currentPassword, newPassword }` | Change password |

### Cards (`/cards`)

| Method | Path | Auth | Body/Query | Description |
|--------|------|------|------------|-------------|
| GET | /cards | Yes | — | Get all user's cards |
| POST | /cards | Yes | `{ currency, label, color, type }` | Create card (returns `{ jobId }`) |
| GET | /cards/:cardId | Yes | — | Get single card |
| DELETE | /cards/:cardId | Yes | — | Delete card |
| POST | /cards/:cardId/topup | Yes | `{ amount, description? }` | Top up balance |
| POST | /cards/:cardId/freeze | Yes | `{ frozen }` | Toggle freeze |
| PUT | /cards/:cardId/pin | Yes | `{ pin }` (6-digit string) | Update PIN |
| PUT | /cards/:cardId/contacts | Yes | `{ email, phoneNumber, phoneDialCode, applyToAll }` | Update contacts |
| PUT | /cards/:cardId/activate | Yes | `{ activationCode }` | Activate physical card |
| GET | /cards/:cardId/3ds | Yes | — | Get 3DS status |
| PUT | /cards/:cardId/3ds | Yes | `{ enabled }` | Toggle 3DS |
| GET | /cards/:cardId/transactions | Yes | `?type=topup\|payment\|refund\|fee` | Card transactions |
| GET | /cards/:cardId/transactions/export | Yes | `?startDate&endDate` | Export CSV |
| GET | /cards/:cardId/balance-history | Yes | — | Balance history |
| GET | /cards/:cardId/balance-history/export | Yes | `?startDate&endDate` | Export balance CSV |
| GET | /cards/:cardId/details-with-transactions | Yes | — | Combined card + transactions |
| POST | /cards/:cardId/access-url | Yes | — | Generate secure view URL |
| GET | /cards/:cardId/telegram | Yes | — | Get Telegram link |
| POST | /cards/:cardId/telegram/link | Yes | `{ telegramId, telegramUsername, telegramFirstName }` | Link Telegram |
| POST | /cards/:cardId/telegram/unlink | Yes | — | Unlink Telegram |

### Transactions (`/transactions`)

| Method | Path | Auth | Body/Query | Description |
|--------|------|------|------------|-------------|
| GET | /transactions | Yes | `?type&cardId` | All user transactions |
| GET | /transactions/export | Yes | `?startDate&endDate&cardId` | Export all as CSV |

### Notifications (`/notifications`)

| Method | Path | Auth | Body/Query | Description |
|--------|------|------|------------|-------------|
| GET | /notifications | Yes | — | All notifications (newest first) |
| PUT | /notifications/mark-all-read | Yes | — | Mark all read |
| PUT | /notifications/:id/read | Yes | — | Mark one read |
| GET | /notifications/settings | Yes | — | Get preferences |
| PUT | /notifications/settings | Yes | `{ transactionAlerts, topupAlerts, securityAlerts, marketingAlerts }` | Update preferences |

### Shipping (`/shipping`)

| Method | Path | Auth | Body/Query | Description |
|--------|------|------|------------|-------------|
| GET | /shipping | Yes | `?status&page&limit` | List shipping requests |
| POST | /shipping | Yes | `{ cardId, recipientName, address, city, country, zipCode }` | Create shipping request |

### Support (`/support`)

| Method | Path | Auth | Body/Query | Description |
|--------|------|------|------------|-------------|
| GET | /support/tickets | Yes | — | Get user's tickets |
| POST | /support/tickets | Yes | `{ subject, message, category }` | Create ticket |

### Jobs (`/jobs`)

| Method | Path | Auth | Body/Query | Description |
|--------|------|------|------------|-------------|
| POST | /jobs | Yes | `{ type }` | Create background job |
| GET | /jobs/:jobId | Yes | — | Poll job status |

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /healthz | No | Health check |

---

## Authentication Flow

```
1. User submits login/register form
   → POST /api/auth/login or /api/auth/register

2. Server validates credentials (bcrypt compare for login)
   → Creates express-session with userId in session store (PostgreSQL)
   → Returns user object + sets session cookie

3. Frontend receives response
   → Calls queryClient.setQueryData(getGetMeQueryKey(), data.user ?? data)
     (synchronous cache update to avoid redirect race condition)
   → Navigates to /dashboard

4. Layout component mounts
   → Calls useGetMe() which hits GET /api/auth/me
   → If 401 → redirect to /login
   → If success → render authenticated layout

5. All subsequent API calls include session cookie automatically
   (custom-fetch.ts sets credentials: "include")

6. Logout
   → POST /api/auth/logout destroys session
   → Frontend clears query cache + redirects to /login
```

---

## Key Design Patterns

### Card Ordering (Drag & Drop)

Card sort order is persisted to `localStorage` under key `"wisp-card-order"`. The `useCardOrder` hook encapsulates all DnD logic:
- Accepts `cardIds` array from API
- Loads stored order from localStorage
- Merges: valid stored IDs first, then any new IDs not in storage
- On drag end: reorders via `arrayMove` and persists to localStorage
- Both `dashboard.tsx` and `cards.tsx` share this hook — reordering on either page is reflected on both

### Responsive Layout Strategy

| Context | Desktop (≥768px) | Mobile (<768px) |
|---------|-----------------|-----------------|
| Navigation | Left sidebar (collapsible) | Fixed bottom bar (5 icons) |
| Content padding | `pb-6` | `pb-24` (clears bottom nav) |
| Dialogs | Centered modal (`DialogContent`) | Full-screen overlay (`DialogPrimitive.Content`) |
| Card grid | 2-3 columns | 1 column |
| Switch toggles | Standard size | Enlarged (h-7 w-12 track, h-5 w-5 thumb) |
| Input font size | Default | 16px minimum (prevents iOS zoom) |

### Async Card Creation Flow

```
1. User fills wizard steps → clicks "Confirm" on Payment step
2. POST /api/cards → server creates job record → returns { jobId }
3. Wizard moves to Processing step
4. useJobPolling(jobId) polls GET /api/jobs/:jobId every 1500ms
5. Server (currently): immediately completes the job with card data
6. Frontend: detects "completed" → moves to Success step
7. Success step shows "View Card" button → navigates to /cards/:id
```

### Transaction vs Balance History

Two separate data views for the same underlying `transactions` table:
- **Transactions**: All types — shown in "Transactions" tab on card-details and /transactions page
- **Balance History**: Only `topup`, `fee`, `refund` types — shown in "Balance History" tab on card-details
- Both have independent CSV export endpoints with date range filtering

### Theme System

Three modes managed by `ThemeProvider`:
- `light` — white backgrounds, dark text
- `dark` — dark backgrounds, light text (`.dark` class on `<html>`)
- `system` — follows OS preference via `prefers-color-scheme`

Persisted to `localStorage` key `"wisp-ui-theme"`. Theme can be changed from:
- Settings page → Appearance section
- Sidebar footer dropdown → Theme submenu

### Telegram Mini App Integration

When running inside Telegram:
- `useTelegram` hook detects the environment via `@twa-dev/sdk`
- Calls `WebApp.ready()` + `WebApp.expand()` to fill the screen
- Reads theme colors from Telegram and sets CSS variables
- `AppRouter` manages the Telegram back button:
  - Hidden on root pages (dashboard, cards, transactions) and auth pages
  - Shown on sub-pages (card details, settings, etc.) — triggers `history.back()`
- Telegram-specific features (card linking) only shown when `isTelegram` is true

---

## Critical Gotchas & Known Issues

### 1. Framer Motion in Telegram WebView

**Problem**: `AnimatePresence mode="wait"` with `initial={{ opacity: 0 }}` causes invisible/white content in Telegram WebView. The content is in the DOM but never becomes visible.

**Cause**: Telegram WebView either enables `prefers-reduced-motion` or has animation timer issues that prevent framer-motion's entrance animations from completing.

**Rule**: NEVER use `AnimatePresence` or `motion.div` for step transitions inside `ResponsiveDialog` flows. Use plain conditional rendering (`{step === 1 && <Step1 />}`).

**Where framer-motion IS safe**: Standalone components not inside dialogs — `CreditCard` (hover animation), `PillSwitcher` (tab indicator), `TransactionItem` (list animation).

### 2. Container Queries (No Plugin Needed)

Tailwind v4 (via `@tailwindcss/vite`) has container queries built in. Do NOT install `@tailwindcss/container-queries` — it will conflict. The `CreditCard` component demonstrates the pattern:
```
<div className="@container">          <!-- Container wrapper -->
  <div className="text-[2cqw] @[280px]:text-xs @[380px]:text-sm">
```

### 3. Sidebar Collapsed Mode Alignment

The sidebar in icon-only mode uses `group-data-[collapsible=icon]` variant classes:
- `SidebarContent`: `px-0` in icon mode (removes extra horizontal padding)
- `SidebarFooter`: `p-0` in icon mode
- Menu links: `justify-center px-0 gap-0` in icon mode (centers icons)
- Logo: Switches from full text logo to wind icon using `hidden`/`block` toggle
- Wind icon uses `mix-blend-screen` (light mode) / `mix-blend-lighten` (dark mode) to handle its black background

### 4. useCardOrder Re-render Prevention

The `useCardOrder` hook receives a `cardIds` array. Since React creates a new array reference on every render, a naive `useEffect([cardIds])` would run infinitely. Solution: `useRef` stores `cardIds.join(",")` and the effect only runs when this string changes.

### 5. Login Sync Race Condition

After successful login, the frontend needs to both update the cache and navigate. If navigation happens first, the `Layout` component's `useGetMe()` might fire before the cache is populated, causing a redirect back to login. Solution: `queryClient.setQueryData(getGetMeQueryKey(), data.user ?? data)` is called synchronously before navigation.

### 6. ResponsiveDialog CSS Conflicts

On mobile, using the styled `DialogContent` from `src/components/ui/dialog.tsx` causes Tailwind class merge issues (via `tailwind-merge`) with the full-screen overlay classes. Solution: `ResponsiveDialog` uses Radix `DialogPrimitive.Content` directly on mobile, bypassing the styled wrapper.

### 7. iOS Input Zoom Prevention

Inputs with font-size < 16px cause iOS Safari to zoom in on focus. All text inputs use `text-base` (16px) minimum to prevent this behavior.

### 8. Safe Area Insets

Mobile devices with notches/gesture bars need safe area insets. Custom utility classes `safe-area-top` and `safe-area-bottom` in `index.css` apply `env(safe-area-inset-*)` padding.

---

## PWA Support

- **Manifest**: `public/manifest.json` — app name, icons, `display: "standalone"`, theme color
- **Service Worker**: `public/sw.js` — minimal (no caching logic), registered in `main.tsx` for Chrome install eligibility
- **Icons**: `public/icons/` — 192x192 and 512x512 (regular + maskable) + apple-touch-icon
- **Favicon**: Branded `favicon.svg` with Wisp "W" on blue-indigo gradient
- Chrome shows "Install" option in address bar; installed app opens in standalone window

---

## Kiml API Integration Guide

> This section is for the developer who will connect the app to the real Kiml Cards API.

### Current State

The backend currently **simulates all card operations locally**:
- Card numbers and CVVs are randomly generated
- Balances are tracked in the local PostgreSQL database
- PIN changes, 3DS updates, and access URLs are stubbed
- Job polling completes immediately (no real async processing)

The full Kiml API reference is at `attached_assets/kimlcards_api_reference_1774179317612.md`.

### Kiml API Basics

- **Base URL**: `https://api.kimlcards.com`
- **Auth**: `x-api-key: kiml_xxxx` header (recommended) or Bearer JWT
- **Response format**: `{ status, statusCode, message, data }` envelope
- **Card IDs**: Kiml uses MongoDB ObjectIds (`_id` strings), not integers

### Mapping: Wisp Endpoints → Kiml Endpoints

| Wisp Endpoint | Kiml Endpoint | Notes |
|---------------|---------------|-------|
| `POST /api/cards` | `POST /card/create-card` | Kiml requires: cardType, customerType, preferredCardName, phoneNumber, phoneDialCode. Returns job_id for async polling. |
| `GET /api/cards` | `GET /card/get-card` | Returns all user cards |
| `GET /api/cards/:id` | `GET /card/get-card-details?cardId=<id>` | Kiml uses query param, not path param |
| `DELETE /api/cards/:id` | `DELETE /card/delete-card` | Kiml uses body: `{ cardId }` |
| `POST /api/cards/:id/freeze` | `PUT /card/toggle-freeze` | Kiml uses body: `{ cardId, type }` |
| `POST /api/cards/:id/topup` | `POST /card/create-card-topup-wallet` | Kiml requires: cardId, coin_name (e.g. "USDT"), amount. Crypto-based top-up. |
| `PUT /api/cards/:id/pin` | `PUT /card/update-card-pin` | Kiml uses body: `{ cardId, pin }` |
| `PUT /api/cards/:id/contacts` | `PUT /card/update-card-details` | Kiml uses body: `{ cardId, phoneDialCode, phoneNumber, email }` |
| `PUT /api/cards/:id/activate` | `PUT /card/activate-physical-card` | Kiml uses body: `{ cardId, code }` |
| `GET /api/cards/:id/3ds` | `GET /card/3ds-get?cardId=<id>` | |
| `PUT /api/cards/:id/3ds` | `PUT /card/3ds-update` | Body format not fully documented |
| `GET /api/cards/:id/transactions` | `GET /card/get-card-transactions` | Query: cardId, limit, page, startDate, endDate, status |
| `GET /api/cards/:id/transactions/export` | `GET /card/export-card-transactions` | Query: cardId, startDate, endDate |
| `GET /api/cards/:id/balance-history` | `GET /card/get-card-balance-history` | Query: cardId, limit, page, type, startDate, endDate |
| `GET /api/cards/:id/balance-history/export` | `GET /card/export-card-balance-history` | Query: cardId |
| `GET /api/cards/:id/details-with-transactions` | `GET /card/get-card-details-with-transactions` | Query: cardId |
| `POST /api/cards/:id/access-url` | `POST /card/create-access-url` | Returns secure URL for iframe |
| `GET /api/cards/:id/telegram` | `GET /telegram/get-telegram-user-by-card?cardId=<id>` | |
| `POST /api/cards/:id/telegram/link` | `POST /telegram/add-user` | |
| `POST /api/cards/:id/telegram/unlink` | `POST /telegram/remove-user` | |
| `GET /api/jobs/:id` | `GET /card/get-job?job_id=<id>` | Poll for async completion |
| `GET /api/notifications` | `GET /notification/get-list` | Query: limit, page, is_read |
| `PUT /api/notifications/mark-all-read` | `PUT /notification/read-all` | |
| `PUT /api/notifications/:id/read` | `PUT /notification/read-one` | |
| `GET /api/notifications/settings` | `GET /notification-setting/get` | |
| `PUT /api/notifications/settings` | `PUT /notification-setting/update` | |
| `POST /api/shipping` | `POST /shipping/create-shipping` | Body: `{ cardId, shipping }` |
| `GET /api/shipping` | `GET /shipping/get-shipping` | Query: limit, page, status |

### Step-by-Step Integration Checklist

#### 1. Store the Kiml API Key
Add `KIML_API_KEY` to environment secrets. The backend reads it from `process.env.KIML_API_KEY`.

#### 2. Create a Kiml HTTP Client
Create `artifacts/api-server/src/lib/kiml-client.ts`:
- Base URL: `https://api.kimlcards.com`
- Default header: `x-api-key: ${process.env.KIML_API_KEY}`
- Response unwrapping: extract `data` from the `{ status, statusCode, message, data }` envelope
- Error handling: throw on `status: "failure"` with `message` as the error text

#### 3. Map Kiml Card IDs
Kiml uses MongoDB ObjectIds (`_id` strings). The local DB uses auto-incrementing integers. You need to:
- Add a `kiml_card_id` varchar column to the `cards` table
- Store the Kiml `_id` when creating a card
- Use `kiml_card_id` for all Kiml API calls

#### 4. Update Service Functions

| Service Function | What to Change |
|-----------------|----------------|
| `createCard()` | Call `POST /card/create-card`. Poll `GET /card/get-job` for completion. Store returned card data + `_id` in local DB. |
| `topUpCard()` | Call `POST /card/create-card-topup-wallet`. Flow changes — Kiml returns a crypto wallet address. |
| `freezeCard()` | Call `PUT /card/toggle-freeze` with `{ cardId: kiml_card_id }` |
| `updateCardPin()` | Call `PUT /card/update-card-pin` with `{ cardId: kiml_card_id, pin }` |
| `updateCardContacts()` | Call `PUT /card/update-card-details` for each card |
| `activatePhysicalCard()` | Call `PUT /card/activate-physical-card` with `{ cardId: kiml_card_id, code }` |
| `getCard3ds()` / `updateCard3ds()` | Call `GET /card/3ds-get` and `PUT /card/3ds-update` |
| `getCardTransactions()` | Call `GET /card/get-card-transactions` |
| `getCardBalanceHistory()` | Call `GET /card/get-card-balance-history` |
| `deleteCard()` | Call `DELETE /card/delete-card` with `{ cardId: kiml_card_id }` |

#### 5. Handle Data Model Differences
- Kiml `Card`: has `card_id` (provider ID), `last4`, `topup_fee`, `cardDesign`, `isDeleted`
- Kiml `Transaction`: has `merchant`, `currency`, `status` (PENDING/DECLINED/CLEARED/VOID)
- Kiml `Topup`: has `crypto_amount`, `coin_name`, `tx_hash`, `status` (PENDING/APPROVED/REJECTED)
- Update `toCardResponse()` to map Kiml fields → frontend's expected format

#### 6. Crypto Top-Up Flow Change
Current simple top-up changes with Kiml:
1. User requests top-up (amount + coin, e.g. USDT)
2. `POST /card/create-card-topup-wallet` returns a crypto wallet address
3. User sends crypto to that address
4. Kiml processes the deposit
5. Frontend's `TopUpDialog` needs updating to show wallet address

#### 7. Secure Card Access URL
`POST /card/create-access-url` returns a real secure URL. The frontend's `SecureCardViewer` already has iframe logic — replace the stub URL. It detects `example.com` and shows "Coming Soon".

#### 8. User & KYC Mapping
Kiml has its own user system. You may need to:
- Create Kiml users on Wisp registration
- Store `kiml_user_id` in local users table
- Forward KYC status to frontend

#### 9. Notification Sync
Options:
- Proxy Kiml notifications directly
- Periodically sync to local `notifications` table
- Sync preferences to Kiml via `PUT /notification-setting/update`

#### 10. Shipping Integration
- `POST /shipping/create-shipping` → create on Kiml
- `GET /shipping/get-shipping` → fetch real statuses/tracking

### Key Kiml Enums

| Enum | Values |
|------|--------|
| CardType | `Virtual`, `Physical` |
| CustomerType | `Consumer`, `Business` |
| TransactionStatus | `PENDING`, `DECLINED`, `CLEARED`, `VOID` |
| TopupStatus | `PENDING`, `APPROVED`, `REJECTED` |
| ShippingStatus | `IN-REVIEW`, `DISPATCH`, `SHIPPED` |

### Kiml Features NOT Yet in Wisp

- **KYC verification** — no UI for document upload/status
- **Payout/withdrawal** — Kiml supports crypto payouts
- **Affiliate system** — two-tier commission support
- **White label branding** — per-org custom branding
- **2FA** — Passkey, Authenticator, Biometric, App-based
- **3DS challenge response** — only settings toggle exists, not the challenge flow

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |
| PORT | Yes | Server port (auto-set per artifact by Replit) |
| SESSION_SECRET | No | Express session secret (has hardcoded default) |
| KIML_API_KEY | No (future) | Kiml Cards API key for production integration |

---

## File Counts

| Category | Count |
|----------|-------|
| Frontend pages | 11 |
| Core components | 6 |
| Shared components | 8 |
| Auth components | 5 |
| Settings components | 3 |
| Custom hooks | 7 |
| Backend route modules | 10 (auth, cards, health, jobs, notifications, shipping, support, telegram, transactions, users) |
| Backend service modules | 4 (card, job, shipping, telegram) |
| Database tables | 9 (+ sessions auto-created) |
| Shared lib packages | 4 (db, api-spec, api-zod, api-client-react) |
