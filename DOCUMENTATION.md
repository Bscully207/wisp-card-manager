# Wisp Card Manager — Technical Documentation

## Overview

Wisp is a fintech debit card management application built as a Telegram Mini App (mobile-first, desktop-compatible). It provides virtual and physical card creation with async job polling, crypto top-ups, freeze/unfreeze, PIN management, 3D Secure settings, transaction & balance history (separated), CSV exports, Telegram account linking, shipping tracking for physical cards, notification preferences, support tickets, and a multi-step card creation wizard.

**External Card Issuer:** Kiml Cards (`https://api.kimlcards.com`) — see [Kiml API Integration Guide](#kiml-api-integration-guide) below.

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
│   ├── api-spec/           # OpenAPI specification
│   ├── api-zod/            # Zod validation schemas (auto-generated from spec)
│   └── api-client-react/   # React Query hooks (auto-generated from spec)
├── scripts/                # Utility scripts (post-merge, etc.)
└── pnpm-workspace.yaml
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, TypeScript 5.9, Tailwind CSS v4 |
| State Management | TanStack React Query v5 |
| Routing | Wouter (lightweight client-side router) |
| UI Components | shadcn/ui (Radix UI primitives) |
| Animations | Framer Motion |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Backend | Express 5, TypeScript, Node.js 24 |
| Database | PostgreSQL via Drizzle ORM |
| Sessions | express-session with connect-pg-simple |
| Auth | bcrypt password hashing, session cookies |
| Telegram SDK | @twa-dev/sdk |
| Validation | Zod (v4), drizzle-zod |
| API Codegen | Orval (from OpenAPI spec) |

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
| status | varchar(20) | NOT NULL, default "active" ("active", "frozen", "expired", "cancelled", "pending_activation") |
| label | varchar(100) | nullable (user-given nickname) |
| color | varchar(50) | nullable (theme color for card display) |
| contact_email | varchar(255) | nullable (per-card contact email) |
| contact_phone | varchar(30) | nullable (per-card contact phone) |
| contact_phone_dial_code | varchar(10) | nullable (e.g. "+1") |
| activation_code | varchar(20) | nullable (for physical cards) |
| three_ds_enabled | boolean | NOT NULL, default true |
| created_at | timestamptz | NOT NULL, default now() |
| updated_at | timestamptz | NOT NULL, auto-updated |

### transactions
| Column | Type | Constraints |
|--------|------|------------|
| id | serial | PK |
| card_id | integer | FK → cards.id (CASCADE) |
| user_id | integer | FK → users.id (CASCADE) |
| type | varchar(20) | NOT NULL ("topup", "payment", "refund", "fee") |
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

### telegram_links
| Column | Type | Constraints |
|--------|------|------------|
| id | serial | PK |
| card_id | integer | FK → cards.id (CASCADE), UNIQUE (one TG link per card) |
| user_id | integer | FK → users.id (CASCADE) |
| telegram_id | varchar(50) | NOT NULL |
| telegram_username | varchar(100) | nullable |
| telegram_first_name | varchar(100) | nullable |
| created_at | timestamptz | NOT NULL, default now() |

### notifications
| Column | Type | Constraints |
|--------|------|------------|
| id | serial | PK |
| user_id | integer | FK → users.id (CASCADE) |
| type | varchar(50) | NOT NULL, default "info" |
| title | varchar(255) | NOT NULL |
| message | text | NOT NULL |
| is_read | boolean | NOT NULL, default false |
| created_at | timestamptz | NOT NULL, default now() |

### notification_settings
| Column | Type | Constraints |
|--------|------|------------|
| id | serial | PK |
| user_id | integer | FK → users.id (CASCADE), UNIQUE |
| transaction_alerts | boolean | NOT NULL, default true |
| topup_alerts | boolean | NOT NULL, default true |
| security_alerts | boolean | NOT NULL, default true |
| marketing_alerts | boolean | NOT NULL, default true |

### shipping
| Column | Type | Constraints |
|--------|------|------------|
| id | serial | PK |
| card_id | integer | FK → cards.id (CASCADE) |
| user_id | integer | FK → users.id (CASCADE) |
| status | varchar(20) | NOT NULL, default "in_review" ("in_review", "dispatched", "shipped", "delivered", "cancelled") |
| recipient_name | varchar(200) | NOT NULL |
| address | varchar(500) | NOT NULL |
| city | varchar(100) | NOT NULL |
| country | varchar(100) | NOT NULL |
| zip_code | varchar(20) | NOT NULL |
| tracking_number | varchar(100) | nullable |
| created_at | timestamptz | NOT NULL, default now() |
| updated_at | timestamptz | NOT NULL, auto-updated |

### jobs
| Column | Type | Constraints |
|--------|------|------------|
| id | serial | PK |
| user_id | integer | FK → users.id (CASCADE) |
| type | varchar(50) | NOT NULL (e.g. "card_creation") |
| status | varchar(20) | NOT NULL, default "pending" ("pending", "processing", "completed", "failed") |
| result | jsonb | nullable (stores completed job result data) |
| error | text | nullable (stores failure reason) |
| created_at | timestamptz | NOT NULL, default now() |
| updated_at | timestamptz | NOT NULL, auto-updated |

### sessions
Managed automatically by `connect-pg-simple`. Stores express-session data in PostgreSQL.

---

## API Endpoints

All endpoints are prefixed with `/api`. All endpoints marked "Auth" require an active session (enforced by `requireAuth` middleware).

### Authentication (`/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/register | No | Register a new user (email, password, firstName, lastName, phone) |
| POST | /auth/login | No | Login with email/password, starts session |
| POST | /auth/logout | No | Destroy session |
| GET | /auth/me | Yes | Get current user profile |

### Users (`/users`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PUT | /users/profile | Yes | Update profile (firstName, lastName, phone, address, city, country) |
| POST | /users/change-password | Yes | Change password (currentPassword, newPassword) |

### Cards (`/cards`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /cards | Yes | Get all user's cards |
| POST | /cards | Yes | Create a new card (returns jobId for async polling). Body: currency, label, color, type |
| GET | /cards/:cardId | Yes | Get single card details |
| DELETE | /cards/:cardId | Yes | Delete a card |
| POST | /cards/:cardId/topup | Yes | Top up card balance. Body: amount, description |
| POST | /cards/:cardId/freeze | Yes | Toggle freeze/unfreeze. Body: frozen (boolean) |
| PUT | /cards/:cardId/pin | Yes | Update card PIN. Body: pin (6-digit string) |
| PUT | /cards/:cardId/contacts | Yes | Update card contact info. Body: email, phoneNumber, phoneDialCode, applyToAll |
| PUT | /cards/:cardId/activate | Yes | Activate physical card. Body: activationCode |
| GET | /cards/:cardId/3ds | Yes | Get 3DS status for a card |
| PUT | /cards/:cardId/3ds | Yes | Enable/disable 3DS. Body: enabled (boolean) |
| GET | /cards/:cardId/transactions | Yes | Get card transactions. Query: type (topup/payment/refund/fee) |
| GET | /cards/:cardId/transactions/export | Yes | Export transactions as CSV. Query: startDate, endDate |
| GET | /cards/:cardId/balance-history | Yes | Get balance history (topups, fees, refunds only) |
| GET | /cards/:cardId/balance-history/export | Yes | Export balance history as CSV |
| GET | /cards/:cardId/details-with-transactions | Yes | Combined card details + transactions (performance optimization) |
| POST | /cards/:cardId/access-url | Yes | Generate secure URL for viewing sensitive card details (stubbed) |
| GET | /cards/:cardId/telegram | Yes | Get Telegram link status for a card |
| POST | /cards/:cardId/telegram/link | Yes | Link Telegram account to card. Body: telegramId, telegramUsername, telegramFirstName |
| POST | /cards/:cardId/telegram/unlink | Yes | Unlink Telegram account from card |

### Transactions (`/transactions`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /transactions | Yes | Get all user's transactions. Query: type (filter), cardId |
| GET | /transactions/export | Yes | Export all transactions as CSV. Query: startDate, endDate, cardId |

### Notifications (`/notifications`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /notifications | Yes | Get all notifications (ordered by newest) |
| PUT | /notifications/mark-all-read | Yes | Mark all notifications as read |
| PUT | /notifications/:notificationId/read | Yes | Mark single notification as read |
| GET | /notifications/settings | Yes | Get notification preferences |
| PUT | /notifications/settings | Yes | Update preferences. Body: transactionAlerts, topupAlerts, securityAlerts, marketingAlerts |

### Shipping (`/shipping`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /shipping | Yes | Get shipping requests. Query: status, page, limit |
| POST | /shipping | Yes | Create shipping request. Body: cardId, recipientName, address, city, country, zipCode |

### Support (`/support`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /support/tickets | Yes | Get user's support tickets |
| POST | /support/tickets | Yes | Create support ticket. Body: subject, message, category |

### Jobs (`/jobs`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /jobs | Yes | Create a background job. Body: type |
| GET | /jobs/:jobId | Yes | Poll job status (pending/processing/completed/failed) |

### Health
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /healthz | No | Health check endpoint |

---

## Backend Services

### card.service.ts
| Function | Purpose |
|----------|---------|
| `generateCardNumber()` | Generates random 16-digit card number (4-digit segments) |
| `generateCvv()` | Generates random 3-digit CVV |
| `generateActivationCode()` | Generates 8-char alphanumeric activation code for physical cards |
| `toCardResponse(card)` | Formats DB card record for API response |
| `getUserCards(userId)` | Retrieves all cards for a user |
| `getCardByIdForUser(cardId, userId)` | Retrieves a card with ownership check |
| `createCard({ userId, currency, label, color, type })` | Creates virtual or physical card with unique number retry |
| `topUpCard(cardId, userId, amount, description?)` | Adds funds + records transaction (DB transaction) |
| `freezeCard(cardId, userId, frozen)` | Toggles card frozen/active status |
| `updateCardPin(cardId, userId, pin)` | Stubbed PIN update (ready for Kiml API) |
| `updateCardContacts(cardId, userId, email, phone, dialCode, applyToAll)` | Updates per-card contact info (optionally all cards) |
| `activatePhysicalCard(cardId, userId, code)` | Validates activation code, sets card to "active" |
| `deleteCard(cardId, userId)` | Deletes a card record |
| `getCard3ds(cardId, userId)` | Gets 3DS enabled status |
| `updateCard3ds(cardId, userId, enabled)` | Toggles 3DS for a card |
| `getCardTransactions(cardId, userId, typeFilter?)` | Gets transactions with optional type filter |
| `getCardBalanceHistory(cardId, userId)` | Gets balance-affecting entries (topup, fee, refund) |

### job.service.ts
| Function | Purpose |
|----------|---------|
| `createJob({ userId, type })` | Creates a pending job record |
| `getJobById(jobId, userId)` | Gets job status with ownership check |
| `updateJobStatus(jobId, status, result?, error?)` | Updates job status |
| `completeJobWithResult(jobId, result)` | Marks job completed with result data |
| `failJob(jobId, error)` | Marks job failed with error message |

### shipping.service.ts
| Function | Purpose |
|----------|---------|
| `toShippingResponse(shipping)` | Formats DB shipping record for API |
| `createShipping({ cardId, userId, recipientName, address, city, country, zipCode })` | Creates shipping request (validates card is physical) |
| `getShippingRequests({ userId, status, page, limit })` | Paginated shipping request list |

### telegram.service.ts
| Function | Purpose |
|----------|---------|
| `getTelegramLinkForCard(cardId, userId)` | Gets Telegram link for a card |
| `linkTelegramToCard(cardId, userId, telegramId, username, firstName)` | Links Telegram account to card (unique constraint) |
| `unlinkTelegramFromCard(cardId, userId)` | Removes Telegram link from card |

---

## Frontend Routes

| Path | Page | Layout | Description |
|------|------|--------|-------------|
| /login | Login | No | Auth page with login tab active |
| /register | Register | No | Auth page with register tab active |
| /dashboard | Dashboard | Yes | Card carousel, total balance, recent transactions, quick actions |
| /cards | Cards | Yes | Card grid with create wizard, DnD reordering |
| /cards/:id | CardDetails | Yes | Full card management: details, settings, transactions, balance history |
| /transactions | Transactions | Yes | Transaction history with type filters and export |
| /notifications | Notifications | Yes | Notification center with individual/bulk read actions |
| /support | Support | Yes | Support ticket management |
| /settings | Settings | Yes | Profile, security, appearance, Telegram, notification preferences, legal |
| /profile | Redirect | — | Redirects to /settings |

---

## Frontend Components

### Pages (`src/pages/`)
- **auth.tsx** — Shared auth layout with animated tab switching (Login/Register)
- **login.tsx / register.tsx** — Thin wrappers around AuthPage with initial tab
- **dashboard.tsx** — Main dashboard: greeting banner, total balance, card carousel (DnD sortable), recent transactions, quick actions, card creation wizard trigger
- **cards.tsx** — Card grid view with DnD reordering, create wizard trigger, per-card top-up and freeze
- **card-details.tsx** — Full card management view with tabs:
  - **Details tab**: Card metadata (name, number, expiry, status), balance, fees, secure card viewer
  - **Settings tab**: Freeze/unfreeze, change PIN, 3D Secure toggle (with OTP method selector), contact information (email + phone with "apply to all cards"), Telegram linking, delete card
  - **Transaction History**: Tabbed between "Transactions" and "Balance History", with export buttons for each
  - **Physical card features**: Activation dialog, shipping request form, shipping tracking
- **transactions.tsx** — Full transaction history with type filter tabs (All/Payments/Top-ups), CSV export
- **notifications.tsx** — Notification center with unread/all toggle, per-notification "mark read" button, mark-all-read
- **support.tsx** — Support ticket list with status badges, create ticket dialog
- **settings.tsx** — Profile form, password change, appearance (theme), Telegram account section, notification preferences, legal docs

### Core Components (`src/components/`)
- **credit-card.tsx** — Visual debit card with contactless icon, chip, Visa logo, gradient themes. Supports `compact` and `full` variants.
- **card-creation-wizard.tsx** — Multi-step card creation wizard:
  - Virtual cards: 6 steps (Type → Details → Terms → Payment → Processing → Success)
  - Physical cards: 7 steps (adds Shipping Address step, auto-creates shipping request)
  - Processing step uses `useJobPolling` for async card creation
  - Includes referral code support with configurable discount tiers
- **layout.tsx** — App shell with sidebar (desktop) and bottom navigation (mobile). Exports `ROOT_PATHS`.
- **responsive-dialog.tsx** — Dialog (desktop) / Drawer (mobile) wrapper with ref-based locking to prevent Dialog↔Drawer switching while open
- **theme-provider.tsx** — Light/dark/system theme with localStorage persistence
- **secure-card-viewer.tsx** — Requests secure access URL and displays in iframe (stubbed as "Coming Soon" until Kiml connected)

### Shared Components (`src/components/shared/`)
- **top-up-dialog.tsx** — Top-up with preset amounts ($50/$100/$1000) and custom input
- **freeze-card-button.tsx** — Freeze/unfreeze with `inline` and `full` variants
- **transaction-item.tsx** — Transaction list item with `compact` and `detailed` variants
- **export-dialog.tsx** — Date range picker for CSV export with download handler
- **change-pin-dialog.tsx** — 6-digit PIN change with confirmation field
- **activate-card-dialog.tsx** — Physical card activation code entry
- **shipping-address-form.tsx** — Shipping address form for physical card delivery
- **shipping-tracking.tsx** — Shipping status and tracking number display
- **notification-preferences.tsx** — Toggle switches for notification types (in Settings page)

### Auth Components (`src/components/auth/`)
- **login-form.tsx** — Email/password login form
- **register-form.tsx** — Registration form with name, email, phone, password
- **brand-panel.tsx** — Right-side branding panel on auth pages (desktop only)
- **pill-switcher.tsx** — Login/Register tab pills
- **social-buttons.tsx** — Google and Telegram social login buttons (UI only)

### Settings Components (`src/components/settings/`)
- **appearance-section.tsx** — Theme toggle with DropdownMenuSub
- **legal-dialogs.tsx** — Terms & Conditions and Privacy Policy dialogs

### UI Components (`src/components/ui/`)
Active shadcn/ui primitives: button, card, checkbox, dialog, drawer, dropdown-menu, form, input, input-group, label, select, separator, sheet, sidebar, skeleton, switch, table, textarea, toast, toaster, toggle, tooltip.

---

## Custom Hooks (`src/hooks/`)

| Hook | Purpose |
|------|---------|
| `useCardOrder` | Shared DnD card ordering — persists sort order to localStorage, provides sensors and drag-end handler |
| `useIsMobile` | Media query hook (768px breakpoint) — synchronous initial value to prevent flicker |
| `useNotifications` | Notification state management — fetches from API, provides unread count and mark-as-read |
| `useTelegram` | Telegram WebApp SDK integration — detects environment, provides webApp instance and telegramUser identity |
| `useTelegramLink` | Telegram card linking hooks — link/unlink/get status per card |
| `useJobPolling` | Polls a job ID at configurable intervals, returns status with auto-stop on completion/failure |
| `useToast` | Toast notification hook (shadcn/ui) |

---

## Key Design Patterns

### Card Ordering (DnD)
Card sort order is persisted to `localStorage` under key `"wisp-card-order"`. The `useCardOrder` hook encapsulates all DnD logic. Both `dashboard.tsx` and `cards.tsx` consume this hook.

### Responsive Layout
- **Mobile**: Bottom navigation bar (`fixed bottom-0`, `h-16`), content has `pb-24`
- **Desktop**: Left sidebar navigation, content has `pb-6`
- Dialog vs. Drawer pattern via `ResponsiveDialog` — locks mode when dialog opens to prevent switching

### Telegram Mini App Integration
- `useTelegram` hook provides `isTelegram` flag, `webApp` SDK instance, and `telegramUser` identity
- Back button management in `AppRouter` — hides on root pages, shows + wires `history.back()` on sub-pages
- Telegram theme colors set on app init
- Telegram linking features only shown when running inside Telegram

### Card Creation Wizard
Multi-step wizard flow with async job polling:
1. **Card Type** — Virtual or Physical selection (physical now enabled)
2. **Card Details** — Currency, cardholder name, card nickname, email, phone
3. **Shipping Address** — (Physical cards only) Recipient name, address, city, country, zip
4. **Terms** — 4 acceptance checkboxes
5. **Payment** — Fee summary ($25 issuance) with optional referral code discount
6. **Processing** — Async job polling with progress indicator (uses `useJobPolling`)
7. **Success** — Animated confirmation with "View Card" button

### Transaction & Balance History Separation
- **Transactions**: Spending/payment entries — displayed in "Transactions" tab
- **Balance History**: Top-ups, fees, refunds — displayed in "Balance History" tab
- Both have separate endpoints and can be independently exported to CSV

### Async Job Polling
Card creation (and future long-running operations) uses a job-based async pattern:
1. `POST /api/cards` creates a job record, returns `jobId`
2. Frontend uses `useJobPolling` hook to poll `GET /api/jobs/:jobId`
3. Processing step shows spinner + progress bar
4. On completion, transitions to success; on failure, shows error with retry

### Theme System
Three modes: `light`, `dark`, `system`. Managed by `ThemeProvider` with `localStorage` key `"wisp-ui-theme"`.

### API Client Generation
The API client is auto-generated from an OpenAPI specification:
1. `lib/api-spec/` — OpenAPI YAML spec (source of truth)
2. Run `pnpm --filter @workspace/api-spec run codegen` to regenerate:
   - `lib/api-zod/` — Zod validation schemas
   - `lib/api-client-react/` — TanStack Query hooks

---

## Authentication Flow

1. User registers or logs in via `/api/auth/register` or `/api/auth/login`
2. Server creates a session (`express-session` + `connect-pg-simple` PostgreSQL store)
3. Session cookie is sent back with `userId`
4. Protected routes use `requireAuth` middleware that checks `req.session.userId`
5. Frontend stores no auth tokens — relies entirely on session cookies

---

## PWA Support

- **Manifest**: `public/manifest.json` — app name, icons, display mode, theme color
- **Service Worker**: `public/sw.js` — minimal (no caching), registered in `main.tsx` for Chrome install eligibility
- **Icons**: `public/icons/` — 192x192 and 512x512 (regular + maskable) + apple-touch-icon
- **Favicon**: Branded `favicon.svg` with Wisp "W" on blue-indigo gradient
- Chrome shows "Install" option; installed app opens in standalone window

---

## Kiml API Integration Guide

> **This section is for the developer who will connect the app to the real Kiml Cards API.**

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
| `PUT /api/cards/:id/3ds` | `PUT /card/3ds-update` | Body format not fully documented in Kiml spec |
| `GET /api/cards/:id/transactions` | `GET /card/get-card-transactions` | Kiml uses query: cardId, limit, page, startDate, endDate, status |
| `GET /api/cards/:id/transactions/export` | `GET /card/export-card-transactions` | Kiml uses query: cardId, startDate, endDate |
| `GET /api/cards/:id/balance-history` | `GET /card/get-card-balance-history` | Kiml uses query: cardId, limit, page, type, startDate, endDate |
| `GET /api/cards/:id/balance-history/export` | `GET /card/export-card-balance-history` | Kiml uses query: cardId |
| `GET /api/cards/:id/details-with-transactions` | `GET /card/get-card-details-with-transactions` | Kiml uses query: cardId |
| `POST /api/cards/:id/access-url` | `POST /card/create-access-url` | Returns secure URL for iframe viewing |
| `GET /api/cards/:id/telegram` | `GET /telegram/get-telegram-user-by-card?cardId=<id>` | |
| `POST /api/cards/:id/telegram/link` | `POST /telegram/add-user` | Body not fully documented |
| `POST /api/cards/:id/telegram/unlink` | `POST /telegram/remove-user` | Body not fully documented |
| `GET /api/jobs/:id` | `GET /card/get-job?job_id=<id>` | Poll for async card creation completion |
| `GET /api/notifications` | `GET /notification/get-list` | Query: limit, page, is_read |
| `PUT /api/notifications/mark-all-read` | `PUT /notification/read-all` | |
| `PUT /api/notifications/:id/read` | `PUT /notification/read-one` | |
| `GET /api/notifications/settings` | `GET /notification-setting/get` | |
| `PUT /api/notifications/settings` | `PUT /notification-setting/update` | |
| `POST /api/shipping` | `POST /shipping/create-shipping` | Kiml uses body: `{ cardId, shipping }` (address object) |
| `GET /api/shipping` | `GET /shipping/get-shipping` | Query: limit, page, status |

### Step-by-Step Integration Checklist

#### 1. Store the Kiml API Key
Add `KIML_API_KEY` to environment secrets. The backend should read it from `process.env.KIML_API_KEY`.

#### 2. Create a Kiml HTTP Client
Create `artifacts/api-server/src/lib/kiml-client.ts`:
- Base URL: `https://api.kimlcards.com`
- Default header: `x-api-key: ${process.env.KIML_API_KEY}`
- Response unwrapping: extract `data` from the `{ status, statusCode, message, data }` envelope
- Error handling: throw on `status: "failure"` with `message` as the error text

#### 3. Map Kiml Card IDs
Kiml uses MongoDB ObjectIds (`_id` strings). The local DB uses auto-incrementing integers. You need to:
- Add a `kiml_card_id` varchar column to the `cards` table to store the Kiml ObjectId
- When creating a card via Kiml, store the returned `_id` in `kiml_card_id`
- When calling Kiml endpoints, use `kiml_card_id` instead of the local `id`

#### 4. Update Service Functions
Each service function in `card.service.ts` currently does local DB operations. Replace with Kiml API calls where appropriate:

| Service Function | What to Change |
|-----------------|----------------|
| `createCard()` | Call `POST /card/create-card` with mapped fields. Poll `GET /card/get-job` for completion. Store returned card data + `_id` in local DB. |
| `topUpCard()` | Call `POST /card/create-card-topup-wallet` with crypto params. The top-up flow changes significantly — Kiml returns a crypto wallet address for the user to send funds to. |
| `freezeCard()` | Call `PUT /card/toggle-freeze` with `{ cardId: kiml_card_id }` |
| `updateCardPin()` | Call `PUT /card/update-card-pin` with `{ cardId: kiml_card_id, pin }` |
| `updateCardContacts()` | Call `PUT /card/update-card-details` for each card being updated |
| `activatePhysicalCard()` | Call `PUT /card/activate-physical-card` with `{ cardId: kiml_card_id, code }` |
| `getCard3ds()` / `updateCard3ds()` | Call `GET /card/3ds-get` and `PUT /card/3ds-update` |
| `getCardTransactions()` | Call `GET /card/get-card-transactions` — response format may differ from local |
| `getCardBalanceHistory()` | Call `GET /card/get-card-balance-history` |
| `deleteCard()` | Call `DELETE /card/delete-card` with `{ cardId: kiml_card_id }` |

#### 5. Handle Kiml-Specific Data Models
Key differences between local models and Kiml:
- Kiml `Card` has: `card_id` (provider ID), `last4`, `topup_fee`, `cardDesign`, `isDeleted`
- Kiml `Transaction` has: `merchant`, `currency`, `status` (PENDING/DECLINED/CLEARED/VOID)
- Kiml `Topup` has: `crypto_amount`, `coin_name`, `tx_hash`, `status` (PENDING/APPROVED/REJECTED)
- The `toCardResponse()` function should be updated to map Kiml fields to the frontend's expected format

#### 6. Crypto Top-Up Flow
The current simple top-up (add amount to balance) changes significantly with Kiml:
1. User requests top-up with amount + coin (e.g. USDT)
2. `POST /card/create-card-topup-wallet` returns a crypto wallet address
3. User sends crypto to that address
4. Kiml processes the deposit and credits the card
5. Poll or webhook for confirmation

The frontend's `TopUpDialog` will need updating to show the crypto wallet address and expected amount.

#### 7. Secure Card Access URL
The `POST /card/create-access-url` endpoint returns a real secure URL from Kiml. The frontend's `SecureCardViewer` component already has iframe rendering logic — just replace the stub URL with the real one. Currently it detects `example.com` URLs and shows "Coming Soon".

#### 8. User & KYC Mapping
Kiml has its own user system with `GET /user/get-user` and `GET /kyc/get-kyc`. You may need to:
- Create Kiml users when Wisp users register
- Store `kiml_user_id` in the local users table
- Forward KYC status to the frontend

#### 9. Notification Sync
Currently notifications are generated locally. With Kiml integration, notifications should come from Kiml's `GET /notification/get-list` endpoint. Sync strategy:
- Option A: Proxy Kiml notifications directly to the frontend
- Option B: Periodically sync Kiml notifications to the local `notifications` table
- Notification preferences should be synced to Kiml via `PUT /notification-setting/update`

#### 10. Shipping Integration
The shipping flow is ready locally. Connect to Kiml:
- `POST /shipping/create-shipping` → create shipping on Kiml side
- `GET /shipping/get-shipping` → fetch real statuses and tracking numbers from Kiml

### Key Kiml Enums
| Enum | Values |
|------|--------|
| CardType | `Virtual`, `Physical` |
| CustomerType | `Consumer`, `Business` |
| TransactionStatus | `PENDING`, `DECLINED`, `CLEARED`, `VOID` |
| TopupStatus | `PENDING`, `APPROVED`, `REJECTED` |
| ShippingStatus | `IN-REVIEW`, `DISPATCH`, `SHIPPED` |

### Kiml Features NOT Yet in Wisp (Future Work)
- **KYC verification flow** (`GET /kyc/get-kyc`) — no UI for document upload/verification status
- **Payout/withdrawal** — Kiml supports crypto payouts but no UI exists
- **Affiliate system** — Kiml supports affiliate commissions (two-tier) but no UI
- **White label branding** — Kiml supports per-org custom branding
- **2FA** — Kiml supports Passkey, Authenticator, Biometric, App-based 2FA
- **3DS challenge response** (`POST /card/three-ds-response`) — only settings toggle exists, not the actual challenge flow

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
- Node.js 24+
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
pnpm --filter @workspace/db run db:push --force # Push with destructive changes
```

### API Code Generation
```bash
pnpm --filter @workspace/api-spec run codegen  # Regenerate Zod schemas + React Query hooks
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
| PORT | Server port (set per artifact by Replit) |
| SESSION_SECRET | Express session secret (optional, has default) |
| KIML_API_KEY | Kiml Cards API key (required for production integration) |

---

## File Size Reference

| Category | Count |
|----------|-------|
| Frontend pages | 11 |
| Core components | 6 |
| Shared components | 8 |
| Auth components | 5 |
| Settings components | 2 |
| Custom hooks | 7 |
| Backend route modules | 8 (auth, cards, jobs, notifications, shipping, support, transactions, users) |
| Backend service modules | 4 (card, job, shipping, telegram) |
| Database tables | 9 (users, cards, transactions, support_tickets, telegram_links, notifications, notification_settings, shipping, jobs) |
