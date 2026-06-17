<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\BookingStatus;
use App\Enums\VehicleStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Customer;
use App\Models\Vehicle;
use App\Models\VehicleLicence;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $stats = [
            'active_bookings' => Booking::where('status', BookingStatus::Active)->count(),
            'pending_bookings' => Booking::where('status', BookingStatus::Pending)->count(),
            'available_vehicles' => Vehicle::where('status', VehicleStatus::Available)->count(),
            'total_vehicles' => Vehicle::count(),
            'total_customers' => Customer::count(),
            'revenue_this_month' => (float) Booking::where('status', BookingStatus::Completed)
                ->whereMonth('actual_return_at', now()->month)
                ->whereYear('actual_return_at', now()->year)
                ->sum('total_amount'),
        ];

        $recentBookings = Booking::with(['customer', 'vehicle'])
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn (Booking $b) => [
                'id' => $b->id,
                'reference' => $b->reference,
                'customer_name' => $b->customer->name,
                'vehicle' => $b->vehicle->make.' '.$b->vehicle->model,
                'reg_plate' => $b->vehicle->reg_plate,
                'status' => $b->status->value,
                'pickup_datetime' => $b->pickup_datetime,
                'return_datetime' => $b->return_datetime,
                'total_amount' => (float) $b->total_amount,
                'currency' => $b->currency->value,
            ]);

        // Most booked vehicles (top 5)
        $mostBooked = Vehicle::withCount('bookings')
            ->orderByDesc('bookings_count')
            ->limit(5)
            ->get(['id', 'make', 'model', 'reg_plate'])
            ->map(fn (Vehicle $v) => [
                'id' => $v->id,
                'label' => "{$v->make} {$v->model}",
                'reg_plate' => $v->reg_plate,
                'value' => $v->bookings_count,
            ]);

        // Highest mileage vehicles (top 5)
        $highestMileage = Vehicle::orderByDesc('current_odometer')
            ->limit(5)
            ->get(['id', 'make', 'model', 'reg_plate', 'current_odometer'])
            ->map(fn (Vehicle $v) => [
                'id' => $v->id,
                'label' => "{$v->make} {$v->model}",
                'reg_plate' => $v->reg_plate,
                'value' => (int) ($v->current_odometer ?? 0),
            ]);

        // Vehicles due for service (based on service_interval_km and last_service_odometer)
        $dueForService = Vehicle::select('id', 'make', 'model', 'reg_plate', 'current_odometer', 'last_service_odometer', 'service_interval_km', 'last_service_date')
            ->whereNotNull('service_interval_km')
            ->get()
            ->map(function (Vehicle $v) {
                $lastService = (int) ($v->last_service_odometer ?? 0);
                $current = (int) ($v->current_odometer ?? 0);
                $interval = (int) ($v->service_interval_km ?? 10000);
                $nextDue = $lastService + $interval;
                $kmUntil = $nextDue - $current;

                return [
                    'id' => $v->id,
                    'label' => "{$v->make} {$v->model}",
                    'reg_plate' => $v->reg_plate,
                    'current_odometer' => $current,
                    'next_service_at' => $nextDue,
                    'km_until_service' => $kmUntil,
                ];
            })
            ->filter(fn ($v) => $v['km_until_service'] <= 2000)
            ->sortBy('km_until_service')
            ->take(5)
            ->values();

        // Vehicles with expiring compliance (next 30 days)
        $expiringCompliance = VehicleLicence::with('vehicle:id,make,model,reg_plate')
            ->whereDate('expiry_date', '>=', now())
            ->whereDate('expiry_date', '<=', now()->addDays(30))
            ->orderBy('expiry_date')
            ->limit(5)
            ->get()
            ->map(fn (VehicleLicence $l) => [
                'id' => $l->id,
                'vehicle_id' => $l->vehicle_id,
                'vehicle_label' => $l->vehicle ? "{$l->vehicle->make} {$l->vehicle->model}" : 'Unknown',
                'reg_plate' => $l->vehicle?->reg_plate,
                'type' => $l->type->value,
                'expiry_date' => $l->expiry_date,
                'days_to_expiry' => $l->daysToExpiry(),
            ]);

        // Vehicle status breakdown
        $statusBreakdown = Vehicle::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        // Revenue trend (last 14 days)
        $revenueTrend = [];
        for ($i = 13; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $revenue = (float) Booking::where('status', BookingStatus::Completed)
                ->whereDate('actual_return_at', $date)
                ->sum('total_amount');
            $revenueTrend[] = ['date' => $date, 'value' => $revenue];
        }

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'recentBookings' => $recentBookings,
            'analytics' => [
                'most_booked' => $mostBooked,
                'highest_mileage' => $highestMileage,
                'due_for_service' => $dueForService,
                'expiring_compliance' => $expiringCompliance,
                'status_breakdown' => $statusBreakdown,
                'revenue_trend' => $revenueTrend,
            ],
        ]);
    }
}
