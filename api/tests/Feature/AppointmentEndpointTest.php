<?php

namespace Tests\Feature;

use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesSchedulingFixtures;
use Tests\TestCase;

class AppointmentEndpointTest extends TestCase
{
    use CreatesSchedulingFixtures;
    use RefreshDatabase;

    public function test_can_book_composite_services_in_available_slot(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-07-20 08:00:00', 'America/Sao_Paulo'));

        ['tenant' => $tenant, 'barber' => $barber, 'serviceA' => $serviceA, 'serviceB' => $serviceB] = $this->createTenantWithSchedule();

        $response = $this->postJson(route('v1.tenants.appointments.store', ['tenant' => $tenant->slug]), [
            'barber_id' => $barber->id,
            'service_ids' => [$serviceA->id, $serviceB->id],
            'starts_at' => '2026-07-20T09:00:00-03:00',
            'client_name' => 'Cliente Teste',
            'client_phone' => '+5511999999999',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.total_duration_minutes', 60)
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('appointments', [
            'tenant_id' => $tenant->id,
            'barber_id' => $barber->id,
            'client_name' => 'Cliente Teste',
            'total_duration_minutes' => 60,
        ]);

        $this->assertDatabaseCount('appointment_service', 2);
    }

    public function test_rejects_booking_when_slot_is_unavailable(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-07-20 08:00:00', 'America/Sao_Paulo'));

        ['tenant' => $tenant, 'barber' => $barber, 'serviceA' => $serviceA, 'serviceB' => $serviceB] = $this->createTenantWithSchedule();

        $this->postJson(route('v1.tenants.appointments.store', ['tenant' => $tenant->slug]), [
            'barber_id' => $barber->id,
            'service_ids' => [$serviceA->id, $serviceB->id],
            'starts_at' => '2026-07-20T09:00:00-03:00',
            'client_name' => 'Primeiro',
        ])->assertCreated();

        $this->postJson(route('v1.tenants.appointments.store', ['tenant' => $tenant->slug]), [
            'barber_id' => $barber->id,
            'service_ids' => [$serviceA->id, $serviceB->id],
            'starts_at' => '2026-07-20T09:00:00-03:00',
            'client_name' => 'Segundo',
        ])->assertUnprocessable();
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }
}
