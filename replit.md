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
- **Frontend**: React 19 + Vite 7 + Tailwind v4 + shadcn/ui
- **External Card Issuer**: Kiml Cards API (not yet connected — all operations are local stubs)

## Application: Wisp — Debit Card Manager

A fintech-style platform for managing top-up debit cards (Telegram Mini App). Features:
- User registration and login (email/password, session-based auth)
- Dashboard showing all cards, total balance, quick actions
- Card management (create virtual/physical, view, freeze/unfreeze, delete, change PIN, update contacts)
- 3D Secure settings with OTP delivery method selection
- Top-up functionality per card
- Transaction history (per-card and across all cards) with type filtering
- Balance history (top-ups, fees, refunds) separated from transactions
- CSV export for both transactions and balance history
- Physical card activation (activation code) and shipping tracking
- Telegram account linking per card
- Secure card detail viewing (iframe-based, stubbed until Kiml connected)
- Async job polling for card creation
- Notification center with individual/bulk read and notification preferences
- Profile/settings management with appearance theming
- Support ticket creation and tracking
- PWA installable (Chrome desktop)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   ├── card-manager/       # React + Vite frontend (Wisp)
│   └── mockup-sandbox/     # Component preview server (dev only)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
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
- `pnpm --filter @workspace/db run push --force` — push with destructive changes

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes are split by domain in `src/routes/`.

- Auth: `src/routes/auth.ts` — register, login, logout, /me
- Users: `src/routes/users.ts` — profile update, change password
- Cards: `src/routes/cards.ts` — full card lifecycle: CRUD, freeze, PIN, contacts, 3DS, activation, topup, access-url, transactions, balance-history, exports, telegram linking
- Shipping: `src/routes/shipping.ts` — POST /shipping (create), GET /shipping (list with pagination/status)
- Transactions: `src/routes/transactions.ts` — all transactions for user with type filter and CSV export
- Notifications: `src/routes/notifications.ts` — list, mark read (single + all), preferences CRUD
- Support: `src/routes/support.ts` — ticket management
- Jobs: `src/routes/jobs.ts` — async job creation and polling
- Services: `src/services/card.service.ts` — card business logic (create with collision retry, transactional top-up, freeze, PIN, contacts, 3DS, activation, delete, transaction/balance queries)
- Services: `src/services/job.service.ts` — async job lifecycle (create, update status, complete, fail)
- Services: `src/services/shipping.service.ts` — shipping request creation and listing
- Services: `src/services/telegram.service.ts` — Telegram account linking/unlinking per card
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
- `src/hooks/use-telegram.tsx` — calls `WebApp.ready()` + `WebApp.expand()`, sets CSS vars from theme, exposes telegramUser identity
- `useTelegramBackButton()` hook for hardware back button integration
- Telegram-specific features (card linking) only shown inside Telegram
- Viewport meta: `user-scalable=no, viewport-fit=cover`

**Responsive Dialogs**:
- `src/components/responsive-dialog.tsx` — Radix Dialog on desktop (centered modal); on mobile uses `DialogPrimitive.Content` directly for full-screen overlay (bypasses styled `DialogContent` to avoid CSS class merge conflicts with tailwind-merge)
- Mobile: full-screen with custom header (title + X close button), scrollable content area
- No swipe/drag-to-close on mobile — prevents accidental dismissal during multi-step flows
- All modals use `ResponsiveDialog`

**Animation Compatibility (Telegram WebView)**:
- Card creation wizard does NOT use framer-motion for step transitions — plain conditional rendering ensures content always appears (framer-motion `AnimatePresence mode="wait"` + `initial={{ opacity: 0 }}` caused invisible content in Telegram WebView due to `prefers-reduced-motion` or animation timer issues)
- framer-motion is still used elsewhere in the app (credit-card component, pill-switcher, transaction-item) but NOT inside ResponsiveDialog flows

**Pages** under `src/pages/`:
- `login.tsx`, `register.tsx` — auth pages (full-width on mobile, side image on desktop)
- `dashboard.tsx` — card overview + total balance + quick actions + drag-and-drop card reorder + inline card creation wizard (supports virtual and physical; physical adds shipping address step)
- `cards.tsx` — card grid + create card + top-up
- `card-details.tsx` — single card with Details/Settings tabs, transaction/balance history tabs, export, PIN change, 3DS, contacts, Telegram linking, physical card activation/shipping
- `transactions.tsx` — filterable by type (All/Payments/Top-ups) with CSV export
- `notifications.tsx` — unread/all tabs, per-notification mark-read, mark-all-read
- `settings.tsx` — profile, security, appearance, Telegram account, notification preferences, legal
- `support.tsx` — support tickets
- /profile route redirects to /settings

**Key Components**:
- `card-creation-wizard.tsx` — 6-step (virtual) or 7-step (physical) wizard with async job polling
- `secure-card-viewer.tsx` — secure URL iframe viewer (stubbed as "Coming Soon")
- `change-pin-dialog.tsx` — 6-digit PIN change with confirmation
- `activate-card-dialog.tsx` — physical card activation code entry
- `shipping-address-form.tsx` / `shipping-tracking.tsx` — physical card delivery flow
- `export-dialog.tsx` — date range picker for CSV exports
- `notification-preferences.tsx` — toggle switches for notification types

**Shared Hooks** (`src/hooks/`):
- `use-card-order.ts` — DnD card ordering with localStorage persistence
- `use-mobile.tsx` — responsive breakpoint detection (768px), synchronous initial value
- `use-notifications.tsx` — notification state from API (unread count, mark-as-read)
- `use-telegram.tsx` — Telegram WebApp SDK integration + user identity
- `use-telegram-link.ts` — per-card Telegram linking hooks
- `use-job-polling.ts` — polls job status at configurable intervals, auto-stops on completion
- `use-toast.ts` — shadcn toast notifications

**PWA (Progressive Web App)**:
- Web App Manifest at `public/manifest.json` — name, icons, display mode, theme color
- Service worker at `public/sw.js` — minimal (no caching), registered in `main.tsx` for Chrome install eligibility
- PWA icons at `public/icons/` — 192x192 and 512x512 (regular + maskable) + apple-touch-icon
- Branded favicon.svg with Wisp "W" on blue-indigo gradient
- Chrome shows "Install" option in address bar; installed app opens in standalone window

**CSS**:
- Safe area insets via `safe-area-bottom` / `safe-area-top` classes
- 44px minimum tap targets on mobile
- Switch toggles enlarged for mobile (h-7 w-12 track, h-5 w-5 thumb)
- 16px font-size on inputs to prevent iOS zoom
- Telegram theme CSS variables support

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Schema files in `src/schema/`:
- `users.ts`, `cards.ts`, `transactions.ts`, `support_tickets.ts`
- `telegram_links.ts`, `notifications.ts`, `shipping.ts`, `jobs.ts`

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec + Orval codegen config. Run codegen:
`pnpm --filter @workspace/api-spec run codegen`

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

## Kiml API Integration

The app is designed to work with Kiml Cards (`https://api.kimlcards.com`) as the card issuing provider. Currently all operations are locally stubbed. See `DOCUMENTATION.md` for the complete Kiml API integration guide with endpoint mapping, step-by-step checklist, and data model differences.

Reference: `attached_assets/kimlcards_api_reference_1774179317612.md`
