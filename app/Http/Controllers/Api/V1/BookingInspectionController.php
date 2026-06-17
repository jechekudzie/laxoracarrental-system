<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\InspectionType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreInspectionRequest;
use App\Http\Resources\Api\V1\BookingInspectionResource;
use App\Models\Booking;
use App\Services\InspectionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BookingInspectionController extends Controller
{
    public function __construct(private InspectionService $inspections) {}

    public function index(Request $request, Booking $booking): AnonymousResourceCollection
    {
        abort_unless($request->user()?->can('bookings.view'), 403);

        return BookingInspectionResource::collection($booking->inspections);
    }

    public function store(StoreInspectionRequest $request, Booking $booking): JsonResponse
    {
        $data = $request->validated();
        $type = InspectionType::from($data['type']);

        $inspection = $this->inspections->record($booking, $type, $data, $request->user());

        return BookingInspectionResource::make($inspection)
            ->response()
            ->setStatusCode(201);
    }

    public function diff(Request $request, Booking $booking): JsonResponse
    {
        abort_unless($request->user()?->can('bookings.view'), 403);

        return response()->json(['diff' => $this->inspections->diff($booking)]);
    }

    public function template(): JsonResponse
    {
        return response()->json([
            'items' => config('inspections.items'),
        ]);
    }
}
