# Mobile API Changelog — Booking Categories, Deposit Refund & Errands

Hand-off doc for the Zuura mobile team. Captures every backend change that affects the mobile app since the last stable build. Pair this with [MOBILE_API_GUIDE.md](MOBILE_API_GUIDE.md) and the live OpenAPI spec at `/docs/api` (Scalar).

## TL;DR (top 5 behaviour changes)

1. **Deposits are now per-category, not per-booking.** A new `BookingCategory` resource sets the security deposit, km allowance, excess km rate and fuel policy. The mobile app no longer sends `deposit_amount` when creating a booking — the server fills it in from the vehicle's category.
2. **Fuel policy is automatic.** Pickup level is stored at booking time; on return, the server computes the charge per quarter-tank short and deducts it from the deposit. Surplus fuel returned is **not** credited back.
3. **Deposit refund runs itself on `POST /bookings/{id}/complete`.** If the deductions (mileage overage + fuel shortfall + damage) are less than the deposit, the server creates a `Payment` with `type=deposit_refund` automatically. Surface it on the return summary screen.
4. **Pickup odometer can be captured at booking creation.** Optional, and pre-fills from the vehicle's last recorded reading. If set early, `activate` can use the same value.
5. **Vehicle payloads now include `booking_category`.** Read the deposit, km allowance, excess rate and fuel charge from there — not from the vehicle root.

## 1. New resource: `BookingCategory`

Commercial tier attached to a vehicle. Drives the booking math.

```json
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
  "sort_order": 10
}
```

### New endpoints

| Method | Path | Auth | Permission |
|---|---|---|---|
| GET | `/api/v1/booking-categories` | bearer | `booking_categories.view` |
| POST | `/api/v1/booking-categories` | bearer | `booking_categories.create` |
| GET | `/api/v1/booking-categories/{id}` | bearer | `booking_categories.view` |
| PATCH | `/api/v1/booking-categories/{id}` | bearer | `booking_categories.update` |
| DELETE | `/api/v1/booking-categories/{id}` | bearer | `booking_categories.delete` |

**Slug is auto-generated** from `name` by `spatie/laravel-sluggable` on create. Do not send `slug` in POST/PATCH bodies — it's ignored.

**Customer role** does not need the write endpoints. Only the read endpoints are relevant if you want to list tiers somewhere. In practice, read the tier from `vehicle.booking_category` on the availability search — that's usually enough.

Seeded tiers: `small`, `medium`, `large`, `premium`.

## 2. Vehicle resource — new field

`GET /api/v1/vehicles/availability` and `GET /api/v1/vehicles/{id}` now include a nested `booking_category` object:

```json
{
  "id": 42,
  "make": "Toyota",
  "model": "Corolla",
  "reg_plate": "ABC 1234",
  "daily_rate": "45.00",
  "currency": "USD",
  "current_odometer": 42310,
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
  }
}
```

The commercial terms (`security_deposit`, `km_per_day_limit`, `excess_km_rate`, `fuel_charge_per_level`) live on `booking_category`, not on the vehicle root. Always read them from there.

**Backwards compatibility note:** the vehicle's `km_per_day_limit` and `excess_km_rate` columns still exist in the DB but they're dormant — nothing on the server reads them anymore. They'll be dropped in a follow-up migration. Update your app now to use the nested category fields.

**Vehicles with no booking_category:** the availability search excludes them automatically. If an admin manually hit `/vehicles/{id}` they'd see `booking_category: null` — don't try to book those.

## 3. `POST /api/v1/bookings` — request body changes

### Removed
- `deposit_amount` — server now snapshots this from `vehicle.booking_category.security_deposit`. If you send it, it's ignored.

### Added (both optional)
- `fuel_level_pickup` — one of `empty`, `quarter`, `half`, `three_quarter`, `full`. Stored on the booking and used to compute the fuel charge on return. If omitted at creation, the pickup inspection will capture it later.
- `odometer_start` — integer km. If you already know the pickup odometer (e.g. walk-in customer standing next to the car), send it. The `activate` step can use the same value.

### Full example

```json
POST /api/v1/bookings
{
  "customer_id": 7,
  "vehicle_id": 42,
  "pickup_datetime": "2026-04-20T10:00:00Z",
  "return_datetime": "2026-04-23T10:00:00Z",
  "pickup_location": "Harare Airport",
  "return_location": "Harare Airport",
  "fuel_level_pickup": "full",
  "odometer_start": 42310,
  "cross_border": false,
  "notes": "Customer requested early pickup"
}
```

### New failure mode

`InvalidBookingException` with `code: "InvalidBookingException"` and message *"Vehicle {plate} has no booking category assigned. Assign one before creating a booking."* — surfaces as a **422** with the standard `{ message, code }` shape. Treat it like any other domain exception: show the message to the user, let them pick a different vehicle.

## 4. `POST /api/v1/bookings/{id}/complete` — new behaviour

### New optional field
- `fuel_level_return` — if not supplied, the server reads it from the return inspection record.

### What the server does (new pipeline)

