<?php

namespace Tests\Unit;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Services\AvailabilityService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesSchedulingFixtures;
use Tests\TestCase;

class AvailabilityServiceTest extends TestCase
{
    use CreatesSchedulingFixtures;
    use RefreshDatabase;

    protected AvailabilityService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(AvailabilityService::class);
    }

    public function test_returns_continuous_slots_for_single_duration(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-07-20 08:00:00', 'America/Sao_Paulo'));

        ['tenant' => $tenant, 'barber' => $barber] = $this->createTenantWithSchedule();
        $date = Carbon::parse('2026-07-20', 'America/Sao_Paulo');

        $result = $this->service->getAvailableSlots($tenant, $date, 30, $barber->id);
        $slots = $result['barbers'][0]['slots'];

        $this->assertSame('2026-07-20T09:00:00-03:00', $slots[0]);
        $this->assertContains('2026-07-20T18:30:00-03:00', $slots);
        $this->assertNotContains('2026-07-20T18:45:00-03:00', $slots);
    }

    public function test_composite_service_duration_blocks_overlapping_slots(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-07-20 08:00:00', 'America/Sao_Paulo'));

        ['tenant' => $tenant, 'barber' => $barber, 'serviceA' => $serviceA, 'serviceB' => $serviceB] = $this->createTenantWithSchedule();
        $date = Carbon::parse('2026-07-20', 'America/Sao_Paulo');

        $duration = $this->service->resolveDurationFromServices($tenant, [$serviceA->id, $serviceB->id]);
        $this->assertSame(60, $duration);

        $startsAt = Carbon::parse('2026-07-20 10:00:00', 'America/Sao_Paulo');
        Appointment::query()->create([
            'tenant_id' => $tenant->id,
            'barber_id' => $barber->id,
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addHour(),
            'total_duration_minutes' => 60,
            'total_price_cents' => 7000,
            'status' => AppointmentStatus::Confirmed,
        ]);

        $result = $this->service->getAvailableSlots($tenant, $date, $duration, $barber->id);
        $slots = $result['barbers'][0]['slots'];

        $this->assertContains('2026-07-20T09:00:00-03:00', $slots);
        $this->assertContains('2026-07-20T11:00:00-03:00', $slots);
        $this->assertNotContains('2026-07-20T10:00:00-03:00', $slots);
        $this->assertNotContains('2026-07-20T10:15:00-03:00', $slots);
        $this->assertNotContains('2026-07-20T10:30:00-03:00', $slots);
        $this->assertNotContains('2026-07-20T10:45:00-03:00', $slots);
    }

    public function test_closed_day_returns_no_slots(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-07-19 08:00:00', 'America/Sao_Paulo'));

        ['tenant' => $tenant, 'barber' => $barber] = $this->createTenantWithSchedule();
        $date = Carbon::parse('2026-07-19', 'America/Sao_Paulo'); // Sunday

        $result = $this->service->getAvailableSlots($tenant, $date, 30, $barber->id);

        $this->assertSame([], $result['barbers'][0]['slots']);
    }

    public function test_respects_booking_lead_time(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-07-20 09:20:00', 'America/Sao_Paulo'));

        ['tenant' => $tenant, 'barber' => $barber] = $this->createTenantWithSchedule([
            'booking_lead_minutes' => 30,
        ]);

        $date = Carbon::parse('2026-07-20', 'America/Sao_Paulo');
        $result = $this->service->getAvailableSlots($tenant, $date, 30, $barber->id);
        $slots = $result['barbers'][0]['slots'];

        $this->assertNotContains('2026-07-20T09:30:00-03:00', $slots);
        $this->assertNotContains('2026-07-20T09:45:00-03:00', $slots);
        $this->assertContains('2026-07-20T10:00:00-03:00', $slots);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }
}
