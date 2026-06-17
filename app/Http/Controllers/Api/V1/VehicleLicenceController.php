<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\Currency;
use App\Enums\LicenceType;
use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Models\VehicleLicence;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Create + update + delete compliance licences (insurance, Zinara, ZBC,
 * fitness, registration) on a vehicle. Mirrors the web admin's
 * `VehicleController::storeLicence` / `destroyLicence` so the mobile staff
 * app writes to the same table with identical semantics.
 */
class VehicleLicenceController extends Controller
{
    public function store(Request $request, Vehicle $vehicle): JsonResponse
    {
        abort_unless($request->user()?->can('vehicles.update'), 403);

        $data = $this->validateBody($request);
        $data['cost'] = $data['cost'] ?? 0;
        $data['currency'] = $data['currency'] ?? Currency::USD->value;

        $licence = $vehicle->licences()->create($data);

        return response()->json([
            'data' => $this->shape($licence),
        ], 201);
    }

    public function update(
        Request $request,
        Vehicle $vehicle,
        VehicleLicence $licence,
    ): JsonResponse {
        abort_unless($request->user()?->can('vehicles.update'), 403);
        abort_unless((int) $licence->vehicle_id === (int) $vehicle->id, 404);

        $data = $this->validateBody($request);
        $licence->update($data);

        return response()->json(['data' => $this->shape($licence->fresh())]);
    }

    public function destroy(
        Request $request,
        Vehicle $vehicle,
        VehicleLicence $licence,
    ): JsonResponse {
        abort_unless($request->user()?->can('vehicles.update'), 403);
        abort_unless((int) $licence->vehicle_id === (int) $vehicle->id, 404);

        $licence->delete();

        return response()->json(null, 204);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateBody(Request $request): array
    {
        return $request->validate([
            'type' => ['required', Rule::enum(LicenceType::class)],
            'label' => ['nullable', 'string', 'max:120'],
            'document_number' => ['nullable', 'string', 'max:120'],
            'provider' => ['nullable', 'string', 'max:120'],
            'issue_date' => ['nullable', 'date'],
            'expiry_date' => ['required', 'date'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'cover_amount' => ['nullable', 'numeric', 'min:0'],
            'cover_type' => ['nullable', 'string', 'max:60'],
            'currency' => ['nullable', 'string', 'size:3'],
            'notes' => ['nullable', 'string'],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function shape(VehicleLicence $l): array
    {
        return [
            'id' => $l->id,
            'type' => $l->type?->value,
            'label' => $l->label,
            'document_number' => $l->document_number,
            'provider' => $l->provider,
            'issue_date' => $l->issue_date?->toDateString(),
            'expiry_date' => $l->expiry_date?->toDateString(),
            'days_to_expiry' => $l->daysToExpiry(),
            'is_expired' => $l->isExpired(),
            'cost' => $l->cost,
            'currency' => $l->currency?->value,
        ];
    }
}
