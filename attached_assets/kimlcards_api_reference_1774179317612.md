# DOK Credit Cards API — Full Reference
> **Base URL:** `https://api.kimlcards.com`
> **Spec:** OAS 3.0 | Version 1.0.0
> **Local dev:** `http://localhost:3001/dev`
> **Spec file:** `https://api.kimlcards.com/docs/openapi.json`

---

## Authentication

Two methods are supported. Both are passed as headers.

### 1. API Key (Recommended)
```
x-api-key: kiml_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
Obtain from your dashboard under Settings → API Key.

### 2. Bearer JWT (Global default)
```
Authorization: Bearer <token>
```
Obtain by calling the login endpoint.

---

## Standard Response Format

Every endpoint returns this envelope:
```json
{
  "status": "success" | "failure",
  "statusCode": 200,
  "message": "Human-readable description",
  "data": { ... }
}
```

Paginated responses include a `data.pagination` object:
```json
{
  "page": 1,
  "limit": 20,
  "total": 100,
  "totalPages": 5
}
```

---

## Common Query Parameters (reused across endpoints)

| Param | Type | Description |
|-------|------|-------------|
| `cardId` | string | Card ObjectId |
| `limit` | integer | Items per page |
| `page` | integer | Page number |
| `startDate` | string | Filter start date |
| `endDate` | string | Filter end date |
| `status` | enum | Filter by status (varies by endpoint) |

---

## Endpoints

### 🃏 Cards

#### `POST /card/create-card`
Create a new card for the authenticated user.

**Body: `CreateCardRequest`**
| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `cardType` | ✅ | `"Virtual"` \| `"Physical"` | |
| `customerType` | ✅ | `"Consumer"` \| `"Business"` | |
| `preferredCardName` | ✅ | string | Name printed on card |
| `phoneNumber` | ✅ | string | |
| `phoneDialCode` | ✅ | string | e.g. `"+1"` |
| `expiryDate` | ❌ | string | Optional custom expiry |
| `secondaryCardName` | ❌ | string | |

---

#### `GET /card/get-card`
Get all cards belonging to the authenticated user. No params.

---

#### `GET /card/get-card-details`
Get details for a single card.

**Query:** `?cardId=<id>`

---

#### `GET /card/get-card-details-with-transactions`
Get card details including its transactions.

**Query:** `?cardId=<id>`

---

#### `GET /card/get-card-transactions`
Get paginated transactions for a card.

**Query:** `cardId` (req), `limit`, `page`, `startDate`, `endDate`, `status`, `dateType`

---

#### `GET /card/get-card-balance-history`
Get paginated balance history for a card.

**Query:** `cardId` (req), `limit`, `page`, `type`, `startDate`, `endDate`

---

#### `GET /card/export-card-transactions`
Export transactions as a file.

**Query:** `cardId` (req), `startDate`, `endDate`

---

#### `GET /card/export-card-balance-history`
Export balance history as a file.

**Query:** `cardId` (req)

---

#### `PUT /card/update-card-details`
Update contact details linked to a card.

**Body: `UpdateCardRequest`**
| Field | Required | Type |
|-------|----------|------|
| `cardId` | ✅ | string |
| `phoneDialCode` | ❌ | string |
| `phoneNumber` | ❌ | string |
| `email` | ❌ | string |

---

#### `PUT /card/update-card-pin`
Update the PIN for a card.

**Body: `UpdateCardPinRequest`**
| Field | Required |
|-------|----------|
| `cardId` | ✅ |
| `pin` | ✅ |

---

#### `PUT /card/toggle-freeze`
Freeze or unfreeze a card.

**Body: `ToggleFreezeRequest`**
| Field | Required | Notes |
|-------|----------|-------|
| `cardId` | ✅ | |
| `type` | ❌ | Freeze type/direction |

---

#### `DELETE /card/delete-card`
Delete a card.

**Body: `DeleteCardRequest`**
| Field | Required |
|-------|----------|
| `cardId` | ✅ |

---

#### `PUT /card/activate-physical-card`
Activate a physical card using its activation code.

**Body: `ActivatePhysicalCardRequest`**
| Field | Required |
|-------|----------|
| `cardId` | ✅ |
| `code` | ✅ |

---

#### `POST /card/create-card-topup-wallet`
Create a crypto top-up wallet for a card.

**Body: `CreateTopupWalletRequest`**
| Field | Required | Notes |
|-------|----------|-------|
| `cardId` | ✅ | |
| `coin_name` | ✅ | e.g. `"USDT"` |
| `amount` | ✅ | USD amount to top up |
| `tx_hash` | ❌ | Optional transaction hash |

---

#### `POST /card/create-access-url`
Create a secure access URL for a card (e.g. to view card details in an iframe/webview). No documented body.

---

#### `PUT /card/3ds-update`
Update 3DS (3D Secure) settings for a card. No documented body params.

---

#### `GET /card/3ds-get`
Get 3DS settings for a card.

**Query:** `?cardId=<id>`

---

#### `POST /card/three-ds-response`
Handle a 3DS challenge response.

**Body: `ThreeDsResponseRequest`** (fields not fully documented in spec)

---

#### `GET /card/get-job`
Poll the status of an async job (e.g. card creation).

**Query:** `?job_id=<id>` (required)

---

### 👤 User

#### `GET /user/get-user`
Get the authenticated user's profile.

**Query:** `?user_id=<id>` (optional — omit to get self)

**Response model: `User`**
```
_id, first_name, last_name, full_name, email, country_code, status,
max_cards, two_fa_enable, email_verified, company_name,
company_address, company_reg_no, createdAt, updatedAt
```

---

### 🪪 KYC

#### `GET /kyc/get-kyc`
Get the KYC (Know Your Customer) verification status for the authenticated user. No params.

**Response model: `KYC`**
```
_id, firstName, lastName, dob, residentialAddress, idDocumentType, is_verified
```

---

### 📦 Shipping

#### `POST /shipping/create-shipping`
Create a shipping request for a physical card.

**Body: `CreateShippingRequest`**
| Field | Required | Notes |
|-------|----------|-------|
| `cardId` | ✅ | |
| `shipping` | ❌ | Shipping address object |
| `shippingId` | ❌ | Use existing shipping profile |
| `shipping_payment` | ❌ | Payment method for shipping |

---

#### `POST /shipping/create-bulk-shipping`
Create bulk shipping requests. No documented body.

---

#### `GET /shipping/get-shipping`
Get shipping requests for the authenticated user.

**Query:** `limit`, `page`, `status` (optional — `"IN-REVIEW"` | `"DISPATCH"` | `"SHIPPED"`)

**Response model: `Shipping`**
```
_id, status, recipientName, address, trackingNumber, createdAt
```

---

### 🔔 Notifications

#### `GET /notification/get-list`
Get paginated notifications.

**Query:** `limit`, `page`, `is_read` (optional boolean)

---

#### `PUT /notification/read-all`
Mark all notifications as read. No body.

---

#### `PUT /notification/read-one`
Mark a single notification as read. No documented body (likely `notification_id` in body or query).

---

#### `GET /notification-setting/get`
Get notification preferences. No params.

---

#### `PUT /notification-setting/update`
Update notification preferences. No documented body.

**Response model: `Notification`**
```
_id, title, message, type, is_read, createdAt
```

---

### 💬 Telegram

#### `GET /telegram/get-telegram-user-by-card`
Get Telegram users linked to a card.

**Query:** `?cardId=<id>`

---

#### `POST /telegram/add-user`
Link a Telegram user to a card. No documented body.

---

#### `POST /telegram/remove-user`
Unlink a Telegram user from a card. No documented body.

---

## Data Models

### `User`
| Field | Type |
|-------|------|
| `_id` | ObjectId |
| `first_name` | string |
| `last_name` | string |
| `full_name` | string |
| `email` | string |
| `country_code` | string |
| `status` | `UserStatus` |
| `max_cards` | number |
| `two_fa_enable` | boolean |
| `email_verified` | boolean |
| `company_name` | string |
| `company_address` | string |
| `company_reg_no` | string |
| `createdAt` | datetime |
| `updatedAt` | datetime |

### `Card`
| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | |
| `card_id` | string | Provider card ID |
| `cardType` | `CardType` | Virtual or Physical |
| `customerType` | `CustomerType` | |
| `preferredCardName` | string | |
| `secondaryCardName` | string | |
| `cardDesign` | string | |
| `last4` | string | Last 4 digits |
| `topup_fee` | number | |
| `affiliate_topup_commission` | number | |
| `master_affiliate_topup_commission` | number | |
| `total_topup_fee` | number | |
| `isDeleted` | boolean | |
| `createdAt` | datetime | |
| `updatedAt` | datetime | |

### `Transaction`
| Field | Type |
|-------|------|
| `_id` | ObjectId |
| `card_id` | ObjectId |
| `amount` | number |
| `currency` | string |
| `merchant` | string |
| `status` | `TransactionStatus` |
| `type` | string |
| `createdAt` | datetime |

### `Topup`
| Field | Type |
|-------|------|
| `_id` | ObjectId |
| `card_id` | ObjectId |
| `amount` | number (USD) |
| `crypto_amount` | number |
| `coin_name` | string |
| `status` | `TopupStatus` |
| `tx_hash` | string |
| `createdAt` | datetime |

### `Payout`
| Field | Type |
|-------|------|
| `_id` | ObjectId |
| `payout_type` | string |
| `usd_amount` | number |
| `coin_name` | string |
| `withdrawal_address` | string |
| `status` | `PayoutStatus` |
| `tx_hash` | string |
| `createdAt` | datetime |

### `KYC`
| Field | Type |
|-------|------|
| `_id` | ObjectId |
| `firstName` | string |
| `lastName` | string |
| `dob` | string |
| `residentialAddress` | string |
| `idDocumentType` | string |
| `is_verified` | boolean |

### `Shipping`
| Field | Type |
|-------|------|
| `_id` | ObjectId |
| `status` | `ShippingStatus` |
| `recipientName` | string |
| `address` | string |
| `trackingNumber` | string |
| `createdAt` | datetime |

### `AffiliateUser`
| Field | Type |
|-------|------|
| `_id` | ObjectId |
| `name` | string |
| `email` | string |
| `status` | `AffiliateUserStatus` |
| `topup_commission` | number |
| `master_affiliate_id` | ObjectId |
| `createdAt` | datetime |

### `CryptoAddresses`
```
evm, bitcoin, solana, tron
```
Each is an `AddressDetails`: `{ address, derive_path, memo }`

### `WhiteLabel`
```
_id, name, domain, logo_url, primary_color
```

### `ChartData`
```
labels (array), data (array), total (number)
```

---

## Enums

| Enum | Values |
|------|--------|
| `CardType` | `Virtual`, `Physical` |
| `CustomerType` | `Consumer`, `Business` |
| `UserStatus` | `ACTIVE`, `BLOCKED`, `PENDING` |
| `TransactionStatus` | `PENDING`, `DECLINED`, `CLEARED`, `VOID` |
| `TopupStatus` | `PENDING`, `APPROVED`, `REJECTED` |
| `PayoutStatus` | `PENDING`, `APPROVED`, `REJECTED` |
| `ShippingStatus` | `IN-REVIEW`, `DISPATCH`, `SHIPPED` |
| `AffiliateUserStatus` | `ACTIVE`, `BLOCKED`, `REQUESTED` |
| `TwoFAType` | `PASSKEY`, `AUTHENTICATOR`, `BIOMETRIC`, `APP` |

---

## All Request Schemas (Quick Reference)

| Schema | Required Fields | All Fields |
|--------|----------------|------------|
| `LoginRequest` | `type` | email, password, otp, passkeyData, type, signature, userId |
| `CreateUserRequest` | firstName, lastName, countryCode, email, password, aid | same |
| `CreateCardRequest` | cardType, customerType, preferredCardName, phoneNumber, phoneDialCode | + expiryDate, secondaryCardName |
| `DeleteCardRequest` | cardId | cardId |
| `ToggleFreezeRequest` | cardId | cardId, type |
| `UpdateCardRequest` | cardId | cardId, phoneDialCode, phoneNumber, email |
| `UpdateCardPinRequest` | cardId, pin | same |
| `ActivatePhysicalCardRequest` | cardId, code | same |
| `CreateTopupWalletRequest` | cardId, coin_name, amount | + tx_hash |
| `CreateShippingRequest` | cardId | cardId, shipping, shippingId, shipping_payment |
| `UpdateShippingRequest` | — | shippingObj |
| `CreatePayoutRequest` | usd_amount, type | + coin_name, withdrawal_address, withdrawal_address_memo, card_id |
| `UpdatePayoutRequest` | — | payout_id, tx_hash, reason, status |
| `UpdatePersonalInfoRequest` | — | first_name, last_name, country_code, name, addressLine1, addressLine2, city, zipcode, state, businessName, website, notes, description, user_affiliate_topup_commission, threshold |
| `UpdateUsernameRequest` | new_username | new_username |
| `UpdateEmailRequest` | new_email | new_email |
| `VerifyUpdateEmailRequest` | current_email_otp, new_email_otp | same |
| `UpdatePasswordRequest` | current_password, new_password | same |
| `UpdatePasskeyRequest` | passkey_id, name | same |
| `DeletePasskeyRequest` | passkey_id | passkey_id |
| `ForgetPasswordRequest` | email | email |
| `VerifyForgetPasswordRequest` | email, otp, password | same |
| `VerifyOtpRequest` | otp | userId, otp |
| `ResendOtpRequest` | — | — |
| `CreateAffiliateUserRequest` | name | name, email |
| `UpdateAffiliateUserRequest` | name | userId, name |
| `UpdateUserRequest` | type | userObj, type |
| `UpdateTopupRequest` | — | topupObj |
| `UpdateDepositCommissionRequest` | — | deposit_id, fee_percentage, affiliate_commission_percentage, master_affiliate_commission_percentage |
| `UpdateCardTopupCommissionRequest` | — | (commission fields) |
| `ThreeDsResponseRequest` | — | (3DS response data) |
| `RefreshTokenRequest` | refreshToken | refreshToken |

---

## Query/Filter Schemas

| Schema | Required | Fields |
|--------|----------|--------|
| `GetTransactionRequest` | cardId | cardId, limit, page, status, startDate, endDate, dateType |
| `GetBalanceHistoryRequest` | cardId | cardId, limit, page, type, startDate, endDate |
| `GetCardDetailsRequest` | cardId | cardId |
| `GetListNotificationRequest` | — | limit, page |
| `GetJobRequest` | — | job_id |
| `ExportTransactionRequest` | — | cardId, startDate, endDate, ... |
| `ExportBalanceHistoryRequest` | — | cardId, ... |
| `ExportUsersRequest` | — | status, startDate, endDate |
| `ExportShippingRequest` | — | status, startDate, endDate |
| `GetDepositsChartRequest` | — | startDate, endDate, type |
| `GetEarningsChartRequest` | — | startDate, endDate, type |
| `GetUsersChartRequest` | — | startDate, endDate, type |

---

## Notes & Patterns

- **ObjectIds** are MongoDB-style string IDs (`_id` fields)
- **Async operations** (e.g. card creation) may return a `job_id` — poll `GET /card/get-job?job_id=<id>` to check completion
- **Crypto top-ups** support EVM, Bitcoin, Solana, and Tron networks
- **Physical cards** require a separate activate step after creation (`PUT /card/activate-physical-card`)
- **Affiliate system** supports two tiers: affiliate and master affiliate, each with configurable commissions
- **White label** support is built in — each user/org can have a branded `WhiteLabel` config
- **2FA** supports four methods: Passkey, Authenticator app, Biometric, and App-based
