<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ServiceProviderCategory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'name',
    'category',
    'phone',
    'email',
    'address',
    'contact_person',
    'services_offered',
    'rating',
    'is_active',
    'notes',
])]
class ServiceProvider extends Model
{
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'category' => ServiceProviderCategory::class,
            'rating' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }
}
