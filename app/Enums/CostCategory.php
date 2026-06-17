<?php

declare(strict_types=1);

namespace App\Enums;

enum CostCategory: string
{
    case Maintenance = 'maintenance';
    case Breakdown = 'breakdown';
    case Towing = 'towing';
    case Accident = 'accident';
    case CarWash = 'car_wash';
    case Fuel = 'fuel';
    case Parking = 'parking';
    case Tolls = 'tolls';
    case Fine = 'fine';
    case Licensing = 'licensing';
    case Other = 'other';
}