1. Recomputes `mileage_overage_amount` from `(odometer_end − odometer_start) − km_allowance` × `category.excess_km_rate`.
2. Computes **fuel charge** = `levels_short × category.fuel_charge_per_level`. Surplus fuel (return > pickup) is treated as zero — **no credit**.
3. Sums `mileage_overage + fuel_charge + damage_charge` and deducts from `deposit_amount`.
4. If any deposit is left, creates a `Payment` row with `type=deposit_refund`, `status=completed`, amount = `deposit − deductions`.
5. If deductions exceed the deposit, no refund is created and the overflow is already part of `total_amount` (surfaces on the invoice).

### Surface it on the return screen

After calling `complete`, immediately `GET /bookings/{id}`. Walk the `payments` array and find the row with `type: "deposit_refund"` to get `refund_amount`. Compute `balance_owed = max(0, deductions - deposit)` if you need to nudge the customer to pay the shortfall.

## 5. Payment types

The `PaymentType` enum now matters to the mobile app:

| Value | Meaning |
|---|---|
| `rental` | Regular rental payment against a booking or invoice |
| `deposit` | Initial security deposit capture (charged at booking creation time) |
| `deposit_refund` | Refund created automatically on `complete` |
| `refund` | Manual refund (rare) |

Filter by `type` on the booking's `payments[]` array to compute deposit held vs refunded.

## 6. Error handling

### Domain exceptions still render as 422 JSON for the mobile app

```json
{ "message": "…", "code": "VehicleUnavailableException" }
```

The four codes the mobile app should handle specifically:

| Code | When | User-facing action |
|---|---|---|
| `CustomerBlacklistedException` | Booking create, blacklisted customer | Show friendly message, no retry |
| `VehicleUnavailableException` | Booking create, vehicle has overlap or bad status | Prompt to pick a different vehicle |
| `InvalidBookingException` | Bad state transition, odometer regression, or missing category | Message is explicit — show it verbatim |

(Behaviour change: these used to crash Inertia web clients. That's fixed on the server — the mobile JSON flow is unchanged, mentioned here so the mobile team isn't surprised if they see this in the release notes.)

### Auth fix (already deployed)

`POST /auth/login` and `POST /auth/register` used to return a **500** on some stacks because the server was passing a `Stringable` into Sanctum's strict-typed `createToken(string)`. Fixed — tokens are issued cleanly now. Bump your dev environment.

## 7. Errands / non-booking costs

New capability in the fleet side that doesn't change the mobile app's booking flow but **does** affect the odometer the app will see next time it fetches a vehicle.

- New `CostCategory` values: `parking`, `tolls` (in addition to the existing `fuel`, `car_wash`, etc.).
- When an operator logs a cost with an odometer reading (e.g. "refueling on an errand at 45,200 km"), the server:
  1. Creates the `VehicleCost` entry.
  2. Bumps `vehicle.current_odometer` if the new reading is higher.
  3. Creates a `MileageLog` row with `booking_id=null`, `source=manual` and a note like *"Errand: parking — Airport long stay"*.

**Impact on mobile:** when the app fetches a vehicle via availability search or `/vehicles/{id}`, `current_odometer` now reflects the latest known reading — whether it came from a booking pickup/return or an errand. Use it as the default starting odometer on the pickup screen.

## 8. New demo login for end-to-end self-booking

The customer self-booking flow is unlocked on the backend. `php artisan migrate:fresh --seed` now creates a demo customer account the mobile team can use:

- **Email:** `alice@demo.test`
- **Password:** `password`
- **Role:** `customer`

This account has a linked `Customer` record (`user_id → customer.id`). Call `GET /auth/me` after login to read `customer.id` and use that as `customer_id` when creating a booking from the app.

## 9. Typical mobile booking flow (updated)

1. **Browse (no auth):** `GET /vehicles/availability?pickup_datetime=...&return_datetime=...` → returns vehicles with nested `booking_category` and a `quote` that now includes the deposit in `total_estimated`.
2. **Authenticate:** `POST /auth/login` or `POST /auth/register`. Store the bearer token.
3. **Cache the customer id:** `GET /auth/me` → `customer.id`.
4. **Create:** `POST /bookings` with `{ customer_id, vehicle_id, pickup_datetime, return_datetime, pickup_location, return_location, fuel_level_pickup, odometer_start? }`. Don't send `deposit_amount`. Response includes the snapshotted `deposit_amount`, `km_allowance`, `excess_km_rate`, `base_amount`, `total_amount`, and the booking `reference`.
5. **Pay the deposit:** `POST /payments` with `{ booking_id, amount: <deposit_amount>, type: "deposit", method: "ecocash" | "cash" | ... }`.
6. **Wait for confirmation:** refresh `GET /bookings/{id}`; when `status` transitions from `pending` to `confirmed`, the customer's booking is locked in.
7. **Handover:** staff runs `POST /bookings/{id}/activate` with `{ odometer_start }`. Pickup inspection gets recorded separately.
8. **Return:** staff runs `POST /bookings/{id}/complete` with `{ odometer_end, fuel_level_return }`. Server computes overage + fuel charge + refund.
9. **Settlement screen:** `GET /bookings/{id}` once more. Walk `payments[]` for the `deposit_refund` row. If `deductions > deposit`, show a "balance owed" prompt and route to `POST /payments` with `type: "rental"`.

