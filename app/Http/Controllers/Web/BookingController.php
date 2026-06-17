<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\BookingStatus;
use App\Enums\Currency;
use App\Enums\InspectionType;
use App\Enums\InvoiceStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Vehicle;
use App\Services\BookingService;
use App\Services\InspectionService;
use App\Services\InvoiceService;
use App\Services\RatingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    public function __construct(private BookingService $bookings) {}

    public function index(Request $request): Response
    {
        $bookings = Booking::with(['customer', 'vehicle'])
            ->when($request->search, fn ($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('reference', 'like', "%{$s}%")
                    ->orWhereHas('customer', fn ($q) => $q->where('name', 'like', "%{$s}%"))
                    ->orWhereHas('vehicle', fn ($q) => $q->where('reg_plate', 'like', "%{$s}%"));
            }))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Booking $b) => [
                'id' => $b->id,
                'reference' => $b->reference,
                'customer_name' => $b->customer->name,
                'vehicle' => $b->vehicle->make.' '.$b->vehicle->model,
                'reg_plate' => $b->vehicle->reg_plate,
                'status' => $b->status->value,
                'pickup_datetime' => $b->pickup_datetime,
                'return_datetime' => $b->return_datetime,
                'total_amount' => (float) $b->total_amount,
                'currency' => $b->currency->value,
            ]);

        return Inertia::render('bookings/index', [
            'bookings' => $bookings,
            'filters' => $request->only('search', 'status'),
            'statuses' => collect(BookingStatus::cases())->map(fn ($e) => ['value' => $e->value, 'label' => ucfirst($e->value)]),
        ]);
    }

    public function create(): Response
    {
        $vehicles = Vehicle::with('bookingCategory')
            ->where('status', 'available')
            ->orderBy('make')
            ->get(['id', 'make', 'model', 'reg_plate', 'daily_rate', 'currency', 'booking_category_id', 'current_odometer']);

        return Inertia::render('bookings/create', [
            'customers' => Customer::orderBy('name')->get(['id', 'name', 'phone', 'status']),
            'vehicles' => $vehicles->map(fn (Vehicle $v) => [
                'id' => $v->id,
                'make' => $v->make,
                'model' => $v->model,
                'reg_plate' => $v->reg_plate,
                'daily_rate' => (float) $v->daily_rate,
                'currency' => $v->currency?->value ?? 'USD',
                'current_odometer' => (int) ($v->current_odometer ?? 0),
                'booking_category' => $v->bookingCategory ? [
                    'id' => $v->bookingCategory->id,
                    'name' => $v->bookingCategory->name,
                    'security_deposit' => (float) $v->bookingCategory->security_deposit,
                    'km_per_day_limit' => $v->bookingCategory->km_per_day_limit,
                    'excess_km_rate' => (float) $v->bookingCategory->excess_km_rate,
                    'fuel_charge_per_level' => (float) $v->bookingCategory->fuel_charge_per_level,
                    'currency' => $v->bookingCategory->currency?->value ?? 'USD',
                ] : null,
            ])->values(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'vehicle_id' => ['required', 'integer', 'exists:vehicles,id'],
            'pickup_datetime' => ['required', 'date'],
            'return_datetime' => ['required', 'date', 'after:pickup_datetime'],
            'pickup_location' => ['nullable', 'string', 'max:200'],
            'return_location' => ['nullable', 'string', 'max:200'],
            'fuel_level_pickup' => ['nullable', 'string', 'in:empty,quarter,half,three_quarter,full'],
            'odometer_start' => ['nullable', 'integer', 'min:0'],
            'cross_border' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
        ]);

        $booking = $this->bookings->create($data, $request->user());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Booking created: '.$booking->reference]);

        return to_route('bookings.show', $booking);
    }

    public function show(Booking $booking): Response
    {
        $booking->load(['customer', 'vehicle', 'inspections', 'rating', 'invoice', 'payments' => fn ($q) => $q->latest('paid_at')]);

        $completedPayments = $booking->payments->where('status', PaymentStatus::Completed);
        $depositHeld = (float) $completedPayments->where('type', PaymentType::Deposit)->sum('amount');
        $depositRefunded = (float) $completedPayments->where('type', PaymentType::DepositRefund)->sum('amount');
        $rentalPaid = (float) $completedPayments->where('type', PaymentType::Rental)->sum('amount');
        $depositBalance = $depositHeld - $depositRefunded;

        $suggestedRefund = max(
            0.0,
            $depositBalance - (float) $booking->mileage_overage_amount - (float) $booking->damage_charge - (float) $booking->fuel_charge
        );

        return Inertia::render('bookings/show', [
            'booking' => [
                'id' => $booking->id,
                'reference' => $booking->reference,
                'status' => $booking->status->value,
                'cross_border' => (bool) $booking->cross_border,
                'customer' => [
                    'id' => $booking->customer->id,
                    'name' => $booking->customer->name,
                    'phone' => $booking->customer->phone,
                    'email' => $booking->customer->email,
                ],
                'vehicle' => [
                    'id' => $booking->vehicle->id,
                    'make' => $booking->vehicle->make,
                    'model' => $booking->vehicle->model,
                    'year' => $booking->vehicle->year,
                    'label' => $booking->vehicle->make.' '.$booking->vehicle->model.' ('.$booking->vehicle->reg_plate.')',
                    'reg_plate' => $booking->vehicle->reg_plate,
                ],
                'invoice' => $booking->invoice ? [
                    'id' => $booking->invoice->id,
                    'number' => $booking->invoice->number,
                    'status' => $booking->invoice->status->value,
                    'total' => (float) $booking->invoice->total,
                    'paid_amount' => (float) $booking->invoice->paid_amount,
                ] : null,
                'pickup_datetime' => $booking->pickup_datetime,
                'return_datetime' => $booking->return_datetime,
                'actual_pickup_at' => $booking->actual_pickup_at,
                'actual_return_at' => $booking->actual_return_at,
                'pickup_location' => $booking->pickup_location,
                'return_location' => $booking->return_location,
                'rental_days' => $booking->rental_days,
                'km_allowance' => $booking->km_allowance,
                'daily_rate' => (float) $booking->daily_rate,
                'excess_km_rate' => (float) $booking->excess_km_rate,
                'currency' => $booking->currency->value,
                'odometer_start' => $booking->odometer_start,
                'odometer_end' => $booking->odometer_end,
                'base_amount' => (float) $booking->base_amount,
                'mileage_overage_amount' => (float) $booking->mileage_overage_amount,
                'extras_amount' => (float) $booking->extras_amount,
                'fuel_charge' => (float) $booking->fuel_charge,
                'damage_charge' => (float) $booking->damage_charge,
                'total_amount' => (float) $booking->total_amount,
                'deposit_amount' => (float) $booking->deposit_amount,
                'paid_amount' => (float) $booking->paid_amount,
                'notes' => $booking->notes,
                'cancellation_reason' => $booking->cancellation_reason,
                'created_at' => $booking->created_at,
                'inspections' => $booking->inspections->map(fn ($i) => [
                    'id' => $i->id,
                    'type' => $i->type->value,
                    'odometer' => $i->odometer,
                    'fuel_level' => $i->fuel_level,
                    'items' => $i->items,
                    'exterior_notes' => $i->exterior_notes,
                    'damage_summary' => $i->damage_summary,
                    'created_at' => $i->created_at,
                ]),
                'rating' => $booking->rating ? [
                    'score_condition' => $booking->rating->score_condition,
                    'score_timeliness' => $booking->rating->score_timeliness,
                    'score_payment' => $booking->rating->score_payment,
                    'score_communication' => $booking->rating->score_communication,
                    'score_care' => $booking->rating->score_care,
                    'average' => (float) $booking->rating->average,
                    'comment' => $booking->rating->comment,
                ] : null,
                'payments' => $booking->payments->map(fn (Payment $p) => [
                    'id' => $p->id,
                    'reference' => $p->reference,
                    'type' => $p->type?->value ?? 'rental',
                    'type_label' => $p->type?->label() ?? 'Rental Payment',
                    'amount' => (float) $p->amount,
                    'method' => $p->method->value,
                    'status' => $p->status->value,
                    'gateway_reference' => $p->gateway_reference,
                    'paid_at' => $p->paid_at,
                    'notes' => $p->notes,
                ])->values(),
                'deposit_summary' => [
                    'held' => $depositHeld,
                    'refunded' => $depositRefunded,
                    'balance' => $depositBalance,
                    'expected' => (float) $booking->deposit_amount,
                    'suggested_refund' => round($suggestedRefund, 2),
                    'charges_from_deposit' => [
                        'mileage' => (float) $booking->mileage_overage_amount,
                        'damage' => (float) $booking->damage_charge,
                        'fuel' => (float) $booking->fuel_charge,
                    ],
                ],
                'rental_paid' => $rentalPaid,
            ],
            'paymentMethods' => collect(PaymentMethod::cases())->map(fn ($e) => [
                'value' => $e->value,
                'label' => $this->paymentMethodLabel($e),
            ]),
            'paymentTypes' => collect(PaymentType::cases())
                ->filter(fn ($t) => $t !== PaymentType::DepositRefund && $t !== PaymentType::Refund)
                ->values()
                ->map(fn ($e) => ['value' => $e->value, 'label' => $e->label()]),
        ]);
    }

    private function paymentMethodLabel(PaymentMethod $m): string
    {
        return match ($m) {
            PaymentMethod::Cash => 'Cash',
            PaymentMethod::EcoCash => 'EcoCash',
            PaymentMethod::OneMoney => 'OneMoney',
            PaymentMethod::BankTransfer => 'Bank Transfer',
            PaymentMethod::Card => 'Card',
            PaymentMethod::Wallet => 'Customer Wallet',
        };
    }

    public function storePayment(Request $request, Booking $booking): RedirectResponse
    {
        $data = $request->validate([
            'type' => ['required', 'string', 'in:rental,deposit'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'method' => ['required', 'string', 'in:cash,ecocash,onemoney,bank_transfer,card,wallet'],
            'gateway_reference' => ['nullable', 'string', 'max:120'],
            'paid_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $payment = DB::transaction(function () use ($booking, $data, $request) {
            $payment = Payment::create([
                'reference' => 'PAY-'.strtoupper(Str::random(8)),
                'booking_id' => $booking->id,
                'invoice_id' => $booking->invoice?->id,
                'customer_id' => $booking->customer_id,
                'recorded_by_user_id' => $request->user()?->id,
                'type' => $data['type'],
                'amount' => $data['amount'],
                'currency' => Currency::USD,
                'method' => $data['method'],
                'gateway_reference' => $data['gateway_reference'] ?? null,
                'status' => PaymentStatus::Completed,
                'paid_at' => $data['paid_at'] ?? now(),
                'notes' => $data['notes'] ?? null,
            ]);

            // Update booking paid_amount (rental payments only; deposit is tracked separately).
            if ($data['type'] === 'rental') {
                $booking->increment('paid_amount', (float) $data['amount']);

                // Roll the rental payment into the invoice balance/status if there is one.
                $this->syncInvoiceFromPayments($booking);
            }

            return $payment;
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Payment recorded.']);
        Inertia::flash('payment_recorded', $payment->id);

        return back();
    }

    /**
     * Recompute the invoice's paid_amount from the sum of completed rental
     * payments and roll the status forward (sent → partially_paid → paid).
     * Idempotent — safe to call any time payments change.
     */
    private function syncInvoiceFromPayments(Booking $booking): void
    {
        $invoice = $booking->invoice()->first();
        if ($invoice === null) {
            return;
        }

        $rentalPaid = (float) Payment::query()
            ->where('invoice_id', $invoice->id)
            ->where('status', PaymentStatus::Completed)
            ->where('type', PaymentType::Rental)
            ->sum('amount');

        $total = (float) $invoice->total;
        $status = $rentalPaid <= 0
            ? ($invoice->status === InvoiceStatus::Draft ? InvoiceStatus::Draft : InvoiceStatus::Sent)
            : ($rentalPaid + 0.01 >= $total ? InvoiceStatus::Paid : InvoiceStatus::PartiallyPaid);

        $invoice->update([
            'paid_amount' => $rentalPaid,
            'status' => $status,
        ]);
    }

    public function refundDeposit(Request $request, Booking $booking): RedirectResponse
    {
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:0'],
            'method' => ['required', 'string', 'in:cash,ecocash,onemoney,bank_transfer,card,wallet'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $booking->load('payments');
        $heldDeposit = (float) $booking->payments
            ->where('status', PaymentStatus::Completed)
            ->where('type', PaymentType::Deposit)
            ->sum('amount');
        $alreadyRefunded = (float) $booking->payments
            ->where('status', PaymentStatus::Completed)
            ->where('type', PaymentType::DepositRefund)
            ->sum('amount');
        $available = $heldDeposit - $alreadyRefunded;

        if ($data['amount'] > $available + 0.01) {
            return back()->withErrors(['amount' => "Refund exceeds available deposit balance of \${$available}."]);
        }

        Payment::create([
            'reference' => 'REF-'.strtoupper(Str::random(8)),
            'booking_id' => $booking->id,
            'invoice_id' => $booking->invoice?->id,
            'customer_id' => $booking->customer_id,
            'recorded_by_user_id' => $request->user()?->id,
            'type' => PaymentType::DepositRefund,
            'amount' => $data['amount'],
            'currency' => Currency::USD,
            'method' => $data['method'],
            'status' => PaymentStatus::Completed,
            'paid_at' => now(),
            'notes' => $data['notes'] ?? null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Deposit refunded.']);

        return back();
    }

    public function destroyPayment(Booking $booking, Payment $payment): RedirectResponse
    {
        abort_unless($payment->booking_id === $booking->id, 404);

        if ($payment->type === PaymentType::Rental && $payment->status === PaymentStatus::Completed) {
            $booking->decrement('paid_amount', (float) $payment->amount);
        }

        $payment->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Payment removed.']);

        return back();
    }

    public function confirm(Booking $booking): RedirectResponse
    {
        $this->bookings->confirm($booking);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Booking confirmed.']);

        return back();
    }

    public function activate(Request $request, Booking $booking): RedirectResponse
    {
        $data = $request->validate([
            'odometer_start' => ['required', 'integer', 'min:0'],
        ]);

        $this->bookings->activate($booking, (int) $data['odometer_start'], $request->user());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Booking activated — vehicle is now rented.']);

        return back();
    }

    /**
     * Render the "Return vehicle" form — same UX as the mobile end-rental
     * screen: odometer + fuel + damage inputs, all the rates needed to
     * compute the reconciliation preview client-side.
     *
     * Named `createCompletion` (not `completeForm`) so the Wayfinder
     * generator doesn't collide with `complete.form` on the sibling
     * `complete` action, which also wants to declare a `completeForm`
     * variable.
     */
    public function createCompletion(Booking $booking): Response
    {
        abort_unless(
            $booking->status === BookingStatus::Active,
            422,
            'Only active bookings can be returned.',
        );

        $booking->load(['customer', 'vehicle.bookingCategory', 'payments']);
        $category = $booking->vehicle->bookingCategory;
        abort_if(
            $category === null,
            422,
            'Vehicle has no booking category — cannot complete.',
        );

        $depositHeld = (float) $booking->payments
            ->where('status', PaymentStatus::Completed)
            ->where('type', PaymentType::Deposit)
            ->sum('amount');
        $depositRefunded = (float) $booking->payments
            ->where('status', PaymentStatus::Completed)
            ->where('type', PaymentType::DepositRefund)
            ->sum('amount');

        return Inertia::render('bookings/complete-booking', [
            'booking' => [
                'id' => $booking->id,
                'reference' => $booking->reference,
                'status' => $booking->status->value,
                'customer' => [
                    'name' => $booking->customer->name,
                    'phone' => $booking->customer->phone,
                ],
                'vehicle' => [
                    'label' => $booking->vehicle->make.' '.$booking->vehicle->model,
                    'reg_plate' => $booking->vehicle->reg_plate,
                ],
                'currency' => $booking->currency->value,
                'rental_days' => (int) $booking->rental_days,
                'daily_rate' => (float) $booking->daily_rate,
                'base_amount' => (float) $booking->base_amount,
                'extras_amount' => (float) $booking->extras_amount,
                'km_allowance' => (int) $booking->km_allowance,
                'odometer_start' => (int) ($booking->odometer_start ?? 0),
                'fuel_level_pickup' => $booking->fuel_level_pickup,
                'deposit_amount' => (float) $booking->deposit_amount,
                'deposit_held' => round($depositHeld, 2),
                'deposit_refunded' => round($depositRefunded, 2),
                // Snapshotted rates so the client-side preview stays honest
                // even if the category is later retuned.
                'excess_km_rate' => (float) $booking->excess_km_rate,
                'fuel_charge_per_level' => (float) $category->fuel_charge_per_level,
            ],
        ]);
    }

    public function complete(Request $request, Booking $booking): RedirectResponse
    {
        $data = $request->validate([
            'odometer_end' => ['required', 'integer', 'min:0'],
            'fuel_level_return' => ['nullable', 'string', 'in:empty,quarter,half,three_quarter,full'],
            'damage_charge' => ['nullable', 'numeric', 'min:0'],
        ]);

        // Stamp damage on the row first so BookingService::complete picks it
        // up when running the quote + deposit reconciliation.
        if (array_key_exists('damage_charge', $data)) {
            $booking->update(['damage_charge' => $data['damage_charge'] ?? 0]);
        }

        $fuelLevelReturn = $data['fuel_level_return'] ?? null;
        $this->bookings->complete(
            $booking,
            (int) $data['odometer_end'],
            $request->user(),
            $fuelLevelReturn,
        );

        // Auto-generate invoice on completion if one doesn't exist
        $this->ensureInvoiceExists($booking->refresh());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Booking completed. Invoice generated.']);

        return to_route('bookings.show', $booking);
    }

    public function generateInvoice(Booking $booking): RedirectResponse
    {
        $this->ensureInvoiceExists($booking);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Invoice generated.']);

        return back();
    }

    private function ensureInvoiceExists(Booking $booking): Invoice
    {
        $booking->loadMissing('invoice', 'vehicle', 'payments');

        // Single source of truth: delegate to InvoiceService which writes
        // the canonical {description, quantity, unit_amount, total} line-item
        // shape shared by mobile + web readers.
        $invoice = app(InvoiceService::class)->generateForBooking($booking);

        // Back-link existing payments to the invoice so the history reads
        // cleanly (this is idempotent — the service returns early if the
        // invoice already existed).
        Payment::where('booking_id', $booking->id)
            ->whereNull('invoice_id')
            ->update(['invoice_id' => $invoice->id]);

        return $invoice;
    }

    public function cancel(Request $request, Booking $booking): RedirectResponse
    {
        $data = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $this->bookings->cancel($booking, $data['reason'], $request->user());

        Inertia::flash('toast', ['type' => 'warning', 'message' => 'Booking cancelled.']);

        return back();
    }

    /**
     * Render the inspection-capture form (pickup or return). Mirrors the
     * mobile InspectionCaptureScreen: checklist items seeded from the
     * canonical config, plus the existing inspection (if any) so staff can
     * edit rather than duplicate.
     */
    public function createInspection(Request $request, Booking $booking): Response
    {
        $type = $request->string('type')->toString();
        abort_unless(in_array($type, ['pickup', 'return'], true), 422, 'type must be pickup or return');

        $booking->load(['customer', 'vehicle', 'inspections']);
        $existing = $booking->inspections->firstWhere('type', InspectionType::from($type));

        $templateItems = config('inspections.items', []);
        $existingItemsByKey = collect($existing?->items ?? [])->keyBy('key');

        // Merge the canonical template with any already-filled values so
        // staff can quickly edit a previously-recorded inspection.
        $items = collect($templateItems)
            ->map(function (array $tpl) use ($existingItemsByKey) {
                $prev = $existingItemsByKey->get($tpl['key']);

                return [
                    'key' => $tpl['key'],
                    'label' => $tpl['label'],
                    'condition' => $prev['condition'] ?? null,
                    'notes' => $prev['notes'] ?? '',
                ];
            })
            ->values()
            ->all();

        return Inertia::render('bookings/inspection-form', [
            'booking' => [
                'id' => $booking->id,
                'reference' => $booking->reference,
                'status' => $booking->status->value,
                'customer' => [
                    'name' => $booking->customer->name,
                    'phone' => $booking->customer->phone,
                ],
                'vehicle' => [
                    'label' => $booking->vehicle->make.' '.$booking->vehicle->model,
                    'reg_plate' => $booking->vehicle->reg_plate,
                    'current_odometer' => (int) $booking->vehicle->current_odometer,
                ],
                'odometer_start' => $booking->odometer_start,
                'odometer_end' => $booking->odometer_end,
                'fuel_level_pickup' => $booking->fuel_level_pickup,
                'fuel_level_return' => $booking->fuel_level_return,
            ],
            'type' => $type,
            'items' => $items,
            'existing' => $existing ? [
                'odometer' => $existing->odometer,
                'fuel_level' => $existing->fuel_level,
                'exterior_notes' => $existing->exterior_notes,
                'interior_notes' => $existing->interior_notes,
                'damage_summary' => $existing->damage_summary,
                'customer_signature_name' => $existing->customer_signature_name,
                'signed_by_customer' => (bool) $existing->signed_by_customer,
                'photos' => $existing->photos ?? [],
            ] : null,
        ]);
    }

    public function storeInspection(
        Request $request,
        Booking $booking,
        InspectionService $inspections,
    ): RedirectResponse {
        $data = $request->validate([
            'type' => ['required', Rule::enum(InspectionType::class)],
            'odometer' => ['nullable', 'integer', 'min:0'],
            'fuel_level' => ['nullable', 'string', 'in:empty,quarter,half,three_quarter,full'],
            'items' => ['nullable', 'array'],
            'items.*.key' => ['required_with:items.*.condition', 'string', 'max:80'],
            'items.*.label' => ['nullable', 'string', 'max:120'],
            'items.*.condition' => ['nullable', 'string', 'in:ok,fair,poor,damaged,missing'],
            'items.*.notes' => ['nullable', 'string', 'max:500'],
            'photos' => ['nullable', 'array'],
            'photos.*' => ['string'],
            'exterior_notes' => ['nullable', 'string'],
            'interior_notes' => ['nullable', 'string'],
            'damage_summary' => ['nullable', 'string'],
            'signed_by_customer' => ['nullable', 'boolean'],
            'customer_signature_name' => ['nullable', 'string', 'max:120'],
        ]);

        // Strip any rows the operator left blank (no condition picked).
        $data['items'] = collect($data['items'] ?? [])
            ->filter(fn ($i) => ! empty($i['condition']))
            ->values()
            ->all();

        $inspections->record(
            $booking,
            InspectionType::from($data['type']),
            $data,
            $request->user(),
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => ucfirst($data['type']).' inspection recorded.',
        ]);

        return to_route('bookings.show', $booking);
    }

    public function createRating(Request $request, Booking $booking): Response
    {
        abort_unless(
            $booking->status === BookingStatus::Completed,
            422,
            'Ratings can only be recorded on completed bookings.',
        );

        $booking->load(['customer', 'vehicle', 'rating']);

        return Inertia::render('bookings/rate-customer', [
            'booking' => [
                'id' => $booking->id,
                'reference' => $booking->reference,
                'customer' => [
                    'id' => $booking->customer->id,
                    'name' => $booking->customer->name,
                    'average_rating' => $booking->customer->average_rating
                        ? (float) $booking->customer->average_rating
                        : null,
                    'ratings_count' => (int) ($booking->customer->ratings_count ?? 0),
                ],
                'vehicle' => [
                    'label' => $booking->vehicle->make.' '.$booking->vehicle->model,
                    'reg_plate' => $booking->vehicle->reg_plate,
                ],
            ],
            'existing' => $booking->rating ? [
                'score_condition' => (int) $booking->rating->score_condition,
                'score_timeliness' => (int) $booking->rating->score_timeliness,
                'score_payment' => (int) $booking->rating->score_payment,
                'score_communication' => (int) $booking->rating->score_communication,
                'score_care' => (int) $booking->rating->score_care,
                'comment' => $booking->rating->comment,
            ] : null,
        ]);
    }

    public function storeRating(
        Request $request,
        Booking $booking,
        RatingService $ratings,
    ): RedirectResponse {
        $data = $request->validate([
            'score_condition' => ['required', 'integer', 'between:1,5'],
            'score_timeliness' => ['required', 'integer', 'between:1,5'],
            'score_payment' => ['required', 'integer', 'between:1,5'],
            'score_communication' => ['required', 'integer', 'between:1,5'],
            'score_care' => ['required', 'integer', 'between:1,5'],
            'comment' => ['nullable', 'string', 'max:2000'],
        ]);

        $ratings->rate($booking, $data, $request->user());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Customer rated.',
        ]);

        return to_route('bookings.show', $booking);
    }
}
