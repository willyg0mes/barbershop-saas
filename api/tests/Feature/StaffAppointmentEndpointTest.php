<?php

namespace Tests\Feature;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\Concerns\CreatesSchedulingFixtures;
use Tests\TestCase;

class StaffAppointmentEndpointTest extends TestCase
{
    use CreatesSchedulingFixtures;
    use RefreshDatabase;

    public function test_barber_can_list_own_appointments_for_date(): void
    {
        ['tenant' => $tenant, 'barber' => $barber, 'serviceA' => $service] = $this->createTenantWithSchedule();

        $startsAt = now()->timezone($tenant->timezone)->setTime(10, 0);
        $appointment = Appointment::query()->create([
            'tenant_id' => $tenant->id,
            'barber_id' => $barber->id,
            'client_name' => 'Cliente Teste',
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addMinutes(30),
            'total_duration_minutes' => 30,
            'total_price_cents' => 4000,
            'status' => AppointmentStatus::Confirmed,
        ]);
        $appointment->services()->attach($service->id, [
            'duration_minutes' => 30,
            'price_cents' => 4000,
            'sort_order' => 1,
        ]);

        $token = $barber->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->getJson(route('v1.appointments.index', ['date' => $startsAt->toDateString()]))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.client_name', 'Cliente Teste');
    }

    public function test_barber_cannot_list_other_barber_appointments(): void
    {
        ['tenant' => $tenant, 'barber' => $barber] = $this->createTenantWithSchedule();

        $otherBarber = User::factory()->barber()->create([
            'tenant_id' => $tenant->id,
            'email' => 'other@testshop.test',
            'password' => Hash::make('password'),
        ]);

        $startsAt = now()->timezone($tenant->timezone)->setTime(11, 0);
        Appointment::query()->create([
            'tenant_id' => $tenant->id,
            'barber_id' => $otherBarber->id,
            'client_name' => 'Outro cliente',
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addMinutes(30),
            'total_duration_minutes' => 30,
            'total_price_cents' => 4000,
            'status' => AppointmentStatus::Confirmed,
        ]);

        $token = $barber->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->getJson(route('v1.appointments.index', ['date' => $startsAt->toDateString()]))
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_barber_can_update_appointment_status(): void
    {
        ['tenant' => $tenant, 'barber' => $barber] = $this->createTenantWithSchedule();

        $startsAt = now()->timezone($tenant->timezone)->addHour();
        $appointment = Appointment::query()->create([
            'tenant_id' => $tenant->id,
            'barber_id' => $barber->id,
            'client_name' => 'Cliente',
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addMinutes(30),
            'total_duration_minutes' => 30,
            'total_price_cents' => 4000,
            'status' => AppointmentStatus::Confirmed,
        ]);

        $token = $barber->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->patchJson(route('v1.appointments.update', ['appointment' => $appointment->id]), [
                'status' => AppointmentStatus::InProgress->value,
            ])
            ->assertOk()
            ->assertJsonPath('data.status', AppointmentStatus::InProgress->value);
    }

    public function test_client_cannot_access_staff_appointments(): void
    {
        ['tenant' => $tenant] = $this->createTenantWithSchedule();

        $client = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => UserRole::Client,
            'email' => 'client@testshop.test',
            'password' => Hash::make('password'),
        ]);

        $token = $client->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->getJson(route('v1.appointments.index', ['date' => now()->toDateString()]))
            ->assertForbidden();
    }

    public function test_staff_can_update_fcm_token(): void
    {
        ['barber' => $barber] = $this->createTenantWithSchedule();
        $token = $barber->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->patchJson(route('v1.auth.fcm-token'), [
                'fcm_token' => 'ExponentPushToken[test-token]',
            ])
            ->assertOk();

        $this->assertDatabaseHas('users', [
            'id' => $barber->id,
            'fcm_token' => 'ExponentPushToken[test-token]',
        ]);
    }

    public function test_barber_can_reschedule_appointment_keeping_local_time(): void
    {
        ['tenant' => $tenant, 'barber' => $barber, 'serviceA' => $service] = $this->createTenantWithSchedule();

        $startsAt = now()->timezone($tenant->timezone)->addDay()->setTime(10, 0)->seconds(0);
        $appointment = Appointment::query()->create([
            'tenant_id' => $tenant->id,
            'barber_id' => $barber->id,
            'client_name' => 'Cliente Reagendar',
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addMinutes(30),
            'total_duration_minutes' => 30,
            'total_price_cents' => 4000,
            'status' => AppointmentStatus::Confirmed,
        ]);
        $appointment->services()->attach($service->id, [
            'duration_minutes' => 30,
            'price_cents' => 4000,
            'sort_order' => 1,
        ]);

        $newStartsAt = $startsAt->copy()->setTime(18, 0);
        $token = $barber->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->patchJson(route('v1.appointments.update', ['appointment' => $appointment->id]), [
                'starts_at' => $newStartsAt->toIso8601String(),
            ])
            ->assertOk()
            ->assertJsonPath('data.starts_at', $newStartsAt->toIso8601String());

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'starts_at' => $newStartsAt->format('Y-m-d H:i:s'),
        ]);
    }

    public function test_finance_summary_returns_day_totals(): void
    {
        ['tenant' => $tenant, 'barber' => $barber] = $this->createTenantWithSchedule();
        $startsAt = now()->timezone($tenant->timezone)->setTime(14, 0);

        Appointment::query()->create([
            'tenant_id' => $tenant->id,
            'barber_id' => $barber->id,
            'client_name' => 'Cliente A',
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addMinutes(30),
            'total_duration_minutes' => 30,
            'total_price_cents' => 5000,
            'status' => AppointmentStatus::Completed,
        ]);

        $token = $barber->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->getJson(route('v1.finance.summary', ['date' => $startsAt->toDateString()]))
            ->assertOk()
            ->assertJsonPath('data.completed_count', 1)
            ->assertJsonPath('data.total_revenue_cents', 5000);
    }
}
