<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\CustomerStatus;
use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Services\CustomerService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function __construct(private CustomerService $customers) {}

    public function index(Request $request): Response
    {
        $customers = Customer::query()
            ->when($request->search, fn ($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('phone', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%")
                    ->orWhere('id_number', 'like', "%{$s}%");
            }))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Customer $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'phone' => $c->phone,
                'email' => $c->email,
                'status' => $c->status->value,
                'ratings_count' => $c->ratings_count,
                'average_rating' => $c->average_rating ? round((float) $c->average_rating, 1) : null,
            ]);

        return Inertia::render('customers/index', [
            'customers' => $customers,
            'filters' => $request->only('search', 'status'),
            'statuses' => collect(CustomerStatus::cases())->map(fn ($e) => ['value' => $e->value, 'label' => ucfirst($e->value)]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('customers/form', ['customer' => null]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate($this->customerRules(creating: true));

        $customer = $this->customers->createWalkIn($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Customer created successfully.']);

        return to_route('customers.show', $customer);
    }

    public function quickStore(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'id_number' => ['required', 'string', 'max:30'],
            'phone' => ['required', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:120'],
            'licence_number' => ['required', 'string', 'max:30'],
            'licence_class' => ['required', 'string', 'max:30'],
            'licence_expiry' => ['required', 'date'],
        ]);

        $customer = $this->customers->createWalkIn($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Customer created.']);
        Inertia::flash('new_customer_id', $customer->id);

        return back();
    }

    public function show(Customer $customer): Response
    {
        $customer->load(['ratings' => fn ($q) => $q->latest()->limit(10)]);
        $bookings = $customer->bookings()->with('vehicle')->latest()->limit(10)->get();

        return Inertia::render('customers/show', [
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'id_number' => $customer->id_number,
                'dob' => $customer->dob?->toDateString(),
                'gender' => $customer->gender,
                'phone' => $customer->phone,
                'email' => $customer->email,
                'address' => $customer->address,
                'province' => $customer->province,
                'languages' => $customer->languages,
                'profile_photo' => $customer->profile_photo,
                'licence_number' => $customer->licence_number,
                'licence_class' => $customer->licence_class,
                'licence_issued_date' => $customer->licence_issued_date?->toDateString(),
                'licence_expiry' => $customer->licence_expiry,
                'licence_front' => $customer->licence_front,
                'licence_back' => $customer->licence_back,
                'defensive_driving_cert' => $customer->defensive_driving_cert,
                'police_clearance_cert' => $customer->police_clearance_cert,
                'national_id_front' => $customer->national_id_front,
                'national_id_back' => $customer->national_id_back,
                'selfie_holding_id' => $customer->selfie_holding_id,
                'emergency_contact_name' => $customer->emergency_contact_name,
                'emergency_contact_phone' => $customer->emergency_contact_phone,
                'emergency_contact_relationship' => $customer->emergency_contact_relationship,
                'status' => $customer->status->value,
                'blacklist_reason' => $customer->blacklist_reason,
                'ratings_count' => $customer->ratings_count,
                'average_rating' => $customer->average_rating ? round((float) $customer->average_rating, 2) : null,
                'wallet_balance' => (float) $customer->wallet_balance,
                'wallet_currency' => $customer->wallet_currency->value,
                'notes' => $customer->notes,
                'created_at' => $customer->created_at,
                'ratings' => $customer->ratings->map(fn ($r) => [
                    'id' => $r->id,
                    'score_condition' => $r->score_condition,
                    'score_timeliness' => $r->score_timeliness,
                    'score_payment' => $r->score_payment,
                    'score_communication' => $r->score_communication,
                    'score_care' => $r->score_care,
                    'average' => (float) $r->average,
                    'comment' => $r->comment,
                    'created_at' => $r->created_at,
                ]),
                'bookings' => $bookings->map(fn ($b) => [
                    'id' => $b->id,
                    'reference' => $b->reference,
                    'vehicle' => $b->vehicle->make.' '.$b->vehicle->model,
                    'reg_plate' => $b->vehicle->reg_plate,
                    'status' => $b->status->value,
                    'pickup_datetime' => $b->pickup_datetime,
                    'return_datetime' => $b->return_datetime,
                    'total_amount' => (float) $b->total_amount,
                ]),
            ],
        ]);
    }

    public function edit(Customer $customer): Response
    {
        return Inertia::render('customers/form', [
            'customer' => $this->formProjection($customer),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function formProjection(Customer $customer): array
    {
        return [
            'id' => $customer->id,
            'name' => $customer->name,
            'id_number' => $customer->id_number,
            'dob' => $customer->dob?->toDateString(),
            'gender' => $customer->gender,
            'phone' => $customer->phone,
            'email' => $customer->email,
            'address' => $customer->address,
            'province' => $customer->province,
            'languages' => $customer->languages,
            'profile_photo' => $customer->profile_photo,
            'licence_number' => $customer->licence_number,
            'licence_class' => $customer->licence_class,
            'licence_issued_date' => $customer->licence_issued_date?->toDateString(),
            'licence_expiry' => $customer->licence_expiry?->toDateString(),
            'licence_front' => $customer->licence_front,
            'licence_back' => $customer->licence_back,
            'defensive_driving_cert' => $customer->defensive_driving_cert,
            'police_clearance_cert' => $customer->police_clearance_cert,
            'national_id_front' => $customer->national_id_front,
            'national_id_back' => $customer->national_id_back,
            'selfie_holding_id' => $customer->selfie_holding_id,
            'emergency_contact_name' => $customer->emergency_contact_name,
            'emergency_contact_phone' => $customer->emergency_contact_phone,
            'emergency_contact_relationship' => $customer->emergency_contact_relationship,
            'notes' => $customer->notes,
        ];
    }

    public function update(Request $request, Customer $customer): RedirectResponse
    {
        $data = $request->validate($this->customerRules(creating: false));

        $customer->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Customer updated.']);

        return to_route('customers.show', $customer);
    }

    public function blacklist(Request $request, Customer $customer): RedirectResponse
    {
        $request->validate(['reason' => ['required', 'string', 'max:500']]);

        $this->customers->blacklist($customer, $request->reason);

        Inertia::flash('toast', ['type' => 'warning', 'message' => 'Customer has been blacklisted.']);

        return back();
    }

    public function reinstate(Customer $customer): RedirectResponse
    {
        $this->customers->reinstate($customer);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Customer reinstated.']);

        return back();
    }

    /**
     * Shared validation rules for the full customer create/edit form.
     * Required-on-create fields stay required; everything else nullable so
     * staff can save in stages and complete docs later.
     *
     * @return array<string, array<int, string>>
     */
    private function customerRules(bool $creating): array
    {
        $req = $creating ? 'required' : 'sometimes';

        return [
            'name' => [$req, 'string', 'max:120'],
            'id_number' => [$req, 'string', 'max:30'],
            'dob' => ['nullable', 'date'],
            'gender' => ['nullable', 'string', 'max:20'],
            'phone' => [$req, 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:120'],
            'address' => ['nullable', 'string'],
            'province' => ['nullable', 'string', 'max:60'],
            'languages' => ['nullable', 'array'],
            'languages.*' => ['string', 'max:30'],
            'profile_photo' => ['nullable', 'url'],
            'licence_number' => [$req, 'string', 'max:30'],
            'licence_class' => [$req, 'string', 'max:30'],
            'licence_issued_date' => ['nullable', 'date'],
            'licence_expiry' => [$req, 'date'],
            'licence_front' => ['nullable', 'url'],
            'licence_back' => ['nullable', 'url'],
            'defensive_driving_cert' => ['nullable', 'url'],
            'police_clearance_cert' => ['nullable', 'url'],
            'national_id_front' => ['nullable', 'url'],
            'national_id_back' => ['nullable', 'url'],
            'selfie_holding_id' => ['nullable', 'url'],
            'emergency_contact_name' => ['nullable', 'string', 'max:120'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:20'],
            'emergency_contact_relationship' => ['nullable', 'string', 'max:60'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
