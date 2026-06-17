<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreBookingRequest;
use App\Http\Resources\Api\V1\BookingResource;
use App\Models\Booking;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BookingController extends Controller
{
    public function __construct(private BookingService $bookings) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        abort_unless($request->user()?->can('bookings.view'), 403);

        $query = Booking::query()
            ->with(['customer', 'vehicle.bookingCategory'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('customer_id'), fn ($q) => $q->where('customer_id', $request->integer('customer_id')))
            ->when($request->filled('vehicle_id'), fn ($q) => $q->where('vehicle_id', $request->integer('vehicle_id')))
            ->latest();

        // Customers only see their own bookings
        $user = $request->user();
        if ($user && $user->hasRole(UserRole::Customer->value) && $user->customer) {
            $query->where('customer_id', $user->customer->id);
        }

        return BookingResource::collection($query->paginate($request->integer('per_page', 20)));
    }

    public function store(StoreBookingRequest $request): JsonResponse
    {
        $booking = $this->bookings->create($request->validated(), $request->user());

        return BookingResource::make($booking->load(['customer', 'vehicle.bookingCategory']))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Booking $booking): BookingResource
    {
        abort_unless($request->user()?->can('bookings.view'), 403);

        return BookingResource::make(
            $booking->load(['customer', 'vehicle.bookingCategory', 'invoice', 'payments']),
        );
    }

    public function update(Request $request, Booking $booking): BookingResource
    {
        abort_unless($request->user()?->can('bookings.update'), 403);

        $validated = $request->validate([
            'notes' => ['nullable', 'string'],
            'pickup_location' => ['nullable', 'string', 'max:255'],
            'return_location' => ['nullable', 'string', 'max:255'],
        ]);

        $booking->update($validated);

        return BookingResource::make($booking->load(['customer', 'vehicle.bookingCategory']));
    }

    public function destroy(Request $request, Booking $booking): JsonResponse
    {
        // Customers can cancel their own bookings; staff need the permission.
        $user = $request->user();
        $canCancel =
            $user?->can('bookings.cancel') ||
            ($user?->customer && (int) $booking->customer_id === (int) $user->customer->id);
        abort_unless($canCancel, 403);

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $this->bookings->cancel($booking, $validated['reason'], $user);

        return response()->json(null, 204);
    }

    public function confirm(Request $request, Booking $booking): BookingResource
    {
        abort_unless($request->user()?->can('bookings.confirm'), 403);

        return BookingResource::make($this->bookings->confirm($booking));
    }

    public function activate(Request $request, Booking $booking): BookingResource
    {
        abort_unless($request->user()?->can('bookings.activate'), 403);

        $validated = $request->validate([
            'odometer_start' => ['required', 'integer', 'min:0'],
        ]);

        return BookingResource::make(
            $this->bookings->activate($booking, $validated['odometer_start'], $request->user()),
        );
    }

    /**
     * Dry-run of the completion math so the mobile staff UI can show the
     * customer exactly what they're signing off on: mileage overage, fuel
     * charge, damage, new booking total, and whether a deposit refund or
     * a balance-owed is about to be generated. No writes.
     */
    public function completePreview(
        Request $request,
        Booking $booking,
        \App\Services\PricingService $pricing,
    ): \Illuminate\Http\JsonResponse {
        abort_unless($request->user()?->can('bookings.complete'), 403);

        $validated = $request->validate([
            'odometer_end' => ['required', 'integer', 'min:0'],
            'fuel_level_return' => [
                'nullable',
                \Illuminate\Validation\Rule::enum(\App\Enums\FuelLevel::class),
            ],
            'damage_charge' => ['nullable', 'numeric', 'min:0'],
        ]);

        $booking->loadMissing('vehicle.bookingCategory');
        $category = $booking->vehicle?->bookingCategory;
        abort_if($category === null, 422, 'Vehicle has no booking category — cannot complete.');

        $pickupLevel = $booking->fuel_level_pickup instanceof \App\Enums\FuelLevel
            ? $booking->fuel_level_pickup
            : \App\Enums\FuelLevel::tryFrom((string) $booking->fuel_level_pickup);
        $returnLevel = isset($validated['fuel_level_return'])
            ? \App\Enums\FuelLevel::from($validated['fuel_level_return'])
            : ($booking->fuel_level_return instanceof \App\Enums\FuelLevel
                ? $booking->fuel_level_return
                : \App\Enums\FuelLevel::tryFrom((string) $booking->fuel_level_return));

        $fuelCharge = $pricing->calculateFuelCharge($category, $pickupLevel, $returnLevel);
        $damageCharge = (float) ($validated['damage_charge'] ?? $booking->damage_charge);

        $quote = $pricing->quote(
            $booking->vehicle,
            $booking->pickup_datetime,
            $booking->return_datetime,
            $booking->extras ?? [],
            $fuelCharge,
            $damageCharge,
            (int) $booking->odometer_start,
            $validated['odometer_end'],
        );

        $deductions = $quote->mileageOverageAmount + $fuelCharge + $damageCharge;
        $reconciliation = $pricing->reconcileDeposit((float) $booking->deposit_amount, $deductions);

        return response()->json([
            'odometer_start' => (int) $booking->odometer_start,
            'odometer_end' => $validated['odometer_end'],
            'actual_distance' => $quote->actualDistance,
            'km_allowance' => $quote->kmAllowance,
            'excess_km' => $quote->excessKm,
            'excess_km_rate' => $quote->excessKmRate,
            'mileage_overage_amount' => $quote->mileageOverageAmount,
            'fuel_level_pickup' => $pickupLevel?->value,
            'fuel_level_return' => $returnLevel?->value,
            'fuel_charge' => $fuelCharge,
            'damage_charge' => $damageCharge,
            'deductions_total' => round($deductions, 2),
            'deposit_amount' => (float) $booking->deposit_amount,
            'refund' => $reconciliation['refund'],
            'balance_owed' => $reconciliation['balance_owed'],
            'new_total_amount' => $quote->totalAmount,
            'currency' => $quote->currency,
        ]);
    }

    public function complete(Request $request, Booking $booking): BookingResource
    {
        abort_unless($request->user()?->can('bookings.complete'), 403);

        $validated = $request->validate([
            'odometer_end' => ['required', 'integer', 'min:0'],
            'fuel_level_return' => [
                'nullable',
                \Illuminate\Validation\Rule::enum(\App\Enums\FuelLevel::class),
            ],
            'damage_charge' => ['nullable', 'numeric', 'min:0'],
        ]);

        // Stamp damage on the row before the service runs — BookingService::
        // complete() reads $booking->damage_charge directly when building the
        // quote and reconciling the deposit.
        if (array_key_exists('damage_charge', $validated)) {
            $booking->update(['damage_charge' => $validated['damage_charge'] ?? 0]);
        }

        return BookingResource::make(
            $this->bookings->complete(
                $booking,
                $validated['odometer_end'],
                $request->user(),
                $validated['fuel_level_return'] ?? null,
            ),
        );
    }
}
