<?php

declare(strict_types=1);

namespace App\Enums;

enum UserRole: string
{
    case SuperAdmin = 'super-admin';
    case FleetManager = 'fleet-manager';
    case BookingAgent = 'booking-agent';
    case Finance = 'finance';
    case Customer = 'customer';

    public function label(): string
    {
        return match ($this) {
            self::SuperAdmin => 'Super Admin',
            self::FleetManager => 'Fleet Manager',
            self::BookingAgent => 'Booking Agent',
            self::Finance => 'Finance',
            self::Customer => 'Customer',
        };
    }
}
