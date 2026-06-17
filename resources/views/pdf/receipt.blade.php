<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Receipt {{ $payment->reference }}</title>
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
            padding: 22px 28px;
        }

        /* Header */
        .header {
            display: table;
            width: 100%;
            border-bottom: 3px solid {{ $isRefund ? '#a855f7' : '#10b981' }};
            padding-bottom: 12px;
            margin-bottom: 16px;
        }

        .header-left {
            display: table-cell;
            vertical-align: top;
        }

        .header-right {
            display: table-cell;
            text-align: right;
            vertical-align: top;
        }

        .brand {
            font-size: 18px;
            font-weight: bold;
            color: {{ $isRefund ? '#a855f7' : '#10b981' }};
            letter-spacing: -0.5px;
        }

        .brand-sub {
            font-size: 7px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 2px;
        }

        .brand-contact {
            font-size: 8px;
            color: #64748b;
            margin-top: 6px;
        }

        .doc-label {
            font-size: 11px;
            font-weight: bold;
            color: #1e293b;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .doc-ref {
            font-size: 11px;
            color: {{ $isRefund ? '#a855f7' : '#10b981' }};
            font-weight: bold;
            font-family: 'DejaVu Sans Mono', monospace;
            margin-top: 2px;
        }

        .doc-date {
            font-size: 8px;
            color: #64748b;
            margin-top: 2px;
        }

        /* Amount box */
        .amount-box {
            background: {{ $isRefund ? '#faf5ff' : '#f0fdf4' }};
            border: 1px solid {{ $isRefund ? '#a855f7' : '#10b981' }};
            padding: 16px;
            text-align: center;
            margin-bottom: 14px;
        }

        .amount-label {
            font-size: 8px;
            color: {{ $isRefund ? '#7e22ce' : '#047857' }};
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: bold;
        }

        .amount-value {
            font-size: 26px;
            font-weight: bold;
            color: {{ $isRefund ? '#7e22ce' : '#047857' }};
            margin: 4px 0;
        }

        .status-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 8px;
            font-size: 7px;
            font-weight: bold;
            text-transform: uppercase;
            background: #fff;
            color: {{ $isRefund ? '#7e22ce' : '#047857' }};
        }

        /* Two columns */
        .two-column {
            display: table;
            width: 100%;
            margin-bottom: 12px;
        }

        .column {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding-right: 8px;
        }

        .column:last-child {
            padding-right: 0;
            padding-left: 8px;
        }

        .section-title {
            font-size: 8px;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 3px;
            margin-bottom: 6px;
        }

        .info-row {
            display: table;
            width: 100%;
            margin-bottom: 3px;
        }

        .info-label {
            display: table-cell;
            color: #64748b;
            width: 45%;
            font-size: 9px;
        }

        .info-value {
            display: table-cell;
            font-weight: 500;
            text-align: right;
            font-size: 9px;
        }

        .info-value-mono {
            font-family: 'DejaVu Sans Mono', monospace;
            font-size: 8px;
        }

        /* Rental strip */
        .rental-strip {
            background: #f8fafc;
            border-left: 3px solid #cbd5e1;
            padding: 10px 12px;
            margin-bottom: 12px;
        }

        .rental-label {
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #64748b;
            font-weight: bold;
        }

        .rental-ref {
            font-family: 'DejaVu Sans Mono', monospace;
            font-weight: bold;
            font-size: 11px;
            color: #0f172a;
            margin-top: 2px;
        }

        .rental-vehicle {
            font-size: 9px;
            color: #475569;
            margin-top: 2px;
        }

        .reg-plate {
            display: inline-block;
            background: #e2e8f0;
            padding: 1px 5px;
            border-radius: 3px;
            font-family: 'DejaVu Sans Mono', monospace;
            font-size: 8px;
        }

        /* Notes */
        .notes {
            margin: 12px 0;
            padding: 10px;
            background: #f8fafc;
            font-size: 9px;
            color: #64748b;
            font-style: italic;
            text-align: center;
            border-left: 3px solid #cbd5e1;
        }

        /* Footer */
        .footer {
            margin-top: 18px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 8px;
            color: #64748b;
        }

        .footer-thanks {
            font-size: 9px;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 3px;
        }

        .footer-contact {
            margin-top: 5px;
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
            <div class="brand-contact">Harare Office · +263 77 000 0000</div>
        </div>
        <div class="header-right">
            <div class="doc-label">{{ $isRefund ? 'Refund' : 'Receipt' }}</div>
            <div class="doc-ref">{{ $payment->reference }}</div>
            <div class="doc-date">
                {{ $payment->paid_at ? \Carbon\Carbon::parse($payment->paid_at)->format('d M Y, H:i') : '—' }}
            </div>
        </div>
    </div>

    <!-- Amount -->
    <div class="amount-box">
        <div class="amount-label">{{ $payment->type?->label() ?? 'Payment' }}</div>
        <div class="amount-value">
            {{ $isRefund ? '−' : '' }}${{ number_format((float) $payment->amount, 2) }}
        </div>
        <div class="status-badge">{{ ucfirst($payment->status->value) }}</div>
    </div>

    <!-- Two columns: customer + payment details -->
    <div class="two-column">
        <div class="column">
            <div class="section-title">Customer</div>
            <div class="info-row">
                <span class="info-label">Name</span>
                <span class="info-value">{{ $payment->customer->name }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Phone</span>
                <span class="info-value">{{ $payment->customer->phone }}</span>
            </div>
            @if ($payment->customer->email)
                <div class="info-row">
                    <span class="info-label">Email</span>
                    <span class="info-value">{{ $payment->customer->email }}</span>
                </div>
            @endif
        </div>
        <div class="column">
            <div class="section-title">Payment Details</div>
            <div class="info-row">
                <span class="info-label">Method</span>
                <span class="info-value">{{ $methodLabels[$payment->method->value] ?? $payment->method->value }}</span>
            </div>
            @if ($payment->gateway_reference)
                <div class="info-row">
                    <span class="info-label">Txn Ref</span>
                    <span class="info-value info-value-mono">{{ $payment->gateway_reference }}</span>
                </div>
            @endif
            @if ($payment->invoice)
                <div class="info-row">
                    <span class="info-label">Invoice</span>
                    <span class="info-value info-value-mono">{{ $payment->invoice->number }}</span>
                </div>
            @endif
        </div>
    </div>

    <!-- Rental reference -->
    @if ($payment->booking)
        <div class="rental-strip">
            <div class="rental-label">Rental</div>
            <div class="rental-ref">{{ $payment->booking->reference }}</div>
            @if ($payment->booking->vehicle)
                <div class="rental-vehicle">
                    {{ $payment->booking->vehicle->make }} {{ $payment->booking->vehicle->model }}
                    <span class="reg-plate">{{ $payment->booking->vehicle->reg_plate }}</span>
                </div>
            @endif
        </div>
    @endif

    <!-- Notes -->
    @if ($payment->notes)
        <div class="notes">"{{ $payment->notes }}"</div>
    @endif

    <!-- Footer -->
    <div class="footer">
        <div class="footer-thanks">Thank you for your payment!</div>
        <div>This is an official {{ $isRefund ? 'refund' : 'receipt' }} for the transaction above.</div>
        <div class="footer-contact">
            Laxora Car Rental | hello@laxora.co.zw | +263 77 000 0000
        </div>
    </div>
</div>
</body>
</html>
