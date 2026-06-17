<?php

declare(strict_types=1);

namespace App\Enums;

enum SalaryType: string
{
    case Monthly = 'monthly';
    case Weekly = 'weekly';
    case Daily = 'daily';
    case Hourly = 'hourly';

    public function label(): string
    {
        return match ($this) {
            self::Monthly => 'Monthly',
            self::Weekly => 'Weekly',
            self::Daily => 'Daily',
            self::Hourly => 'Hourly',
        };
    }
}
