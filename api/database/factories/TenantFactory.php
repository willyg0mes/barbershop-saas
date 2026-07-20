<?php

namespace Database\Factories;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Tenant>
 */
class TenantFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->unique()->company().' Barber';
        $slug = str()->slug($name);

        return [
            'name' => $name,
            'slug' => $slug,
            'subdomain' => $slug,
            'custom_domain' => null,
            'logo_url' => null,
            'primary_color' => '#1A1A1A',
            'secondary_color' => '#C4A35A',
            'accent_color' => '#F5F5F5',
            'timezone' => 'America/Sao_Paulo',
            'settings' => [
                'slot_interval_minutes' => 15,
                'booking_lead_minutes' => 60,
            ],
            'is_active' => true,
        ];
    }
}
