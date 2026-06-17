<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\Currency;
use App\Enums\QuotationStatus;
use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Quotation;
use App\Models\QuotationItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class QuotationController extends Controller
{
    public function index(Request $request): Response
    {
        $quotations = Quotation::with('customer:id,name', 'creator:id,name')
            ->when($request->search, fn ($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('number', 'like', "%{$s}%")->orWhere('subject', 'like', "%{$s}%");
            }))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->latest('issued_at')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Quotation $q) => [
                'id' => $q->id,
                'number' => $q->number,
                'subject' => $q->subject,
                'customer' => $q->customer ? ['id' => $q->customer->id, 'name' => $q->customer->name] : null,
                'issued_at' => $q->issued_at?->toDateString(),
                'valid_until' => $q->valid_until?->toDateString(),
                'status' => $q->status->value,
                'status_label' => $q->status->label(),
                'status_color' => $q->status->color(),
                'total' => (float) $q->total,
                'currency' => $q->currency->value,
                'created_by' => $q->creator?->name,
            ]);

        return Inertia::render('finance/quotations/index', [
            'quotations' => $quotations,
            'filters' => $request->only('search', 'status'),
            'statuses' => collect(QuotationStatus::cases())->map(fn ($s) => ['value' => $s->value, 'label' => $s->label()]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('finance/quotations/create', [
            'customers' => Customer::orderBy('name')->get(['id', 'name']),
            'currencies' => collect(Currency::cases())->map(fn ($c) => ['value' => $c->value, 'label' => $c->value]),
            'next_number' => $this->generateNumber(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateQuotation($request);
        $items = $this->validateItems($request);

        DB::transaction(function () use ($data, $items) {
            $quotation = Quotation::create([
                ...$data,
                'created_by' => auth()->id(),
            ]);

            foreach ($items as $index => $item) {
                QuotationItem::create([...$item, 'quotation_id' => $quotation->id, 'sort_order' => $index]);
            }

            $quotation->update([
                'subtotal' => collect($items)->sum('total'),
                'total' => collect($items)->sum('total') + ($data['tax'] ?? 0) - ($data['discount'] ?? 0),
            ]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Quotation created.']);

        return redirect()->route('finance.quotations.index');
    }

    public function show(Quotation $quotation): Response
    {
        $quotation->load('customer', 'creator', 'items');

        return Inertia::render('finance/quotations/show', [
            'quotation' => [
                'id' => $quotation->id,
                'number' => $quotation->number,
                'subject' => $quotation->subject,
                'customer' => $quotation->customer ? ['id' => $quotation->customer->id, 'name' => $quotation->customer->name, 'email' => $quotation->customer->email, 'phone' => $quotation->customer->phone] : null,
                'issued_at' => $quotation->issued_at?->toDateString(),
                'valid_until' => $quotation->valid_until?->toDateString(),
                'status' => $quotation->status->value,
                'status_label' => $quotation->status->label(),
                'status_color' => $quotation->status->color(),
                'subtotal' => (float) $quotation->subtotal,
                'tax' => (float) $quotation->tax,
                'discount' => (float) $quotation->discount,
                'total' => (float) $quotation->total,
                'currency' => $quotation->currency->value,
                'notes' => $quotation->notes,
                'terms' => $quotation->terms,
                'created_by' => $quotation->creator?->name,
                'items' => $quotation->items->map(fn (QuotationItem $i) => [
                    'id' => $i->id,
                    'description' => $i->description,
                    'quantity' => (float) $i->quantity,
                    'unit' => $i->unit,
                    'unit_price' => (float) $i->unit_price,
                    'total' => (float) $i->total,
                ]),
            ],
            'statuses' => collect(QuotationStatus::cases())->map(fn ($s) => ['value' => $s->value, 'label' => $s->label()]),
        ]);
    }

    public function updateStatus(Request $request, Quotation $quotation): RedirectResponse
    {
        $data = $request->validate(['status' => ['required', Rule::enum(QuotationStatus::class)]]);

        $quotation->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Status updated.']);

        return back();
    }

    public function destroy(Quotation $quotation): RedirectResponse
    {
        $quotation->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Quotation deleted.']);

        return redirect()->route('finance.quotations.index');
    }

    private function generateNumber(): string
    {
        $year = now()->format('Y');
        $last = Quotation::withTrashed()->where('number', 'like', "QT-{$year}-%")->count();

        return sprintf('QT-%s-%04d', $year, $last + 1);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateQuotation(Request $request): array
    {
        return $request->validate([
            'number' => ['required', 'string', 'unique:quotations,number'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'issued_at' => ['required', 'date'],
            'valid_until' => ['required', 'date', 'after_or_equal:issued_at'],
            'status' => ['nullable', Rule::enum(QuotationStatus::class)],
            'tax' => ['nullable', 'numeric', 'min:0'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', Rule::enum(Currency::class)],
            'subject' => ['nullable', 'string', 'max:200'],
            'notes' => ['nullable', 'string'],
            'terms' => ['nullable', 'string'],
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function validateItems(Request $request): array
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit' => ['nullable', 'string', 'max:30'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        return collect($validated['items'])->map(fn ($item) => [
            'description' => $item['description'],
            'quantity' => $item['quantity'],
            'unit' => $item['unit'] ?? null,
            'unit_price' => $item['unit_price'],
            'total' => round($item['quantity'] * $item['unit_price'], 2),
        ])->all();
    }
}
