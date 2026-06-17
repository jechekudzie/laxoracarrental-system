<?php

declare(strict_types=1);

namespace App\Enums;

enum CustomerStatus: string
{
    case Active = 'active';
    case Greylisted = 'greylisted';
    case Blacklisted = 'blacklisted';
    case Suspended = 'suspended';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Active',
            self::Greylisted => 'Greylisted',
            self::Blacklisted => 'Blacklisted',
            self::Suspended => 'Suspended',
        };
    }
}
