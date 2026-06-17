# Car Rental API — Mobile Developer Guide

This guide documents the v1 REST API shipped by the `car-rental-web` Laravel backend. It is the integration reference for the Zuura mobile app.

- **Base URL**: `https://{host}/api/v1` (local dev: `https://car-rental-web.test/api/v1`)
- **Auth**: Laravel Sanctum personal access tokens
- **Format**: JSON in, JSON out (`Accept: application/json`, `Content-Type: application/json`)
- **Source**: [routes/api.php](../routes/api.php), controllers in [app/Http/Controllers/Api/V1/](../app/Http/Controllers/Api/V1/)

---

## 1. Conventions

### Headers

Every request:

```
Accept: application/json
Content-Type: application/json
```

Authenticated requests additionally send:

```
Authorization: Bearer {plainTextToken}
```

### Authentication model

- Tokens are issued by `POST /auth/login` and `POST /auth/register`. Store them securely (Keychain / EncryptedSharedPreferences).
- Tokens do **not** expire by default — call `POST /auth/logout` to revoke the current token.
- A `401 Unauthenticated` response means the token is missing, revoked, or invalid. Clear local state and route the user back to login.
- Permissions are checked per-endpoint via `$user->can('{resource}.{action}')`. Failures return `403`.

### Pagination

List endpoints use Laravel's default paginator:

```json
{
  "data": [ ... ],
  "links": { "first": "...", "last": "...", "prev": null, "next": "..." },
  "meta": { "current_page": 1, "from": 1, "last_page": 3, "per_page": 20, "to": 20, "total": 45, "path": "..." }
}
```

Override with `?page=2&per_page=20`.

### Error shape

**Validation (422)** — Laravel default:

```json
{
  "message": "The given data was invalid.",
  "errors": { "email": ["The email field is required."] }
}
```

**Domain exceptions (422)** — business-rule violations:

```json
{
  "message": "Customer is blacklisted and cannot create bookings.",
  "code": "CustomerBlacklistedException"
}
```

Other common statuses: `401` (no/bad token), `403` (missing permission), `404` (not found), `429` (throttled on auth endpoints — 6/min).

### Dates & money

- Dates: `YYYY-MM-DD`. Datetimes: ISO 8601 (`2026-04-20T10:00:00Z`). Always send UTC from the client.
- Money: decimal strings (`"125.00"`). Use a decimal library on mobile — do not round-trip through `float`.
- Currency codes: `USD`, `ZiG`, `ZAR`.

### Enums (cheat sheet)

| Enum | Values |
|---|---|
| `BookingStatus` | `pending` · `confirmed` · `active` · `completed` · `cancelled` |
| `VehicleStatus` | `available` · `rented` · `maintenance` · `reserved` · `decommissioned` |
| `CustomerStatus` | `active` · `greylisted` · `blacklisted` · `suspended` |
| `InvoiceStatus` | `draft` · `sent` · `partially_paid` · `paid` · `overdue` · `cancelled` |
| `PaymentStatus` | `pending` · `processing` · `completed` · `failed` · `refunded` · `cancelled` |
| `PaymentMethod` | `cash` · `ecocash` · `onemoney` · `bank_transfer` · `card` · `wallet` |
| `PaymentType` | `rental` · `deposit` · `deposit_refund` · `refund` |
| `InspectionType` | `pickup` · `return` |
| `ChecklistCondition` | `ok` · `fair` · `poor` · `damaged` · `missing` |
| `VehicleCategory` (body type) | `sedan` · `suv` · `truck` · `van` · `hatchback` · `bakkie` |
| `FuelType` | `petrol` · `diesel` · `hybrid` · `electric` |
| `FuelLevel` | `empty` · `quarter` · `half` · `three_quarter` · `full` |
| `Transmission` | `manual` · `automatic` |
| `UserRole` | `super-admin` · `fleet-manager` · `booking-agent` · `finance` · `customer` |

