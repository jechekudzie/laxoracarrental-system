<?php

declare(strict_types=1);

namespace App\Enums;

enum FuelLevel: string
{
    case Empty = 'empty';
    case Quarter = 'quarter';
    case Half = 'half';
    case ThreeQuarter = 'three_quarter';
    case Full = 'full';

    /**
     * Numeric fraction of a full tank (0.0–1.0).
     */
    public function fraction(): float
    {
        return match ($this) {
            self::Empty => 0.0,
            self::Quarter => 0.25,
            self::Half => 0.50,
            self::ThreeQuarter => 0.75,
            self::Full => 1.0,
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::Empty => 'Empty',
            self::Quarter => 'Quarter',
            self::Half => 'Half',
            self::ThreeQuarter => 'Three Quarter',
            self::Full => 'Full',
        };
    }

    /**
     * @return int Number of 1/4-tank levels short (0 if equal or returned with more).
     */
    public static function levelsShort(?self $pickup, ?self $return): int
    {
        if ($pickup === null || $return === null) {
            return 0;
        }

        $diff = ($pickup->fraction() - $return->fraction()) * 4;

        return (int) max(0, round($diff));
    }
}
