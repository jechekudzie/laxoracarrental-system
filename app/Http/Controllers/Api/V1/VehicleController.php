<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreVehicleRequest;
use App\Http\Requests\Api\V1\UpdateVehicleRequest;
use App\Http\Resources\Api\V1\VehicleResource;
use App\Models\Vehicle;
use App\Services\VehicleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class VehicleController extends Controller
{
    public function __construct(private VehicleService $vehicles) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        abort_unless($request->user()?->can('vehicles.view'), 403);

        $vehicles = Vehicle::query()
            ->with('owner')
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('category'), fn ($q) => $q->where('category', $request->string('category')))
            ->when($request->filled('ownership_type'), fn ($q) => $q->where('ownership_type', $request->string('ownership_type')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->string('search').'%';
                $q->where(function ($q) use ($term) {
                    $q->where('make', 'like', $term)
                        ->orWhere('model', 'like', $term)
                        ->orWhere('reg_plate', 'like', $term);
                });
            })
            ->orderBy('reg_plate')
            ->paginate($request->integer('per_page', 20));

        return VehicleResource::collection($vehicles);
    }

    public function store(StoreVehicleRequest $request): JsonResponse
    {
        $vehicle = $this->vehicles->create($request->validated());

        $vehicle->load([
            'owner',
            'bookingCategory',
            'licences' => fn ($q) => $q->orderBy('expiry_date'),
            'maintenanceRecords' => fn ($q) => $q->latest('started_at')->limit(10),
        ]);

        return VehicleResource::make($vehicle)
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Vehicle $vehicle): VehicleResource
    {
        abort_unless($request->user()?->can('vehicles.view'), 403);

        $vehicle->load([
            'owner',
            'bookingCategory',
            'licences' => fn ($q) => $q->orderBy('expiry_date'),
            'maintenanceRecords' => fn ($q) => $q->latest('started_at')->limit(10),
        ]);

        return VehicleResource::make($vehicle);
    }

    public function update(UpdateVehicleRequest $request, Vehicle $vehicle): VehicleResource
    {
        $vehicle = $this->vehicles->update($vehicle, $request->validated());

        $vehicle->load([
            'owner',
            'bookingCategory',
            'licences' => fn ($q) => $q->orderBy('expiry_date'),
            'maintenanceRecords' => fn ($q) => $q->latest('started_at')->limit(10),
        ]);

        return VehicleResource::make($vehicle);
    }

    public function destroy(Request $request, Vehicle $vehicle): JsonResponse
    {
        abort_unless($request->user()?->can('vehicles.delete'), 403);

        $vehicle->delete();

        return response()->json(null, 204);
    }
}
