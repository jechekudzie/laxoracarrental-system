<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\EmploymentType;
use App\Enums\SalaryType;
use Database\Factories\EmployeeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'cost_center_id',
    'employee_number',
    'first_name',
    'last_name',
    'email',
    'phone',
    'position',
    'employment_type',
    'salary_type',
    'base_salary',
    'hire_date',
    'termination_date',
    'is_active',
    'national_id',
    'bank_account',
    'bank_name',
    'notes',
])]
class Employee extends Model
{
    /** @use HasFactory<EmployeeFactory> */
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'employment_type' => EmploymentType::class,
            'salary_type' => SalaryType::class,
            'base_salary' => 'decimal:2',
            'hire_date' => 'date',
            'termination_date' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    /** @return BelongsTo<CostCenter, $this> */
    public function costCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class);
    }

    /** @return HasMany<Salary, $this> */
    public function salaries(): HasMany
    {
        return $this->hasMany(Salary::class);
    }

    /** @return HasMany<WorkerTask, $this> */
    public function tasks(): HasMany
    {
        return $this->hasMany(WorkerTask::class, 'assigned_to');
    }

    /** @return HasMany<OperationalExpense, $this> */
    public function expenses(): HasMany
    {
        return $this->hasMany(OperationalExpense::class, 'incurred_by');
    }
}
