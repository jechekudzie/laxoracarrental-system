<?php

declare(strict_types=1);

namespace App\Exceptions;

class InvalidBookingException extends DomainException
{
    public static function returnBeforePickup(): self
    {
        return new self('Return datetime must be after pickup datetime.');
    }

    public static function invalidTransition(string $from, string $to): self
    {
        return new self("Cannot transition booking from {$from} to {$to}.");
    }

    public static function odometerRegression(int $start, int $end): self
    {
        return new self("Return odometer ({$end} km) cannot be lower than pickup odometer ({$start} km).");
    }

    public static function missingBookingCategory(string $regPlate): self
    {
        return new self("Vehicle {$regPlate} has no booking category assigned. Assign one before creating a booking.");
    }
}