> ⚠ **`VehicleCategory` ≠ `BookingCategory`.** `VehicleCategory` is the hardcoded body-type enum used for search/filter (sedan, suv, etc.). `BookingCategory` is a separate, admin-managed DB record that defines the **commercial terms** — security deposit, km allowance, excess km rate, fuel top-up charge. Every vehicle belongs to one BookingCategory, and that's what drives pricing at booking time. See [§3a](#3a-booking-categories).

---

## 2. Auth

### `POST /auth/login` — public, throttled 6/min

```json
{ "email": "alice@example.com", "password": "secret", "device_name": "iPhone 15" }
```

**200**:
```json
{
  "token": "1|xxxxxxxxxxxxxxxxxxx",
  "user": { "id": 1, "name": "Alice", "email": "alice@example.com", "roles": ["customer"], "permissions": ["bookings.view", ...] }
}
```

Errors: `422 "The provided credentials are incorrect."`

### `POST /auth/register` — public, throttled 6/min

Creates a `User` + linked `Customer` with `status=active`, `wallet_balance=0`.

```json
{
  "name": "Alice Moyo",
  "email": "alice@example.com",
  "phone": "+263771234567",
  "password": "Str0ng!Pass",
  "password_confirmation": "Str0ng!Pass",
  "device_name": "iPhone 15",

  "id_number": "63-123456-A-07",
  "address": "12 Samora Machel Ave, Harare",
  "licence_number": "DL12345",
  "licence_class": "4",
  "licence_expiry": "2030-01-15"
}
```

Required: `name`, `email`, `phone`, `password` (confirmed + `Password::defaults()`), `device_name`. The rest are optional but recommended so the customer can book immediately.

**201**: `{ "token": "...", "customer": { ...CustomerResource } }`

### `GET /auth/me`

Returns the authenticated user + their `customer` (null for staff users).

### `POST /auth/logout`

Deletes the current token. Always call before clearing local auth state.

---

## 3a. Booking Categories

A **booking category** is a commercial tier the fleet admin creates (e.g. *Small Car*, *SUV*, *Premium*). Each vehicle belongs to exactly one category, and the category — not the vehicle — carries:

- `security_deposit` — flat refundable deposit charged at booking time
- `km_per_day_limit` — mileage allowance per rental day
- `excess_km_rate` — per-km surcharge once the allowance is used up
- `fuel_charge_per_level` — charge per quarter-tank short on return (set to 0 to disable)

The mobile app almost never needs to mutate these — they're staff-managed — but it **does** need to read them to show customers the deposit, mileage rules and fuel policy before they confirm a booking.

### `GET /booking-categories` — auth, `booking_categories.view`

Query params: `page`, `per_page`, `active` (boolean). Returns a paginated list of `BookingCategoryResource`.

```json
{
  "data": [
    {
      "id": 1,
      "slug": "small",
      "name": "Small Car",
      "description": "Honda Fit, Toyota Vitz and similar city runabouts.",
      "security_deposit": "150.00",
      "km_per_day_limit": 200,
      "excess_km_rate": "0.50",
      "fuel_charge_per_level": "15.00",
      "currency": "USD",
      "is_active": true,
      "sort_order": 10,
      "created_at": "2026-04-14T12:00:00Z",
      "updated_at": "2026-04-14T12:00:00Z"
    }
  ],
  "links": { ... },
  "meta": { ... }
}
```

### `GET /booking-categories/{id}` — auth, `booking_categories.view`

Returns a single `BookingCategoryResource`.

### Write endpoints (staff only)

`POST`, `PATCH`, `DELETE /booking-categories/{id}` — gated by `booking_categories.create/update/delete`. The customer-role mobile app doesn't touch these; they exist for admin/operator clients.

---

## 3. Vehicles

### `GET /vehicles/availability` — **public**

This is the primary browse endpoint for the mobile customer experience.

Query params:

| Param | Type | Required | Notes |
|---|---|---|---|
| `pickup_datetime` | ISO 8601 | yes | must be ≥ now |
| `return_datetime` | ISO 8601 | yes | must be after pickup |
| `category` | enum | no | filter by `VehicleCategory` |
| `min_rate` | numeric | no | daily rate floor |
| `max_rate` | numeric | no | daily rate ceiling |