## 10. Quick diff — what's on the wire

**Availability `vehicle[i]`:** gained `current_odometer`, `booking_category_id`, `booking_category` (object). No removals.

**`POST /bookings` body:** dropped `deposit_amount`. Added `fuel_level_pickup`, `odometer_start`.

**`POST /bookings/{id}/complete` body:** added `fuel_level_return` (optional).

**Booking resource:** `fuel_level_pickup`, `fuel_level_return`, `fuel_charge`, `deposit_amount` were already there; they now carry real values instead of zeros/nulls. The related `payments[]` array may include a row with `type: "deposit_refund"` after completion.

**Error shape:** unchanged (`{ message, code }` at 422). New `code` value to expect: `InvalidBookingException` with "missing booking category" message.

## Quick checklist for the mobile team

- [ ] Availability screen reads `booking_category.security_deposit` and shows it alongside the daily rate.
- [ ] Booking creation screen shows a "deposit" line that comes from `booking_category.security_deposit`, not a user input.
- [ ] Pickup fuel level picker (`empty` … `full`) is wired and sent as `fuel_level_pickup`.
- [ ] Optional pickup odometer input on the booking create screen. Pre-fill from `vehicle.current_odometer`.
- [ ] Return/settlement screen polls `GET /bookings/{id}` after `complete` and renders any `payments[]` row with `type: "deposit_refund"` as a "Refunded" line.
- [ ] `missingBookingCategory` / `VehicleUnavailableException` / `CustomerBlacklistedException` error codes are surfaced to the user with friendly copy.
- [ ] `VehicleCategory` (body type enum: sedan/suv/…) is **not** confused with `BookingCategory` (commercial tier). Different concept, different resource.

Questions? Point the mobile dev at [MOBILE_API_GUIDE.md](MOBILE_API_GUIDE.md) for the full endpoint reference and [/docs/api](http://car-rental-web.test/docs/api) for the live OpenAPI spec (Scalar).

---

## Patch — Invoice `paid_amount` sync (2026-04-15)

### Short version

**No mobile code changes required.** The `POST /api/v1/payments` endpoint always worked correctly — it goes through `PaymentService::record` → `InvoiceService::markPaid`, which updates `invoice.paid_amount` and rolls `invoice.status` forward on every completed rental payment. The bug we just fixed lived only in the fleet operator's **web admin** flow, where staff recording payments through the admin UI left the invoice balance stuck at zero.

### Why it matters to the mobile team

If a mobile customer was looking at an invoice that had been partially or fully paid **via the admin UI**, they would have seen an incorrect `paid_amount` / `status` on `GET /api/v1/invoices/{id}`. That stale state was the backend's fault, not the app's. It's gone now — both the admin and API paths converge on the same source of truth.

### Behaviour guarantee (already true via the API, now also true via the admin)

After a successful `POST /api/v1/payments` with `type: "rental"` and `invoice_id: <id>`, the next `GET /api/v1/invoices/{id}` reflects:

- `paid_amount` incremented by the amount
- `status` rolled forward along the state machine:

```
no rental payments yet → sent      (or stays draft if it was draft)
0 < paid_amount < total → partially_paid
paid_amount >= total   → paid
```

No manual refresh or client-side recompute is needed. Just re-fetch the invoice after the payment call if you want the new state.

### Seed data note

`php artisan migrate:fresh --seed` on this build now produces **real `Payment` rows** for completed/active/confirmed demo bookings — previously the seeder cheated and stamped `invoice.paid_amount` directly. Practical impact on the mobile app:

- `GET /api/v1/bookings/{id}` → the `payments[]` array on completed demo bookings is no longer empty. It contains the deposit capture + rental settlement rows, so your customer's "payment history" screen has sensible data to render against.
- Deposits seeded for `active` and `confirmed` bookings as well, so the `deposit_summary` block (if you surface it) isn't empty on those either.

### One thing to know about our two sync paths

There are now two places that keep the invoice balance in sync with payments, and they use slightly different strategies:

| Called by | Function | Strategy |
|---|---|---|
| Mobile API (`POST /api/v1/payments`) | `InvoiceService::markPaid` | **Delta-based** — `paid_amount = current + amount` |
| Web admin (`POST /bookings/{id}/payments` via Inertia) | `BookingController::syncInvoiceFromPayments` | **Recompute** — `paid_amount = sum of all completed rental payments on the invoice` |

For normal flows they produce identical results. The recompute approach is more defensive (self-healing if payments get backfilled or amounts edited). A follow-up cleanup will migrate `markPaid` to the recompute strategy too, for parity — that's a pure backend refactor and won't change the API contract.

### Action items for the mobile team

- [ ] Nothing to ship. Verify your invoice detail screen refetches after a successful `POST /payments` (it should already).
- [ ] If you have a local snapshot of demo data from before this patch, wipe and reseed so `payments[]` is populated on completed bookings.
- [ ] If you've been displaying a "This invoice may be out of date — refresh" hint as a workaround for the stale state, you can remove it.
