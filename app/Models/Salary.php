<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\PaymentMethod;
use App\Enums\SalaryStatus;
use Database\Factories\SalaryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'employee_id',
    'paid_by',
    'period_start',
    'period_end',
    'pay_date',
    'basic_salary',
    'allowances',
    'deductions',
    'gross_salary',
    'net_salary',
    'payment_method',
    'payment_reference',
    'status',
    'notes',
])]
class Salary extends Model
{
    /** @use HasFactory<SalaryFactory> */
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'period_start' => 'date',
            'period_end' => 'date',
            'pay_date' => 'date',
            'allowances' => 'array',
            'deductions' => 'array',
            'basic_salary' => 'decimal:2',
            'gross_salary' => 'decimal:2',
            'net_salary' => 'decimal:2',
            'payment_method' => PaymentMethod::class,
            'status' => SalaryStatus::class,
        ];
    }

    /** @return BelongsTo<Employee, $this> */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /** @return BelongsTo<User, $this> */
    public function paidBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'paid_by');
    }
}
