<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Financial Statement — {{ $start->format('d M Y') }} to {{ $end->format('d M Y') }}</title>
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

        /* ── Header ── */
        .header {
            display: table;
            width: 100%;
            border-bottom: 3px solid #4f46e5;
            padding-bottom: 16px;
            margin-bottom: 20px;
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

        .doc-period {
            font-size: 14px;
            color: #4f46e5;
            font-weight: bold;
            margin-top: 2px;
        }

        .doc-generated {
            font-size: 8px;
            color: #64748b;
            margin-top: 4px;
        }

        /* ── Period Banner ── */
        .period-banner {
            background: #f1f5f9;
            padding: 8px 14px;
            margin-bottom: 20px;
            font-size: 9px;
            color: #475569;
            text-align: center;
            letter-spacing: 0.5px;
        }

        .period-banner strong {
            color: #1e293b;
        }

        /* ── Section headers ── */
        .section-header {
            padding: 7px 14px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 0;
        }

        .section-header.income {
            background: #f0fdf4;
            color: #065f46;
            border-left: 4px solid #059669;
        }

        .section-header.expense {
            background: #fff1f2;
            color: #991b1b;
            border-left: 4px solid #dc2626;
        }

        .section-header.summary {
            background: #f8fafc;
            color: #1e293b;
            border-left: 4px solid #4f46e5;
        }

        /* ── Statement table ── */
        .stmt-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 18px;
        }

        .stmt-table tbody tr td {
            padding: 8px 14px;
            font-size: 10px;
            border-bottom: 1px solid #f1f5f9;
        }

        .stmt-table tbody tr:nth-child(even) td {
            background: #fafafa;
        }

        .stmt-table tbody tr:nth-child(odd) td {
            background: #fff;
        }

        .stmt-table td.label-cell {
            color: #475569;
            width: 70%;
        }

        .stmt-table td.label-cell.indent {
            padding-left: 28px;
        }

        .stmt-table td.amount-cell {
            text-align: right;
            font-weight: 600;
            color: #0f172a;
            width: 30%;
            font-family: 'DejaVu Sans Mono', monospace;
            font-size: 9px;
        }

        .stmt-table td.amount-cell.muted {
            color: #64748b;
            font-weight: normal;
        }

        .stmt-table td.amount-cell.negative {
            color: #dc2626;
        }

        /* ── Subtotal row ── */
        .subtotal-row td {
            background: #f8fafc !important;
            border-top: 1px solid #cbd5e1;
            border-bottom: 2px solid #cbd5e1;
            padding-top: 9px !important;
            padding-bottom: 9px !important;
        }

        .subtotal-row td.label-cell {
            font-weight: bold;
            color: #1e293b;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .subtotal-row td.amount-cell {
            font-size: 11px;
            font-weight: bold;
            color: #1e293b;
        }

        .subtotal-row.income td.amount-cell {
            color: #059669;
        }

        .subtotal-row.expense td.amount-cell {
            color: #dc2626;
        }

        /* ── Net position box ── */
        .net-box {
            display: table;
            width: 100%;
            margin-bottom: 20px;
            padding: 16px 18px;
        }

        .net-box.profit {
            background: #d1fae5;
            border-left: 5px solid #059669;
        }

        .net-box.loss {
            background: #fee2e2;
            border-left: 5px solid #dc2626;
        }

        .net-box-inner {
            display: table;
            width: 100%;
        }

        .net-label-cell {
            display: table-cell;
            vertical-align: middle;
        }

        .net-title {
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .net-box.profit .net-title {
            color: #065f46;
        }

        .net-box.loss .net-title {
            color: #991b1b;
        }

        .net-subtitle {
            font-size: 8px;
            margin-top: 2px;
        }

        .net-box.profit .net-subtitle {
            color: #047857;
        }

        .net-box.loss .net-subtitle {
            color: #b91c1c;
        }

        .net-amount-cell {
            display: table-cell;
            vertical-align: middle;
            text-align: right;
        }

        .net-amount {
            font-size: 22px;
            font-weight: bold;
            font-family: 'DejaVu Sans Mono', monospace;
        }

        .net-box.profit .net-amount {
            color: #065f46;
        }

        .net-box.loss .net-amount {
            color: #991b1b;
        }

        /* ── Booking summary ── */
        .booking-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
        }

        .booking-table thead th {
            background: #f1f5f9;
            text-align: left;
            font-size: 9px;
            font-weight: bold;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 8px 14px;
            border-bottom: 2px solid #cbd5e1;
        }

        .booking-table thead th.text-right {
            text-align: right;
        }

        .booking-table tbody td {
            padding: 8px 14px;
            font-size: 10px;
            border-bottom: 1px solid #e2e8f0;
        }

        .booking-table tbody td.text-right {
            text-align: right;
            font-weight: 600;
            font-family: 'DejaVu Sans Mono', monospace;
            font-size: 9px;
        }

        .booking-table tbody tr:nth-child(even) td {
            background: #fafafa;
        }

        .status-pill {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 8px;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .pill-completed  { background: #d1fae5; color: #065f46; }
        .pill-active     { background: #dbeafe; color: #1e40af; }
        .pill-pending    { background: #fef3c7; color: #92400e; }
        .pill-cancelled  { background: #e2e8f0; color: #64748b; }
        .pill-overdue    { background: #fee2e2; color: #991b1b; }
        .pill-confirmed  { background: #ede9fe; color: #5b21b6; }
        .pill-default    { background: #f1f5f9; color: #475569; }

        /* ── Section title (reused from invoice) ── */
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

        /* ── Footer ── */
        .footer {
            margin-top: 24px;
            padding-top: 14px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 8px;
            color: #64748b;
        }

        .footer-divider {
            display: inline-block;
            margin: 0 6px;
            color: #cbd5e1;
        }
    </style>
</head>
<body>
<div class="container">

    {{-- ── Header ── --}}
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
            <div class="doc-label">Financial Statement</div>
            <div class="doc-period">{{ $start->format('F Y') }}</div>
            <div class="doc-generated">Generated {{ now()->format('d M Y, H:i') }}</div>
        </div>
    </div>

    {{-- ── Period Banner ── --}}
    <div class="period-banner">
        For the period: <strong>{{ $start->format('d M Y') }}</strong> to <strong>{{ $end->format('d M Y') }}</strong>
    </div>

    {{-- ── Income Section ── --}}
    @php
        $outstanding = $revenue - $collected;
    @endphp

    <div class="section-header income">Income</div>
    <table class="stmt-table">
        <tbody>
            <tr>
                <td class="label-cell indent">Booking Revenue (Invoiced)</td>
                <td class="amount-cell">${{ number_format($revenue, 2) }}</td>
            </tr>
            <tr>
                <td class="label-cell indent">Cash Collected</td>
                <td class="amount-cell">${{ number_format($collected, 2) }}</td>
            </tr>
            <tr>
                <td class="label-cell indent" style="color: #94a3b8;">Outstanding Receivables</td>
                <td class="amount-cell muted">
                    @if ($outstanding > 0)
                        ${{ number_format($outstanding, 2) }}
                    @else
                        —
                    @endif
                </td>
            </tr>
            <tr class="subtotal-row income">
                <td class="label-cell">Total Collected</td>
                <td class="amount-cell">${{ number_format($collected, 2) }}</td>
            </tr>
        </tbody>
    </table>

    {{-- ── Expense Section ── --}}
    @php
        $totalExpenses = $expenses + $payroll;
    @endphp

    <div class="section-header expense">Expenses</div>
    <table class="stmt-table">
        <tbody>
            @foreach ($expensesByCategory as $cat)
                <tr>
                    <td class="label-cell indent">{{ $cat['label'] }}</td>
                    <td class="amount-cell negative">${{ number_format($cat['total'], 2) }}</td>
                </tr>
            @endforeach
            <tr>
                <td class="label-cell indent">Payroll &amp; Salaries</td>
                <td class="amount-cell negative">${{ number_format($payroll, 2) }}</td>
            </tr>
            <tr class="subtotal-row expense">
                <td class="label-cell">Total Expenses</td>
                <td class="amount-cell">${{ number_format($totalExpenses, 2) }}</td>
            </tr>
        </tbody>
    </table>

    {{-- ── Net Position ── --}}
    @php
        $isProfit = $grossProfit >= 0;
    @endphp

    <div class="net-box {{ $isProfit ? 'profit' : 'loss' }}">
        <div class="net-box-inner">
            <div class="net-label-cell">
                <div class="net-title">
                    {{ $isProfit ? 'Gross Profit' : 'Net Loss' }}
                </div>
                <div class="net-subtitle">
                    Cash Collected − Operational Expenses − Payroll
                </div>
            </div>
            <div class="net-amount-cell">
                <div class="net-amount">
                    {{ $isProfit ? '' : '(' }}${{ number_format(abs($grossProfit), 2) }}{{ $isProfit ? '' : ')' }}
                </div>
            </div>
        </div>
    </div>

    {{-- ── Booking Summary ── --}}
    @if ($bookingStats->count() > 0)
        <div class="section-header summary">Booking Summary</div>
        <table class="booking-table">
            <thead>
                <tr>
                    <th width="70%">Status</th>
                    <th width="30%" class="text-right">Count</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($bookingStats as $stat)
                    @php
                        $slug = strtolower(str_replace([' ', '_'], '-', $stat['status']));
                        $pillKey = 'pill-' . str_replace('-', '', $slug);
                        $pillClass = in_array('pill-' . $slug, [
                            'pill-completed', 'pill-active', 'pill-pending',
                            'pill-cancelled', 'pill-overdue', 'pill-confirmed',
                        ]) ? 'pill-' . $slug : 'pill-default';
                    @endphp
                    <tr>
                        <td>
                            <span class="status-pill {{ $pillClass }}">
                                {{ ucfirst(str_replace('_', ' ', $stat['status'])) }}
                            </span>
                        </td>
                        <td class="text-right">{{ number_format($stat['count']) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    {{-- ── Footer ── --}}
    <div class="footer">
        Generated on {{ now()->format('d M Y \a\t H:i') }}
        <span class="footer-divider">|</span>
        Laxora Car Rental
        <span class="footer-divider">|</span>
        Confidential — For Internal Use Only
    </div>

</div>
</body>
</html>
