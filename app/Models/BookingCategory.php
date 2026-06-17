<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\Currency;
use Database\Factories\BookingCategoryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Sluggable\HasSlug;
use Spatie\Sluggable\SlugOptions;

#[Fillable([
    'slug',
    'name',
    'description',
    'security_deposit',
    'km_per_day_limit',
    'excess_km_rate',
    'fuel_charge_per_level',
    'currency',
    'is_active',
    'sort_order',
])]
class BookingCategory extends Model
{
    /** @use HasFactory<BookingCategoryFactory> */
    use HasFactory, HasSlug, SoftDeletes;

    public function getSlugOptions(): SlugOptions
    {
        return SlugOptions::create()
            ->generateSlugsFrom('name')
            ->saveSlugsTo('slug')
            ->doNotGenerateSlugsOnUpdate();
    }

    protected function casts(): array
    {
        return [
            'security_deposit' => 'decimal:2',
            'km_per_day_limit' => 'integer',
            'excess_km_rate' => 'decimal:2',
            'fuel_charge_per_level' => 'decimal:2',
            'currency' => Currency::class,
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * @return HasMany<Vehicle, $this>
     */
    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class);
    }
}
