<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreBookingCategoryRequest;
use App\Http\Requests\Api\V1\UpdateBookingCategoryRequest;
use App\Http\Resources\Api\V1\BookingCategoryResource;
use App\Models\BookingCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BookingCategoryController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        abort_unless($request->user()?->can('booking_categories.view'), 403);

        $categories = BookingCategory::query()
            ->when($request->filled('active'), fn ($q) => $q->where('is_active', $request->boolean('active')))
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate($request->integer('per_page', 20));

        return BookingCategoryResource::collection($categories);
    }

    public function store(StoreBookingCategoryRequest $request): JsonResponse
    {
        $category = BookingCategory::create($request->validated());

        return BookingCategoryResource::make($category)
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, BookingCategory $bookingCategory): BookingCategoryResource
    {
        abort_unless($request->user()?->can('booking_categories.view'), 403);

        return BookingCategoryResource::make($bookingCategory);
    }

    public function update(UpdateBookingCategoryRequest $request, BookingCategory $bookingCategory): BookingCategoryResource
    {
        $bookingCategory->update($request->validated());

        return BookingCategoryResource::make($bookingCategory->refresh());
    }

    public function destroy(Request $request, BookingCategory $bookingCategory): JsonResponse
    {
        abort_unless($request->user()?->can('booking_categories.delete'), 403);

        $bookingCategory->delete();

        return response()->json(null, 204);
    }
}
