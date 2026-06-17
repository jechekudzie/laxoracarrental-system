<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\CostCenterFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'code',
    'name',
    'description',
    'budget_amount',
    'is_active',
])]
class CostCenter extends Model
{
    /** @use HasFactory<CostCenterFactory> */
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'budget_amount' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    /** @return HasMany<Employee, $this> */
    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    /** @return HasMany<OperationalExpense, $this> */
    public function operationalExpenses(): HasMany
    {
        return $this->hasMany(OperationalExpense::class);
    }

    /** @return HasMany<Requisition, $this> */
    public function requisitions(): HasMany
    {
        return $this->hasMany(Requisition::class);
    }

    /** @return HasMany<WorkerTask, $this> */
    public function workerTasks(): HasMany
    {
        return $this->hasMany(WorkerTask::class);
    }

    /** @return HasMany<ServiceProviderPayment, $this> */
    public function vendorPayments(): HasMany
    {
        return $this->hasMany(ServiceProviderPayment::class);
    }
}
