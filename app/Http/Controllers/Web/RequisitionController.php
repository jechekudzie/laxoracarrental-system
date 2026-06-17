<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\Priority;
use App\Enums\RequisitionStatus;
use App\Http\Controllers\Controller;
use App\Models\CostCenter;
use App\Models\Requisition;
use App\Models\RequisitionItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RequisitionController extends Controller
{
    public function index(Request $request): Response
    {
        $requisitions = Requisition::with('costCenter:id,name,code', 'requestedBy:id,name')
            ->when($request->search, fn ($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('number', 'like', "%{$s}%")->orWhere('title', 'like', "%{$s}%");
            }))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->priority, fn ($q, $p) => $q->where('priority', $p))
            ->when($request->cost_center_id, fn ($q, $id) => $q->where('cost_center_id', $id))
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Requisition $r) => [
                'id' => $r->id,
                'number' => $r->number,
                'title' => $r->title,
                'status' => $r->status->value,
                'status_label' => $r->status->label(),
                'status_color' => $r->status->color(),
                'priority' => $r->priority->value,
                'priority_label' => $r->priority->label(),
                'priority_color' => $r->priority->color(),
                'required_by' => $r->required_by?->toDateString(),
                'total_estimated' => (float) $r->total_estimated,
                'cost_center' => $r->costCenter ? ['id' => $r->costCenter->id, 'name' => $r->costCenter->name] : null,
                'requested_by' => $r->requestedBy?->name,
                'created_at' => $r->created_at?->toDateString(),
            ]);

        return Inertia::render('finance/requisitions/index', [
            'requisitions' => $requisitions,
            'filters' => $request->only('search', 'status', 'priority', 'cost_center_id'),
            'statuses' => collect(RequisitionStatus::cases())->map(fn ($s) => ['value' => $s->value, 'label' => $s->label()]),
            'priorities' => collect(Priority::cases())->map(fn ($p) => ['value' => $p->value, 'label' => $p->label()]),
            'cost_centers' => CostCenter::where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('finance/requisitions/create', [
            'cost_centers' => CostCenter::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'priorities' => collect(Priority::cases())->map(fn ($p) => ['value' => $p->value, 'label' => $p->label()]),
            'next_number' => $this->generateNumber(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateRequisition($request);
        $items = $this->validateItems($request);

        DB::transaction(function () use ($data, $items) {
            $requisition = Requisition::create([
                ...$data,
                'requested_by' => auth()->id(),
                'total_estimated' => collect($items)->sum('total_estimated'),
            ]);

            foreach ($items as $item) {
                RequisitionItem::create([...$item, 'requisition_id' => $requisition->id]);
            }
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Requisition submitted.']);

        return redirect()->route('finance.requisitions.index');
    }

    public function show(Requisition $requisition): Response
    {
        $requisition->load('costCenter', 'requestedBy', 'approvedBy', 'items');

        return Inertia::render('finance/requisitions/show', [
            'requisition' => [
                'id' => $requisition->id,
                'number' => $requisition->number,
                'title' => $requisition->title,
                'description' => $requisition->description,
                'status' => $requisition->status->value,
                'status_label' => $requisition->status->label(),
                'status_color' => $requisition->status->color(),
                'priority' => $requisition->priority->value,
                'priority_label' => $requisition->priority->label(),
                'priority_color' => $requisition->priority->color(),
                'required_by' => $requisition->required_by?->toDateString(),
                'total_estimated' => (float) $requisition->total_estimated,
                'total_actual' => $requisition->total_actual ? (float) $requisition->total_actual : null,
                'rejection_reason' => $requisition->rejection_reason,
                'notes' => $requisition->notes,
                'approved_at' => $requisition->approved_at?->toDateTimeString(),
                'fulfilled_at' => $requisition->fulfilled_at?->toDateTimeString(),
                'cost_center' => $requisition->costCenter ? ['id' => $requisition->costCenter->id, 'name' => $requisition->costCenter->name] : null,
                'requested_by' => $requisition->requestedBy?->name,
                'approved_by' => $requisition->approvedBy?->name,
                'items' => $requisition->items->map(fn (RequisitionItem $i) => [
                    'id' => $i->id,
                    'description' => $i->description,
                    'quantity' => (float) $i->quantity,
                    'unit' => $i->unit,
                    'unit_price_estimated' => (float) $i->unit_price_estimated,
                    'total_estimated' => (float) $i->total_estimated,
                    'unit_price_actual' => $i->unit_price_actual ? (float) $i->unit_price_actual : null,
                    'total_actual' => $i->total_actual ? (float) $i->total_actual : null,
                    'supplier_name' => $i->supplier_name,
                ]),
                'created_at' => $requisition->created_at?->toDateString(),
            ],
        ]);
    }

    public function approve(Requisition $requisition): RedirectResponse
    {
        $requisition->update([
            'status' => RequisitionStatus::Approved,
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Requisition approved.']);

        return back();
    }

    public function reject(Request $request, Requisition $requisition): RedirectResponse
    {
        $data = $request->validate(['rejection_reason' => ['required', 'string']]);

        $requisition->update([
            'status' => RequisitionStatus::Rejected,
            'rejection_reason' => $data['rejection_reason'],
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Requisition rejected.']);

        return back();
    }

    public function fulfill(Requisition $requisition): RedirectResponse
    {
        $requisition->update([
            'status' => RequisitionStatus::Fulfilled,
            'fulfilled_at' => now(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Requisition marked as fulfilled.']);

        return back();
    }

    public function destroy(Requisition $requisition): RedirectResponse
    {
        $requisition->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Requisition deleted.']);

        return redirect()->route('finance.requisitions.index');
    }

    private function generateNumber(): string
    {
        $year = now()->format('Y');
        $last = Requisition::withTrashed()->where('number', 'like', "REQ-{$year}-%")->count();

        return sprintf('REQ-%s-%04d', $year, $last + 1);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateRequisition(Request $request): array
    {
        return $request->validate([
            'number' => ['required', 'string', 'unique:requisitions,number'],
            'cost_center_id' => ['nullable', 'exists:cost_centers,id'],
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'required_by' => ['nullable', 'date'],
            'priority' => ['nullable', Rule::enum(Priority::class)],
            'notes' => ['nullable', 'string'],
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
            'items.*.unit_price_estimated' => ['required', 'numeric', 'min:0'],
            'items.*.supplier_name' => ['nullable', 'string', 'max:120'],
        ]);

        return collect($validated['items'])->map(fn ($item) => [
            'description' => $item['description'],
            'quantity' => $item['quantity'],
            'unit' => $item['unit'] ?? null,
            'unit_price_estimated' => $item['unit_price_estimated'],
            'total_estimated' => round($item['quantity'] * $item['unit_price_estimated'], 2),
            'supplier_name' => $item['supplier_name'] ?? null,
        ])->all();
    }
}
