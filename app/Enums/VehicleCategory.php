<?php

declare(strict_types=1);

namespace App\Enums;

enum VehicleCategory: string
{
    case Sedan = 'sedan';
    case SUV = 'suv';
    case Truck = 'truck';
    case Van = 'van';
    case Hatchback = 'hatchback';
    case Bakkie = 'bakkie';

    public function label(): string
    {
        return match ($this) {
            self::Sedan => 'Sedan',
            self::SUV => 'SUV',
            self::Truck => 'Truck',
            self::Van => 'Van',
            self::Hatchback => 'Hatchback',
            self::Bakkie => 'Bakkie',
        };
    }
}
