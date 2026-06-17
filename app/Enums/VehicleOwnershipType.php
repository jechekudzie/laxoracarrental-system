<?php

declare(strict_types=1);

namespace App\Enums;

enum VehicleOwnershipType: string
{
    case Owned = 'owned';
    case Outsourced = 'outsourced';

    public function label(): string
    {
        return match ($this) {
            self::Owned => 'Owned',
            self::Outsourced => 'Outsourced',
        };
    }
}
