<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\Currency;
use App\Enums\PaymentMethod;
use App\Enums\VendorPaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\CostCenter;
use App\Models\ServiceProvider;
use App\Models\ServiceProviderPayment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class VendorPaymentController extends Controller
{
    public function index(Request $request): Response
    {
        $payments = ServiceProviderPayment::with('serviceProvider:id,name,category', 'costCenter:id,name')
            ->when($request->search, fn ($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('description', 'like', "%{$s}%")
                    ->orWhere('reference_number', 'like', "%{$s}%")
                    ->orWhere('provider_invoice_number', 'like', "%{$s}%");
            }))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->service_provider_id, fn ($q, $id) => $q->where('service_provider_id', $id))
            ->when($request->cost_center_id, fn ($q, $id) => $q->where('cost_center_id', $id))
            ->latest('invoice_date')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (ServiceProviderPayment $p) => [
                'id' => $p->id,
                'description' => $p->description,
                'reference_number' => $p->reference_number,
                'provider_invoice_number' => $p->provider_invoice_number,
                'amount' => (float) $p->amount,
                'currency' => $p->currency->value,
                'invoice_date' => $p->invoice_date?->toDateString(),
                'due_date' => $p->due_date?->toDateString(),
                'payment_date' => $p->payment_date?->toDateString(),
                'status' => $p->status->value,
                'status_label' => $p->status->label(),
                'status_color' => $p->status->color(),
                'service_provider' => $p->serviceProvider ? ['id' => $p->serviceProvider->id, 'name' => $p->serviceProvider->name] : null,
                'cost_center' => $p->costCenter ? ['id' => $p->costCenter->id, 'name' => $p->costCenter->name] : null,
            ]);

        $totalPending = ServiceProviderPayment::where('status', VendorPaymentStatus::Pending)->sum('amount');
        $totalOverdue = ServiceProviderPayment::where('status', VendorPaymentStatus::Overdue)->sum('amount');

        return Inertia::render('finance/vendor-payments/index', [
            'payments' => $payments,
            'filters' => $request->only('search', 'status', 'service_provider_id', 'cost_center_id'),
            'statuses' => collect(VendorPaymentStatus::cases())->map(fn ($s) => ['value' => $s->value, 'label' => $s->label()]),
            'service_providers' => ServiceProvider::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'cost_centers' => CostCenter::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'payment_methods' => collect(PaymentMethod::cases())->map(fn ($m) => ['value' => $m->value, 'label' => ucfirst(str_replace('_', ' ', $m->value))]),
            'currencies' => collect(Currency::cases())->map(fn ($c) => ['value' => $c->value, 'label' => $c->value]),
            'summary' => [
                'total_pending' => (float) $totalPending,
                'total_overdue' => (float) $totalOverdue,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validatePayment($request);

        ServiceProviderPayment::create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Vendor payment recorded.']);

        return back();
    }

    public function update(Request $request, ServiceProviderPayment $vendorPayment): RedirectResponse
    {
        $data = $this->validatePayment($request);

        $vendorPayment->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Payment updated.']);

        return back();
    }

    public function markPaid(Request $request, ServiceProviderPayment $vendorPayment): RedirectResponse
    {
        $data = $request->validate([
            'payment_date' => ['required', 'date'],
            'payment_method' => ['nullable', Rule::enum(PaymentMethod::class)],
        ]);

        $vendorPayment->update([
            ...$data,
            'status' => VendorPaymentStatus::Paid,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Payment marked as paid.']);

        return back();
    }

    public function destroy(ServiceProviderPayment $vendorPayment): RedirectResponse
    {
        $vendorPayment->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Payment record deleted.']);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function validatePayment(Request $request): array
    {
        return $request->validate([
            'service_provider_id' => ['required', 'exists:service_providers,id'],
            'cost_center_id' => ['nullable', 'exists:cost_centers,id'],
            'reference_number' => ['nullable', 'string', 'max:60'],
            'provider_invoice_number' => ['nullable', 'string', 'max:60'],
            'description' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'currency' => ['nullable', Rule::enum(Currency::class)],
            'invoice_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date'],
            'payment_date' => ['nullable', 'date'],
            'payment_method' => ['nullable', Rule::enum(PaymentMethod::class)],
            'status' => ['nullable', Rule::enum(VendorPaymentStatus::class)],
            'notes' => ['nullable', 'string'],
        ]);
    }
}
