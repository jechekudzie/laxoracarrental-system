<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Cash Declaration {{ $declaration->declaration_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 10px; line-height: 1.6; color: #1e293b; background: #fff; }
        .container { max-width: 100%; padding: 30px 40px; }

        .top-bar { height: 5px; background: #c2943f; margin-bottom: 24px; }

        .header { display: table; width: 100%; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; }
        .header-left { display: table-cell; vertical-align: middle; width: 50%; }
        .header-right { display: table-cell; vertical-align: top; text-align: right; }
        .doc-type { font-size: 8px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 2px; }
        .doc-number { font-size: 16px; font-weight: bold; color: #c2943f; margin-top: 3px; font-family: 'DejaVu Sans Mono', monospace; }
        .doc-date { font-size: 7px; color: #94a3b8; margin-top: 3px; }
        .logo { height: 45px; width: auto; }

        /* Amount box */
        .amount-box { border: 2px solid rgba(194,148,63,0.3); border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; background: #fffbf2; }
        .amount-label { font-size: 8px; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px; }
        .amount-value { font-size: 28px; font-weight: bold; color: #c2943f; }

        /* Details grid */
        .details-section { margin: 16px 0; }
        .section-heading { font-size: 8px; font-weight: bold; color: #c2943f; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid rgba(194,148,63,0.2); padding-bottom: 4px; margin-bottom: 10px; }
        .grid-2 { display: table; width: 100%; }
        .grid-col { display: table-cell; width: 50%; vertical-align: top; padding-right: 12px; }
        .field { margin-bottom: 10px; }
        .field-label { font-size: 7px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
        .field-value { font-size: 10px; font-weight: bold; color: #1e293b; margin-top: 1px; }
        .field-value-mono { font-family: 'DejaVu Sans Mono', monospace; }

        /* Source badge */
        .source-badge { display: inline-block; background: #fef3c7; color: #92400e; border-radius: 12px; padding: 2px 10px; font-size: 8px; font-weight: bold; }

        /* Description box */
        .description-box { background: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin: 12px 0; font-size: 10px; color: #374151; }

        /* Signature */
        .sig-section { margin-top: 24px; border-top: 2px solid #e2e8f0; padding-top: 16px; }
        .sig-heading { font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
        .sig-box { border: 1px solid #e2e8f0; border-radius: 4px; height: 80px; background: #f9fafb; overflow: hidden; max-width: 300px; }
        .sig-img { width: 100%; height: 80px; object-fit: contain; }
        .sig-pending { font-size: 8px; color: #94a3b8; text-align: center; padding-top: 28px; }
        .sig-meta { font-size: 7px; color: #16a34a; margin-top: 4px; }
        .sig-underline { display: table; width: 100%; margin-top: 10px; }
        .sig-field { display: table-cell; width: 45%; padding-right: 8%; }
        .sig-field-label { font-size: 7px; color: #94a3b8; text-transform: uppercase; }
        .sig-field-value { font-size: 9px; font-weight: bold; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; margin-top: 2px; min-height: 14px; }

        /* Declaration text */
        .declaration-text { background: #fffbf2; border-left: 3px solid #c2943f; padding: 10px 12px; font-size: 8px; line-height: 1.6; color: #374151; margin: 16px 0; font-style: italic; }

        .footer { margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 8px; font-size: 7px; color: #94a3b8; text-align: center; }
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
            <div class="doc-type">Cash Declaration Receipt</div>
            <div class="doc-number">{{ $declaration->declaration_number }}</div>
            <div class="doc-date">{{ $declaration->declared_at->format('d M Y \a\t H:i') }}</div>
        </div>
    </div>

    <!-- Amount -->
    <div class="amount-box">
        <div class="amount-label">Amount Received</div>
        <div class="amount-value">{{ $declaration->currency }} {{ number_format($declaration->amount, 2) }}</div>
    </div>

    <!-- Declaration Statement -->
    <div class="declaration-text">
        I, <strong>{{ $declaration->declaredBy->name }}</strong>, hereby declare that I have received the above amount of
        <strong>{{ $declaration->currency }} {{ number_format($declaration->amount, 2) }}</strong> in cash on
        <strong>{{ $declaration->declared_at->format('d F Y') }}</strong> at <strong>{{ $declaration->declared_at->format('H:i') }}</strong>.
        This declaration is made in accordance with Laxora Car Rental's cash handling procedures.
    </div>

    <!-- Payment Details -->
    <div class="details-section">
        <div class="section-heading">Payment Details</div>
        <div class="grid-2">
            <div class="grid-col">
                <div class="field">
                    <div class="field-label">Source</div>
                    <div class="field-value"><span class="source-badge">{{ $declaration->source_label }}</span></div>
                </div>
                <div class="field">
                    <div class="field-label">Currency</div>
                    <div class="field-value">{{ $declaration->currency }}</div>
                </div>
                @if($declaration->reference)
                <div class="field">
                    <div class="field-label">Reference Number</div>
                    <div class="field-value field-value-mono">{{ $declaration->reference }}</div>
                </div>
                @endif
            </div>
            <div class="grid-col">
                @if($declaration->customer)
                <div class="field">
                    <div class="field-label">Customer</div>
                    <div class="field-value">{{ $declaration->customer->name }}</div>
                </div>
                @endif
                @if($declaration->booking)
                <div class="field">
                    <div class="field-label">Booking Reference</div>
                    <div class="field-value field-value-mono">{{ $declaration->booking->booking_number }}</div>
                </div>
                @endif
                <div class="field">
                    <div class="field-label">Declared At</div>
                    <div class="field-value">{{ $declaration->declared_at->format('d M Y H:i') }}</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Description -->
    <div class="details-section">
        <div class="section-heading">Description</div>
        <div class="description-box">{{ $declaration->description }}</div>
    </div>

    <!-- Signature -->
    <div class="sig-section">
        <div class="sig-heading">Declaration & Signature</div>
        <div class="sig-box">
            @if($declaration->signature)
            <img src="{{ $declaration->signature }}" class="sig-img" alt="Admin signature">
            @else
            <p class="sig-pending">No signature recorded</p>
            @endif
        </div>
        @if($declaration->signature)
        <div class="sig-meta">✓ Digitally signed by {{ $declaration->declaredBy->name }}</div>
        @endif
        <div class="sig-underline">
            <div class="sig-field">
                <div class="sig-field-label">Received By</div>
                <div class="sig-field-value">{{ $declaration->declaredBy->name }}</div>
            </div>
            <div class="sig-field">
                <div class="sig-field-label">Date</div>
                <div class="sig-field-value">{{ $declaration->declared_at->format('d M Y') }}</div>
            </div>
        </div>
    </div>

    <div class="footer">
        Laxora Car Rental · hello@laxora.co.zw · +263 77 000 0000 · Harare, Zimbabwe<br>
        This document is a legally binding cash declaration receipt.
    </div>

</div>
</body>
</html>
