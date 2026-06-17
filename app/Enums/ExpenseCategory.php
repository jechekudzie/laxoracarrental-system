<?php

declare(strict_types=1);

namespace App\Enums;

enum ExpenseCategory: string
{
    case OfficeSupplies = 'office_supplies';
    case Utilities = 'utilities';
    case Transport = 'transport';
    case Meals = 'meals';
    case Accommodation = 'accommodation';
    case Equipment = 'equipment';
    case IT = 'it';
    case Marketing = 'marketing';
    case Repairs = 'repairs';
    case Cleaning = 'cleaning';
    case Security = 'security';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::OfficeSupplies => 'Office Supplies',
            self::Utilities => 'Utilities',
            self::Transport => 'Transport',
            self::Meals => 'Meals & Entertainment',
            self::Accommodation => 'Accommodation',
            self::Equipment => 'Equipment',
            self::IT => 'IT & Technology',
            self::Marketing => 'Marketing',
            self::Repairs => 'Repairs',
            self::Cleaning => 'Cleaning',
            self::Security => 'Security',
            self::Other => 'Other',
        };
    }
}
