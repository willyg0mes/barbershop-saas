<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use BelongsToTenant, HasFactory, Notifiable;

    protected $fillable = [
        'tenant_id',
        'name',
        'email',
        'role',
        'phone',
        'password',
        'fcm_token',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'fcm_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'is_active' => 'boolean',
        ];
    }

    public function appointmentsAsClient(): HasMany
    {
        return $this->hasMany(Appointment::class, 'client_id');
    }

    public function appointmentsAsBarber(): HasMany
    {
        return $this->hasMany(Appointment::class, 'barber_id');
    }

    public function businessHours(): HasMany
    {
        return $this->hasMany(BusinessHour::class, 'barber_id');
    }

    public function isOwner(): bool
    {
        return $this->role === UserRole::Owner;
    }

    public function isBarber(): bool
    {
        return $this->role === UserRole::Barber;
    }

    public function isClient(): bool
    {
        return $this->role === UserRole::Client;
    }
}
