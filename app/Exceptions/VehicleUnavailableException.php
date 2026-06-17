<?php

declare(strict_types=1);

namespace App\Exceptions;

class VehicleUnavailableException extends DomainException
{
    public static function forDates(string $plate, string $pickup, string $return): self
    {
        return new self("Vehicle {$plate} is not available between {$pickup} and {$return}.");
    }

    public static function notRentable(string $plate, string $status): self
    {
        return new self("Vehicle {$plate} is currently {$status} and cannot be booked.");
    }
}