**200**: `{ "data": [ VehicleResource + quote ] }` — excludes vehicles that are `decommissioned`/`maintenance`, have no booking category assigned, or have overlapping `confirmed`/`active` bookings. Each vehicle carries a `quote`:

```json
{
  "id": 42,
  "make": "Toyota",
  "model": "Corolla",
  "daily_rate": "45.00",
  "currency": "USD",
  "booking_category": {
    "id": 1,
    "slug": "small",
    "name": "Small Car",
    "security_deposit": "150.00",
    "km_per_day_limit": 200,
    "excess_km_rate": "0.50",
    "fuel_charge_per_level": "15.00",
    "currency": "USD"
  },
  "...": "...",
  "quote": {
    "daily_rate": "45.00",
    "rental_days": 3,
    "km_allowance": 600,
    "base_amount": "135.00",
    "security_deposit": "150.00",
    "total_estimated": "285.00"
  }
}
```

The `quote.total_estimated` includes the base hire fee **and** the security deposit — that's what the customer will be asked to pay up-front. The deposit is refunded on return (less deductions) via a `deposit_refund` payment.

### `GET /vehicles` — auth, `vehicles.view`

Query: `page`, `per_page`, `status`, `category`, `ownership_type`, `search` (matches `make`/`model`/`reg_plate`). Paginated.

### `GET /vehicles/{id}` — auth, `vehicles.view`

Returns a single `VehicleResource` with `owner` eager-loaded.

**VehicleResource shape**:

```json
{
  "id": 42,
  "make": "Toyota",
  "model": "Corolla",
  "year": 2022,
  "colour": "white",
  "reg_plate": "ABC 1234",
  "vin": "JT...",
  "category": "sedan",
  "booking_category_id": 1,
  "booking_category": {
    "id": 1,
    "slug": "small",
    "name": "Small Car",
    "security_deposit": "150.00",
    "km_per_day_limit": 200,
    "excess_km_rate": "0.50",
    "fuel_charge_per_level": "15.00",
    "currency": "USD"
  },
  "fuel_type": "petrol",
  "transmission": "automatic",
  "seats": 5,
  "ownership_type": "owned",
  "owner": null,
  "daily_rate": "45.00",
  "weekly_rate": "270.00",
  "monthly_rate": "1000.00",
  "currency": "USD",
  "status": "available",
  "current_odometer": 42310,
  "photos": [],
  "created_at": "2026-01-10T08:00:00Z",
  "updated_at": "2026-04-10T08:00:00Z"
}
```

> The commercial terms (`security_deposit`, `km_per_day_limit`, `excess_km_rate`, `fuel_charge_per_level`) live on `booking_category`, not directly on the vehicle. Always read them from there.

`POST`, `PATCH`, `DELETE /vehicles` are staff-only (`vehicles.create`/`update`/`delete`) — not typically invoked from the mobile customer app. See [StoreVehicleRequest](../app/Http/Requests/Api/V1/StoreVehicleRequest.php) for the full field list if you need to build an operator screen.

---

## 4. Customers

Staff endpoints, all gated by `customers.*` permissions. Customer-role users should not call these directly — they see their own profile through `/auth/me`.

| Method | Path | Permission |
|---|---|---|
| GET | `/customers` | `customers.view` |
| POST | `/customers` | `customers.create` |
| GET | `/customers/{id}` | `customers.view` |
| PATCH | `/customers/{id}` | `customers.update` |
| DELETE | `/customers/{id}` | `customers.delete` |
| POST | `/customers/{id}/blacklist` | `customers.blacklist` |
| POST | `/customers/{id}/reinstate` | `customers.blacklist` |
| GET | `/customers/{id}/ratings` | `customers.view` |

Blacklist body: `{ "reason": "..." }`. Blacklisted customers cannot create bookings (422 `CustomerBlacklistedException`).

**CustomerResource shape**:

```json
{
  "id": 7,
  "name": "Alice Moyo",
  "id_number": "63-123456-A-07",
  "phone": "+263771234567",
  "email": "alice@example.com",
  "address": "...",
  "licence_number": "DL12345",
  "licence_class": "4",
  "licence_expiry": "2030-01-15",
  "emergency_contact_name": null,
  "emergency_contact_phone": null,
  "wallet_balance": "0.00",
  "wallet_currency": "USD",
  "status": "active",
  "blacklist_reason": null,
  "created_at": "2026-01-10T08:00:00Z"
}
```

---

## 5. Bookings

This is the core workflow. **Status lifecycle**:

```
pending ──confirm──▶ confirmed ──activate──▶ active ──complete──▶ completed
   │                     │                     │
   └─────────────────────┴─────────────────────┴──▶ cancelled
```

Customers with role `customer` automatically see **only their own bookings** on `GET /bookings` — the server auto-filters by their linked `customer_id`. Staff see everything.

### `GET /bookings` — `bookings.view`

Query: `page`, `per_page`, `status`, `customer_id`, `vehicle_id`. Paginated, latest first. Eager-loads `customer` and `vehicle`.

### `POST /bookings` — `bookings.create`

```json
{
  "customer_id": 7,
  "vehicle_id": 42,
  "pickup_datetime": "2026-04-20T10:00:00Z",
  "return_datetime": "2026-04-23T10:00:00Z",

  "pickup_location": "Harare Airport",
  "return_location": "Harare Airport",
  "fuel_level_pickup": "full",
  "cross_border": false,
  "cross_border_countries": [],
  "extras": { "child_seat": 10 },
  "notes": "Customer requested early pickup"
}
```

> **No `deposit_amount`.** Don't send one — it's ignored. The server pulls `deposit_amount` from `vehicle.booking_category.security_deposit` and snapshots it onto the booking. Likewise `km_allowance`, `daily_rate` and `excess_km_rate` are computed server-side.

**Customer self-booking**: a logged-in user with `role=customer` must set `customer_id` to their own `customer.id` (read it from `GET /auth/me`). The server enforces that customers only see/create bookings for themselves.

**Optional fuel level**: `fuel_level_pickup` can be set at creation time if you already know the tank state; otherwise it's recorded on the pickup inspection. The *return* level is recorded on the return inspection OR passed to the `complete` action.

Failure modes:
- `422 CustomerBlacklistedException` — customer is blacklisted
- `422 VehicleUnavailableException` — vehicle is in `maintenance`/`decommissioned` or has an overlapping `confirmed`/`active` booking
- `422 InvalidBookingException` with `code: "missingBookingCategory"` — the vehicle has no booking category assigned; cannot be booked until the operator fixes it
- `422` validation — dates invalid, customer/vehicle not found

New bookings start as `pending`. `reference`, `rental_days`, `km_allowance`, `daily_rate`, `excess_km_rate`, `base_amount`, `deposit_amount`, `total_amount` are all computed server-side.

### `GET /bookings/{id}` — `bookings.view`

Returns `BookingResource` with `customer`, `vehicle`, `invoice`, and `payments` loaded.

### `PATCH /bookings/{id}` — `bookings.update`

Only logistical fields are mutable: `notes`, `pickup_location`, `return_location`. To change dates/vehicle/customer, cancel and rebook.

### `DELETE /bookings/{id}` — `bookings.cancel`

Body: `{ "reason": "..." }`. Transitions to `cancelled`. Not allowed from `completed`.

### State transitions

| Action | Endpoint | Body | From state | Effect |
|---|---|---|---|---|
| Confirm | `POST /bookings/{id}/confirm` | `{}` | `pending` | → `confirmed` |
| Activate (pickup) | `POST /bookings/{id}/activate` | `{ "odometer_start": 42310 }` | `confirmed` | → `active`, records `actual_pickup_at` |
| Complete (return) | `POST /bookings/{id}/complete` | `{ "odometer_end": 42510, "fuel_level_return": "three_quarter" }` | `active` | → `completed`, reconciles deposit, optionally creates refund payment |

