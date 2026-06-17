<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\Currency;
use App\Enums\MaintenanceType;
use App\Http\Controllers\Controller;
use App\Models\MaintenanceRecord;
use App\Models\Vehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Create / update / delete maintenance records against a vehicle. Mirrors
 * the web admin's `VehicleController::storeMaintenance` behaviour: the
 * labour + parts + tow costs are rolled up into `total_cost`, and when a
 * completion odometer is provided we bump the vehicle's `last_service_*`
 * snapshot so the compliance dashboard stays accurate.
 */
class MaintenanceRecordController extends Controller
{
    public function store(Request $request, Vehicle $vehicle): JsonResponse
    {
        abort_unless($request->user()?->can('vehicles.update'), 403);

        $data = $this->validateBody($request);

        return DB::transaction(function () use ($vehicle, $data, $request) {
            $row = array_merge($this->normalise($data), [
                'currency' => Currency::USD,
                'recorded_by_user_id' => $request->user()?->id,
            ]);

            $record = $vehicle->maintenanceRecords()->create($row);

            if (! empty($row['odometer'])) {
                $vehicle->update([
                    'last_service_odometer' => $row['odometer'],
                    'last_service_date' => $row['completed_at'] ?? now(),
                    'current_odometer' => max(
                        (int) $vehicle->current_odometer,
                        (int) $row['odometer'],
                    ),
                ]);
            }

            return response()->json(['data' => $this->shape($record)], 201);
        });
    }

    public function update(
        Request $request,
        Vehicle $vehicle,
        MaintenanceRecord $record,
    ): JsonResponse {
        abort_unless($request->user()?->can('vehicles.update'), 403);
        abort_unless((int) $record->vehicle_id === (int) $vehicle->id, 404);

        $data = $this->validateBody($request);
        $record->update($this->normalise($data));

        return response()->json(['data' => $this->shape($record->fresh())]);
    }

    public function destroy(
        Request $request,
        Vehicle $vehicle,
        MaintenanceRecord $record,
    ): JsonResponse {
        abort_unless($request->user()?->can('vehicles.update'), 403);
        abort_unless((int) $record->vehicle_id === (int) $vehicle->id, 404);

        $record->delete();

        return response()->json(null, 204);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateBody(Request $request): array
    {
        return $request->validate([
            'type' => ['required', Rule::enum(MaintenanceType::class)],
            'service_type' => ['nullable', 'string', 'max:120'],
            'description' => ['required', 'string', 'max:2000'],
            'odometer' => ['nullable', 'integer', 'min:0'],
            'service_provider' => ['nullable', 'string', 'max:120'],
            'labour_cost' => ['nullable', 'numeric', 'min:0'],
            'parts_cost' => ['nullable', 'numeric', 'min:0'],
            'tow_cost' => ['nullable', 'numeric', 'min:0'],
            'downtime_days' => ['nullable', 'integer', 'min:0'],
            'started_at' => ['nullable', 'date'],
            'completed_at' => ['nullable', 'date'],
            'customer_liable' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalise(array $data): array
    {
        $labour = (float) ($data['labour_cost'] ?? 0);
        $parts = (float) ($data['parts_cost'] ?? 0);
        $tow = (float) ($data['tow_cost'] ?? 0);

        return [
            'type' => $data['type'],
            'service_type' => $data['service_type'] ?? null,
            'description' => $data['description'],
            'odometer' => $data['odometer'] ?? null,
            'service_provider' => $data['service_provider'] ?? null,
            'labour_cost' => $labour,
            'parts_cost' => $parts,
            'tow_cost' => $tow,
            'total_cost' => round($labour + $parts + $tow, 2),
            'downtime_days' => $data['downtime_days'] ?? 0,
            'started_at' => $data['started_at'] ?? null,
            'completed_at' => $data['completed_at'] ?? null,
            'customer_liable' => $data['customer_liable'] ?? false,
            'notes' => $data['notes'] ?? null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function shape(MaintenanceRecord $m): array
    {
        return [
            'id' => $m->id,
            'type' => $m->type?->value,
            'service_type' => $m->service_type,
            'description' => $m->description,
            'odometer' => $m->odometer,
            'service_provider' => $m->service_provider,
            'labour_cost' => $m->labour_cost,
            'parts_cost' => $m->parts_cost,
            'tow_cost' => $m->tow_cost,
            'total_cost' => $m->total_cost,
            'currency' => $m->currency?->value,
            'downtime_days' => $m->downtime_days,
            'started_at' => $m->started_at?->toIso8601String(),
            'completed_at' => $m->completed_at?->toIso8601String(),
            'customer_liable' => (bool) $m->customer_liable,
            'notes' => $m->notes,
        ];
    }
}
