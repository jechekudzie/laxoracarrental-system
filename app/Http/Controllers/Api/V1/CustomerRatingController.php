<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreRatingRequest;
use App\Http\Resources\Api\V1\CustomerRatingResource;
use App\Models\Booking;
use App\Models\Customer;
use App\Services\RatingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CustomerRatingController extends Controller
{
    public function __construct(private RatingService $ratings) {}

    public function store(StoreRatingRequest $request, Booking $booking): JsonResponse
    {
        $rating = $this->ratings->rate($booking, $request->validated(), $request->user());

        return CustomerRatingResource::make($rating)
            ->response()
            ->setStatusCode(201);
    }

    public function forCustomer(Request $request, Customer $customer): AnonymousResourceCollection
    {
        abort_unless($request->user()?->can('customers.view'), 403);

        return CustomerRatingResource::collection(
            $customer->ratings()->latest()->paginate($request->integer('per_page', 20)),
        );
    }
}
