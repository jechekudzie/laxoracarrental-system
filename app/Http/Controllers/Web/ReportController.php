<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\BookingStatus;
use App\Enums\ExpenseCategory;
use App\Enums\ExpenseStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Customer;
use App\Models\Employee;
use App\Models\Invoice;
use App\Models\OperationalExpense;
use App\Models\Payment;
use App\Models\Salary;
use App\Models\WorkerTask;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    private function periodDates(string $period): array
    {
        return match ($period) {
            'last_month' => [now()->subMonth()->startOfMonth(), now()->subMonth()->endOfMonth()],
            'this_quarter' => [now()->startOfQuarter(), now()->endOfQuarter()],
            'this_year' => [now()->startOfYear(), now()->endOfYear()],
            default => [now()->startOfMonth(), now()->endOfMonth()],
        };
    }

    public function index(): InertiaResponse
    {
        $startOfMonth = now()->startOfMonth();
        $endOfMonth = now()->endOfMonth();

        $stats = [
            'bookings_this_month' => Booking::whereBetween('created_at', [$startOfMonth, $endOfMonth])->count(),
            'revenue_this_month' => (float) Invoice::whereBetween('created_at', [$startOfMonth, $endOfMonth])->sum('paid_amount'),
            'expenses_this_month' => (float) OperationalExpense::whereBetween('expense_date', [$startOfMonth, $endOfMonth])->sum('amount'),
            'active_employees' => Employee::where('is_active', true)->count(),
            'tasks_completed_this_month' => WorkerTask::where('status', 'completed')
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->count(),
            'tasks_overdue' => WorkerTask::whereNotIn('status', ['completed', 'cancelled'])
                ->where('due_date', '<', now()->toDateString())
                ->count(),
        ];

        return Inertia::render('reports/index', [
            'stats' => $stats,
        ]);
    }

    public function bookings(Request $request): InertiaResponse
    {
        $period = $request->input('period', 'this_month');
        [$start, $end] = $this->periodDates($period);

        $summary = [
            'total' => Booking::whereBetween('created_at', [$start, $end])->count(),
            'revenue' => (float) Booking::whereBetween('created_at', [$start, $end])->sum('total_amount'),
            'completed' => Booking::where('status', BookingStatus::Completed)->whereBetween('created_at', [$start, $end])->count(),
            'cancelled' => Booking::where('status', BookingStatus::Cancelled)->whereBetween('created_at', [$start, $end])->count(),
            'avg_value' => (float) Booking::whereBetween('created_at', [$start, $end])->avg('total_amount'),
        ];

        $byStatus = Booking::selectRaw('status, count(*) as count, sum(total_amount) as revenue')
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('status')
            ->get()
            ->map(fn ($r) => [
                'status' => $r->status instanceof BookingStatus ? $r->status->value : $r->status,
                'label' => $r->status instanceof BookingStatus ? $r->status->label() : BookingStatus::from($r->status)->label(),
                'count' => (int) $r->count,
                'revenue' => (float) $r->revenue,
            ])
            ->values()
            ->all();

        $monthlyTrend = Booking::selectRaw(
            "TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month, DATE_TRUNC('month', created_at) as month_date, count(*) as bookings, sum(total_amount) as revenue"
        )
            ->where('created_at', '>=', now()->subMonths(11)->startOfMonth())
            ->groupBy('month_date', 'month')
            ->orderBy('month_date')
            ->get()
            ->map(fn ($r) => [
                'month' => $r->month,
                'bookings' => (int) $r->bookings,
                'revenue' => (float) $r->revenue,
            ])
            ->values()
            ->all();

        $topCustomers = Booking::join('customers', 'bookings.customer_id', '=', 'customers.id')
            ->selectRaw('customers.name, count(*) as bookings, sum(bookings.total_amount) as revenue')
            ->whereBetween('bookings.created_at', [$start, $end])
            ->groupBy('customers.id', 'customers.name')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get()
            ->map(fn ($r) => [
                'name' => $r->name,
                'bookings' => (int) $r->bookings,
                'revenue' => (float) $r->revenue,
            ])
            ->values()
            ->all();

        $topVehicles = Booking::join('vehicles', 'bookings.vehicle_id', '=', 'vehicles.id')
            ->selectRaw("CONCAT(vehicles.make, ' ', vehicles.model, ' (', vehicles.reg_plate, ')') as label, count(*) as bookings, sum(bookings.total_amount) as revenue")
            ->whereBetween('bookings.created_at', [$start, $end])
            ->groupBy('vehicles.id', 'vehicles.make', 'vehicles.model', 'vehicles.reg_plate')
            ->orderByDesc('bookings')
            ->limit(10)
            ->get()
            ->map(fn ($r) => [
                'label' => $r->label,
                'bookings' => (int) $r->bookings,
                'revenue' => (float) $r->revenue,
            ])
            ->values()
            ->all();

        return Inertia::render('reports/bookings', [
            'period' => $period,
            'summary' => $summary,
            'by_status' => $byStatus,
            'monthly_trend' => $monthlyTrend,
            'top_customers' => $topCustomers,
            'top_vehicles' => $topVehicles,
        ]);
    }

    public function expenses(Request $request): InertiaResponse
    {
        $period = $request->input('period', 'this_month');
        [$start, $end] = $this->periodDates($period);

        $summary = [
            'total' => (float) OperationalExpense::whereBetween('expense_date', [$start, $end])->sum('amount'),
            'paid' => (float) OperationalExpense::where('status', 'paid')->whereBetween('expense_date', [$start, $end])->sum('amount'),
            'pending' => (float) OperationalExpense::where('status', 'pending')->whereBetween('expense_date', [$start, $end])->sum('amount'),
            'overdue' => OperationalExpense::where('due_date', '<', now()->toDateString())
                ->where('status', '!=', 'paid')
                ->count(),
        ];

        $byCategory = OperationalExpense::selectRaw('category, count(*) as count, sum(amount) as total')
            ->whereBetween('expense_date', [$start, $end])
            ->groupBy('category')
            ->get()
            ->map(fn ($r) => [
                'category' => $r->category instanceof ExpenseCategory ? $r->category->value : $r->category,
                'label' => $r->category instanceof ExpenseCategory ? $r->category->label() : ExpenseCategory::from($r->category)->label(),
                'total' => (float) $r->total,
                'count' => (int) $r->count,
            ])
            ->values()
            ->all();

        $byCostCenter = OperationalExpense::join('cost_centers', 'operational_expenses.cost_center_id', '=', 'cost_centers.id')
            ->selectRaw('cost_centers.name, count(*) as count, sum(operational_expenses.amount) as total')
            ->whereBetween('expense_date', [$start, $end])
            ->whereNotNull('operational_expenses.cost_center_id')
            ->groupBy('cost_centers.id', 'cost_centers.name')
            ->orderByDesc('total')
            ->limit(10)
            ->get()
            ->map(fn ($r) => [
                'name' => $r->name,
                'total' => (float) $r->total,
                'count' => (int) $r->count,
            ])
            ->values()
            ->all();

        $monthlyTrend = OperationalExpense::selectRaw(
            "TO_CHAR(DATE_TRUNC('month', expense_date), 'Mon YYYY') as month, DATE_TRUNC('month', expense_date) as month_date, sum(amount) as total"
        )
            ->where('expense_date', '>=', now()->subMonths(11)->startOfMonth())
            ->groupBy('month_date', 'month')
            ->orderBy('month_date')
            ->get()
            ->map(fn ($r) => [
                'month' => $r->month,
                'total' => (float) $r->total,
            ])
            ->values()
            ->all();

        $topProviders = OperationalExpense::join('service_providers', 'operational_expenses.service_provider_id', '=', 'service_providers.id')
            ->selectRaw('service_providers.name, count(*) as count, sum(operational_expenses.amount) as total')
            ->whereBetween('expense_date', [$start, $end])
            ->whereNotNull('operational_expenses.service_provider_id')
            ->groupBy('service_providers.id', 'service_providers.name')
            ->orderByDesc('total')
            ->limit(10)
            ->get()
            ->map(fn ($r) => [
                'name' => $r->name,
                'total' => (float) $r->total,
                'count' => (int) $r->count,
            ])
            ->values()
            ->all();

        return Inertia::render('reports/expenses', [
            'period' => $period,
            'summary' => $summary,
            'by_category' => $byCategory,
            'by_cost_center' => $byCostCenter,
            'monthly_trend' => $monthlyTrend,
            'top_providers' => $topProviders,
        ]);
    }

    public function hr(Request $request): InertiaResponse
    {
        $period = $request->input('period', 'this_month');
        [$start, $end] = $this->periodDates($period);

        $summary = [
            'total_employees' => Employee::count(),
            'active' => Employee::where('is_active', true)->count(),
            'total_payroll' => (float) Salary::whereBetween('period_start', [$start, $end])->sum('net_salary'),
            'paid_payroll' => (float) Salary::where('status', 'paid')->whereBetween('period_start', [$start, $end])->sum('net_salary'),
            'new_hires' => Employee::whereBetween('hire_date', [$start, $end])->count(),
        ];

        $byEmploymentType = Employee::selectRaw('employment_type, count(*) as count')
            ->groupBy('employment_type')
            ->get()
            ->map(fn ($r) => [
                'employment_type' => $r->employment_type,
                'count' => (int) $r->count,
            ])
            ->values()
            ->all();

        $byCostCenter = Employee::join('cost_centers', 'employees.cost_center_id', '=', 'cost_centers.id')
            ->selectRaw('cost_centers.name, count(*) as count, sum(employees.base_salary) as total_salary')
            ->whereNotNull('employees.cost_center_id')
            ->groupBy('cost_centers.id', 'cost_centers.name')
            ->orderByDesc('total_salary')
            ->get()
            ->map(fn ($r) => [
                'name' => $r->name,
                'count' => (int) $r->count,
                'total_salary' => (float) $r->total_salary,
            ])
            ->values()
            ->all();

        $salaryTrend = Salary::selectRaw(
            "TO_CHAR(DATE_TRUNC('month', period_start), 'Mon YYYY') as month, DATE_TRUNC('month', period_start) as month_date, sum(net_salary) as total"
        )
            ->where('period_start', '>=', now()->subMonths(11)->startOfMonth())
            ->groupBy('month_date', 'month')
            ->orderBy('month_date')
            ->get()
            ->map(fn ($r) => [
                'month' => $r->month,
                'total' => (float) $r->total,
            ])
            ->values()
            ->all();

        $taskCompletion = WorkerTask::join('employees', 'worker_tasks.assigned_to', '=', 'employees.id')
            ->selectRaw("CONCAT(employees.first_name, ' ', employees.last_name) as employee, count(*) as total, sum(case when worker_tasks.status = 'completed' then 1 else 0 end) as completed")
            ->whereBetween('worker_tasks.created_at', [$start, $end])
            ->groupBy('employees.id', 'employees.first_name', 'employees.last_name')
            ->orderByDesc('completed')
            ->limit(10)
            ->get()
            ->map(fn ($r) => [
                'employee' => $r->employee,
                'total' => (int) $r->total,
                'completed' => (int) $r->completed,
                'rate' => $r->total > 0 ? round($r->completed / $r->total * 100) : 0,
            ])
            ->values()
            ->all();

        return Inertia::render('reports/hr', [
            'period' => $period,
            'summary' => $summary,
            'by_employment_type' => $byEmploymentType,
            'by_cost_center' => $byCostCenter,
            'salary_trend' => $salaryTrend,
            'task_completion' => $taskCompletion,
        ]);
    }

    public function tasks(Request $request): InertiaResponse
    {
        $period = $request->input('period', 'this_month');
        [$start, $end] = $this->periodDates($period);

        $total = WorkerTask::whereBetween('created_at', [$start, $end])->count();
        $completed = WorkerTask::where('status', 'completed')->whereBetween('created_at', [$start, $end])->count();

        $summary = [
            'total' => $total,
            'completed' => $completed,
            'in_progress' => WorkerTask::where('status', 'in_progress')->whereBetween('created_at', [$start, $end])->count(),
            'overdue' => WorkerTask::whereNotIn('status', ['completed', 'cancelled'])
                ->where('due_date', '<', now()->toDateString())
                ->count(),
            'completion_rate' => $total > 0 ? round($completed / $total * 100) : 0,
        ];

        $byStatus = WorkerTask::selectRaw('status, count(*) as count')
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('status')
            ->get()
            ->map(fn ($r) => [
                'status' => $r->status,
                'count' => (int) $r->count,
            ])
            ->values()
            ->all();

        $byPriority = WorkerTask::selectRaw('priority, count(*) as count')
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('priority')
            ->get()
            ->map(fn ($r) => [
                'priority' => $r->priority,
                'count' => (int) $r->count,
            ])
            ->values()
            ->all();

        $monthlyCompletions = WorkerTask::selectRaw(
            "TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month, DATE_TRUNC('month', created_at) as month_date, count(*) as completed"
        )
            ->where('status', 'completed')
            ->where('created_at', '>=', now()->subMonths(11)->startOfMonth())
            ->groupBy('month_date', 'month')
            ->orderBy('month_date')
            ->get()
            ->map(fn ($r) => [
                'month' => $r->month,
                'completed' => (int) $r->completed,
            ])
            ->values()
            ->all();

        $topPerformers = WorkerTask::join('employees', 'worker_tasks.assigned_to', '=', 'employees.id')
            ->selectRaw("CONCAT(employees.first_name, ' ', employees.last_name) as employee, count(*) as total, sum(case when worker_tasks.status = 'completed' then 1 else 0 end) as completed")
            ->whereBetween('worker_tasks.created_at', [$start, $end])
            ->groupBy('employees.id', 'employees.first_name', 'employees.last_name')
            ->orderByDesc('completed')
            ->limit(10)
            ->get()
            ->map(fn ($r) => [
                'employee' => $r->employee,
                'total' => (int) $r->total,
                'completed' => (int) $r->completed,
                'rate' => $r->total > 0 ? round($r->completed / $r->total * 100) : 0,
            ])
            ->values()
            ->all();

        return Inertia::render('reports/tasks', [
            'period' => $period,
            'summary' => $summary,
            'by_status' => $byStatus,
            'by_priority' => $byPriority,
            'monthly_completions' => $monthlyCompletions,
            'top_performers' => $topPerformers,
        ]);
    }

    public function exportBookings(Request $request): StreamedResponse
    {
        $period = $request->input('period', 'this_month');
        [$start, $end] = $this->periodDates($period);

        $bookings = Booking::join('customers', 'bookings.customer_id', '=', 'customers.id')
            ->join('vehicles', 'bookings.vehicle_id', '=', 'vehicles.id')
            ->selectRaw("bookings.reference, customers.name as customer, CONCAT(vehicles.make, ' ', vehicles.model) as vehicle, vehicles.reg_plate, bookings.status, bookings.pickup_datetime, bookings.return_datetime, bookings.total_amount, bookings.currency")
            ->whereBetween('bookings.created_at', [$start, $end])
            ->orderBy('bookings.created_at')
            ->get();

        return Response::streamDownload(function () use ($bookings) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Reference', 'Customer', 'Vehicle', 'Reg Plate', 'Status', 'Pickup', 'Return', 'Amount', 'Currency']);
            foreach ($bookings as $b) {
                fputcsv($handle, [$b->reference, $b->customer, $b->vehicle, $b->reg_plate, $b->status, $b->pickup_datetime, $b->return_datetime, $b->total_amount, $b->currency]);
            }
            fclose($handle);
        }, "bookings-{$period}.csv", ['Content-Type' => 'text/csv']);
    }

    public function exportExpenses(Request $request): StreamedResponse
    {
        $period = $request->input('period', 'this_month');
        [$start, $end] = $this->periodDates($period);

        $expenses = OperationalExpense::with('costCenter:id,name', 'serviceProvider:id,name')
            ->whereBetween('expense_date', [$start, $end])
            ->orderBy('expense_date')
            ->get();

        return Response::streamDownload(function () use ($expenses) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Date', 'Description', 'Category', 'Amount', 'Currency', 'Status', 'Cost Center', 'Service Provider', 'Due Date']);
            foreach ($expenses as $e) {
                fputcsv($handle, [
                    $e->expense_date?->toDateString(), $e->description,
                    $e->category instanceof ExpenseCategory ? $e->category->label() : $e->category,
                    $e->amount, $e->currency,
                    $e->status instanceof ExpenseStatus ? $e->status->label() : $e->status,
                    $e->costCenter?->name, $e->serviceProvider?->name, $e->due_date?->toDateString(),
                ]);
            }
            fclose($handle);
        }, "expenses-{$period}.csv", ['Content-Type' => 'text/csv']);
    }

    public function exportHr(Request $request): StreamedResponse
    {
        $employees = Employee::with('costCenter:id,name')
            ->orderBy('first_name')
            ->get();

        return Response::streamDownload(function () use ($employees) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Employee #', 'First Name', 'Last Name', 'Email', 'Phone', 'Position', 'Employment Type', 'Salary Type', 'Base Salary', 'Department', 'Hire Date', 'Status']);
            foreach ($employees as $e) {
                fputcsv($handle, [
                    $e->employee_number, $e->first_name, $e->last_name, $e->email, $e->phone,
                    $e->position, $e->employment_type->value, $e->salary_type->value,
                    $e->base_salary, $e->costCenter?->name, $e->hire_date?->toDateString(),
                    $e->is_active ? 'Active' : 'Inactive',
                ]);
            }
            fclose($handle);
        }, 'employees.csv', ['Content-Type' => 'text/csv']);
    }

    public function exportTasks(Request $request): StreamedResponse
    {
        $period = $request->input('period', 'this_month');
        [$start, $end] = $this->periodDates($period);

        $tasks = WorkerTask::join('employees', 'worker_tasks.assigned_to', '=', 'employees.id')
            ->selectRaw("worker_tasks.title, worker_tasks.status, worker_tasks.priority, worker_tasks.due_date, CONCAT(employees.first_name, ' ', employees.last_name) as employee, worker_tasks.created_at")
            ->whereBetween('worker_tasks.created_at', [$start, $end])
            ->orderBy('worker_tasks.created_at')
            ->get();

        return Response::streamDownload(function () use ($tasks) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Title', 'Status', 'Priority', 'Assigned To', 'Due Date', 'Created']);
            foreach ($tasks as $t) {
                fputcsv($handle, [$t->title, $t->status, $t->priority, $t->employee, $t->due_date, $t->created_at]);
            }
            fclose($handle);
        }, "tasks-{$period}.csv", ['Content-Type' => 'text/csv']);
    }

    public function customerStatements(Request $request): InertiaResponse
    {
        $customers = Customer::withCount('bookings')
            ->with('bookings', function ($q) {
                $q->selectRaw('customer_id, sum(total_amount) as revenue, count(*) as total')->groupBy('customer_id');
            })
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Customer $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'email' => $c->email,
                'phone' => $c->phone,
                'bookings_count' => $c->bookings_count,
            ]);

        return Inertia::render('reports/statements/customers', [
            'customers' => $customers,
            'filters' => $request->only('search'),
        ]);
    }

    public function customerStatement(Request $request, Customer $customer): InertiaResponse
    {
        $startDate = $request->input('start_date', now()->startOfYear()->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());

        $bookings = $customer->bookings()
            ->with('vehicle:id,make,model,reg_plate', 'invoice:id,booking_id,number,total_amount,paid_amount,status')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->orderBy('created_at')
            ->get()
            ->map(fn ($b) => [
                'id' => $b->id,
                'reference' => $b->reference,
                'vehicle' => $b->vehicle ? "{$b->vehicle->make} {$b->vehicle->model} ({$b->vehicle->reg_plate})" : null,
                'status' => $b->status->value,
                'status_label' => $b->status->label(),
                'pickup_datetime' => $b->pickup_datetime?->toDateTimeString(),
                'return_datetime' => $b->return_datetime?->toDateTimeString(),
                'total_amount' => (float) $b->total_amount,
                'currency' => $b->currency,
                'invoice' => $b->invoice ? [
                    'number' => $b->invoice->number,
                    'total' => (float) $b->invoice->total_amount,
                    'paid' => (float) $b->invoice->paid_amount,
                    'balance' => (float) $b->invoice->total_amount - (float) $b->invoice->paid_amount,
                    'status' => $b->invoice->status,
                ] : null,
            ]);

        $payments = Payment::whereHas('booking', fn ($q) => $q->where('customer_id', $customer->id))
            ->with('booking:id,reference')
            ->whereBetween('paid_at', [$startDate, $endDate])
            ->orderBy('paid_at')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'paid_at' => $p->paid_at?->toDateString(),
                'amount' => (float) $p->amount,
                'method' => $p->payment_method,
                'reference' => $p->booking?->reference,
                'notes' => $p->notes,
            ]);

        $totalBilled = $bookings->sum('total_amount');
        $totalPaid = $payments->sum('amount');

        return Inertia::render('reports/statements/customer-show', [
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'id_number' => $customer->id_number,
            ],
            'bookings' => $bookings->values(),
            'payments' => $payments->values(),
            'summary' => [
                'total_bookings' => $bookings->count(),
                'total_billed' => $totalBilled,
                'total_paid' => $totalPaid,
                'outstanding' => $totalBilled - $totalPaid,
            ],
            'period' => ['start' => $startDate, 'end' => $endDate],
        ]);
    }

    public function customerStatementPdf(Request $request, Customer $customer): HttpResponse
    {
        $startDate = $request->input('start_date', now()->startOfYear()->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());

        $bookings = $customer->bookings()
            ->with('vehicle:id,make,model,reg_plate', 'invoice')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->orderBy('created_at')
            ->get();

        $payments = Payment::whereHas('booking', fn ($q) => $q->where('customer_id', $customer->id))
            ->with('booking:id,reference')
            ->whereBetween('paid_at', [$startDate, $endDate])
            ->orderBy('paid_at')
            ->get();

        $pdf = Pdf::loadView('pdf.customer-statement', [
            'customer' => $customer,
            'bookings' => $bookings,
            'payments' => $payments,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'totalBilled' => $bookings->sum('total_amount'),
            'totalPaid' => $payments->sum('amount'),
        ])->setPaper('a4', 'portrait');

        return $pdf->stream("statement-{$customer->id}-{$startDate}-{$endDate}.pdf");
    }

    public function organisationStatement(Request $request): InertiaResponse
    {
        $period = $request->input('period', 'this_month');
        [$start, $end] = $this->periodDates($period);

        $revenue = Invoice::whereBetween('issued_at', [$start, $end])->sum('total_amount');
        $collected = Invoice::whereBetween('issued_at', [$start, $end])->sum('paid_amount');
        $expenses = OperationalExpense::whereBetween('expense_date', [$start, $end])->sum('amount');
        $payroll = Salary::whereBetween('period_start', [$start, $end])->sum('net_salary');

        $expensesByCategory = OperationalExpense::selectRaw('category, sum(amount) as total')
            ->whereBetween('expense_date', [$start, $end])
            ->groupBy('category')
            ->get()
            ->map(fn ($r) => [
                'label' => $r->category instanceof ExpenseCategory ? $r->category->label() : ExpenseCategory::from($r->category)->label(),
                'total' => (float) $r->total,
            ])
            ->values();

        $revenueByMonth = Invoice::selectRaw(
            "TO_CHAR(DATE_TRUNC('month', issued_at), 'Mon YYYY') as month, DATE_TRUNC('month', issued_at) as month_date, sum(total_amount) as revenue, sum(paid_amount) as collected"
        )
            ->where('issued_at', '>=', now()->subMonths(11)->startOfMonth())
            ->groupBy('month_date', 'month')
            ->orderBy('month_date')
            ->get()
            ->map(fn ($r) => ['month' => $r->month, 'revenue' => (float) $r->revenue, 'collected' => (float) $r->collected])
            ->values();

        return Inertia::render('reports/statements/organisation', [
            'period' => $period,
            'summary' => [
                'revenue' => (float) $revenue,
                'collected' => (float) $collected,
                'expenses' => (float) $expenses,
                'payroll' => (float) $payroll,
                'gross_profit' => (float) $collected - (float) $expenses - (float) $payroll,
            ],
            'expenses_by_category' => $expensesByCategory,
            'revenue_by_month' => $revenueByMonth,
        ]);
    }

    public function organisationStatementPdf(Request $request): HttpResponse
    {
        $period = $request->input('period', 'this_month');
        [$start, $end] = $this->periodDates($period);

        $revenue = (float) Invoice::whereBetween('issued_at', [$start, $end])->sum('total_amount');
        $collected = (float) Invoice::whereBetween('issued_at', [$start, $end])->sum('paid_amount');
        $expenses = (float) OperationalExpense::whereBetween('expense_date', [$start, $end])->sum('amount');
        $payroll = (float) Salary::whereBetween('period_start', [$start, $end])->sum('net_salary');

        $expensesByCategory = OperationalExpense::selectRaw('category, sum(amount) as total')
            ->whereBetween('expense_date', [$start, $end])
            ->groupBy('category')
            ->get()
            ->map(fn ($r) => [
                'label' => ExpenseCategory::from($r->category instanceof ExpenseCategory ? $r->category->value : $r->category)->label(),
                'total' => (float) $r->total,
            ]);

        $bookingStats = Booking::whereBetween('created_at', [$start, $end])
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->get();

        $pdf = Pdf::loadView('pdf.organisation-statement', [
            'period' => $period,
            'start' => $start,
            'end' => $end,
            'revenue' => $revenue,
            'collected' => $collected,
            'expenses' => $expenses,
            'payroll' => $payroll,
            'grossProfit' => $collected - $expenses - $payroll,
            'expensesByCategory' => $expensesByCategory,
            'bookingStats' => $bookingStats,
        ])->setPaper('a4', 'portrait');

        return $pdf->stream("organisation-statement-{$period}.pdf");
    }
}
