<?php

namespace App\Enums;

enum UserRole: string
{
    case Owner = 'owner';
    case Barber = 'barber';
    case Client = 'client';

    public function isStaff(): bool
    {
        return $this === self::Owner || $this === self::Barber;
    }
}
