<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\CashDeclaration;
use App\Models\Customer;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CashDeclarationController extends Controller
{
    public function index(Request $request): Response
    {
        $declarations = CashDeclaration::with([
            'declaredBy:id,name',
            'customer:id,name',
            'booking:id,booking_number',
        ])
            ->when($request->search, fn ($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('declaration_number', 'like', "%{$s}%")
                    ->orWhere('description', 'like', "%{$s}%");
            }))
            ->when($request->source, fn ($q, $s) => $q->where('source', $s))
            ->orderByDesc('declared_at')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (CashDeclaration $d) => [
                'id' => $d->id,
                'declaration_number' => $d->declaration_number,
                'amount' => $d->amount,
                'currency' => $d->currency,
                'source' => $d->source,
                'source_label' => $this->sourceLabel($d->source),
                'reference' => $d->reference,
                'description' => $d->description,
                'declared_by_name' => $d->declaredBy?->name,
                'customer_name' => $d->customer?->name,
                'booking_number' => $d->booking?->booking_number,
                'has_signature' => ! empty($d->signature),
                'declared_at' => $d->declared_at->format('d M Y H:i'),
            ]);

        $totals = CashDeclaration::selectRaw('currency, SUM(amount) as total')
            ->groupBy('currency')
            ->pluck('total', 'currency');

        return Inertia::render('legal/cash-declarations/index', [
            'declarations' => $declarations,
            'filters' => $request->only('search', 'source'),
            'totals' => $totals,
            'sources' => $this->sources(),
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('legal/cash-declarations/create', [
            'customers' => Customer::orderBy('name')->get(['id', 'name']),
            'bookings' => Booking::orderByDesc('created_at')->get(['id', 'booking_number'])->map(fn ($b) => [
                'id' => $b->id,
                'label' => $b->booking_number,
            ]),
            'sources' => $this->sources(),
            'prefill_booking_id' => $request->booking_id,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'currency' => ['required', 'string', 'size:3'],
            'source' => ['required', 'string', 'in:customer_payment,deposit,petty_cash,other'],
            'reference' => ['nullable', 'string', 'max:80'],
            'booking_id' => ['nullable', 'exists:bookings,id'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'description' => ['required', 'string'],
            'signature' => ['nullable', 'string'], // base64 PNG
            'declared_at' => ['required', 'date'],
        ]);

        $declaration = CashDeclaration::create(array_merge($data, [
            'declaration_number' => 'CD-'.strtoupper(Str::random(8)),
            'declared_by' => $request->user()->id,
        ]));

        Inertia::flash('toast', ['type' => 'success', 'message' => "Declaration {$declaration->declaration_number} saved."]);

        return redirect()->route('legal.cash-declarations.show', $declaration);
    }

    public function show(CashDeclaration $cashDeclaration): Response
    {
        $cashDeclaration->load(['declaredBy:id,name', 'customer:id,name', 'booking:id,booking_number']);

        return Inertia::render('legal/cash-declarations/show', [
            'declaration' => [
                'id' => $cashDeclaration->id,
                'declaration_number' => $cashDeclaration->declaration_number,
                'amount' => $cashDeclaration->amount,
                'currency' => $cashDeclaration->currency,
                'source' => $cashDeclaration->source,
                'source_label' => $this->sourceLabel($cashDeclaration->source),
                'reference' => $cashDeclaration->reference,
                'description' => $cashDeclaration->description,
                'declared_by_name' => $cashDeclaration->declaredBy?->name,
                'customer_name' => $cashDeclaration->customer?->name,
                'booking_number' => $cashDeclaration->booking?->booking_number,
                'signature' => $cashDeclaration->signature,
                'declared_at' => $cashDeclaration->declared_at->format('d M Y H:i'),
            ],
        ]);
    }

    public function downloadPdf(CashDeclaration $cashDeclaration): HttpResponse
    {
        $cashDeclaration->load(['declaredBy:id,name', 'customer:id,name', 'booking:id,booking_number']);

        $pdf = Pdf::loadView('pdf.cash-declaration', [
            'declaration' => $cashDeclaration,
        ])->setPaper('a4', 'portrait');

        return $pdf->download("declaration-{$cashDeclaration->declaration_number}.pdf");
    }

    public function destroy(CashDeclaration $cashDeclaration): RedirectResponse
    {
        $cashDeclaration->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Declaration deleted.']);

        return redirect()->route('legal.cash-declarations.index');
    }

    /** @return array<array{value: string, label: string}> */
    private function sources(): array
    {
        return [
            ['value' => 'customer_payment', 'label' => 'Customer Payment'],
            ['value' => 'deposit', 'label' => 'Security Deposit'],
            ['value' => 'petty_cash', 'label' => 'Petty Cash'],
            ['value' => 'other', 'label' => 'Other'],
        ];
    }

    private function sourceLabel(string $source): string
    {
        return match ($source) {
            'customer_payment' => 'Customer Payment',
            'deposit' => 'Security Deposit',
            'petty_cash' => 'Petty Cash',
            default => 'Other',
        };
    }
}
