<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\BookingStatus;
use App\Enums\CostCategory;
use App\Enums\Currency;
use App\Enums\FuelType;
use App\Enums\LicenceType;
use App\Enums\MaintenanceType;
use App\Enums\MileageSource;
use App\Enums\Transmission;
use App\Enums\VehicleCategory;
use App\Enums\VehicleOwnershipType;
use App\Enums\VehicleStatus;
use App\Http\Controllers\Controller;
use App\Models\BookingCategory;
use App\Models\MaintenanceRecord;
use App\Models\MileageLog;
use App\Models\ServiceProvider;
use App\Models\Vehicle;
use App\Models\VehicleCost;
use App\Models\VehicleLicence;
use App\Models\VehicleOwner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class VehicleController extends Controller
{
    public function index(Request $request): Response
    {
        $vehicles = Vehicle::query()
            ->with('bookingCategory:id,name,slug')
            ->when($request->search, fn ($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('make', 'like', "%{$s}%")
                    ->orWhere('model', 'like', "%{$s}%")
                    ->orWhere('reg_plate', 'like', "%{$s}%");
            }))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->ownership, fn ($q, $o) => $q->where('ownership_type', $o))
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Vehicle $v) => [
                'id' => $v->id,
                'make' => $v->make,
                'model' => $v->model,
                'year' => $v->year,
                'reg_plate' => $v->reg_plate,
                'category' => $v->category->value,
                'booking_category' => $v->bookingCategory ? ['id' => $v->bookingCategory->id, 'name' => $v->bookingCategory->name] : null,
                'status' => $v->status->value,
                'ownership_type' => $v->ownership_type->value,
                'daily_rate' => (float) $v->daily_rate,
                'currency' => $v->currency->value,
                'current_odometer' => $v->current_odometer,
            ]);

        return Inertia::render('vehicles/index', [
            'vehicles' => $vehicles,
            'filters' => $request->only('search', 'status', 'ownership'),
            'statuses' => collect(VehicleStatus::cases())->map(fn ($e) => ['value' => $e->value, 'label' => ucfirst($e->value)]),
            'ownershipTypes' => collect(VehicleOwnershipType::cases())->map(fn ($e) => ['value' => $e->value, 'label' => $e->label()]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('vehicles/form', [
            'vehicle' => null,
            'owners' => VehicleOwner::orderBy('name')->get(['id', 'name', 'phone']),
            'bookingCategories' => $this->bookingCategoryOptions(),
            ...$this->formOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateVehicle($request);

        DB::transaction(function () use ($data) {
            $ownerId = $this->resolveOwnerId($data);

            Vehicle::create([
                ...collect($data)->except(['new_owner_name', 'new_owner_phone', 'new_owner_bank_details', 'vehicle_owner_id'])->all(),
                'vehicle_owner_id' => $ownerId,
                'status' => VehicleStatus::Available,
            ]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Vehicle added successfully.']);

        return to_route('vehicles.index');
    }

    public function show(Vehicle $vehicle): Response
    {
        $vehicle->load([
            'owner',
            'bookingCategory',
            'bookings' => fn ($q) => $q->with('customer')->latest()->limit(20),
            'maintenanceRecords' => fn ($q) => $q->latest('started_at')->limit(20),
            'licences' => fn ($q) => $q->orderBy('expiry_date'),
            'costs' => fn ($q) => $q->latest('incident_date')->limit(30),
        ]);

        $providers = ServiceProvider::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'category', 'phone']);

        return Inertia::render('vehicles/show', [
            'vehicle' => [
                'id' => $vehicle->id,
                'make' => $vehicle->make,
                'model' => $vehicle->model,
                'year' => $vehicle->year,
                'colour' => $vehicle->colour,
                'reg_plate' => $vehicle->reg_plate,
                'vin' => $vehicle->vin,
                'category' => $vehicle->category->value,
                'fuel_type' => $vehicle->fuel_type->value,
                'transmission' => $vehicle->transmission->value,
                'seats' => $vehicle->seats,
                'status' => $vehicle->status->value,
                'ownership_type' => $vehicle->ownership_type->value,
                'owner' => $vehicle->owner ? [
                    'id' => $vehicle->owner->id,
                    'name' => $vehicle->owner->name,
                    'phone' => $vehicle->owner->phone,
                    'email' => $vehicle->owner->email,
                    'agreed_daily_rate' => (float) ($vehicle->owner->agreed_daily_rate ?? 0),
                ] : null,
                'owner_agreed_rate' => $vehicle->owner_agreed_rate ? (float) $vehicle->owner_agreed_rate : null,
                'owner_markup_percent' => $vehicle->owner_markup_percent ? (float) $vehicle->owner_markup_percent : null,
                'daily_rate' => (float) $vehicle->daily_rate,
                'booking_category' => $vehicle->bookingCategory ? [
                    'id' => $vehicle->bookingCategory->id,
                    'slug' => $vehicle->bookingCategory->slug,
                    'name' => $vehicle->bookingCategory->name,
                    'security_deposit' => (float) $vehicle->bookingCategory->security_deposit,
                    'km_per_day_limit' => $vehicle->bookingCategory->km_per_day_limit,
                    'excess_km_rate' => (float) $vehicle->bookingCategory->excess_km_rate,
                    'fuel_charge_per_level' => (float) $vehicle->bookingCategory->fuel_charge_per_level,
                    'currency' => $vehicle->bookingCategory->currency?->value ?? 'USD',
                ] : null,
                'currency' => $vehicle->currency->value,
                'current_odometer' => $vehicle->current_odometer,
                'last_service_odometer' => $vehicle->last_service_odometer,
                'last_service_date' => $vehicle->last_service_date,
                'service_interval_km' => $vehicle->service_interval_km,
                'notes' => $vehicle->notes,
                'created_at' => $vehicle->created_at,
                'bookings' => $vehicle->bookings->map(fn ($b) => [
                    'id' => $b->id,
                    'reference' => $b->reference,
                    'customer_name' => $b->customer?->name,
                    'status' => $b->status->value,
                    'pickup_datetime' => $b->pickup_datetime,
                    'return_datetime' => $b->return_datetime,
                    'total_amount' => (float) $b->total_amount,
                ])->values(),
                'maintenance_records' => $vehicle->maintenanceRecords->map(fn ($r) => [
                    'id' => $r->id,
                    'type' => $r->type->value,
                    'service_type' => $r->service_type,
                    'description' => $r->description,
                    'odometer' => $r->odometer,
                    'service_provider' => $r->service_provider,
                    'total_cost' => (float) $r->total_cost,
                    'currency' => $r->currency->value,
                    'started_at' => $r->started_at,
                    'completed_at' => $r->completed_at,
                    'downtime_days' => $r->downtime_days,
                    'notes' => $r->notes,
                ])->values(),
                'licences' => $vehicle->licences->map(fn ($l) => [
                    'id' => $l->id,
                    'type' => $l->type->value,
                    'label' => $l->label,
                    'document_number' => $l->document_number,
                    'provider' => $l->provider,
                    'issue_date' => $l->issue_date,
                    'expiry_date' => $l->expiry_date,
                    'cost' => (float) $l->cost,
                    'currency' => $l->currency->value,
                    'cover_amount' => $l->cover_amount ? (float) $l->cover_amount : null,
                    'cover_type' => $l->cover_type,
                    'notes' => $l->notes,
                    'days_to_expiry' => $l->daysToExpiry(),
                    'is_expired' => $l->isExpired(),
                ])->values(),
                'costs' => $vehicle->costs->map(fn ($c) => [
                    'id' => $c->id,
                    'category' => $c->category->value,
                    'description' => $c->description,
                    'amount' => (float) $c->amount,
                    'currency' => $c->currency->value,
                    'vendor_name' => $c->vendor_name,
                    'odometer' => $c->odometer,
                    'incident_date' => $c->incident_date,
                    'notes' => $c->notes,
                ])->values(),
                'total_costs' => (float) $vehicle->costs->sum('amount')
                    + (float) $vehicle->maintenanceRecords->sum('total_cost')
                    + (float) $vehicle->licences->sum('cost'),
                'total_revenue' => (float) $vehicle->bookings->where('status', BookingStatus::Completed)->sum('total_amount'),
            ],
            'serviceProviders' => $providers->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'category' => $p->category->value,
                'phone' => $p->phone,
            ]),
            'maintenanceTypes' => collect(MaintenanceType::cases())->map(fn ($e) => ['value' => $e->value, 'label' => ucfirst($e->value)]),
            'costCategories' => collect(CostCategory::cases())->map(fn ($e) => ['value' => $e->value, 'label' => ucfirst(str_replace('_', ' ', $e->value))]),
            'licenceTypes' => collect(LicenceType::cases())->map(fn ($e) => ['value' => $e->value, 'label' => match ($e) {
                LicenceType::Zinara => 'ZINARA Licence',
                LicenceType::ZBC => 'ZBC Radio Licence',
                LicenceType::Fitness => 'Vehicle Fitness',
                LicenceType::Insurance => 'Insurance',
                LicenceType::Registration => 'Registration',
                LicenceType::Custom => 'Other',
            }]),
        ]);
    }

    public function storeMaintenance(Request $request, Vehicle $vehicle): RedirectResponse
    {
        $data = $request->validate([
            'type' => ['required', 'string', 'in:scheduled,breakdown,accident'],
            'service_type' => ['nullable', 'string', 'max:120'],
            'description' => ['required', 'string', 'max:2000'],
            'odometer' => ['nullable', 'integer', 'min:0'],
            'service_provider_id' => ['nullable', 'integer', 'exists:service_providers,id'],
            'labour_cost' => ['nullable', 'numeric', 'min:0'],
            'parts_cost' => ['nullable', 'numeric', 'min:0'],
            'tow_cost' => ['nullable', 'numeric', 'min:0'],
            'downtime_days' => ['nullable', 'integer', 'min:0'],
            'started_at' => ['nullable', 'date'],
            'completed_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $providerName = null;
        if (! empty($data['service_provider_id'])) {
            $providerName = ServiceProvider::find($data['service_provider_id'])?->name;
        }

        $record = [
            'type' => $data['type'],
            'service_type' => $data['service_type'] ?? null,
            'description' => $data['description'],
            'odometer' => $data['odometer'] ?? null,
            'service_provider' => $providerName,
            'labour_cost' => $data['labour_cost'] ?? 0,
            'parts_cost' => $data['parts_cost'] ?? 0,
            'tow_cost' => $data['tow_cost'] ?? 0,
            'downtime_days' => $data['downtime_days'] ?? 0,
            'started_at' => $data['started_at'] ?? null,
            'completed_at' => $data['completed_at'] ?? null,
            'notes' => $data['notes'] ?? null,
            'currency' => Currency::USD,
            'recorded_by_user_id' => $request->user()?->id,
        ];
        $record['total_cost'] = $record['labour_cost'] + $record['parts_cost'] + $record['tow_cost'];

        $vehicle->maintenanceRecords()->create($record);

        if (! empty($record['odometer'])) {
            $vehicle->update([
                'last_service_odometer' => $record['odometer'],
                'last_service_date' => $record['completed_at'] ?? now(),
                'current_odometer' => max((int) $vehicle->current_odometer, (int) $record['odometer']),
            ]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Maintenance record added.']);

        return back();
    }

    public function destroyMaintenance(Vehicle $vehicle, MaintenanceRecord $record): RedirectResponse
    {
        abort_unless($record->vehicle_id === $vehicle->id, 404);

        $record->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Maintenance record removed.']);

        return back();
    }

    public function storeLicence(Request $request, Vehicle $vehicle): RedirectResponse
    {
        $data = $request->validate([
            'type' => ['required', 'string', 'in:zinara,zbc,fitness,insurance,registration,custom'],
            'label' => ['nullable', 'string', 'max:120'],
            'document_number' => ['nullable', 'string', 'max:120'],
            'provider' => ['nullable', 'string', 'max:120'],
            'issue_date' => ['nullable', 'date'],
            'expiry_date' => ['required', 'date'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'cover_amount' => ['nullable', 'numeric', 'min:0'],
            'cover_type' => ['nullable', 'string', 'max:60'],
            'notes' => ['nullable', 'string'],
        ]);

        $data['cost'] = $data['cost'] ?? 0;
        $data['currency'] = Currency::USD;

        $vehicle->licences()->create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Licence/compliance record added.']);

        return back();
    }

    public function destroyLicence(Vehicle $vehicle, VehicleLicence $licence): RedirectResponse
    {
        abort_unless($licence->vehicle_id === $vehicle->id, 404);

        $licence->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Licence record removed.']);

        return back();
    }

    public function storeCost(Request $request, Vehicle $vehicle): RedirectResponse
    {
        $data = $request->validate([
            'category' => ['required', 'string', Rule::enum(CostCategory::class)],
            'description' => ['required', 'string', 'max:500'],
            'amount' => ['required', 'numeric', 'min:0'],
            'service_provider_id' => ['nullable', 'integer', 'exists:service_providers,id'],
            'vendor_name' => ['nullable', 'string', 'max:120'],
            'vendor_phone' => ['nullable', 'string', 'max:30'],
            'odometer' => ['nullable', 'integer', 'min:0'],
            'incident_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        if (! empty($data['service_provider_id'])) {
            $provider = ServiceProvider::find($data['service_provider_id']);
            $data['vendor_name'] = $provider?->name ?? $data['vendor_name'];
            $data['vendor_phone'] = $provider?->phone ?? $data['vendor_phone'];
        }

        unset($data['service_provider_id']);
        $data['currency'] = Currency::USD;
        $data['recorded_by_user_id'] = $request->user()?->id;

        DB::transaction(function () use ($vehicle, $data, $request): void {
            $cost = $vehicle->costs()->create($data);

            // If this cost entry carries an odometer reading, treat it as a mileage log
            // for the vehicle: create a MileageLog entry and bump current_odometer so the
            // fleet always reflects the latest reading, booking or errand.
            if (! empty($data['odometer'])) {
                $newReading = (int) $data['odometer'];

                if ($newReading > (int) $vehicle->current_odometer) {
                    $vehicle->update(['current_odometer' => $newReading]);
                }

                MileageLog::create([
                    'vehicle_id' => $vehicle->id,
                    'booking_id' => null,
                    'recorded_by_user_id' => $request->user()?->id,
                    'odometer_reading' => $newReading,
                    'source' => MileageSource::Manual,
                    'recorded_at' => $data['incident_date'] ?? now(),
                    'notes' => "Errand: {$cost->category->value} — {$data['description']}",
                ]);
            }
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cost recorded.']);

        return back();
    }

    public function destroyCost(Vehicle $vehicle, VehicleCost $cost): RedirectResponse
    {
        abort_unless($cost->vehicle_id === $vehicle->id, 404);

        $cost->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cost entry removed.']);

        return back();
    }

    public function edit(Vehicle $vehicle): Response
    {
        $vehicle->load('owner');

        return Inertia::render('vehicles/form', [
            'vehicle' => [
                'id' => $vehicle->id,
                'make' => $vehicle->make,
                'model' => $vehicle->model,
                'year' => $vehicle->year,
                'colour' => $vehicle->colour,
                'reg_plate' => $vehicle->reg_plate,
                'vin' => $vehicle->vin,
                'category' => $vehicle->category->value,
                'booking_category_id' => $vehicle->booking_category_id,
                'fuel_type' => $vehicle->fuel_type->value,
                'transmission' => $vehicle->transmission->value,
                'seats' => $vehicle->seats,
                'ownership_type' => $vehicle->ownership_type->value,
                'vehicle_owner_id' => $vehicle->vehicle_owner_id,
                'owner_agreed_rate' => $vehicle->owner_agreed_rate ? (float) $vehicle->owner_agreed_rate : null,
                'owner_markup_percent' => $vehicle->owner_markup_percent ? (float) $vehicle->owner_markup_percent : null,
                'daily_rate' => (float) $vehicle->daily_rate,
                'current_odometer' => $vehicle->current_odometer,
                'service_interval_km' => $vehicle->service_interval_km,
                'notes' => $vehicle->notes,
            ],
            'owners' => VehicleOwner::orderBy('name')->get(['id', 'name', 'phone']),
            'bookingCategories' => $this->bookingCategoryOptions(),
            ...$this->formOptions(),
        ]);
    }

    public function update(Request $request, Vehicle $vehicle): RedirectResponse
    {
        $data = $this->validateVehicle($request, $vehicle->id);

        DB::transaction(function () use ($data, $vehicle) {
            $ownerId = $this->resolveOwnerId($data);

            $vehicle->update([
                ...collect($data)->except(['new_owner_name', 'new_owner_phone', 'new_owner_bank_details', 'vehicle_owner_id'])->all(),
                'vehicle_owner_id' => $ownerId,
            ]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Vehicle updated successfully.']);

        return to_route('vehicles.show', $vehicle);
    }

    public function destroy(Vehicle $vehicle): RedirectResponse
    {
        $vehicle->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Vehicle removed.']);

        return to_route('vehicles.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function formOptions(): array
    {
        return [
            'categories' => collect(VehicleCategory::cases())->map(fn ($e) => ['value' => $e->value, 'label' => $e->label()]),
            'fuelTypes' => collect(FuelType::cases())->map(fn ($e) => ['value' => $e->value, 'label' => ucfirst($e->value)]),
            'transmissions' => collect(Transmission::cases())->map(fn ($e) => ['value' => $e->value, 'label' => ucfirst($e->value)]),
            'ownershipTypes' => collect(VehicleOwnershipType::cases())->map(fn ($e) => ['value' => $e->value, 'label' => $e->label()]),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function validateVehicle(Request $request, ?int $vehicleId = null): array
    {
        $regRule = ['required', 'string', 'max:20'];
        $regRule[] = $vehicleId
            ? 'unique:vehicles,reg_plate,'.$vehicleId
            : 'unique:vehicles,reg_plate';

        return $request->validate([
            'make' => ['required', 'string', 'max:60'],
            'model' => ['required', 'string', 'max:60'],
            'year' => ['required', 'integer', 'min:1990', 'max:'.(date('Y') + 1)],
            'colour' => ['required', 'string', 'max:40'],
            'reg_plate' => $regRule,
            'vin' => ['nullable', 'string', 'max:30'],
            'category' => ['required', 'string'],
            'booking_category_id' => ['required', 'integer', 'exists:booking_categories,id'],
            'fuel_type' => ['required', 'string'],
            'transmission' => ['required', 'string'],
            'seats' => ['required', 'integer', 'min:1', 'max:50'],
            'ownership_type' => ['required', 'string', 'in:owned,outsourced'],
            'vehicle_owner_id' => ['nullable', 'integer', 'exists:vehicle_owners,id'],
            'new_owner_name' => ['nullable', 'string', 'max:120'],
            'new_owner_phone' => ['nullable', 'string', 'max:30'],
            'new_owner_bank_details' => ['nullable', 'string'],
            'owner_agreed_rate' => ['nullable', 'numeric', 'min:0'],
            'owner_markup_percent' => ['nullable', 'numeric', 'min:0', 'max:500'],
            'daily_rate' => ['required', 'numeric', 'min:0'],
            'current_odometer' => ['nullable', 'integer', 'min:0'],
            'service_interval_km' => ['nullable', 'integer', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);
    }

    /**
     * @return array<int, array{id: int, name: string, slug: string, security_deposit: float, km_per_day_limit: int, excess_km_rate: float, fuel_charge_per_level: float, currency: string}>
     */
    private function bookingCategoryOptions(): array
    {
        return BookingCategory::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (BookingCategory $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
                'security_deposit' => (float) $c->security_deposit,
                'km_per_day_limit' => $c->km_per_day_limit,
                'excess_km_rate' => (float) $c->excess_km_rate,
                'fuel_charge_per_level' => (float) $c->fuel_charge_per_level,
                'currency' => $c->currency?->value ?? 'USD',
            ])
            ->all();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function resolveOwnerId(array $data): ?int
    {
        if (($data['ownership_type'] ?? null) !== 'outsourced') {
            return null;
        }

        if (! empty($data['vehicle_owner_id'])) {
            return (int) $data['vehicle_owner_id'];
        }

        if (! empty($data['new_owner_name']) && ! empty($data['new_owner_phone'])) {
            $owner = VehicleOwner::create([
                'name' => $data['new_owner_name'],
                'phone' => $data['new_owner_phone'],
                'bank_details' => $data['new_owner_bank_details'] ?? null,
            ]);

            return $owner->id;
        }

        return null;
    }
}
