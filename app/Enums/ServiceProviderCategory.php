<?php

declare(strict_types=1);

namespace App\Enums;

enum ServiceProviderCategory: string
{
    case Mechanic = 'mechanic';
    case Tow = 'tow';
    case CarWash = 'car_wash';
    case Parts = 'parts';
    case Insurance = 'insurance';
    case Tyres = 'tyres';
    case Panelbeater = 'panelbeater';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Mechanic => 'Mechanic / Garage',
            self::Tow => 'Towing',
            self::CarWash => 'Car Wash',
            self::Parts => 'Parts Supplier',
            self::Insurance => 'Insurance Broker',
            self::Tyres => 'Tyres',
            self::Panelbeater => 'Panelbeater',
            self::Other => 'Other',
        };
    }
}
