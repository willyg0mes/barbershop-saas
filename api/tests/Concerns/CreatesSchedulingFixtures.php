<?php

namespace Tests\Concerns;

use App\Enums\UserRole;
use App\Models\BusinessHour;
use App\Models\Service;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

trait CreatesSchedulingFixtures
{
    protected function createTenantWithSchedule(array $settings = []): array
    {
        $tenant = Tenant::factory()->create([
            'slug' => 'test-shop',
            'subdomain' => 'testshop',
            'timezone' => 'America/Sao_Paulo',
            'settings' => array_merge([
                'slot_interval_minutes' => 15,
                'booking_lead_minutes' => 0,
            ], $settings),
        ]);

        foreach (range(0, 6) as $day) {
            BusinessHour::query()->create([
                'tenant_id' => $tenant->id,
                'barber_id' => null,
                'day_of_week' => $day,
                'open_time' => $day === 0 ? null : '09:00:00',
                'close_time' => $day === 0 ? null : '19:00:00',
                'is_closed' => $day === 0,
            ]);
        }

        $barber = User::factory()->barber()->create([
            'tenant_id' => $tenant->id,
            'email' => 'barber@testshop.test',
            'password' => Hash::make('password'),
        ]);

        $serviceA = Service::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Corte',
            'duration_minutes' => 30,
            'price_cents' => 4000,
            'sort_order' => 1,
        ]);

        $serviceB = Service::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Barba',
            'duration_minutes' => 30,
            'price_cents' => 3000,
            'sort_order' => 2,
        ]);

        return compact('tenant', 'barber', 'serviceA', 'serviceB');
    }
}
