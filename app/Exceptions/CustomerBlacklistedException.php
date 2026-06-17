<?php

declare(strict_types=1);

namespace App\Exceptions;

class CustomerBlacklistedException extends DomainException
{
    public static function make(string $name): self
    {
        return new self("Customer {$name} is blacklisted and cannot create bookings.");
    }
}
