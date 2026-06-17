<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\MaintenanceType;
use App\Http\Controllers\Controller;
use App\Models\MaintenanceRecord;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MaintenanceController extends Controller
{
    public function index(Request $request): Response
    {
        $records = MaintenanceRecord::query()
            ->with('vehicle:id,make,model,reg_plate')
            ->when($request->type, fn ($q, $t) => $q->where('type', $t))
            ->when($request->search, fn ($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('description', 'like', "%{$s}%")
                    ->orWhere('service_provider', 'like', "%{$s}%")
                    ->orWhereHas('vehicle', fn ($q) => $q->where('reg_plate', 'like', "%{$s}%")
                        ->orWhere('make', 'like', "%{$s}%")
                        ->orWhere('model', 'like', "%{$s}%"));
            }))
            ->orderByDesc('started_at')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (MaintenanceRecord $r) => [
                'id' => $r->id,
                'vehicle_id' => $r->vehicle_id,
                'vehicle_label' => $r->vehicle ? "{$r->vehicle->make} {$r->vehicle->model}" : null,
                'reg_plate' => $r->vehicle?->reg_plate,
                'type' => $r->type->value,
                'service_type' => $r->service_type,
                'description' => $r->description,
                'service_provider' => $r->service_provider,
                'odometer' => $r->odometer,
                'total_cost' => (float) $r->total_cost,
                'currency' => $r->currency->value,
                'downtime_days' => $r->downtime_days,
                'started_at' => $r->started_at,
                'completed_at' => $r->completed_at,
            ]);

        $summary = [
            'total_records' => MaintenanceRecord::count(),
            'total_cost' => (float) MaintenanceRecord::sum('total_cost'),
            'scheduled_count' => MaintenanceRecord::where('type', MaintenanceType::Scheduled)->count(),
            'breakdown_count' => MaintenanceRecord::where('type', MaintenanceType::Breakdown)->count(),
            'accident_count' => MaintenanceRecord::where('type', MaintenanceType::Accident)->count(),
        ];

        return Inertia::render('maintenance/index', [
            'records' => $records,
            'summary' => $summary,
            'filters' => $request->only('search', 'type'),
            'types' => collect(MaintenanceType::cases())->map(fn ($e) => ['value' => $e->value, 'label' => ucfirst($e->value)]),
        ]);
    }
}
