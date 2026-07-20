<?php

namespace Database\Factories;

use App\Models\Service;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Service>
 */
class ServiceFactory extends Factory
{
    protected $model = Service::class;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'name' => fake()->randomElement(['Corte', 'Barba', 'Corte + Barba', 'Sobrancelha']),
            'description' => fake()->sentence(),
            'duration_minutes' => fake()->randomElement([15, 30, 45, 60]),
            'price_cents' => fake()->randomElement([2500, 3500, 5000, 7000]),
            'is_active' => true,
            'sort_order' => 0,
        ];
    }
}
