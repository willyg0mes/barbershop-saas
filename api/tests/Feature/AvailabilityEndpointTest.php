<?php

namespace Tests\Feature;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesSchedulingFixtures;
use Tests\TestCase;

class AvailabilityEndpointTest extends TestCase
{
    use CreatesSchedulingFixtures;
    use RefreshDatabase;

    public function test_availability_endpoint_accepts_service_ids_and_returns_slots(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-07-20 08:00:00', 'America/Sao_Paulo'));

        ['tenant' => $tenant, 'barber' => $barber, 'serviceA' => $serviceA, 'serviceB' => $serviceB] = $this->createTenantWithSchedule();

        $response = $this->getJson(route('v1.tenants.availability', [
            'tenant' => $tenant->slug,
            'date' => '2026-07-20',
            'service_ids' => [$serviceA->id, $serviceB->id],
            'barber_id' => $barber->id,
        ]));

        $response->assertOk()
            ->assertJsonPath('data.duration_minutes', 60)
            ->assertJsonPath('data.service_ids', [$serviceA->id, $serviceB->id])
            ->assertJsonStructure([
                'data' => [
                    'date',
                    'duration_minutes',
                    'timezone',
                    'barbers' => [
                        ['id', 'name', 'slots'],
                    ],
                ],
            ]);

        $slots = $response->json('data.barbers.0.slots');
        $this->assertContains('2026-07-20T09:00:00-03:00', $slots);
    }

    public function test_availability_endpoint_excludes_slots_blocked_by_existing_appointment(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-07-20 08:00:00', 'America/Sao_Paulo'));

        ['tenant' => $tenant, 'barber' => $barber, 'serviceA' => $serviceA, 'serviceB' => $serviceB] = $this->createTenantWithSchedule();

        $startsAt = Carbon::parse('2026-07-20 10:00:00', 'America/Sao_Paulo');
        Appointment::query()->create([
            'tenant_id' => $tenant->id,
            'barber_id' => $barber->id,
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addMinutes(60),
            'total_duration_minutes' => 60,
            'total_price_cents' => 7000,
            'status' => AppointmentStatus::Confirmed,
        ]);

        $response = $this->getJson(route('v1.tenants.availability', [
            'tenant' => $tenant->slug,
            'date' => '2026-07-20',
            'duration_minutes' => 60,
            'barber_id' => $barber->id,
        ]));

        $slots = $response->json('data.barbers.0.slots');

        $this->assertNotContains('2026-07-20T10:00:00-03:00', $slots);
        $this->assertContains('2026-07-20T11:00:00-03:00', $slots);
    }

    public function test_availability_requires_duration_or_service_ids(): void
    {
        ['tenant' => $tenant] = $this->createTenantWithSchedule();

        $this->getJson(route('v1.tenants.availability', [
            'tenant' => $tenant->slug,
            'date' => '2026-07-20',
        ]))->assertUnprocessable();
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }
}
