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

## Application: Wisp — Debit Card Manager

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
│   └── card-manager/       # React + Vite frontend (Wisp)
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
- `cards` — debit cards per user (number, balance, status, color, type: virtual/physical, activationCode for physical cards)
- `transactions` — ledger of topup/payment/refund events
- `support_tickets` — user support tickets with status tracking
- `shipping` — shipping requests for physical cards (recipientName, address, city, country, zipCode, trackingNumber, status)
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
- Cards: `src/routes/cards.ts` — thin controller delegating to card service, includes PUT /cards/:cardId/activate for physical card activation, PUT /cards/:cardId/pin for PIN change, GET /cards/:cardId/details-with-transactions for combined card+transactions fetch
- Shipping: `src/routes/shipping.ts` — POST /shipping (create shipping request), GET /shipping (list with pagination/status filter)
- Transactions: `src/routes/transactions.ts` — all transactions for user
- Support: `src/routes/support.ts` — ticket management
- Services: `src/services/card.service.ts` — card business logic (create with collision retry, transactional top-up, freeze/unfreeze, delete, transaction queries, physical card activation)
- Services: `src/services/shipping.service.ts` — shipping request creation and listing
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
- `dashboard.tsx` — card overview + total balance + quick actions + drag-and-drop card reorder + inline card creation wizard (supports both virtual and physical cards; physical flow adds shipping address step and auto-submits shipping request on creation)
- `notifications.tsx` — notifications page with unread/all tabs (mock data)
- `cards.tsx` — card list + create card + top-up
- `card-details.tsx` — single card with 4-col action tiles (mobile) or 2-col (desktop)
- `transactions.tsx` — card list view on mobile, table on desktop
- `settings.tsx` — comprehensive settings: profile (read-only + edit/save), security (change password), appearance (theme toggle), legal (T&C/Privacy), help (contact support)
- `support.tsx` — support tickets
- /profile route redirects to /settings

**Navigation**:
- Desktop sidebar: logo + collapse trigger in header, nav items, user dropdown footer (Settings, Support, Theme dropdown, Logout)
- Mobile: top header (back button on sub-pages, logo, bell icon, user avatar dropdown), bottom tab bar (Dashboard, Cards, Transactions)
- Bell icon navigates to /notifications page, shows unread dot when notifications are unread
- Theme selection via dropdown (Light/Dark/System) in user dropdowns on both mobile and desktop
- Dashboard: free-floating total balance, compact card rendering with drag-and-drop reorder (uses @dnd-kit via shared `useCardOrder` hook), "Create Card" opens wizard directly
- Top-up presets: $50, $100, $1000, "Other" (reveals custom input) — consistent across dashboard, cards, and card-details pages

**Shared Hooks** (`src/hooks/`):
- `use-card-order.ts` — DnD card ordering logic with localStorage persistence (shared between dashboard and cards pages)
- `use-mobile.tsx` — responsive breakpoint detection (768px)
- `use-notifications.tsx` — React Context notification state (unread count, mark-as-read)
- `use-telegram.tsx` — Telegram WebApp SDK integration
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
- 16px font-size on inputs to prevent iOS zoom
- Telegram theme CSS variables support

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec + Orval codegen config. Run codegen:
`pnpm --filter @workspace/api-spec run codegen`
