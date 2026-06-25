<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Agreement {{ $agreement->agreement_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 9px; line-height: 1.5; color: #1e293b; background: #fff; }
        .container { max-width: 100%; padding: 30px 40px; }

        .top-bar { height: 5px; background: #c2943f; margin-bottom: 24px; }

        .header { display: table; width: 100%; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; }
        .header-left { display: table-cell; vertical-align: middle; width: 50%; }
        .header-right { display: table-cell; vertical-align: top; text-align: right; }
        .header-right .doc-type { font-size: 8px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 2px; }
        .header-right .doc-number { font-size: 14px; font-weight: bold; color: #c2943f; margin-top: 3px; font-family: 'DejaVu Sans Mono', monospace; }
        .logo { height: 45px; width: auto; }

        .section-title { font-size: 8px; font-weight: bold; color: #c2943f; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; margin-top: 16px; }
        .party-box { background: #fffbf2; border: 1px solid rgba(194,148,63,0.2); border-radius: 6px; padding: 12px; margin-bottom: 12px; }
        .grid-2 { display: table; width: 100%; }
        .grid-2 .col { display: table-cell; width: 50%; padding-right: 12px; vertical-align: top; }
        .grid-3 { display: table; width: 100%; }
        .grid-3 .col { display: table-cell; width: 33.33%; padding-right: 10px; vertical-align: top; }
        .field { margin-bottom: 8px; }
        .field-label { font-size: 7px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
        .field-value { font-size: 9px; font-weight: bold; color: #1e293b; margin-top: 1px; }

        h3 { font-size: 9px; font-weight: bold; text-transform: uppercase; margin-top: 14px; margin-bottom: 6px; letter-spacing: 0.5px; }
        p { margin-bottom: 6px; }
        ol, ul { padding-left: 18px; margin-bottom: 8px; }
        li { margin-bottom: 3px; }

        .fees-box { background: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin: 12px 0; }
        .fees-row { display: table; width: 100%; border-bottom: 1px solid #e2e8f0; padding: 4px 0; }
        .fees-row:last-child { border-bottom: none; }
        .fees-label { display: table-cell; color: #64748b; }
        .fees-value { display: table-cell; text-align: right; font-weight: bold; }
        .fees-total .fees-label, .fees-total .fees-value { font-size: 10px; color: #c2943f; font-weight: bold; }

        .sig-section { display: table; width: 100%; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        .sig-col { display: table-cell; width: 48%; vertical-align: top; padding-right: 4%; }
        .sig-label { font-weight: bold; font-size: 8px; text-transform: uppercase; margin-bottom: 8px; }
        .sig-box { border: 1px solid #e2e8f0; border-radius: 4px; height: 60px; background: #f9fafb; overflow: hidden; margin-bottom: 6px; }
        .sig-img { width: 100%; height: 60px; object-fit: contain; }
        .sig-meta { font-size: 7px; color: #16a34a; }
        .sig-pending { font-size: 7px; color: #94a3b8; padding-top: 20px; text-align: center; }

        .footer { margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 8px; font-size: 7px; color: #94a3b8; text-align: center; }
        .note { background: #fffbf2; border-left: 3px solid #c2943f; padding: 8px 10px; font-size: 8px; margin: 8px 0; }
    </style>
</head>
<body>
<div class="top-bar"></div>
<div class="container">

    <!-- Header -->
    <div class="header">
        <div class="header-left">
            <img src="{{ public_path('logo.jpg') }}" alt="Laxora Car Rental" class="logo">
        </div>
        <div class="header-right">
            <div class="doc-type">Vehicle Rental Agreement</div>
            <div class="doc-number">{{ $agreement->agreement_number }}</div>
            <div style="font-size:7px; color:#94a3b8; margin-top:3px;">Created {{ $agreement->created_at->format('d M Y') }}</div>
        </div>
    </div>

    <p style="margin-bottom:12px;">This Vehicle Rental Agreement ("Agreement") is entered into between:</p>

    <!-- Company -->
    <div class="section-title">Company</div>
    <div class="party-box">
        <div class="grid-2">
            <div class="col">
                <div class="field"><div class="field-label">Company Name</div><div class="field-value">Laxora Car Rental</div></div>
                <div class="field"><div class="field-label">Address</div><div class="field-value">Harare Office, Zimbabwe</div></div>
            </div>
            <div class="col">
                <div class="field"><div class="field-label">Phone</div><div class="field-value">+263 77 000 0000</div></div>
                <div class="field"><div class="field-label">Email</div><div class="field-value">hello@laxora.co.zw</div></div>
            </div>
        </div>
    </div>

    <!-- Renter -->
    <div class="section-title">AND — Renter</div>
    <div class="party-box">
        <div class="grid-2">
            <div class="col">
                <div class="field"><div class="field-label">Full Name</div><div class="field-value">{{ $agreement->renter_name }}</div></div>
                <div class="field"><div class="field-label">ID / Passport</div><div class="field-value">{{ $agreement->renter_id_number ?? '—' }}</div></div>
                <div class="field"><div class="field-label">Physical Address</div><div class="field-value">{{ $agreement->renter_address ?? '—' }}</div></div>
            </div>
            <div class="col">
                <div class="field"><div class="field-label">Phone Number</div><div class="field-value">{{ $agreement->renter_phone ?? '—' }}</div></div>
                <div class="field"><div class="field-label">Email Address</div><div class="field-value">{{ $agreement->renter_email ?? '—' }}</div></div>
            </div>
        </div>
    </div>

    <!-- Section 1: Vehicle -->
    <div class="section-title">1. Vehicle Details</div>
    <div class="grid-3">
        <div class="col">
            <div class="field"><div class="field-label">Make & Model</div><div class="field-value">{{ $agreement->vehicle_make_model ?? '—' }}</div></div>
            <div class="field"><div class="field-label">Registration No.</div><div class="field-value">{{ $agreement->vehicle_registration ?? '—' }}</div></div>
        </div>
        <div class="col">
            <div class="field"><div class="field-label">Mileage Out</div><div class="field-value">{{ $agreement->mileage_out ?? '—' }}</div></div>
            <div class="field"><div class="field-label">Fuel Level</div><div class="field-value">{{ $agreement->fuel_level_out ?? '—' }}</div></div>
        </div>
        <div class="col">
            <div class="field"><div class="field-label">Rental Start</div><div class="field-value">{{ $agreement->rental_start?->format('d M Y H:i') ?? '—' }}</div></div>
            <div class="field"><div class="field-label">Rental End</div><div class="field-value">{{ $agreement->rental_end?->format('d M Y H:i') ?? '—' }}</div></div>
        </div>
    </div>
    <div class="grid-2" style="margin-top:4px;">
        <div class="col"><div class="field"><div class="field-label">Collection Location</div><div class="field-value">{{ $agreement->collection_location ?? '—' }}</div></div></div>
        <div class="col"><div class="field"><div class="field-label">Return Location</div><div class="field-value">{{ $agreement->return_location ?? '—' }}</div></div></div>
    </div>

    <!-- Section 2: Fees -->
    <div class="section-title">2. Rental Fees & Deposit</div>
    <div class="fees-box">
        @if($agreement->rental_rate)
        <div class="fees-row"><span class="fees-label">Daily Rate</span><span class="fees-value">USD {{ number_format($agreement->rental_rate, 2) }}</span></div>
        @endif
        @if($agreement->rental_days)
        <div class="fees-row"><span class="fees-label">Rental Days</span><span class="fees-value">{{ $agreement->rental_days }} days</span></div>
        @endif
        @if($agreement->deposit_amount)
        <div class="fees-row"><span class="fees-label">Refundable Deposit</span><span class="fees-value">USD {{ number_format($agreement->deposit_amount, 2) }}</span></div>
        @endif
        @if($agreement->mileage_allowance)
        <div class="fees-row"><span class="fees-label">Mileage Allowance</span><span class="fees-value">{{ $agreement->mileage_allowance }} km/day</span></div>
        @endif
        @if($agreement->excess_mileage_fee)
        <div class="fees-row"><span class="fees-label">Excess Mileage Fee</span><span class="fees-value">USD {{ number_format($agreement->excess_mileage_fee, 2) }}/km</span></div>
        @endif
        @if($agreement->total_amount)
        <div class="fees-row fees-total"><span class="fees-label">Total Rental Amount</span><span class="fees-value">USD {{ number_format($agreement->total_amount, 2) }}</span></div>
        @endif
    </div>
    <div class="note">All charges are payable in advance unless agreed otherwise in writing. The Deposit may be used for vehicle damage, fines, fuel shortages, excess mileage, towing, cleaning, late returns, administrative costs, or any breach of this Agreement.</div>

    <!-- Legal Clauses -->
    @if($agreement->template_content)
    <div style="margin-top:12px;">
        {!! $agreement->template_content !!}
    </div>
    @endif

    <!-- Signatures -->
    <div class="sig-section">
        <div class="sig-col">
            <div class="sig-label">Renter</div>
            <div class="sig-box">
                @if($agreement->renter_signature)
                <img src="{{ $agreement->renter_signature }}" class="sig-img" alt="Renter signature">
                @else
                <p class="sig-pending">Awaiting signature</p>
                @endif
            </div>
            @if($agreement->renter_signed_at)
            <div class="sig-meta">
                ✓ {{ $agreement->renter_representative_name ?? $agreement->renter_name }} · {{ $agreement->renter_signed_at->format('d M Y H:i') }}
            </div>
            @endif
            <div class="field" style="margin-top:8px;"><div class="field-label">Name</div><div class="field-value">{{ $agreement->renter_name }}</div></div>
            <div class="field"><div class="field-label">Date</div><div class="field-value">{{ $agreement->renter_signed_at?->format('d M Y') ?? '___________________' }}</div></div>
        </div>
        <div class="sig-col">
            <div class="sig-label">Company Representative</div>
            <div class="sig-box">
                @if($agreement->company_signature)
                <img src="{{ $agreement->company_signature }}" class="sig-img" alt="Company signature">
                @else
                <p class="sig-pending">Awaiting signature</p>
                @endif
            </div>
            @if($agreement->company_signed_at)
            <div class="sig-meta">
                ✓ {{ $agreement->company_representative_name ?? 'Laxora Car Rental' }} · {{ $agreement->company_signed_at->format('d M Y H:i') }}
            </div>
            @endif
            <div class="field" style="margin-top:8px;"><div class="field-label">Name</div><div class="field-value">{{ $agreement->company_representative_name ?? '___________________' }}</div></div>
            <div class="field"><div class="field-label">Date</div><div class="field-value">{{ $agreement->company_signed_at?->format('d M Y') ?? '___________________' }}</div></div>
        </div>
    </div>

    <div class="footer">
        Laxora Car Rental · hello@laxora.co.zw · +263 77 000 0000 · Harare, Zimbabwe<br>
        This document is generated electronically and is legally binding.
    </div>

</div>
</body>
</html>
