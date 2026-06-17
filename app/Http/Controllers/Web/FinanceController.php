<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\BookingStatus;
use App\Enums\CostCategory;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Invoice;
use App\Models\MaintenanceRecord;
use App\Models\Vehicle;
use App\Models\VehicleCost;
use App\Models\VehicleLicence;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class FinanceController extends Controller
{
    public function index(Request $request): Response
    {
        $period = $request->get('period', 'month');
        $range = $this->resolveRange($period);

        // Income: paid_amount from invoices in the range
        $invoiceIncome = (float) Invoice::whereBetween('issued_at', [$range['start'], $range['end']])->sum('paid_amount');

        // Expenditure: ad-hoc costs + maintenance totals + licence costs
        $adhocCosts = (float) VehicleCost::whereBetween('incident_date', [$range['start'], $range['end']])->sum('amount');
        $maintenanceCosts = (float) MaintenanceRecord::whereBetween('started_at', [$range['start'], $range['end']])->sum('total_cost');
        $licenceCosts = (float) VehicleLicence::whereBetween('issue_date', [$range['start'], $range['end']])->sum('cost');

        $totalExpense = $adhocCosts + $maintenanceCosts + $licenceCosts;
        $netProfit = $invoiceIncome - $totalExpense;

        // Series (daily buckets for last N days)
        $series = $this->buildSeries($range['start'], $range['end']);

        // Expense breakdown by category
        $expenseByCategory = $this->expenseBreakdown($range['start'], $range['end']);

        // Top earning / top cost vehicles
        $topEarners = Vehicle::withSum(['bookings as revenue' => function ($q) use ($range) {
            $q->where('status', BookingStatus::Completed)
                ->whereBetween('actual_return_at', [$range['start'], $range['end']]);
        }], 'total_amount')
            ->orderByDesc('revenue')
            ->limit(5)
            ->get(['id', 'make', 'model', 'reg_plate'])
            ->map(fn ($v) => [
                'id' => $v->id,
                'label' => "{$v->make} {$v->model}",
                'reg_plate' => $v->reg_plate,
                'amount' => (float) ($v->revenue ?? 0),
            ]);

        $topCostCenters = Vehicle::withSum(['costs as cost_total' => function ($q) use ($range) {
            $q->whereBetween('incident_date', [$range['start'], $range['end']]);
        }], 'amount')
            ->orderByDesc('cost_total')
            ->limit(5)
            ->get(['id', 'make', 'model', 'reg_plate'])
            ->map(fn ($v) => [
                'id' => $v->id,
                'label' => "{$v->make} {$v->model}",
                'reg_plate' => $v->reg_plate,
                'amount' => (float) ($v->cost_total ?? 0),
            ]);

        // Recent transactions mixed
        $recentInvoices = Invoice::with('customer:id,name')
            ->whereBetween('issued_at', [$range['start'], $range['end']])
            ->latest('issued_at')
            ->limit(10)
            ->get()
            ->map(fn (Invoice $inv) => [
                'id' => $inv->id,
                'date' => $inv->issued_at,
                'type' => 'income',
                'description' => "{$inv->number} — {$inv->customer->name}",
                'amount' => (float) $inv->paid_amount,
            ]);

        $recentCosts = VehicleCost::with('vehicle:id,make,model,reg_plate')
            ->whereBetween('incident_date', [$range['start'], $range['end']])
            ->latest('incident_date')
            ->limit(10)
            ->get()
            ->map(fn (VehicleCost $c) => [
                'id' => 'c-'.$c->id,
                'date' => $c->incident_date,
                'type' => 'expense',
                'description' => "{$c->category->value} — ".($c->vehicle ? "{$c->vehicle->make} {$c->vehicle->model}" : 'Vehicle'),
                'amount' => (float) $c->amount,
            ]);

        $transactions = $recentInvoices->concat($recentCosts)
            ->sortByDesc('date')
            ->take(15)
            ->values();

        return Inertia::render('finance/index', [
            'period' => $period,
            'range' => [
                'start' => $range['start']->toDateString(),
                'end' => $range['end']->toDateString(),
                'label' => $range['label'],
            ],
            'summary' => [
                'income' => $invoiceIncome,
                'expense' => $totalExpense,
                'profit' => $netProfit,
                'margin' => $invoiceIncome > 0 ? round(($netProfit / $invoiceIncome) * 100, 1) : 0,
                'expense_adhoc' => $adhocCosts,
                'expense_maintenance' => $maintenanceCosts,
                'expense_licence' => $licenceCosts,
                'booking_count' => Booking::whereBetween('created_at', [$range['start'], $range['end']])->count(),
                'completed_bookings' => Booking::where('status', BookingStatus::Completed)->whereBetween('actual_return_at', [$range['start'], $range['end']])->count(),
            ],
            'series' => $series,
            'expense_by_category' => $expenseByCategory,
            'top_earners' => $topEarners,
            'top_cost_centers' => $topCostCenters,
            'transactions' => $transactions,
        ]);
    }

    /**
     * @return array{start: CarbonImmutable, end: CarbonImmutable, label: string}
     */
    private function resolveRange(string $period): array
    {
        $now = CarbonImmutable::now();

        return match ($period) {
            'day' => [
                'start' => $now->startOfDay(),
                'end' => $now->endOfDay(),
                'label' => 'Today',
            ],
            'week' => [
                'start' => $now->startOfWeek(),
                'end' => $now->endOfWeek(),
                'label' => 'This Week',
            ],
            'year' => [
                'start' => $now->startOfYear(),
                'end' => $now->endOfYear(),
                'label' => 'This Year',
            ],
            default => [
                'start' => $now->startOfMonth(),
                'end' => $now->endOfMonth(),
                'label' => 'This Month',
            ],
        };
    }

    /**
     * @return array<int, array{date: string, income: float, expense: float}>
     */
    private function buildSeries(CarbonImmutable $start, CarbonImmutable $end): array
    {
        $days = (int) $start->diffInDays($end) + 1;

        $income = Invoice::selectRaw('DATE(issued_at) as d, SUM(paid_amount) as total')
            ->whereBetween('issued_at', [$start, $end])
            ->groupBy('d')
            ->pluck('total', 'd');

        $adhoc = VehicleCost::selectRaw('DATE(incident_date) as d, SUM(amount) as total')
            ->whereBetween('incident_date', [$start, $end])
            ->groupBy('d')
            ->pluck('total', 'd');

        $maint = MaintenanceRecord::selectRaw('DATE(started_at) as d, SUM(total_cost) as total')
            ->whereBetween('started_at', [$start, $end])
            ->groupBy('d')
            ->pluck('total', 'd');

        $series = [];
        for ($i = 0; $i < min($days, 62); $i++) {
            $day = $start->addDays($i)->toDateString();
            $series[] = [
                'date' => $day,
                'income' => (float) ($income[$day] ?? 0),
                'expense' => (float) (($adhoc[$day] ?? 0) + ($maint[$day] ?? 0)),
            ];
        }

        return $series;
    }

    /**
     * @return Collection<int, array{category: string, amount: float}>
     */
    private function expenseBreakdown(CarbonImmutable $start, CarbonImmutable $end): Collection
    {
        $byCategory = VehicleCost::selectRaw('category, SUM(amount) as total')
            ->whereBetween('incident_date', [$start, $end])
            ->groupBy('category')
            ->get()
            ->mapWithKeys(fn ($row) => [$row->category => (float) $row->total]);

        $maintCost = (float) MaintenanceRecord::whereBetween('started_at', [$start, $end])->sum('total_cost');
        $licenceCost = (float) VehicleLicence::whereBetween('issue_date', [$start, $end])->sum('cost');

        // Aggregate: include maintenance as a row, licences as licensing
        $out = collect(CostCategory::cases())
            ->map(fn ($c) => [
                'category' => ucfirst(str_replace('_', ' ', $c->value)),
                'amount' => (float) ($byCategory[$c->value] ?? 0),
            ])
            ->filter(fn ($r) => $r['amount'] > 0);

        if ($maintCost > 0) {
            $out->push(['category' => 'Service & Maintenance', 'amount' => $maintCost]);
        }
        if ($licenceCost > 0) {
            $existing = $out->firstWhere('category', 'Licensing');
            if ($existing) {
                $out = $out->map(fn ($r) => $r['category'] === 'Licensing' ? ['category' => 'Licensing', 'amount' => $r['amount'] + $licenceCost] : $r);
            } else {
                $out->push(['category' => 'Licensing', 'amount' => $licenceCost]);
            }
        }

        return $out->sortByDesc('amount')->values();
    }
}