On `complete`, the server:
1. Re-computes `mileage_overage_amount` from `(odometer_end − odometer_start) − km_allowance`, billed at the category's `excess_km_rate`.
2. Computes a **fuel charge** from `(pickup_level − return_level)` in quarter-tank units × `category.fuel_charge_per_level`. Surplus fuel is ignored — customers never get credited for bringing back more fuel than they were given.
3. Sums `mileage_overage + fuel_charge + damage_charge` and subtracts from `deposit_amount`.
4. If the deposit covers the deductions, creates a `Payment` with `type=deposit_refund` for the remainder. Poll `GET /bookings/{id}` or read `payments[]` to surface the refund.
5. If the deductions exceed the deposit, no refund is created and the overage is added to the invoice as a balance due.

Invalid transitions and odometer regressions (end < start) raise `422 InvalidBookingException`.

### BookingResource shape

```json
{
  "id": 101,
  "reference": "BK-2026-000101",
  "status": "confirmed",
  "customer_id": 7,
  "customer": { ... },
  "vehicle_id": 42,
  "vehicle": { ... },
  "pickup_datetime": "2026-04-20T10:00:00Z",
  "return_datetime": "2026-04-23T10:00:00Z",
  "actual_pickup_at": null,
  "actual_return_at": null,
  "rental_days": 3,
  "km_allowance": 600,
  "odometer_start": null,
  "odometer_end": null,
  "daily_rate": "45.00",
  "excess_km_rate": "0.50",
  "currency": "USD",
  "base_amount": "135.00",
  "mileage_overage_amount": "0.00",
  "extras_amount": "10.00",
  "fuel_charge": "0.00",
  "damage_charge": "0.00",
  "tax_amount": "0.00",
  "total_amount": "145.00",
  "deposit_amount": "50.00",
  "paid_amount": "50.00",
  "extras": { "child_seat": 10 },
  "pickup_location": "Harare Airport",
  "return_location": "Harare Airport",
  "cross_border": false,
  "cross_border_countries": [],
  "notes": null,
  "created_at": "2026-04-14T09:00:00Z",
  "updated_at": "2026-04-14T09:05:00Z"
}
```

---

## 6. Booking Inspections

One `pickup` inspection at handover, one `return` inspection at completion. The server computes a damage diff between the two.

### `GET /inspections/template` — **public**

No auth. Returns the standard checklist so the mobile app can render a blank form without hardcoding items:

```json
{ "items": [ { "key": "body_front", "label": "Front body panel", "category": "exterior" }, ... ] }
```

Fetch this on app launch (or with the booking) and cache it.

### `GET /bookings/{id}/inspections` — `bookings.view`

Returns `{ "data": [ BookingInspectionResource ] }` (not paginated — max two items per booking).

### `POST /bookings/{id}/inspections` — `bookings.update`

```json
{
  "type": "pickup",
  "odometer": 42310,
  "fuel_level": "full",
  "items": [
    { "key": "body_front", "label": "Front body panel", "condition": "ok", "notes": null },
    { "key": "body_rear",  "label": "Rear body panel",  "condition": "damaged", "notes": "Small scratch on bumper" }
  ],
  "photos": ["https://.../pickup-1.jpg", "https://.../pickup-2.jpg"],
  "exterior_notes": "Clean",
  "interior_notes": "Clean",
  "damage_summary": "Minor scratch on rear bumper",
  "signed_by_customer": true,
  "customer_signature_name": "Alice Moyo"
}
```

Notes for mobile:
- Photos are **URLs or file references** — uploading binary files is not part of this endpoint. Upload to object storage first (TBD — confirm with backend team) and submit the URLs here.
- `items[].key` must match template keys for diffing to work cleanly.
- `signed_at` is set server-side when `signed_by_customer=true`.

### `GET /bookings/{id}/inspections/diff` — `bookings.view`

Returns `{ "diff": { ... } }` comparing pickup vs return. Use this after completion to show the customer the damage summary before they leave.

---

## 7. Customer Ratings

