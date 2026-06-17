<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\LicenceType;
use App\Http\Controllers\Controller;
use App\Models\VehicleLicence;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ComplianceController extends Controller
{
    public function index(Request $request): Response
    {
        $licences = VehicleLicence::query()
            ->with('vehicle:id,make,model,reg_plate')
            ->when($request->type, fn ($q, $t) => $q->where('type', $t))
            ->when($request->status, function ($q, $status) {
                $today = now()->startOfDay();
                if ($status === 'expired') {
                    $q->whereDate('expiry_date', '<', $today);
                } elseif ($status === 'expiring') {
                    $q->whereDate('expiry_date', '>=', $today)
                        ->whereDate('expiry_date', '<=', $today->copy()->addDays(30));
                } elseif ($status === 'valid') {
                    $q->whereDate('expiry_date', '>', $today->copy()->addDays(30));
                }
            })
            ->when($request->search, fn ($q, $s) => $q->whereHas('vehicle', function ($q) use ($s) {
                $q->where('make', 'like', "%{$s}%")
                    ->orWhere('model', 'like', "%{$s}%")
                    ->orWhere('reg_plate', 'like', "%{$s}%");
            }))
            ->orderBy('expiry_date')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (VehicleLicence $l) => [
                'id' => $l->id,
                'vehicle_id' => $l->vehicle_id,
                'vehicle_label' => $l->vehicle ? "{$l->vehicle->make} {$l->vehicle->model}" : null,
                'reg_plate' => $l->vehicle?->reg_plate,
                'type' => $l->type->value,
                'type_label' => $this->typeLabel($l->type),
                'provider' => $l->provider,
                'document_number' => $l->document_number,
                'expiry_date' => $l->expiry_date,
                'cost' => (float) $l->cost,
                'currency' => $l->currency->value,
                'cover_amount' => $l->cover_amount ? (float) $l->cover_amount : null,
                'days_to_expiry' => $l->daysToExpiry(),
                'is_expired' => $l->isExpired(),
            ]);

        $today = now()->startOfDay();
        $summary = [
            'total' => VehicleLicence::count(),
            'valid' => VehicleLicence::whereDate('expiry_date', '>', $today->copy()->addDays(30))->count(),
            'expiring' => VehicleLicence::whereDate('expiry_date', '>=', $today)->whereDate('expiry_date', '<=', $today->copy()->addDays(30))->count(),
            'expired' => VehicleLicence::whereDate('expiry_date', '<', $today)->count(),
        ];

        return Inertia::render('compliance/index', [
            'licences' => $licences,
            'summary' => $summary,
            'filters' => $request->only('search', 'type', 'status'),
            'types' => collect(LicenceType::cases())->map(fn ($e) => ['value' => $e->value, 'label' => $this->typeLabel($e)]),
        ]);
    }

    private function typeLabel(LicenceType $type): string
    {
        return match ($type) {
            LicenceType::Zinara => 'ZINARA Licence',
            LicenceType::ZBC => 'ZBC Radio Licence',
            LicenceType::Fitness => 'Vehicle Fitness',
            LicenceType::Insurance => 'Insurance',
            LicenceType::Registration => 'Registration',
            LicenceType::Custom => 'Other',
        };
    }
}
