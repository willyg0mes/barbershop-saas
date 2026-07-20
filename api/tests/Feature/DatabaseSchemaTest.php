<?php

namespace Tests\Feature;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\BusinessHour;
use App\Models\Service;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DatabaseSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_migrations_create_core_tables(): void
    {
        $tenant = Tenant::factory()->create([
            'slug' => 'schema-test',
            'subdomain' => 'schematest',
        ]);

        $barber = User::factory()->barber()->create([
            'tenant_id' => $tenant->id,
            'email' => 'barber@schema.test',
        ]);

        $service = Service::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Corte',
            'duration_minutes' => 30,
            'price_cents' => 4000,
        ]);

        BusinessHour::query()->create([
            'tenant_id' => $tenant->id,
            'barber_id' => null,
            'day_of_week' => 1,
            'open_time' => '09:00:00',
            'close_time' => '18:00:00',
            'is_closed' => false,
        ]);

        $appointment = Appointment::query()->create([
            'tenant_id' => $tenant->id,
            'client_id' => null,
            'barber_id' => $barber->id,
            'client_name' => 'Walk-in',
            'starts_at' => now()->addDay()->setTime(10, 0),
            'ends_at' => now()->addDay()->setTime(10, 30),
            'total_duration_minutes' => 30,
            'total_price_cents' => 4000,
            'status' => AppointmentStatus::Pending,
        ]);

        $appointment->services()->attach($service->id, [
            'duration_minutes' => 30,
            'price_cents' => 4000,
            'sort_order' => 1,
        ]);

        $this->assertDatabaseHas('tenants', ['slug' => 'schema-test']);
        $this->assertDatabaseHas('users', [
            'email' => 'barber@schema.test',
            'role' => UserRole::Barber->value,
        ]);
        $this->assertDatabaseHas('services', ['name' => 'Corte']);
        $this->assertDatabaseHas('business_hours', ['day_of_week' => 1]);
        $this->assertDatabaseHas('appointments', ['client_name' => 'Walk-in']);
        $this->assertDatabaseHas('appointment_service', [
            'appointment_id' => $appointment->id,
            'service_id' => $service->id,
        ]);
    }

    public function test_database_seeder_populates_demo_tenant(): void
    {
        $this->seed();

        $this->assertDatabaseHas('tenants', ['slug' => 'dom-corte']);
        $this->assertDatabaseHas('users', ['email' => 'owner@domcorte.test']);
        $this->assertDatabaseHas('users', ['email' => 'barber@domcorte.test']);
        $this->assertDatabaseHas('services', ['name' => 'Corte + Barba']);
        $this->assertGreaterThanOrEqual(7, BusinessHour::query()->count());
        $this->assertGreaterThanOrEqual(1, Appointment::query()->count());
    }

    public function test_health_endpoint_returns_ok(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertOk()
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('checks.database', 'up');
    }
}
