<?php

declare(strict_types=1);

namespace App\Enums;

enum VehicleStatus: string
{
    case Available = 'available';
    case Rented = 'rented';
    case Maintenance = 'maintenance';
    case Reserved = 'reserved';
    case Decommissioned = 'decommissioned';

    public function label(): string
    {
        return match ($this) {
            self::Available => 'Available',
            self::Rented => 'Rented',
            self::Maintenance => 'In Maintenance',
            self::Reserved => 'Reserved',
            self::Decommissioned => 'Decommissioned',
        };
    }
}
