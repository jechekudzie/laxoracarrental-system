<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice {{ $invoice->number }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 10px;
            line-height: 1.4;
            color: #1e293b;
            background: #fff;
        }

        .container {
            max-width: 100%;
            padding: 30px 40px;
        }

        /* Header */
        .header {
            display: table;
            width: 100%;
            border-bottom: 3px solid #4f46e5;
            padding-bottom: 16px;
            margin-bottom: 24px;
        }

        .header-left {
            display: table-cell;
            vertical-align: top;
            width: 60%;
        }

        .header-right {
            display: table-cell;
            vertical-align: top;
            text-align: right;
        }

        .brand {
            font-size: 22px;
            font-weight: bold;
            color: #4f46e5;
            letter-spacing: -0.5px;
        }

        .brand-sub {
            font-size: 8px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 2px;
        }

        .brand-contact {
            font-size: 9px;
            color: #64748b;
            margin-top: 8px;
            line-height: 1.5;
        }

        .doc-label {
            font-size: 11px;
            font-weight: bold;
            color: #1e293b;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .doc-number {
            font-size: 14px;
            color: #4f46e5;
            font-weight: bold;
            margin-top: 2px;
            font-family: 'DejaVu Sans Mono', monospace;
        }

        .status-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 10px;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 6px;
        }

        .status-paid { background: #d1fae5; color: #065f46; }
        .status-sent { background: #dbeafe; color: #1e40af; }
        .status-partially_paid { background: #fef3c7; color: #92400e; }
        .status-overdue { background: #fee2e2; color: #991b1b; }
        .status-draft { background: #f1f5f9; color: #475569; }
        .status-cancelled { background: #e2e8f0; color: #64748b; }

        /* Two column layouts */
        .two-column {
            display: table;
            width: 100%;
            margin-bottom: 16px;
        }

        .column {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding-right: 12px;
        }

        .column:last-child {
            padding-right: 0;
            padding-left: 12px;
        }

        .section-title {
            font-size: 9px;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
            margin-bottom: 8px;
        }

        .info-row {
            display: table;
            width: 100%;
            margin-bottom: 4px;
        }

        .info-label {
            display: table-cell;
            color: #64748b;
            width: 40%;
            font-size: 9px;
        }

        .info-value {
            display: table-cell;
            font-weight: 500;
            text-align: right;
            font-size: 9px;
        }

        .customer-name {
            font-size: 13px;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 4px;
        }

        .customer-detail {
            font-size: 9px;
            color: #64748b;
            margin-top: 1px;
        }

        /* Booking strip */
        .booking-strip {
            background: #f8fafc;
            border-left: 3px solid #4f46e5;
            padding: 10px 14px;
            margin-bottom: 18px;
        }

        .booking-ref {
            font-family: 'DejaVu Sans Mono', monospace;
            font-weight: bold;
            font-size: 11px;
            color: #0f172a;
        }

        .booking-vehicle {
            font-size: 10px;
            color: #475569;
            margin-top: 2px;
        }

        .reg-plate {
            display: inline-block;
            background: #e2e8f0;
            padding: 1px 6px;
            border-radius: 3px;
            font-family: 'DejaVu Sans Mono', monospace;
            font-size: 9px;
        }

        .booking-dates {
            font-size: 9px;
            color: #64748b;
            margin-top: 3px;
        }

        /* Items table */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
        }

        .items-table thead th {
            background: #f1f5f9;
            text-align: left;
            font-size: 9px;
            font-weight: bold;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 10px 8px;
            border-bottom: 2px solid #cbd5e1;
        }

        .items-table thead th.text-right {
            text-align: right;
        }

        .items-table tbody td {
            padding: 10px 8px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 10px;
            vertical-align: top;
        }

        .items-table tbody td.text-right {
            text-align: right;
        }

        .items-table tbody td.amount {
            font-weight: 600;
            color: #0f172a;
        }

        /* Totals */
        .totals-wrap {
            display: table;
            width: 100%;
            margin-top: 10px;
        }

        .totals-spacer {
            display: table-cell;
            width: 55%;
        }

        .totals-box {
            display: table-cell;
            width: 45%;
            background: #f8fafc;
            padding: 14px;
            border-left: 3px solid #4f46e5;
        }

        .totals-row {
            display: table;
            width: 100%;
            margin-bottom: 4px;
        }

        .totals-label {
            display: table-cell;
            color: #64748b;
            font-size: 9px;
        }

        .totals-value {
            display: table-cell;
            text-align: right;
            font-size: 9px;
            font-weight: 500;
        }

        .totals-grand {
            margin-top: 6px;
            padding-top: 6px;
            border-top: 1px solid #cbd5e1;
        }

        .totals-grand .totals-label,
        .totals-grand .totals-value {
            font-size: 12px;
            font-weight: bold;
            color: #0f172a;
        }

        .totals-paid .totals-label,
        .totals-paid .totals-value {
            color: #059669;
        }

        .balance-box {
            margin-top: 8px;
            padding: 10px;
            background: #d1fae5;
            border-radius: 4px;
            text-align: center;
        }

        .balance-box.due {
            background: #fee2e2;
        }

        .balance-label {
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #065f46;
            font-weight: bold;
        }

        .balance-box.due .balance-label {
            color: #991b1b;
        }

        .balance-amount {
            font-size: 18px;
            font-weight: bold;
            color: #065f46;
            margin-top: 2px;
        }

        .balance-box.due .balance-amount {
            color: #991b1b;
        }

        /* Notes */
        .notes {
            margin-top: 20px;
            padding: 12px;
            background: #f8fafc;
            border-left: 3px solid #cbd5e1;
        }

        .notes-title {
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #64748b;
            font-weight: bold;
            margin-bottom: 4px;
        }

        .notes-body {
            font-size: 9px;
            color: #475569;
        }

        /* Footer */
        .footer {
            margin-top: 24px;
            padding-top: 14px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 8px;
            color: #64748b;
        }

        .footer-thanks {
            font-size: 10px;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 4px;
        }

        .footer-contact {
            margin-top: 6px;
        }

        /* Mini receipts */
        .receipts-section {
            margin-top: 22px;
            page-break-inside: avoid;
        }

        .receipts-title {
            font-size: 9px;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }

        .receipt-grid {
            width: 100%;
            border-collapse: separate;
            border-spacing: 6px;
        }

        .receipt-card {
            vertical-align: top;
            width: 50%;
            background: #fff;
            border: 1px dashed #94a3b8;
            padding: 10px 12px;
        }

        .receipt-card.refund {
            border-color: #c084fc;
            background: #faf5ff;
        }

        .receipt-card.payment {
            border-color: #6ee7b7;
            background: #f0fdf4;
        }

        .receipt-head {
            display: table;
            width: 100%;
            border-bottom: 1px dashed #cbd5e1;
            padding-bottom: 6px;
            margin-bottom: 6px;
        }

        .receipt-brand {
            display: table-cell;
            font-size: 9px;
            font-weight: bold;
            color: #1e293b;
        }

        .receipt-brand-sub {
            font-size: 7px;
            color: #64748b;
            font-weight: normal;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .receipt-ref {
            display: table-cell;
            text-align: right;
            font-family: 'DejaVu Sans Mono', monospace;
            font-size: 8px;
            font-weight: bold;
            color: #047857;
        }

        .receipt-card.refund .receipt-ref {
            color: #7e22ce;
        }

        .receipt-amount-row {
            display: table;
            width: 100%;
            margin-bottom: 6px;
        }

        .receipt-amount-label {
            display: table-cell;
            font-size: 7px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            font-weight: bold;
        }

        .receipt-amount-value {
            display: table-cell;
            text-align: right;
            font-size: 14px;
            font-weight: bold;
            color: #047857;
        }

        .receipt-card.refund .receipt-amount-value {
            color: #7e22ce;
        }

        .receipt-meta {
            font-size: 8px;
            color: #64748b;
            line-height: 1.5;
        }

        .receipt-meta .meta-label {
            display: inline-block;
            width: 48px;
            color: #94a3b8;
        }

        .receipt-footer {
            margin-top: 6px;
            padding-top: 5px;
            border-top: 1px dashed #cbd5e1;
            font-size: 7px;
            color: #94a3b8;
            text-align: center;
        }
    </style>
</head>
<body>
<div class="container">

    <!-- Header -->
    <div class="header">
        <div class="header-left">
            <div class="brand">Laxora</div>
            <div class="brand-sub">Car Rental</div>
            <div class="brand-contact">
                Harare Office · Zimbabwe<br>
                +263 77 000 0000 · hello@laxora.co.zw
            </div>
        </div>
        <div class="header-right">
            <div class="doc-label">Invoice</div>
            <div class="doc-number">{{ $invoice->number }}</div>
            <div class="status-badge status-{{ $invoice->status->value }}">
                {{ ucfirst(str_replace('_', ' ', $invoice->status->value)) }}
            </div>
        </div>
    </div>

    <!-- Bill To + Dates -->
    <div class="two-column">
        <div class="column">
            <div class="section-title">Billed To</div>
            <div class="customer-name">{{ $invoice->customer->name }}</div>
            <div class="customer-detail">{{ $invoice->customer->phone }}</div>
            @if ($invoice->customer->email)
                <div class="customer-detail">{{ $invoice->customer->email }}</div>
            @endif
        </div>
        <div class="column">
            <div class="section-title">Invoice Dates</div>
            <div class="info-row">
                <span class="info-label">Issued</span>
                <span class="info-value">
                    {{ $invoice->issued_at ? \Carbon\Carbon::parse($invoice->issued_at)->format('d M Y') : '—' }}
                </span>
            </div>
            <div class="info-row">
                <span class="info-label">Due</span>
                <span class="info-value">
                    {{ $invoice->due_at ? \Carbon\Carbon::parse($invoice->due_at)->format('d M Y') : '—' }}
                </span>
            </div>
        </div>
    </div>

    <!-- Booking -->
    @if ($invoice->booking)
        <div class="booking-strip">
            <div class="section-title" style="border: 0; padding: 0; margin-bottom: 4px;">Rental Details</div>
            <div class="booking-ref">{{ $invoice->booking->reference }}</div>
            <div class="booking-vehicle">
                {{ $invoice->booking->vehicle->make }} {{ $invoice->booking->vehicle->model }}
                <span class="reg-plate">{{ $invoice->booking->vehicle->reg_plate }}</span>
            </div>
            <div class="booking-dates">
                {{ \Carbon\Carbon::parse($invoice->booking->pickup_datetime)->format('d M Y') }}
                →
                {{ \Carbon\Carbon::parse($invoice->booking->return_datetime)->format('d M Y') }}
            </div>
        </div>
    @endif

    <!-- Line Items -->
    <table class="items-table">
        <thead>
            <tr>
                <th width="55%">Description</th>
                <th width="10%" class="text-right">Qty</th>
                <th width="17%" class="text-right">Unit Price</th>
                <th width="18%" class="text-right">Amount</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($invoice->line_items ?? [] as $item)
                <tr>
                    <td>{{ $item['description'] }}</td>
                    <td class="text-right">{{ $item['quantity'] }}</td>
                    <td class="text-right">${{ number_format((float) $item['unit_price'], 2) }}</td>
                    <td class="text-right amount">${{ number_format((float) $item['amount'], 2) }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="4" style="text-align: center; color: #94a3b8; padding: 16px;">No line items</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <!-- Totals -->
    @php
        $balance = (float) $invoice->total - (float) $invoice->paid_amount;
        $isPaid = $balance <= 0;
    @endphp
    <div class="totals-wrap">
        <div class="totals-spacer">&nbsp;</div>
        <div class="totals-box">
            <div class="totals-row">
                <span class="totals-label">Subtotal</span>
                <span class="totals-value">${{ number_format((float) $invoice->subtotal, 2) }}</span>
            </div>
            @if ((float) $invoice->tax > 0)
                <div class="totals-row">
                    <span class="totals-label">Tax</span>
                    <span class="totals-value">${{ number_format((float) $invoice->tax, 2) }}</span>
                </div>
            @endif
            <div class="totals-row totals-grand">
                <span class="totals-label">Total</span>
                <span class="totals-value">${{ number_format((float) $invoice->total, 2) }}</span>
            </div>
            <div class="totals-row totals-paid">
                <span class="totals-label">Paid</span>
                <span class="totals-value">−${{ number_format((float) $invoice->paid_amount, 2) }}</span>
            </div>
            <div class="balance-box {{ $isPaid ? '' : 'due' }}">
                <div class="balance-label">{{ $isPaid ? 'Settled' : 'Balance Due' }}</div>
                <div class="balance-amount">${{ number_format(abs($balance), 2) }}</div>
            </div>
        </div>
    </div>

    <!-- Payments -->
    @if ($invoice->payments->count() > 0)
        <div style="margin-top: 22px;">
            <div class="section-title">Payments Received</div>
            <table class="items-table">
                <thead>
                    <tr>
                        <th width="22%">Reference</th>
                        <th width="18%">Type</th>
                        <th width="20%">Method</th>
                        <th width="20%">Date</th>
                        <th width="20%" class="text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($invoice->payments as $payment)
                        @php
                            $isRefund = in_array($payment->type?->value, ['deposit_refund', 'refund']);
                        @endphp
                        <tr>
                            <td style="font-family: 'DejaVu Sans Mono', monospace; font-size: 9px;">
                                {{ $payment->reference }}
                            </td>
                            <td>{{ $payment->type?->label() ?? 'Payment' }}</td>
                            <td>{{ $methodLabels[$payment->method->value] ?? $payment->method->value }}</td>
                            <td style="color: #64748b;">
                                {{ $payment->paid_at ? \Carbon\Carbon::parse($payment->paid_at)->format('d M Y') : '—' }}
                            </td>
                            <td class="text-right amount" style="color: {{ $isRefund ? '#7e22ce' : '#047857' }};">
                                {{ $isRefund ? '−' : '+' }}${{ number_format((float) $payment->amount, 2) }}
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        {{-- Mini receipts: 2 per row --}}
        <div class="receipts-section">
            <div class="receipts-title">Receipts</div>
            @php
                $chunks = $invoice->payments->chunk(2);
            @endphp
            <table class="receipt-grid">
                @foreach ($chunks as $pair)
                    <tr>
                        @foreach ($pair as $payment)
                            @php
                                $isRefund = in_array($payment->type?->value, ['deposit_refund', 'refund']);
                            @endphp
                            <td class="receipt-card {{ $isRefund ? 'refund' : 'payment' }}">
                                <div class="receipt-head">
                                    <div class="receipt-brand">
                                        Laxora
                                        <div class="receipt-brand-sub">{{ $isRefund ? 'Refund' : 'Receipt' }}</div>
                                    </div>
                                    <div class="receipt-ref">{{ $payment->reference }}</div>
                                </div>

                                <div class="receipt-amount-row">
                                    <div class="receipt-amount-label">{{ $payment->type?->label() ?? 'Payment' }}</div>
                                    <div class="receipt-amount-value">
                                        {{ $isRefund ? '−' : '' }}${{ number_format((float) $payment->amount, 2) }}
                                    </div>
                                </div>

                                <div class="receipt-meta">
                                    <div><span class="meta-label">Method:</span> {{ $methodLabels[$payment->method->value] ?? $payment->method->value }}</div>
                                    <div><span class="meta-label">Date:</span> {{ $payment->paid_at ? \Carbon\Carbon::parse($payment->paid_at)->format('d M Y, H:i') : '—' }}</div>
                                    @if ($payment->gateway_reference)
                                        <div><span class="meta-label">Txn:</span>
                                            <span style="font-family: 'DejaVu Sans Mono', monospace; font-size: 7px;">{{ $payment->gateway_reference }}</span>
                                        </div>
                                    @endif
                                </div>

                                <div class="receipt-footer">
                                    {{ $invoice->number }} · {{ $invoice->customer->name }}
                                </div>
                            </td>
                        @endforeach
                        @if ($pair->count() === 1)
                            <td class="receipt-card" style="border: 0; background: transparent;">&nbsp;</td>
                        @endif
                    </tr>
                @endforeach
            </table>
        </div>
    @endif

    <!-- Notes -->
    @if ($invoice->notes)
        <div class="notes">
            <div class="notes-title">Notes</div>
            <div class="notes-body">{{ $invoice->notes }}</div>
        </div>
    @endif

    <!-- Footer -->
    <div class="footer">
        <div class="footer-thanks">Thank you for choosing Laxora Car Rental!</div>
        <div>Payment reference: <strong>{{ $invoice->number }}</strong></div>
        <div class="footer-contact">
            Laxora Car Rental | hello@laxora.co.zw | +263 77 000 0000 | Harare, Zimbabwe
        </div>
    </div>
</div>
</body>
</html>