Staff-side, used after return to rate the customer's behavior.

### `POST /bookings/{id}/rating` — `bookings.update`

```json
{
  "score_condition": 5,
  "score_timeliness": 4,
  "score_payment": 5,
  "score_communication": 5,
  "score_care": 5,
  "comment": "Returned the vehicle in great condition."
}
```

All scores are integers 1–5. Response includes computed `average` (decimal string). Rolls up into `customer.average_rating` / `ratings_count`.

### `GET /customers/{id}/ratings` — `customers.view`

Paginated history.

---

## 8. Invoices

An invoice is generated per booking, typically at completion.

| Method | Path | Permission |
|---|---|---|
| GET | `/invoices` | `invoices.view` |
| POST | `/invoices` | `invoices.create` |
| GET | `/invoices/{id}` | `invoices.view` |
| PATCH | `/invoices/{id}` | `invoices.update` |
| DELETE | `/invoices/{id}` | `invoices.update` |

`POST /invoices` body: `{ "booking_id": 101 }`. Pulls all line items (base, mileage overage, extras, fuel, damage, tax) from the booking. Status starts `draft`.

`PATCH` only updates `notes` and `due_at`.

**InvoiceResource shape**:

```json
{
  "id": 55,
  "number": "INV-2026-000055",
  "status": "partially_paid",
  "booking_id": 101,
  "customer_id": 7,
  "customer": { ... },
  "issued_at": "2026-04-23",
  "due_at": "2026-05-07",
  "subtotal": "135.00",
  "mileage_overage": "0.00",
  "fuel_charge": "0.00",
  "extras": "10.00",
  "damage_charge": "0.00",
  "tax": "0.00",
  "total": "145.00",
  "paid_amount": "50.00",
  "balance_due": "95.00",
  "currency": "USD",
  "line_items": [ ... ],
  "created_at": "2026-04-23T11:00:00Z"
}
```

List query params: `status`, `customer_id`, `page`, `per_page`.

---

## 9. Payments

### `GET /payments` — `payments.view`

Query: `page`, `per_page`, `customer_id`, `invoice_id`.

### `POST /payments` — `payments.record`

Exactly one of `invoice_id` or `booking_id` must be set.

```json
{
  "amount": 50.00,
  "method": "ecocash",
  "invoice_id": 55,
  "gateway": "paynow",
  "gateway_reference": "PN-ABC123",
  "paynow_poll_url": "https://www.paynow.co.zw/...",
  "notes": "Initial deposit"
}
```

Behavior:
- Amount ≥ `0.01`.
- Applied against invoice → updates `paid_amount`/`status` (`partially_paid`/`paid`).
- Applied against booking → updates booking `paid_amount`.
- `status` defaults to `completed`; gateway flows can leave it `pending`/`processing`.
- `recorded_by_user_id`, `reference`, and `paid_at` are set server-side.

### `GET /payments/{id}` — `payments.view`

**PaymentResource shape**:

```json
{
  "id": 200,
  "reference": "PMT-2026-000200",
  "invoice_id": 55,
  "booking_id": null,
  "customer_id": 7,
  "amount": "50.00",
  "currency": "USD",
  "method": "ecocash",
  "gateway": "paynow",
  "gateway_reference": "PN-ABC123",
  "status": "completed",
  "paid_at": "2026-04-23T11:05:00Z",
  "notes": "Initial deposit",
  "created_at": "2026-04-23T11:05:00Z"
}
```

---

## 10. Typical mobile flows

### Customer self-booking (the primary mobile flow)

This is the full customer-side journey. A registered customer can complete everything in this list from the app without any staff action until handover.

