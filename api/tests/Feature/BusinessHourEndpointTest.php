<?php

namespace Tests\Feature;

use App\Models\BusinessHour;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\Concerns\CreatesSchedulingFixtures;
use Tests\TestCase;

class BusinessHourEndpointTest extends TestCase
{
    use CreatesSchedulingFixtures;
    use RefreshDatabase;

    public function test_owner_can_list_business_hours(): void
    {
        ['tenant' => $tenant] = $this->createTenantWithSchedule();
        $owner = User::factory()->owner()->create([
            'tenant_id' => $tenant->id,
            'email' => 'owner@testshop.test',
            'password' => Hash::make('password'),
        ]);

        $this->withToken($owner->createToken('test')->plainTextToken)
            ->getJson(route('v1.business-hours.index'))
            ->assertOk()
            ->assertJsonCount(7, 'data')
            ->assertJsonPath('data.0.day_of_week', 0)
            ->assertJsonPath('data.0.is_closed', true);
    }

    public function test_owner_can_update_business_hours(): void
    {
        ['tenant' => $tenant] = $this->createTenantWithSchedule();
        $owner = User::factory()->owner()->create([
            'tenant_id' => $tenant->id,
            'email' => 'owner@testshop.test',
            'password' => Hash::make('password'),
        ]);

        $days = collect(range(0, 6))->map(fn (int $day) => [
            'day_of_week' => $day,
            'is_closed' => $day === 0 || $day === 1,
            'open_time' => $day === 0 || $day === 1 ? null : '10:00',
            'close_time' => $day === 0 || $day === 1 ? null : '18:00',
        ])->all();

        $this->withToken($owner->createToken('test')->plainTextToken)
            ->putJson(route('v1.business-hours.update'), ['days' => $days])
            ->assertOk()
            ->assertJsonPath('data.1.is_closed', true)
            ->assertJsonPath('data.2.open_time', '10:00')
            ->assertJsonPath('data.2.close_time', '18:00');

        $this->assertDatabaseHas('business_hours', [
            'tenant_id' => $tenant->id,
            'barber_id' => null,
            'day_of_week' => 2,
            'is_closed' => false,
        ]);
    }

    public function test_barber_cannot_update_business_hours(): void
    {
        ['barber' => $barber] = $this->createTenantWithSchedule();

        $days = collect(range(0, 6))->map(fn (int $day) => [
            'day_of_week' => $day,
            'is_closed' => false,
            'open_time' => '09:00',
            'close_time' => '19:00',
        ])->all();

        $this->withToken($barber->createToken('test')->plainTextToken)
            ->putJson(route('v1.business-hours.update'), ['days' => $days])
            ->assertForbidden();
    }

    public function test_rejects_open_after_close(): void
    {
        ['tenant' => $tenant] = $this->createTenantWithSchedule();
        $owner = User::factory()->owner()->create([
            'tenant_id' => $tenant->id,
            'email' => 'owner@testshop.test',
            'password' => Hash::make('password'),
        ]);

        $days = collect(range(0, 6))->map(fn (int $day) => [
            'day_of_week' => $day,
            'is_closed' => false,
            'open_time' => '19:00',
            'close_time' => '09:00',
        ])->all();

        $this->withToken($owner->createToken('test')->plainTextToken)
            ->putJson(route('v1.business-hours.update'), ['days' => $days])
            ->assertUnprocessable();
    }
}
