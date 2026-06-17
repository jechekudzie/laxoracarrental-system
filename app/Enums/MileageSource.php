<?php

declare(strict_types=1);

namespace App\Enums;

enum MileageSource: string
{
    case Manual = 'manual';
    case GPS = 'gps';
}
