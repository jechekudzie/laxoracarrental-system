<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BookingCategoryController;
use App\Http\Controllers\Api\V1\BookingController;
use App\Http\Controllers\Api\V1\BookingInspectionController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\CustomerRatingController;
use App\Http\Controllers\Api\V1\FileUploadController;
use App\Http\Controllers\Api\V1\InvoiceController;
use App\Http\Controllers\Api\V1\MaintenanceRecordController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\VehicleAvailabilityController;
use App\Http\Controllers\Api\V1\VehicleController;
use App\Http\Controllers\Api\V1\VehicleLicenceController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->name('api.v1.')->group(function (): void {
    // Public auth endpoints
    Route::post('auth/login', [AuthController::class, 'login'])
        ->middleware('throttle:6,1');
    Route::post('auth/register', [AuthController::class, 'register'])
        ->middleware('throttle:6,1');

    // Public availability search (used by customer portal + mobile browse)
    Route::get('vehicles/availability', VehicleAvailabilityController::class);

    // Public checklist template (so mobile can render a blank inspection form)
    Route::get('inspections/template', [BookingInspectionController::class, 'template']);

    // Public uploads. The mobile register wizard pushes ID/licence/selfie
    // docs *before* the account exists, so we can't gate this behind sanctum.
    // FileUploadController validates mime + size; rate-limited to slow abuse.
    Route::post('uploads', [FileUploadController::class, 'store'])
        ->middleware('throttle:30,1');

    // Protected routes
    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout']);

        // Booking categories (commercial tiers managed by fleet admin)
        Route::apiResource('booking-categories', BookingCategoryController::class)
            ->parameters(['booking-categories' => 'bookingCategory']);

        // Vehicles
        Route::apiResource('vehicles', VehicleController::class);

        // Vehicle compliance (licences) + maintenance — nested under vehicle
        Route::post('vehicles/{vehicle}/licences', [VehicleLicenceController::class, 'store']);
        Route::patch('vehicles/{vehicle}/licences/{licence}', [VehicleLicenceController::class, 'update']);
        Route::delete('vehicles/{vehicle}/licences/{licence}', [VehicleLicenceController::class, 'destroy']);

        Route::post('vehicles/{vehicle}/maintenance', [MaintenanceRecordController::class, 'store']);
        Route::patch('vehicles/{vehicle}/maintenance/{record}', [MaintenanceRecordController::class, 'update']);
        Route::delete('vehicles/{vehicle}/maintenance/{record}', [MaintenanceRecordController::class, 'destroy']);

        // Customers
        Route::apiResource('customers', CustomerController::class);
        Route::post('customers/{customer}/blacklist', [CustomerController::class, 'blacklist']);
        Route::post('customers/{customer}/reinstate', [CustomerController::class, 'reinstate']);

        // Bookings
        Route::apiResource('bookings', BookingController::class);
        Route::post('bookings/{booking}/confirm', [BookingController::class, 'confirm']);
        Route::post('bookings/{booking}/activate', [BookingController::class, 'activate']);
        Route::post('bookings/{booking}/complete-preview', [BookingController::class, 'completePreview']);
        Route::post('bookings/{booking}/complete', [BookingController::class, 'complete']);

        // Booking inspections (pickup + return checklist)
        Route::get('bookings/{booking}/inspections', [BookingInspectionController::class, 'index']);
        Route::post('bookings/{booking}/inspections', [BookingInspectionController::class, 'store']);
        Route::get('bookings/{booking}/inspections/diff', [BookingInspectionController::class, 'diff']);

        // Customer rating after return
        Route::post('bookings/{booking}/rating', [CustomerRatingController::class, 'store']);
        Route::get('customers/{customer}/ratings', [CustomerRatingController::class, 'forCustomer']);

        // Invoices
        Route::apiResource('invoices', InvoiceController::class);

        // Payments
        Route::apiResource('payments', PaymentController::class)->only(['index', 'store', 'show']);

        // Notifications (in-app bell)
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('notifications/{id}/read', [NotificationController::class, 'markRead']);
        Route::post('notifications/read-all', [NotificationController::class, 'markAllRead']);
    });
});
