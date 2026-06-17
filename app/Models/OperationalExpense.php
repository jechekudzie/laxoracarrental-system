<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\Currency;
use App\Enums\ExpenseCategory;
use App\Enums\ExpenseStatus;
use App\Enums\PaymentMethod;
use App\Enums\RecurrencePeriod;
use Database\Factories\OperationalExpenseFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'cost_center_id',
    'incurred_by',
    'service_provider_id',
    'approved_by',
    'reference_number',
    'category',
    'description',
    'amount',
    'currency',
    'expense_date',
    'payment_method',
    'receipt_number',
    'status',
    'notes',
    'is_recurring',
    'recurrence_period',
    'next_due_date',
    'recurrence_end_date',
    'paid_at',
])]
class OperationalExpense extends Model
{
    /** @use HasFactory<OperationalExpenseFactory> */
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'category' => ExpenseCategory::class,
            'currency' => Currency::class,
            'payment_method' => PaymentMethod::class,
            'status' => ExpenseStatus::class,
            'recurrence_period' => RecurrencePeriod::class,
            'expense_date' => 'date',
            'next_due_date' => 'date',
            'recurrence_end_date' => 'date',
            'paid_at' => 'date',
            'is_recurring' => 'boolean',
            'amount' => 'decimal:2',
        ];
    }

    /** @return BelongsTo<CostCenter, $this> */
    public function costCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class);
    }

    /** @return BelongsTo<Employee, $this> */
    public function incurredBy(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'incurred_by');
    }

    /** @return BelongsTo<ServiceProvider, $this> */
    public function serviceProvider(): BelongsTo
    {
        return $this->belongsTo(ServiceProvider::class);
    }

    /** @return BelongsTo<User, $this> */
    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