1. **Browse (no auth).** `GET /vehicles/availability?pickup_datetime=...&return_datetime=...` — returns available vehicles each with an embedded `booking_category` and a `quote.total_estimated` (hire fee + deposit). This is what you display on the search results screen. Cache the chosen vehicle's `id`, `daily_rate`, `booking_category.security_deposit`, `km_per_day_limit`, `excess_km_rate` and `fuel_charge_per_level` — you'll want these on the confirmation screen.
2. **Authenticate.** If the user isn't logged in, send them through `POST /auth/register` (new) or `POST /auth/login`. Store the token. Call `GET /auth/me` and cache `customer.id` — you need it for booking creation.
3. **Create the booking.** `POST /bookings` with `{ customer_id: me.customer.id, vehicle_id, pickup_datetime, return_datetime, pickup_location, return_location, fuel_level_pickup: "full" }`. **Do not** send `deposit_amount` — the server fills it in from the vehicle's booking category. The response contains the final `deposit_amount`, `base_amount`, `total_amount` and a human-readable `reference`.
4. **Confirmation screen.** Show the customer: reference, pickup/return dates, daily rate × days, mileage allowance, deposit amount, and a clear "total due now". Include a note that the deposit is refundable on return minus deductions.
5. **Deposit + first-day payment.** `POST /payments` with `{ booking_id, amount: deposit_amount, type: "deposit", method }` to capture the deposit, then (optionally) another `POST /payments` with `type: "rental"` for the hire fee. Real money transfer happens via the selected `method` — EcoCash/OneMoney/Card/etc. — which your client handles out-of-band and then reports back with a `gateway_reference`.
6. **Staff confirms.** A booking agent approves via the admin web UI → status becomes `confirmed`. Poll `GET /bookings/{id}` or refresh on screen focus. (If you want realtime, ask backend for broadcasting.)
7. **Handover at pickup.** Staff runs `POST /bookings/{id}/activate` with `odometer_start` and captures a pickup inspection (photos, fuel level, items checklist). Status flips to `active`. Your app can show "Pickup completed — enjoy your rental."
8. **Return.** Staff runs `POST /bookings/{id}/complete` with `odometer_end` and `fuel_level_return`, then records the return inspection. The server:
   - computes the mileage overage charge (if any)
   - computes the fuel shortfall charge (if any)
   - deducts those from the deposit
   - if any deposit is left, creates a `Payment` with `type=deposit_refund`
9. **Show the settlement.** Fetch `GET /bookings/{id}` one more time. Surface `deposit_summary` (if exposed) or walk `payments[]` looking for the `deposit_refund` row, and compute:
   - `refund_amount` — what the customer gets back
   - `balance_owed` — anything the customer still owes (mileage overage + fuel + damage exceeding the deposit)
10. **Clear any balance.** If `balance_owed > 0`, generate an invoice (`POST /invoices`) and pay it off (`POST /payments` with `type: "rental"` or the appropriate type).

> **Offline-safe fields** worth caching at step 3: `deposit_amount`, `km_allowance`, `excess_km_rate`, `fuel_charge_per_level`. If the user is out of range when they return the vehicle, your app can still compute a plausible refund estimate from these snapshotted values and queue the settlement call for when connectivity resumes.

### Operator app: inspection capture

1. `GET /inspections/template` once on launch — cache.
2. `GET /bookings/{id}` for context.
3. Build the form from the template, let the user mark `condition`, add `notes`, take photos.
4. Upload photos to object storage out-of-band (ask backend for the upload URL).
5. `POST /bookings/{id}/inspections` with photo URLs + `signed_by_customer=true` once the customer signs.
6. After return, `GET /bookings/{id}/inspections/diff` for the damage summary screen.

---

## 11. Client implementation notes

- **One HTTP client** with interceptors that add the `Authorization` header when a token is present and auto-logout on `401`.
- **Money**: parse decimal strings into `BigDecimal` / `Decimal`. Never use `Double` / `Number`.
- **Dates**: always send ISO 8601 UTC. Display in the user's local zone.
- **Pagination**: implement an infinite-scroll helper keyed on `meta.current_page < meta.last_page`.
- **Retry policy**: safe to retry `GET`s and idempotent actions. Do **not** retry `POST /bookings`, `POST /payments`, or state transitions without first checking the resource — they can double-book or double-charge.
- **Offline**: the inspection template and the active booking can be cached. Queue inspection submissions when offline and replay them in order.
- **Error UX**: surface domain `code` values (`CustomerBlacklistedException`, `VehicleUnavailableException`, `InvalidBookingException`) to the user with friendly messaging — these are the ones they can act on.
- **Throttling**: `POST /auth/login` and `POST /auth/register` are capped at 6/min per IP. Back off on `429`.

