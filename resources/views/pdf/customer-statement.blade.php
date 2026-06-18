<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Customer Statement — {{ $customer->name }}</title>
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
            font-size: 18px;
            font-weight: bold;
            color: #1e293b;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .doc-period-label {
            font-size: 9px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 6px;
        }

        .doc-period {
            font-size: 11px;
            font-weight: bold;
            color: #4f46e5;
            margin-top: 2px;
            font-family: 'DejaVu Sans Mono', monospace;
        }

        /* Customer info box */
        .customer-box {
            background: #eff6ff;
            border-left: 3px solid #4f46e5;
            padding: 12px 16px;
            margin-bottom: 22px;
        }

        .customer-box-title {
            font-size: 8px;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 6px;
        }

        .customer-box-row {
            display: table;
            width: 100%;
        }

        .customer-box-cell {
            display: table-cell;
            vertical-align: top;
            padding-right: 20px;
        }

        .customer-box-cell:last-child {
            padding-right: 0;
        }

        .customer-name {
            font-size: 13px;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 2px;
        }

        .customer-meta-label {
            font-size: 8px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .customer-meta-value {
            font-size: 9px;
            color: #1e293b;
            font-weight: 500;
            margin-top: 1px;
        }

        /* Section title */
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

        /* Tables */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
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
            vertical-align: middle;
        }

        .items-table tbody td.text-right {
            text-align: right;
        }

        .items-table tbody td.amount {
            font-weight: 600;
            color: #0f172a;
        }

        .items-table tbody tr:nth-child(even) {
            background: #f8fafc;
        }

        .items-table tfoot td {
            padding: 10px 8px;
            font-size: 10px;
            font-weight: bold;
            color: #0f172a;
            background: #f1f5f9;
            border-top: 2px solid #cbd5e1;
        }

        .items-table tfoot td.text-right {
            text-align: right;
        }

        /* Booking ref mono */
        .ref-mono {
            font-family: 'DejaVu Sans Mono', monospace;
            font-size: 9px;
        }

        /* Status badges */
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 8px;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .badge-confirmed    { background: #dbeafe; color: #1e40af; }
        .badge-active       { background: #d1fae5; color: #065f46; }
        .badge-completed    { background: #e0e7ff; color: #3730a3; }
        .badge-cancelled    { background: #e2e8f0; color: #64748b; }
        .badge-pending      { background: #fef3c7; color: #92400e; }
        .badge-overdue      { background: #fee2e2; color: #991b1b; }
        .badge-default      { background: #f1f5f9; color: #475569; }

        /* Account summary */
        .summary-wrap {
            display: table;
            width: 100%;
            margin-top: 24px;
        }

        .summary-spacer {
            display: table-cell;
            width: 55%;
        }

        .summary-box {
            display: table-cell;
            width: 45%;
            background: #f8fafc;
            padding: 16px;
            border-left: 3px solid #4f46e5;
        }

        .summary-title {
            font-size: 9px;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }

        .summary-row {
            display: table;
            width: 100%;
            margin-bottom: 5px;
        }

        .summary-label {
            display: table-cell;
            color: #64748b;
            font-size: 10px;
        }

        .summary-value {
            display: table-cell;
            text-align: right;
            font-size: 10px;
            font-weight: 600;
            color: #0f172a;
        }

        .summary-divider {
            border: 0;
            border-top: 1px solid #cbd5e1;
            margin: 8px 0;
        }

        .summary-row-outstanding .summary-label,
        .summary-row-outstanding .summary-value {
            font-size: 13px;
            font-weight: bold;
        }

        .summary-row-outstanding.is-due .summary-label,
        .summary-row-outstanding.is-due .summary-value {
            color: #991b1b;
        }

        .summary-row-outstanding.is-settled .summary-label,
        .summary-row-outstanding.is-settled .summary-value {
            color: #065f46;
        }

        /* Footer */
        .footer {
            margin-top: 30px;
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

        .section-gap {
            margin-top: 22px;
        }
    </style>
</head>
<body>
<div class="container">

    <!-- Header -->
    <div class="header">
        <div class="header-left">
            <div class="brand">Laxora Car Rental</div>
            <div class="brand-sub">Vehicle Rental &amp; Fleet Management</div>
            <div class="brand-contact">
                Harare Office · Zimbabwe<br>
                +263 77 000 0000 · hello@laxora.co.zw
            </div>
        </div>
        <div class="header-right">
            <div class="doc-label">Customer Statement</div>
            <div class="doc-period-label">Statement Period</div>
            <div class="doc-period">
                {{ \Carbon\Carbon::parse($startDate)->format('d M Y') }}
                &nbsp;—&nbsp;
                {{ \Carbon\Carbon::parse($endDate)->format('d M Y') }}
            </div>
        </div>
    </div>

    <!-- Customer Info Box -->
    <div class="customer-box">
        <div class="customer-box-title">Account Details</div>
        <div class="customer-box-row">
            <div class="customer-box-cell" style="width: 30%;">
                <div class="customer-name">{{ $customer->name }}</div>
            </div>
            @if ($customer->id_number)
                <div class="customer-box-cell" style="width: 20%;">
                    <div class="customer-meta-label">ID Number</div>
                    <div class="customer-meta-value">{{ $customer->id_number }}</div>
                </div>
            @endif
            @if ($customer->email)
                <div class="customer-box-cell" style="width: 25%;">
                    <div class="customer-meta-label">Email</div>
                    <div class="customer-meta-value">{{ $customer->email }}</div>
                </div>
            @endif
            @if ($customer->phone)
                <div class="customer-box-cell" style="width: 25%;">
                    <div class="customer-meta-label">Phone</div>
                    <div class="customer-meta-value">{{ $customer->phone }}</div>
                </div>
            @endif
        </div>
    </div>

    <!-- Bookings Table -->
    <div class="section-title">Bookings</div>
    <table class="items-table">
        <thead>
            <tr>
                <th width="15%">Date</th>
                <th width="20%">Booking Ref</th>
                <th width="35%">Vehicle</th>
                <th width="15%">Status</th>
                <th width="15%" class="text-right">Amount</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($bookings as $booking)
                @php
                    $statusValue = is_object($booking->status) ? $booking->status->value : (string) $booking->status;
                    $statusLabel = ucfirst(str_replace('_', ' ', $statusValue));
                    $badgeMap = [
                        'confirmed' => 'badge-confirmed',
                        'active'    => 'badge-active',
                        'completed' => 'badge-completed',
                        'cancelled' => 'badge-cancelled',
                        'pending'   => 'badge-pending',
                        'overdue'   => 'badge-overdue',
                    ];
                    $badgeClass = $badgeMap[$statusValue] ?? 'badge-default';
                    $invoiceTotal = $booking->invoice ? (float) $booking->invoice->total : 0.00;
                @endphp
                <tr>
                    <td style="color: #64748b;">
                        {{ $booking->pickup_datetime
                            ? \Carbon\Carbon::parse($booking->pickup_datetime)->format('d M Y')
                            : \Carbon\Carbon::parse($booking->created_at)->format('d M Y') }}
                    </td>
                    <td class="ref-mono">{{ $booking->reference }}</td>
                    <td>
                        @if ($booking->vehicle)
                            {{ $booking->vehicle->make }} {{ $booking->vehicle->model }}
                            @if ($booking->vehicle->reg_plate)
                                <span style="display: inline-block; background: #e2e8f0; padding: 1px 5px; border-radius: 3px; font-family: 'DejaVu Sans Mono', monospace; font-size: 8px;">{{ $booking->vehicle->reg_plate }}</span>
                            @endif
                        @else
                            <span style="color: #94a3b8;">—</span>
                        @endif
                    </td>
                    <td>
                        <span class="badge {{ $badgeClass }}">{{ $statusLabel }}</span>
                    </td>
                    <td class="text-right amount">${{ number_format($invoiceTotal, 2) }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="5" style="text-align: center; color: #94a3b8; padding: 16px;">No bookings found for this period</td>
                </tr>
            @endforelse
        </tbody>
        <tfoot>
            <tr>
                <td colspan="3">Total Bookings: {{ $bookings->count() }}</td>
                <td></td>
                <td class="text-right">${{ number_format((float) $totalBilled, 2) }}</td>
            </tr>
        </tfoot>
    </table>

    <!-- Payments Table -->
    <div class="section-gap">
        <div class="section-title">Payments Received</div>
        <table class="items-table">
            <thead>
                <tr>
                    <th width="20%">Date</th>
                    <th width="25%">Payment Method</th>
                    <th width="30%">Booking Ref</th>
                    <th width="25%" class="text-right">Amount</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($payments as $payment)
                    @php
                        $methodValue = is_object($payment->method) ? $payment->method->value : (string) $payment->method;
                        $methodLabel = ucfirst(str_replace('_', ' ', $methodValue));
                        $bookingRef = $payment->booking ? $payment->booking->reference : '—';
                    @endphp
                    <tr>
                        <td style="color: #64748b;">
                            {{ $payment->paid_at
                                ? \Carbon\Carbon::parse($payment->paid_at)->format('d M Y')
                                : \Carbon\Carbon::parse($payment->created_at)->format('d M Y') }}
                        </td>
                        <td>{{ $methodLabel }}</td>
                        <td class="ref-mono">{{ $bookingRef }}</td>
                        <td class="text-right amount" style="color: #047857;">
                            +${{ number_format((float) $payment->amount, 2) }}
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="4" style="text-align: center; color: #94a3b8; padding: 16px;">No payments recorded for this period</td>
                    </tr>
                @endforelse
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="3">Total Payments: {{ $payments->count() }}</td>
                    <td class="text-right" style="color: #047857;">${{ number_format((float) $totalPaid, 2) }}</td>
                </tr>
            </tfoot>
        </table>
    </div>

    <!-- Account Summary -->
    @php
        $outstanding = (float) $totalBilled - (float) $totalPaid;
        $isSettled = $outstanding <= 0;
    @endphp
    <div class="summary-wrap">
        <div class="summary-spacer">&nbsp;</div>
        <div class="summary-box">
            <div class="summary-title">Account Summary</div>
            <div class="summary-row">
                <span class="summary-label">Total Billed</span>
                <span class="summary-value">${{ number_format((float) $totalBilled, 2) }}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label" style="color: #047857;">Total Paid</span>
                <span class="summary-value" style="color: #047857;">−${{ number_format((float) $totalPaid, 2) }}</span>
            </div>
            <hr class="summary-divider">
            <div class="summary-row summary-row-outstanding {{ $isSettled ? 'is-settled' : 'is-due' }}">
                <span class="summary-label">Outstanding</span>
                <span class="summary-value">${{ number_format(abs($outstanding), 2) }}</span>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <div class="footer-thanks">Thank you for your business — Laxora Car Rental</div>
        <div class="footer-contact">
            Laxora Car Rental | hello@laxora.co.zw | +263 77 000 0000 | Harare, Zimbabwe
        </div>
    </div>

</div>
</body>
</html>
