<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\Currency;
use App\Enums\ExpenseCategory;
use App\Enums\ExpenseStatus;
use App\Enums\PaymentMethod;
use App\Enums\RecurrencePeriod;
use App\Http\Controllers\Controller;
use App\Models\CostCenter;
use App\Models\Employee;
use App\Models\OperationalExpense;
use App\Models\ServiceProvider;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class OperationalExpenseController extends Controller
{
    public function index(Request $request): Response
    {
        $expenses = OperationalExpense::with('costCenter:id,name,code', 'incurredBy:id,first_name,last_name', 'serviceProvider:id,name')
            ->when($request->search, fn ($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('description', 'like', "%{$s}%")->orWhere('reference_number', 'like', "%{$s}%");
            }))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->category, fn ($q, $c) => $q->where('category', $c))
            ->when($request->cost_center_id, fn ($q, $id) => $q->where('cost_center_id', $id))
            ->when($request->boolean('recurring'), fn ($q) => $q->where('is_recurring', true))
            ->latest('expense_date')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (OperationalExpense $e) => [
                'id' => $e->id,
                'description' => $e->description,
                'reference_number' => $e->reference_number,
                'category' => $e->category->value,
                'category_label' => $e->category->label(),
                'amount' => (float) $e->amount,
                'currency' => $e->currency->value,
                'expense_date' => $e->expense_date?->toDateString(),
                'status' => $e->status->value,
                'status_label' => $e->status->label(),
                'status_color' => $e->status->color(),
                'cost_center' => $e->costCenter ? ['id' => $e->costCenter->id, 'name' => $e->costCenter->name] : null,
                'incurred_by' => $e->incurredBy ? ['id' => $e->incurredBy->id, 'full_name' => $e->incurredBy->full_name] : null,
                'service_provider' => $e->serviceProvider ? ['id' => $e->serviceProvider->id, 'name' => $e->serviceProvider->name] : null,
                'payment_method' => $e->payment_method?->value,
                'payment_method_label' => $e->payment_method ? ucfirst(str_replace('_', ' ', $e->payment_method->value)) : null,
                'receipt_number' => $e->receipt_number,
                'is_recurring' => $e->is_recurring,
                'recurrence_period' => $e->recurrence_period?->value,
                'recurrence_period_label' => $e->recurrence_period?->label(),
                'next_due_date' => $e->next_due_date?->toDateString(),
                'recurrence_end_date' => $e->recurrence_end_date?->toDateString(),
                'paid_at' => $e->paid_at?->toDateString(),
            ]);

        $upcomingRecurring = OperationalExpense::where('is_recurring', true)
            ->whereIn('status', [ExpenseStatus::Pending->value, ExpenseStatus::Approved->value])
            ->whereNotNull('next_due_date')
            ->where('next_due_date', '<=', now()->addDays(7))
            ->orderBy('next_due_date')
            ->get(['id', 'description', 'amount', 'next_due_date', 'recurrence_period'])
            ->map(fn ($e) => [
                'id' => $e->id,
                'description' => $e->description,
                'amount' => (float) $e->amount,
                'next_due_date' => $e->next_due_date?->toDateString(),
                'recurrence_period_label' => $e->recurrence_period?->label(),
            ]);

        return Inertia::render('finance/expenses/index', [
            'expenses' => $expenses,
            'filters' => $request->only('search', 'status', 'category', 'cost_center_id', 'recurring'),
            'upcoming_recurring' => $upcomingRecurring,
            'categories' => collect(ExpenseCategory::cases())->map(fn ($c) => ['value' => $c->value, 'label' => $c->label()]),
            'statuses' => collect(ExpenseStatus::cases())->map(fn ($s) => ['value' => $s->value, 'label' => $s->label()]),
            'recurrence_periods' => collect(RecurrencePeriod::cases())->map(fn ($p) => ['value' => $p->value, 'label' => $p->label()]),
            'cost_centers' => CostCenter::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'employees' => Employee::where('is_active', true)->orderBy('first_name')->get(['id', 'first_name', 'last_name']),
            'service_providers' => ServiceProvider::where('is_active', true)->orderBy('name')->get(['id', 'name', 'category']),
            'payment_methods' => collect(PaymentMethod::cases())->map(fn ($m) => ['value' => $m->value, 'label' => ucfirst(str_replace('_', ' ', $m->value))]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'cost_center_id' => ['nullable', 'exists:cost_centers,id'],
            'incurred_by' => ['nullable', 'exists:employees,id'],
            'service_provider_id' => ['nullable', 'exists:service_providers,id'],
            'reference_number' => ['nullable', 'string', 'max:60'],
            'category' => ['required', Rule::enum(ExpenseCategory::class)],
            'description' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'currency' => ['nullable', Rule::enum(Currency::class)],
            'expense_date' => ['required', 'date'],
            'payment_method' => ['nullable', Rule::enum(PaymentMethod::class)],
            'receipt_number' => ['nullable', 'string', 'max:60'],
            'notes' => ['nullable', 'string'],
            'is_recurring' => ['boolean'],
            'recurrence_period' => ['nullable', 'required_if:is_recurring,true', Rule::enum(RecurrencePeriod::class)],
            'next_due_date' => ['nullable', 'date'],
            'recurrence_end_date' => ['nullable', 'date', 'after:next_due_date'],
        ]);

        $expense = OperationalExpense::create($data);

        // Auto-set next_due_date from expense_date if recurring and not supplied
        if ($expense->is_recurring && ! $expense->next_due_date && $expense->recurrence_period) {
            $expense->update([
                'next_due_date' => $expense->recurrence_period->nextDate($expense->expense_date),
            ]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Expense recorded.']);

        return back();
    }

    public function update(Request $request, OperationalExpense $operationalExpense): RedirectResponse
    {
        $data = $request->validate([
            'cost_center_id' => ['nullable', 'exists:cost_centers,id'],
            'incurred_by' => ['nullable', 'exists:employees,id'],
            'service_provider_id' => ['nullable', 'exists:service_providers,id'],
            'reference_number' => ['nullable', 'string', 'max:60'],
            'category' => ['required', Rule::enum(ExpenseCategory::class)],
            'description' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'currency' => ['nullable', Rule::enum(Currency::class)],
            'expense_date' => ['required', 'date'],
            'payment_method' => ['nullable', Rule::enum(PaymentMethod::class)],
            'receipt_number' => ['nullable', 'string', 'max:60'],
            'status' => ['nullable', Rule::enum(ExpenseStatus::class)],
            'notes' => ['nullable', 'string'],
            'is_recurring' => ['boolean'],
            'recurrence_period' => ['nullable', 'required_if:is_recurring,true', Rule::enum(RecurrencePeriod::class)],
            'next_due_date' => ['nullable', 'date'],
            'recurrence_end_date' => ['nullable', 'date'],
        ]);

        $operationalExpense->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Expense updated.']);

        return back();
    }

    public function approve(OperationalExpense $operationalExpense): RedirectResponse
    {
        $operationalExpense->update([
            'status' => ExpenseStatus::Approved,
            'approved_by' => auth()->id(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Expense approved.']);

        return back();
    }

    public function markPaid(Request $request, OperationalExpense $operationalExpense): RedirectResponse
    {
        $data = $request->validate([
            'paid_at' => ['required', 'date'],
            'payment_method' => ['required', Rule::enum(PaymentMethod::class)],
            'receipt_number' => ['nullable', 'string', 'max:60'],
        ]);

        $operationalExpense->update([
            'status' => ExpenseStatus::Paid,
            'paid_at' => $data['paid_at'],
            'payment_method' => $data['payment_method'],
            'receipt_number' => $data['receipt_number'] ?? $operationalExpense->receipt_number,
        ]);

        // If recurring, spawn the next occurrence
        if ($operationalExpense->is_recurring && $operationalExpense->recurrence_period) {
            $nextDate = $operationalExpense->recurrence_period->nextDate($operationalExpense->next_due_date ?? $operationalExpense->expense_date);

            $endDate = $operationalExpense->recurrence_end_date;
            if (! $endDate || $nextDate->lte($endDate)) {
                OperationalExpense::create([
                    'cost_center_id' => $operationalExpense->cost_center_id,
                    'incurred_by' => $operationalExpense->incurred_by,
                    'service_provider_id' => $operationalExpense->service_provider_id,
                    'category' => $operationalExpense->category,
                    'description' => $operationalExpense->description,
                    'amount' => $operationalExpense->amount,
                    'currency' => $operationalExpense->currency,
                    'expense_date' => $nextDate->toDateString(),
                    'is_recurring' => true,
                    'recurrence_period' => $operationalExpense->recurrence_period,
                    'next_due_date' => $operationalExpense->recurrence_period->nextDate($nextDate)->toDateString(),
                    'recurrence_end_date' => $operationalExpense->recurrence_end_date?->toDateString(),
                    'status' => ExpenseStatus::Pending,
                    'notes' => $operationalExpense->notes,
                ]);
            }
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Payment recorded.']);

        return back();
    }

    public function destroy(OperationalExpense $operationalExpense): RedirectResponse
    {
        $operationalExpense->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Expense deleted.']);

        return back();
    }
}