---

## 12. Quick endpoint index

| Method | Path | Auth | Permission |
|---|---|---|---|
| POST | `/auth/login` | public (6/min) | — |
| POST | `/auth/register` | public (6/min) | — |
| GET | `/auth/me` | token | — |
| POST | `/auth/logout` | token | — |
| GET | `/vehicles/availability` | public | — |
| GET | `/booking-categories` | token | `booking_categories.view` |
| POST | `/booking-categories` | token | `booking_categories.create` |
| GET | `/booking-categories/{id}` | token | `booking_categories.view` |
| PATCH | `/booking-categories/{id}` | token | `booking_categories.update` |
| DELETE | `/booking-categories/{id}` | token | `booking_categories.delete` |
| GET | `/vehicles` | token | `vehicles.view` |
| POST | `/vehicles` | token | `vehicles.create` |
| GET | `/vehicles/{id}` | token | `vehicles.view` |
| PATCH | `/vehicles/{id}` | token | `vehicles.update` |
| DELETE | `/vehicles/{id}` | token | `vehicles.delete` |
| GET | `/customers` | token | `customers.view` |
| POST | `/customers` | token | `customers.create` |
| GET | `/customers/{id}` | token | `customers.view` |
| PATCH | `/customers/{id}` | token | `customers.update` |
| DELETE | `/customers/{id}` | token | `customers.delete` |
| POST | `/customers/{id}/blacklist` | token | `customers.blacklist` |
| POST | `/customers/{id}/reinstate` | token | `customers.blacklist` |
| GET | `/customers/{id}/ratings` | token | `customers.view` |
| GET | `/bookings` | token | `bookings.view` |
| POST | `/bookings` | token | `bookings.create` |
| GET | `/bookings/{id}` | token | `bookings.view` |
| PATCH | `/bookings/{id}` | token | `bookings.update` |
| DELETE | `/bookings/{id}` | token | `bookings.cancel` |
| POST | `/bookings/{id}/confirm` | token | `bookings.confirm` |
| POST | `/bookings/{id}/activate` | token | `bookings.activate` |
| POST | `/bookings/{id}/complete` | token | `bookings.complete` |
| GET | `/inspections/template` | public | — |
| GET | `/bookings/{id}/inspections` | token | `bookings.view` |
| POST | `/bookings/{id}/inspections` | token | `bookings.update` |
| GET | `/bookings/{id}/inspections/diff` | token | `bookings.view` |
| POST | `/bookings/{id}/rating` | token | `bookings.update` |
| GET | `/invoices` | token | `invoices.view` |
| POST | `/invoices` | token | `invoices.create` |
| GET | `/invoices/{id}` | token | `invoices.view` |
| PATCH | `/invoices/{id}` | token | `invoices.update` |
| DELETE | `/invoices/{id}` | token | `invoices.update` |
| GET | `/payments` | token | `payments.view` |
| POST | `/payments` | token | `payments.record` |
| GET | `/payments/{id}` | token | `payments.view` |

---

## 13. Where to look in the codebase

- **Route list**: [routes/api.php](../routes/api.php)
- **Controllers**: [app/Http/Controllers/Api/V1/](../app/Http/Controllers/Api/V1/)
- **Validation rules**: [app/Http/Requests/Api/V1/](../app/Http/Requests/Api/V1/)
- **Response shapes**: [app/Http/Resources/Api/V1/](../app/Http/Resources/Api/V1/)
- **Domain logic**: [app/Models/](../app/Models/), `app/Services/`, `app/Actions/`
- **Enums**: `app/Enums/`
- **Custom exceptions**: `app/Exceptions/`

When this guide and the code disagree, the code wins — flag the delta to the backend team so we can update this doc.
