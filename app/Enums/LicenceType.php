<?php

declare(strict_types=1);

namespace App\Enums;

enum LicenceType: string
{
    case Zinara = 'zinara';
    case ZBC = 'zbc';
    case Fitness = 'fitness';
    case Insurance = 'insurance';
    case Registration = 'registration';
    case Custom = 'custom';
}
