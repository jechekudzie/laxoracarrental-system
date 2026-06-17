<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laxora Fleet Platform — Business Overview</title>
    <style>
        @page { margin: 32mm 22mm 22mm 22mm; }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 10.5px;
            line-height: 1.55;
            color: #1e293b;
        }

        /* Brand */
        .brand-mark {
            font-size: 18px;
            font-weight: bold;
            color: #4f46e5;
            letter-spacing: -0.4px;
        }
        .brand-sub {
            font-size: 7.5px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 2px;
        }

        /* Cover page */
        .cover {
            page-break-after: always;
            padding-top: 40mm;
        }
        .cover .kicker {
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 3px;
            color: #4f46e5;
        }
        .cover h1 {
            font-size: 34px;
            line-height: 1.1;
            font-weight: bold;
            color: #0f172a;
            margin-top: 18px;
            margin-bottom: 12px;
            letter-spacing: -1px;
        }
        .cover .tagline {
            font-size: 15px;
            color: #475569;
            margin-bottom: 28px;
            font-weight: 300;
        }
        .cover .divider {
            width: 60px;
            border-top: 3px solid #4f46e5;
            margin: 24px 0;
        }
        .cover .meta {
            font-size: 9px;
            color: #64748b;
            line-height: 1.8;
            margin-top: 40mm;
        }
        .cover .meta strong { color: #1e293b; font-weight: bold; }

        /* Page headers */
        h2 {
            font-size: 18px;
            font-weight: bold;
            color: #0f172a;
            margin-top: 24px;
            margin-bottom: 10px;
            letter-spacing: -0.3px;
        }
        h2:first-of-type { margin-top: 0; }
        h2 .section-num {
            font-size: 10px;
            color: #4f46e5;
            font-weight: bold;
            display: block;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 3px;
        }
        h3 {
            font-size: 12px;
            font-weight: bold;
            color: #1e293b;
            margin-top: 14px;
            margin-bottom: 6px;
        }

        p { margin-bottom: 9px; }
        p + p { margin-top: 0; }

        .lede {
            font-size: 11px;
            color: #334155;
            line-height: 1.65;
        }

        /* Pull quote / callout */
        .callout {
            background: #eef2ff;
            border-left: 3px solid #4f46e5;
            padding: 12px 14px;
            margin: 14px 0;
            color: #3730a3;
            font-size: 10px;
            line-height: 1.55;
        }
        .callout strong { color: #312e81; }

        .callout-muted {
            background: #f1f5f9;
            border-left: 3px solid #64748b;
            padding: 12px 14px;
            margin: 14px 0;
            color: #334155;
            font-size: 10px;
        }

        /* Lists */
        ul { margin: 6px 0 10px 18px; }
        ul li { margin-bottom: 4px; }

        /* Feature grid (2 columns using table) */
        .features {
            display: table;
            width: 100%;
            border-collapse: separate;
            border-spacing: 10px 0;
            margin: 12px 0;
        }
        .features .row {
            display: table-row;
        }
        .features .feature {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px 14px;
            font-size: 9.5px;
            line-height: 1.5;
        }
        .features .feature .title {
            font-weight: bold;
            color: #0f172a;
            font-size: 10.5px;
            margin-bottom: 3px;
        }
        .features .feature .title .tag {
            font-size: 7px;
            font-weight: bold;
            background: #4f46e5;
            color: #fff;
            padding: 1px 6px;
            border-radius: 3px;
            margin-left: 5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            vertical-align: middle;
        }
        .features .feature .title .tag.roadmap {
            background: #f59e0b;
        }

        /* Stat blocks */
        .stats {
            display: table;
            width: 100%;
            border-collapse: separate;
            border-spacing: 8px 0;
            margin: 10px 0 16px;
        }
        .stats .stat {
            display: table-cell;
            width: 25%;
            background: #0f172a;
            color: #fff;
            padding: 12px 14px;
            border-radius: 6px;
            text-align: center;
        }
        .stats .stat .num {
            font-size: 18px;
            font-weight: bold;
            display: block;
            color: #a5b4fc;
        }
        .stats .stat .lbl {
            font-size: 7.5px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 4px;
            color: #cbd5e1;
        }

        /* Pricing table */
        .pricing {
            display: table;
            width: 100%;
            border-collapse: separate;
            border-spacing: 8px 0;
            margin: 10px 0;
        }
        .pricing .tier {
            display: table-cell;
            width: 25%;
            vertical-align: top;
            background: #fff;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 16px 14px;
            font-size: 9px;
        }
        .pricing .tier.featured {
            border: 2px solid #4f46e5;
            background: #eef2ff;
        }
        .pricing .tier .name {
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #4f46e5;
        }
        .pricing .tier .price {
            font-size: 18px;
            font-weight: bold;
            color: #0f172a;
            margin: 6px 0 2px;
        }
        .pricing .tier .price .unit {
            font-size: 9px;
            font-weight: normal;
            color: #64748b;
        }
        .pricing .tier .fit {
            font-size: 8px;
            color: #64748b;
            margin-bottom: 8px;
            min-height: 28px;
        }
        .pricing .tier ul {
            margin-left: 14px;
            font-size: 8.5px;
            line-height: 1.5;
            color: #334155;
        }
        .pricing .tier ul li { margin-bottom: 3px; }

        /* Flow table */
        .flow {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            font-size: 9.5px;
        }
        .flow th {
            background: #f1f5f9;
            text-align: left;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #475569;
            padding: 8px 10px;
            border-bottom: 1px solid #cbd5e1;
        }
        .flow td {
            padding: 10px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
        }
        .flow td .step-num {
            display: inline-block;
            background: #4f46e5;
            color: #fff;
            width: 16px;
            height: 16px;
            text-align: center;
            border-radius: 50%;
            font-size: 8px;
            font-weight: bold;
            line-height: 16px;
            margin-right: 5px;
        }

        /* Footer */
        .page-footer {
            position: fixed;
            bottom: -16mm;
            left: 0;
            right: 0;
            font-size: 7.5px;
            color: #94a3b8;
            text-align: center;
            padding-top: 8px;
            border-top: 1px solid #e2e8f0;
        }

        .page-break { page-break-before: always; }
        .subtle { color: #64748b; }
        .mono { font-family: 'DejaVu Sans Mono', monospace; font-size: 9px; }
    </style>
</head>
<body>

<div class="page-footer">
    Laxora Fleet Rental Platform · Business Overview · Page&nbsp;<span class="pagenum"></span>
</div>

{{-- ==================================================================== --}}
{{-- Cover                                                                 --}}
{{-- ==================================================================== --}}
<div class="cover">
    <div class="brand-mark">Laxora</div>
    <div class="brand-sub">Fleet Rental Platform</div>

    <div class="divider"></div>

    <div class="kicker">Business Overview · {{ $date }}</div>
    <h1>A fleet-first rental<br>platform built for scale.</h1>
    <p class="tagline">
        A complete booking, deposit, inspection and billing system for car rental operators.
        Single-tenant today. Architected to go multi-tenant SaaS.
    </p>

    <div class="divider"></div>

    <div class="meta">
        <strong>Prepared by</strong> &nbsp;·&nbsp; Laxora Engineering<br>
        <strong>Document</strong> &nbsp;·&nbsp; Platform Overview v1.0<br>
        <strong>Date</strong> &nbsp;·&nbsp; {{ $date }}<br>
        <strong>Audience</strong> &nbsp;·&nbsp; Operators, investors, technology partners
    </div>
</div>

{{-- ==================================================================== --}}
{{-- 1. Executive Summary                                                  --}}
{{-- ==================================================================== --}}
<h2><span class="section-num">01 · Executive Summary</span>A fleet platform, not just a booking form.</h2>

<p class="lede">
    Laxora is a full-stack car rental management platform built from the ground up around the operational reality
    of running a fleet — not a generic booking widget bolted onto a spreadsheet. Every lifecycle step a rental
    business actually does is a first-class citizen: commercial tiering, deposits, pickup and return inspections,
    mileage reconciliation, fuel policy, damage handling, invoicing, refunds, customer ratings, compliance tracking,
    and a mobile app for self-service.
</p>

<p>
    The platform currently runs as a single-operator deployment (Laxora's own rental fleet in Harare), but the
    data model, permission system, and API surface are deliberately structured so that a multi-tenant SaaS rollout
    is a schema change away, not a rewrite.
</p>

<div class="stats">
    <div class="stat"><span class="num">30+</span><span class="lbl">API endpoints</span></div>
    <div class="stat"><span class="num">5</span><span class="lbl">User roles</span></div>
    <div class="stat"><span class="num">40+</span><span class="lbl">Permissions</span></div>
    <div class="stat"><span class="num">99</span><span class="lbl">Automated tests</span></div>
</div>

<h3>The opportunity</h3>
<p>
    Most rental operators in this market run on Excel, WhatsApp threads, and a phone tree. The ones that do use
    software pay for generic tools built for European or American workflows with payment rails (Stripe, PayPal)
    that don't work locally — no EcoCash, no OneMoney, no ZWL/USD split, no local compliance tracking. Laxora is
    the opposite: built in-market, built for the operational tempo of a Harare-sized fleet, and extensible.
</p>

{{-- ==================================================================== --}}
{{-- 2. The Problem                                                        --}}
{{-- ==================================================================== --}}
<h2><span class="section-num">02 · The Problem</span>Six things every rental operator gets wrong.</h2>

<ul>
    <li>
        <strong>Deposit reconciliation is manual and error-prone.</strong> Mileage overage,
        fuel shortfall, damage — most shops do it with a calculator and a pen, refund too much, and eat the
        difference every month.
    </li>
    <li>
        <strong>Booking categories aren't a first-class concept.</strong> Commercial terms (deposit, km allowance,
        excess rate, fuel policy) usually live in the operator's head or in a printed rate card. Customers get
        inconsistent quotes; staff waste time negotiating.
    </li>
    <li>
        <strong>Vehicle lifecycle data is fragmented.</strong> Fuel receipts in a drawer, service logs in a
        mechanic's WhatsApp chat, licence expiry dates on a wall calendar. No single source of truth means no
        profitability per vehicle.
    </li>
    <li>
        <strong>Customer risk is invisible.</strong> No rating history, no blacklist, no licence expiry check —
        so bad customers rebook after a fight and good customers get the same deposit as first-timers.
    </li>
    <li>
        <strong>Pickup and return inspections are a liability.</strong> Handwritten checklists disappear. Photos
        live on a staff member's personal phone. Disputes go unresolved because evidence is lost.
    </li>
    <li>
        <strong>Customers can't self-serve.</strong> Every enquiry is a phone call. Every booking confirmation is
        a WhatsApp forward. The operator becomes the bottleneck.
    </li>
</ul>

<div class="callout">
    <strong>Our thesis:</strong> none of these are exotic problems. They're just problems nobody built software for
    in this market. Laxora does.
</div>

{{-- ==================================================================== --}}
{{-- 3. The Solution — Features                                            --}}
{{-- ==================================================================== --}}
<h2><span class="section-num">03 · The Solution</span>What the platform actually does today.</h2>

<p>
    Every feature below is shipping, tested, and running in production. Items marked
    <span style="background:#f59e0b;color:#fff;font-size:7px;padding:1px 5px;border-radius:3px;text-transform:uppercase;letter-spacing:0.5px;font-weight:bold;">Roadmap</span>
    are planned extensions.
</p>

<div class="features">
    <div class="row">
        <div class="feature">
            <div class="title">Booking Categories</div>
            Commercial tiers (Small Car, Medium Sedan, SUV/Bakkie, Premium/Luxury) own the deposit, km allowance,
            excess rate, and fuel policy. Assign a vehicle to a tier; every booking on that vehicle uses those
            terms automatically.
        </div>
        <div class="feature">
            <div class="title">Deposit Reconciliation</div>
            On return, the server deducts mileage overage, fuel shortfall, and damage from the deposit
            automatically and creates a refund payment for the surplus. No calculator. No disputes.
        </div>
    </div>
    <div class="row">
        <div class="feature">
            <div class="title">Pickup / Return Inspections</div>
            Structured checklists with photos, fuel level, odometer, and customer signature. Stored against the
            booking, diffable between pickup and return for damage claims.
        </div>
        <div class="feature">
            <div class="title">Fuel Policy</div>
            Track pickup and return fuel level in quarter-tank units. Charge customers the category's per-level
            rate for any shortfall. Surplus fuel is never credited back — protects the operator from abuse.
        </div>
    </div>
    <div class="row">
        <div class="feature">
            <div class="title">Customer Profiles & Ratings</div>
            Every customer carries a licence number, expiry, emergency contact, and a five-dimension rating from
            past bookings (condition, timeliness, payment, communication, care of vehicle).
        </div>
        <div class="feature">
            <div class="title">Blacklist & Greylist</div>
            One click to flag a customer. The booking creation flow refuses to serve blacklisted customers with a
            clear reason. Greylist lets you keep serving but with a warning.
        </div>
    </div>
    <div class="row">
        <div class="feature">
            <div class="title">Mobile Self-Booking</div>
            Native customer app: browse availability (no login), register, book, pay deposit, track booking
            status, view deposit refund after return. Full API-first design.
        </div>
        <div class="feature">
            <div class="title">Fleet Admin Dashboard</div>
            Inertia React SPA for operators: vehicles, bookings, invoices, compliance, maintenance log, service
            providers, finance dashboard, and full reporting — all sub-100ms on Herd.
        </div>
    </div>
    <div class="row">
        <div class="feature">
            <div class="title">Compliance & Licences</div>
            Track ZINARA, ZBC, insurance, fitness, and custom licences per vehicle. Automatic expiry warnings
            before a vehicle rolls out non-compliant.
        </div>
        <div class="feature">
            <div class="title">Maintenance Log</div>
            Record services, breakdowns, accidents. Link to service providers (mechanic, tow, panelbeater, parts,
            insurance). Each entry carries labour + parts + tow cost plus downtime days for PnL.
        </div>
    </div>
    <div class="row">
        <div class="feature">
            <div class="title">Vehicle Costs / Errands</div>
            Log fuel, parking, tolls, fines, car wash — anything the vehicle incurs outside a rental. Recording an
            odometer on an errand auto-bumps the vehicle's current reading.
        </div>
        <div class="feature">
            <div class="title">Outsourced Fleet</div>
            Built-in support for third-party owned vehicles. Track the owner, payout rate, and Laxora markup.
            Each booking computes both the customer price and the owner payout.
        </div>
    </div>
    <div class="row">
        <div class="feature">
            <div class="title">Local Payment Methods</div>
            Cash, EcoCash, OneMoney, bank transfer, card, and customer wallet. Paynow gateway integration hooks
            for automated mobile money confirmations.
        </div>
        <div class="feature">
            <div class="title">Invoicing & Receipts</div>
            Every completed booking auto-generates an invoice with a downloadable PDF. Every payment emits a
            printable receipt. Partial payments roll the invoice from sent → partially_paid → paid.
        </div>
    </div>
    <div class="row">
        <div class="feature">
            <div class="title">OpenAPI / Scalar Docs</div>
            Every API endpoint is auto-documented. A live Scalar UI lets mobile developers explore, authenticate,
            and test the API against any environment.
        </div>
        <div class="feature">
            <div class="title">Multi-Tenant SaaS <span class="tag roadmap">Roadmap</span></div>
            Tenant-scoped data model, subdomain routing, tenant-level billing, branded customer app per tenant.
            Architected today for a small change, not a rewrite.
        </div>
    </div>
</div>

{{-- ==================================================================== --}}
{{-- 4. Booking Flow                                                       --}}
{{-- ==================================================================== --}}
<div class="page-break"></div>

<h2><span class="section-num">04 · How It Works</span>The booking lifecycle end-to-end.</h2>

<p>
    Every rental on the platform moves through the same state machine, with real money math at two specific
    points (creation and completion). No ad-hoc "how much should we charge?" conversations.
</p>

<table class="flow">
    <thead>
        <tr>
            <th style="width:22%">Step</th>
            <th style="width:14%">Status</th>
            <th>What happens</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><span class="step-num">1</span><strong>Browse</strong><br><span class="subtle">Customer or staff</span></td>
            <td>n/a</td>
            <td>
                Customer (via mobile app) or staff (via admin) searches availability. Vehicles show daily rate +
                category terms (deposit, km/day, excess rate, fuel charge). Unavailable vehicles are excluded.
            </td>
        </tr>
        <tr>
            <td><span class="step-num">2</span><strong>Create</strong><br><span class="subtle">Booking created</span></td>
            <td><span class="mono">pending</span></td>
            <td>
                Server snapshots <span class="mono">daily_rate</span>, <span class="mono">km_allowance</span>,
                <span class="mono">excess_km_rate</span>, and <span class="mono">deposit_amount</span> from the
                vehicle's category. Computes <span class="mono">base_amount = rental_days × daily_rate</span>.
                Customer sees <strong>hire fee + deposit = total due now</strong>.
            </td>
        </tr>
        <tr>
            <td><span class="step-num">3</span><strong>Confirm</strong><br><span class="subtle">Staff approves</span></td>
            <td><span class="mono">confirmed</span></td>
            <td>
                Booking agent reviews and confirms. Vehicle is now reserved for those dates — no one else can
                book it. Customer gets a confirmation notification.
            </td>
        </tr>
        <tr>
            <td><span class="step-num">4</span><strong>Deposit captured</strong><br><span class="subtle">Payment recorded</span></td>
            <td><span class="mono">confirmed</span></td>
            <td>
                Deposit and (optionally) first-day hire fee captured via EcoCash, cash, or bank transfer. Linked to
                the booking. Invoice generated and marked <span class="mono">sent</span>.
            </td>
        </tr>
        <tr>
            <td><span class="step-num">5</span><strong>Activate</strong><br><span class="subtle">Customer picks up</span></td>
            <td><span class="mono">active</span></td>
            <td>
                Staff records pickup odometer + fuel level, captures pickup inspection (photos, checklist, customer
                signature). Vehicle status flips to <span class="mono">rented</span>.
            </td>
        </tr>
        <tr>
            <td><span class="step-num">6</span><strong>Complete</strong><br><span class="subtle">Customer returns</span></td>
            <td><span class="mono">completed</span></td>
            <td>
                Staff records return odometer + fuel level + return inspection. Server computes mileage overage +
                fuel charge + damage charge, deducts from deposit, creates a <span class="mono">deposit_refund</span>
                payment for any surplus, or adds the shortfall to the invoice.
            </td>
        </tr>
        <tr>
            <td><span class="step-num">7</span><strong>Settle</strong><br><span class="subtle">Invoice closed</span></td>
            <td><span class="mono">paid</span></td>
            <td>
                Any invoice balance is paid off; invoice rolls to <span class="mono">paid</span>. Customer leaves a
                rating on the rental experience; staff leaves a rating on the customer (reputation for next time).
            </td>
        </tr>
    </tbody>
</table>

<div class="callout-muted">
    <strong>Worked example.</strong> 3-day Honda Fit rental (Small Car tier): daily rate $45, 200 km/day allowance,
    $0.50/excess km, $15 per quarter-tank short, $150 deposit. Customer pays <strong>$135 hire + $150 deposit = $285
    on pickup</strong>. Drives 800 km and returns at half tank. Overage: (800 − 600) × $0.50 = $100. Fuel: 2 levels
    short × $15 = $30. Deductions: $130. Refund: $150 − $130 = <strong>$20 auto-refunded</strong>. Final customer
    cost: $265. Zero negotiation. Zero calculator time.
</div>

{{-- ==================================================================== --}}
{{-- 5. Multi-Tenant                                                       --}}
{{-- ==================================================================== --}}
<h2><span class="section-num">05 · Multi-Tenant Future</span>Why SaaS is the next chapter.</h2>

<p>
    Laxora is currently deployed as a single-tenant installation serving one operator: Laxora Rental
    Services. The platform was built that way on purpose — prove the model end-to-end for one real business before
    generalising. The proof is in the platform you're reading about.
</p>

<p>
    The next phase is multi-tenant SaaS: one Laxora codebase hosting multiple independent rental operators,
    each with their own fleet, customers, staff, branding, and billing.
</p>

<h3>What multi-tenant unlocks for operators</h3>
<ul>
    <li><strong>Sign up in 10 minutes.</strong> Pick a subdomain, add your first vehicle, go live. No install, no sysadmin, no dev team.</li>
    <li><strong>Pay only for what you use.</strong> Per-vehicle or per-booking pricing tiers instead of six-figure software licenses.</li>
    <li><strong>Branded mobile app, zero app-store work.</strong> Customers see your logo and colours. Laxora ships updates to everyone.</li>
    <li><strong>Full data isolation.</strong> Row-level tenant scoping — no accidental data leakage between operators.</li>
    <li><strong>Shared learnings, shared upgrades.</strong> Every feature Laxora ships lands on day one for every operator on the platform.</li>
</ul>

<h3>What's already in place to make this a short path</h3>
<ul>
    <li>
        <strong>Clean permission system.</strong> Roles (super-admin, fleet-manager, booking-agent, finance,
        customer) and fine-grained permissions are already tenant-ready — add a tenant_id scope and role inheritance
        follows.
    </li>
    <li>
        <strong>Domain-driven services.</strong> Business logic lives in <span class="mono">BookingService</span>,
        <span class="mono">PricingService</span>, <span class="mono">InvoiceService</span>,
        <span class="mono">PaymentService</span>. No controller has a calculator in it, which means adding a
        tenant layer doesn't break the math.
    </li>
    <li>
        <strong>API-first everything.</strong> The mobile app and the admin dashboard both talk to the same v1
        REST API. A tenant-branded mobile app is a config swap, not a rewrite.
    </li>
    <li>
        <strong>Tested pricing engine.</strong> 99 automated tests protect the money math. A tenant-scoping
        refactor stays safe because the tests tell you immediately if anything moves.
    </li>
</ul>

{{-- ==================================================================== --}}
{{-- 6. Pricing tiers                                                      --}}
{{-- ==================================================================== --}}
<div class="page-break"></div>

<h2><span class="section-num">06 · Pricing Model</span>Tiered pricing for multi-tenant rollout.</h2>

<p>
    Indicative SaaS pricing once multi-tenant rollout is complete. Everything is in USD and subject to local tax.
    All tiers include the mobile customer app, unlimited bookings, unlimited staff accounts, and daily backups.
</p>

<div class="pricing">
    <div class="tier">
        <div class="name">Starter</div>
        <div class="price">$49<span class="unit"> / month</span></div>
        <div class="fit">For new operators with up to 10 vehicles.</div>
        <ul>
            <li>Up to 10 vehicles</li>
            <li>Unlimited bookings</li>
            <li>3 staff accounts</li>
            <li>Email support</li>
            <li>Shared mobile app</li>
        </ul>
    </div>
    <div class="tier featured">
        <div class="name">Professional</div>
        <div class="price">$149<span class="unit"> / month</span></div>
        <div class="fit">For growing fleets — the sweet spot.</div>
        <ul>
            <li>Up to 50 vehicles</li>
            <li>Unlimited bookings</li>
            <li>10 staff accounts</li>
            <li>Priority support</li>
            <li>Branded mobile app</li>
            <li>Advanced reports</li>
            <li>API access</li>
        </ul>
    </div>
    <div class="tier">
        <div class="name">Fleet</div>
        <div class="price">$499<span class="unit"> / month</span></div>
        <div class="fit">For multi-location operators with 50+ vehicles.</div>
        <ul>
            <li>Up to 200 vehicles</li>
            <li>Unlimited staff</li>
            <li>Dedicated support</li>
            <li>White-labelled mobile app</li>
            <li>Custom report builder</li>
            <li>Webhooks</li>
        </ul>
    </div>
    <div class="tier">
        <div class="name">Enterprise</div>
        <div class="price">Contact<span class="unit"> / custom</span></div>
        <div class="fit">For 200+ vehicles, on-prem, or bespoke integrations.</div>
        <ul>
            <li>Unlimited everything</li>
            <li>SLA + 24/7 support</li>
            <li>On-prem or dedicated cloud</li>
            <li>Custom feature development</li>
            <li>Single sign-on</li>
        </ul>
    </div>
</div>

<h3>Unit economics for the operator</h3>
<p>
    Most rental operators lose <strong>$150–$400 per month</strong> on deposit reconciliation errors alone —
    refunding too much, forgetting to charge mileage overage, absorbing fuel shortfalls. The Professional tier pays
    for itself on <strong>the first two bookings it reconciles correctly</strong>. Everything after that is pure
    margin recovery.
</p>

{{-- ==================================================================== --}}
{{-- 7. Technology                                                         --}}
{{-- ==================================================================== --}}
<h2><span class="section-num">07 · Technology</span>Boring tech, fast iteration.</h2>

<p>
    Laxora is built on mainstream, boring, well-documented technology chosen deliberately so any Laravel or
    React developer can pick up the codebase and be productive on day one. No custom framework, no proprietary
    runtime, no vendor lock-in.
</p>

<table style="width:100%;border-collapse:collapse;margin-top:8px;">
    <tr>
        <td style="width:30%;padding:6px 10px;border-bottom:1px solid #e2e8f0;font-weight:bold;color:#475569;font-size:9px;text-transform:uppercase;letter-spacing:1px;">Backend</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;">Laravel 13 · PHP 8.4 · MySQL · Sanctum · Spatie Permission · DomPDF · Scramble OpenAPI · Scalar</td>
    </tr>
    <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-weight:bold;color:#475569;font-size:9px;text-transform:uppercase;letter-spacing:1px;">Admin Web</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;">Inertia v3 · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui · Wayfinder · Vite</td>
    </tr>
    <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-weight:bold;color:#475569;font-size:9px;text-transform:uppercase;letter-spacing:1px;">Mobile</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;">React Native (Expo) · TanStack Query · Zustand · EAS Build · OTA updates</td>
    </tr>
    <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-weight:bold;color:#475569;font-size:9px;text-transform:uppercase;letter-spacing:1px;">Quality</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;">99 automated tests · PHPStan · Pint · ESLint · TypeScript strict · GitHub Actions CI</td>
    </tr>
    <tr>
        <td style="padding:6px 10px;font-weight:bold;color:#475569;font-size:9px;text-transform:uppercase;letter-spacing:1px;">Payments</td>
        <td style="padding:6px 10px;">Paynow (EcoCash, OneMoney) · Cash · Bank transfer · Card · Customer wallet</td>
    </tr>
</table>

{{-- ==================================================================== --}}
{{-- 8. Why Laxora                                                      --}}
{{-- ==================================================================== --}}
<h2><span class="section-num">08 · Why Laxora</span>The case for building this, not buying it.</h2>

<p>
    The global rental management software market is dominated by products built for North American and European
    operators: monthly lease rates in euros, Stripe-based payments, LTD/Ltd compliance workflows, and zero support
    for split-currency billing. These platforms cost thousands of dollars per month, require weeks of setup, and
    still don't let a customer pay a deposit on EcoCash.
</p>

<p>
    Laxora is the first rental platform built <em>from</em> this market, <em>for</em> this market. It speaks
    ZWL and USD fluently, supports local mobile money out of the box, tracks ZINARA and insurance as first-class
    compliance items, and is run by a team that uses it for their own rental fleet every single day — meaning
    every friction, every edge case, every "oh we need this too" ends up in the backlog by the next sprint.
</p>

<div class="callout">
    <strong>We use what we sell.</strong> Laxora Rental Services runs its entire fleet on this platform. Every
    deposit reconciled, every inspection logged, every invoice paid — runs through the same code we'd ship to
    another operator tomorrow. That's the best product feedback loop in software.
</div>

{{-- ==================================================================== --}}
{{-- 9. CTA                                                                --}}
{{-- ==================================================================== --}}
<h2><span class="section-num">09 · What's Next</span>Let's talk.</h2>

<p>Three ways to engage, in increasing order of commitment:</p>

<ul>
    <li>
        <strong>See the live platform.</strong> We'll walk you through the admin dashboard, the mobile app, and
        the booking → deposit reconciliation flow on real data. 30 minutes, no slides.
    </li>
    <li>
        <strong>Pilot with your fleet.</strong> Spin up a single-tenant deployment with your vehicles and
        customers. Run it in parallel with your current system for a month. No cost, no commitment.
    </li>
    <li>
        <strong>Partner on the multi-tenant rollout.</strong> Operators willing to be launch partners get
        founding-member pricing locked in for the first year and a direct line to the engineering roadmap.
    </li>
</ul>

<div class="callout" style="margin-top:24px;">
    <strong>Contact:</strong> Laxora Engineering<br>
    <span style="color:#475569;">Email: <span class="mono">hello@laxora.co.zw</span></span><br>
    <span style="color:#475569;">Platform docs: <span class="mono">{{ $docsUrl }}</span></span><br>
    <span style="color:#475569;">Live API: <span class="mono">{{ $apiUrl }}</span></span>
</div>

<p style="text-align:center;margin-top:28px;color:#94a3b8;font-size:8px;">
    Document generated {{ $date }} · Laxora Fleet Rental Platform v1.0 · Prepared for business review.
</p>

</body>
</html>
