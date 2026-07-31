<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tenant extends Model
{
    /** @use HasFactory<\Database\Factories\TenantFactory> */
    use HasFactory;

    public const PRODUCT = 'barber';

    protected $fillable = [
        'product',
        'name',
        'slug',
        'subdomain',
        'custom_domain',
        'logo_url',
        'primary_color',
        'secondary_color',
        'accent_color',
        'timezone',
        'settings',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'settings' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

    public function businessHours(): HasMany
    {
        return $this->hasMany(BusinessHour::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function branding(): array
    {
        return [
            'name' => $this->name,
            'slug' => $this->slug,
            'product' => $this->product ?? self::PRODUCT,
            'logo_url' => $this->logo_url,
            'primary_color' => $this->primary_color,
            'secondary_color' => $this->secondary_color,
            'accent_color' => $this->accent_color,
        ];
    }

    public function platformHost(): string
    {
        $base = (string) config('wynext.base_domain', 'wynext.online');

        return $this->subdomain.'.'.$base;
    }

    public function publicHost(): string
    {
        if (filled($this->custom_domain)) {
            return (string) $this->custom_domain;
        }

        return $this->platformHost();
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
