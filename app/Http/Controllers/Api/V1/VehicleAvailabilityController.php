<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\AvailabilitySearchRequest;
use App\Http\Resources\Api\V1\VehicleResource;
use App\Services\PricingService;
use App\Services\VehicleAvailabilityService;
use DateTimeImmutable;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class VehicleAvailabilityController extends Controller
{
    public function __construct(
        private VehicleAvailabilityService $availability,
        private PricingService $pricing,
    ) {}

    public function __invoke(AvailabilitySearchRequest $request): AnonymousResourceCollection
    {
        $pickup = new DateTimeImmutable((string) $request->string('pickup_datetime'));
        $return = new DateTimeImmutable((string) $request->string('return_datetime'));

        $vehicles = $this->availability->searchAvailable(
            $pickup,
            $return,
            $request->only(['category', 'min_rate', 'max_rate']),
        );

        $vehicles->each(function ($vehicle) use ($pickup, $return): void {
            $vehicle->setAttribute(
                'quote',
                $this->pricing->quote($vehicle, $pickup, $return)->toArray(),
            );
        });

        return VehicleResource::collection($vehicles);
    }
}
