# Wisp Card Manager — Technical Documentation

## Overview

Wisp is a fintech debit card management application built as a Telegram Mini App (mobile-first, desktop-compatible). It provides virtual and physical card creation, balance top-ups, freeze/unfreeze functionality, transaction history, profile management, support tickets, and in-app notifications.

---

## Architecture

### Monorepo Structure (pnpm workspaces)

```
/
├── artifacts/
│   ├── card-manager/       # React + Vite frontend (Telegram Mini App)
│   ├── api-server/         # Express.js REST API backend
│   └── mockup-sandbox/     # Component preview server (development only)
├── lib/
│   ├── db/                 # Drizzle ORM schema + database connection
│   ├── api-spec/           # OpenAPI specification (auto-generated)
│   ├── api-zod/            # Zod validation schemas (auto-generated from spec)
│   └── api-client-react/   # React Query hooks (auto-generated from spec)
└── pnpm-workspace.yaml
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, TypeScript, Tailwind CSS v4 |
| State Management | TanStack React Query v5 |
| Routing | Wouter (lightweight client-side router) |
| UI Components | shadcn/ui (Radix UI primitives) |
| Animations | Framer Motion |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Backend | Express.js, TypeScript |
| Database | PostgreSQL via Drizzle ORM |
| Sessions | express-session with connect-pg-simple |
| Auth | bcrypt password hashing, session cookies |
| Telegram SDK | @twa-dev/sdk |
| Form Validation | React Hook Form + Zod |

---

## Database Schema

### users
| Column | Type | Constraints |
|--------|------|------------|
| id | serial | PK |
| email | varchar(255) | NOT NULL, UNIQUE |
| password_hash | text | NOT NULL |
| first_name | varchar(100) | nullable |
| last_name | varchar(100) | nullable |
| phone | varchar(50) | nullable |
| address | text | nullable |
| city | varchar(100) | nullable |
| country | varchar(100) | nullable |
| created_at | timestamptz | NOT NULL, default now() |
| updated_at | timestamptz | NOT NULL, auto-updated |

### cards
| Column | Type | Constraints |
|--------|------|------------|
| id | serial | PK |
| user_id | integer | FK → users.id (CASCADE) |
| type | varchar(20) | NOT NULL, default "virtual" ("virtual" or "physical") |
| card_number | varchar(19) | NOT NULL, UNIQUE |
| cardholder_name | varchar(100) | NOT NULL |
| expiry_month | integer | NOT NULL |
| expiry_year | integer | NOT NULL |
| cvv | varchar(4) | NOT NULL |
| balance | double precision | NOT NULL, default 0 |
| currency | varchar(10) | NOT NULL, default "EUR" |
| status | varchar(20) | NOT NULL, default "active" ("active", "frozen", "expired", "cancelled") |
| label | varchar(100) | nullable (user-given nickname) |
| color | varchar(50) | nullable (theme color for card display) |
| created_at | timestamptz | NOT NULL, default now() |
| updated_at | timestamptz | NOT NULL, auto-updated |

### transactions
| Column | Type | Constraints |
|--------|------|------------|
| id | serial | PK |
| card_id | integer | FK → cards.id (CASCADE) |
| user_id | integer | FK → users.id (CASCADE) |
| type | varchar(20) | NOT NULL (e.g. "topup", "purchase", "refund") |
| amount | double precision | NOT NULL |
| balance_before | double precision | NOT NULL |
| balance_after | double precision | NOT NULL |
| description | text | nullable |
| status | varchar(20) | NOT NULL, default "completed" |
| created_at | timestamptz | NOT NULL, default now() |

### support_tickets
| Column | Type | Constraints |
|--------|------|------------|
| id | serial | PK |
| user_id | integer | FK → users.id (CASCADE) |
| subject | varchar(255) | NOT NULL |
| message | text | NOT NULL |
| category | varchar(50) | NOT NULL ("billing", "card", "account", "technical", "other") |
| status | varchar(50) | NOT NULL, default "open" ("open", "in_progress", "resolved", "closed") |
| created_at | timestamptz | NOT NULL, default now() |
| updated_at | timestamptz | NOT NULL, auto-updated |

---

## API Endpoints

All endpoints are prefixed with `/api`.

### Authentication
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/register | No | Register a new user |
| POST | /auth/login | No | Login with email/password |
| POST | /auth/logout | No | Destroy session |
| GET | /auth/me | Yes | Get current user profile |

### Users
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PUT | /users/profile | Yes | Update profile (firstName, lastName, phone, address, city, country) |
| PUT | /users/password | Yes | Change password (currentPassword, newPassword) |

### Cards
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /cards | Yes | Get all user's cards |
| GET | /cards/:id | Yes | Get single card details |
| POST | /cards | Yes | Create a new card |
| POST | /cards/:id/topup | Yes | Top up card balance |
| POST | /cards/:id/freeze | Yes | Toggle freeze/unfreeze |
| DELETE | /cards/:id | Yes | Delete a card |

### Transactions
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /transactions | Yes | Get all user's transactions |
| GET | /cards/:id/transactions | Yes | Get transactions for a specific card |

### Support
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /support/tickets | Yes | Get user's support tickets |
| POST | /support/tickets | Yes | Create a new support ticket |

### Health
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | No | Health check endpoint |

---

## Frontend Routes

| Path | Page | Layout | Description |
|------|------|--------|-------------|
| /login | Login | No | Auth page with login tab active |
| /register | Register | No | Auth page with register tab active |
| /dashboard | Dashboard | Yes | Main dashboard with card carousel, balance, recent transactions |
| /cards | Cards | Yes | Full card grid with create wizard, DnD reordering |
| /cards/:id | CardDetails | Yes | Single card view with transactions, top-up, freeze actions |
| /transactions | Transactions | Yes | Full transaction history (mobile list / desktop table) |
| /notifications | Notifications | Yes | In-app notification center with unread/all tabs |
| /support | Support | Yes | Support ticket list + create ticket dialog |
| /settings | Settings | Yes | Profile editing, password change, appearance, legal docs |
| /profile | Redirect | — | Redirects to /settings |

---

## Frontend Components

### Pages (`src/pages/`)
- **auth.tsx** — Shared auth layout with animated tab switching (Login/Register)
- **login.tsx / register.tsx** — Thin wrappers around AuthPage with initial tab
- **dashboard.tsx** — Main dashboard: greeting banner, total balance, card carousel (DnD sortable), recent transactions, quick actions
- **cards.tsx** — Card grid view with DnD reordering, create wizard trigger, per-card top-up and freeze
- **card-details.tsx** — Single card view: large card display, balance, transaction list, freeze/top-up actions, delete
- **transactions.tsx** — Full transaction history: responsive table (desktop) / card list (mobile)
- **notifications.tsx** — Notification center with unread/all toggle, mark-as-read
- **support.tsx** — Support ticket list with status badges, responsive create dialog
- **settings.tsx** — Profile form, password change, appearance section, legal docs, support link

### Core Components (`src/components/`)
- **credit-card.tsx** — Visual debit card component with contactless icon, chip, Visa logo, gradient themes. Supports `compact` and `full` variants.
- **card-creation-wizard.tsx** — Multi-step card creation wizard (5 steps): Card Type → Card Details → Design → Payment → Confirmation. Includes referral code support with configurable discount tiers.
- **layout.tsx** — App shell with sidebar (desktop) and bottom navigation (mobile). Exports `ROOT_PATHS` for Telegram back button logic.
- **responsive-dialog.tsx** — Dialog (desktop) / Drawer (mobile) responsive wrapper using `useIsMobile()`.
- **theme-provider.tsx** — Light/dark/system theme provider with localStorage persistence.

### Shared Components (`src/components/shared/`)
- **top-up-dialog.tsx** — Responsive top-up dialog with preset amounts and custom input
- **freeze-card-button.tsx** — Reusable freeze/unfreeze button with `inline` and `full` variants
- **transaction-item.tsx** — Transaction list item with `compact` and `detailed` variants

### Auth Components (`src/components/auth/`)
- **login-form.tsx** — Email/password login form
- **register-form.tsx** — Registration form with name, email, phone, password
- **brand-panel.tsx** — Right-side branding panel on auth pages (desktop only)
- **pill-switcher.tsx** — Login/Register tab pills
- **social-buttons.tsx** — Google and Telegram social login buttons (UI only)

### Settings Components (`src/components/settings/`)
- **appearance-section.tsx** — Theme toggle card with DropdownMenuSub for compact theme selection
- **legal-dialogs.tsx** — Terms & Conditions and Privacy Policy dialog content

### UI Components (`src/components/ui/`)
Active shadcn/ui primitives: button, card, checkbox, dialog, drawer, dropdown-menu, form, input, input-group, label, select, separator, sheet, sidebar, skeleton, table, textarea, toast, toaster, toggle, tooltip.

---

## Custom Hooks (`src/hooks/`)

| Hook | Purpose |
|------|---------|
| `useCardOrder` | Shared DnD card ordering logic — persists card sort order to localStorage, provides sensors and drag-end handler |
| `useIsMobile` | Media query hook for responsive breakpoint detection (768px) |
| `useNotifications` | React Context-based notification state management (unread count, mark-as-read) |
| `useTelegram` | Telegram WebApp SDK integration — detects Telegram environment, provides webApp instance |
| `useToast` | Toast notification hook (shadcn/ui) |

---

## Key Design Patterns

### Card Ordering (DnD)
Card sort order is persisted to `localStorage` under key `"wisp-card-order"`. The `useCardOrder` hook (in `src/hooks/use-card-order.ts`) encapsulates all DnD logic — sensor config, stored order reconciliation with current card IDs, and drag-end reordering. Both `dashboard.tsx` and `cards.tsx` consume this hook.

### Responsive Layout
- **Mobile**: Bottom navigation bar (`fixed bottom-0`, `h-16`), content has `pb-24` bottom padding
- **Desktop**: Left sidebar navigation, content has `pb-6` bottom padding
- Dialog vs. Drawer pattern via `ResponsiveDialog` component

### Telegram Mini App Integration
- `useTelegram` hook provides `isTelegram` flag and `webApp` SDK instance
- Back button management in `AppRouter` — hides on root pages, shows + wires `history.back()` on sub-pages
- Telegram theme colors set on app init via `web_app_set_header_color`

### Card Creation Wizard
5-step wizard flow:
1. **Card Type** — Virtual or Physical selection
2. **Card Details** — Currency, cardholder name, card nickname, email, phone
3. **Card Design** — Color/gradient theme picker (6 options: blue, purple, green, orange, pink, teal)
4. **Payment** — Fee summary with optional referral code for discount (configurable via `REFERRAL_CODES` map)
5. **Confirmation** — Animated success state

### Theme System
Three modes: `light`, `dark`, `system`. Managed by `ThemeProvider` with `localStorage` key `"wisp-ui-theme"`. The settings page appearance section uses a compact `DropdownMenuSub` for selection.

### API Client Generation
The API client is auto-generated from an OpenAPI specification:
- `lib/api-spec/` — OpenAPI YAML spec
- `lib/api-zod/` — Generated Zod validation schemas
- `lib/api-client-react/` — Generated TanStack Query hooks (e.g., `useGetCards`, `useCreateCard`, `useTopUpCard`)

---

## Authentication Flow

1. User registers or logs in via `/api/auth/register` or `/api/auth/login`
2. Server creates a session (`express-session` + `connect-pg-simple` PostgreSQL store)
3. Session cookie is sent back with `userId`
4. Protected routes use `requireAuth` middleware that checks `req.session.userId`
5. Frontend stores no auth tokens — relies entirely on session cookies

---

## Utility Functions (`src/lib/utils.ts`)

| Function | Purpose |
|----------|---------|
| `cn(...inputs)` | Tailwind class merging (clsx + tailwind-merge) |
| `formatCurrency(amount, currency)` | Locale-aware currency formatting (en-IE) |
| `formatCardNumber(cardNumber)` | Masks card number to `**** **** **** 1234` |
| `getCurrencySymbol(currency)` | Returns symbol for EUR/USD/GBP |

---

## Development

### Prerequisites
- Node.js 20+
- pnpm 10+
- PostgreSQL database (provided by Replit)

### Running Locally
```bash
pnpm install
pnpm --filter @workspace/api-server run dev    # API on PORT env var
pnpm --filter @workspace/card-manager run dev  # Frontend on Vite dev server
```

### Database
```bash
pnpm --filter @workspace/db run db:push        # Push schema to database
```

### Demo Accounts
| Email | Password | Name |
|-------|----------|------|
| demo@testapp.com | 1234 | Alex Johnson |
| test@testapp.com | Test1234 | Sofia Martinez |

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| DATABASE_URL | PostgreSQL connection string |
| PORT | Server port (set per artifact) |
| SESSION_SECRET | Express session secret (optional, has default) |

---

## File Size Reference

The frontend is intentionally compact:
- Total active UI components: 21 (pruned from 55)
- Total pages: 11
- Total custom hooks: 5
- Total shared components: 3
- Backend routes: 6 route modules
- Database tables: 4
