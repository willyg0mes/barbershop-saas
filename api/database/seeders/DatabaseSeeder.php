<?php

namespace Database\Seeders;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\BusinessHour;
use App\Models\Service;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::query()->create([
            'name' => 'Barbearia Dom Corte',
            'slug' => 'dom-corte',
            'subdomain' => 'domcorte',
            'custom_domain' => null,
            'logo_url' => null,
            'primary_color' => '#121212',
            'secondary_color' => '#D4AF37',
            'accent_color' => '#E8E8E8',
            'timezone' => 'America/Sao_Paulo',
            'settings' => [
                'slot_interval_minutes' => 15,
                'booking_lead_minutes' => 30,
            ],
            'is_active' => true,
        ]);

        $owner = User::query()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Carlos Owner',
            'email' => 'owner@domcorte.test',
            'role' => UserRole::Owner,
            'phone' => '+5511999990001',
            'password' => Hash::make('password'),
            'is_active' => true,
        ]);

        $barber = User::query()->create([
            'tenant_id' => $tenant->id,
            'name' => 'João Barbeiro',
            'email' => 'barber@domcorte.test',
            'role' => UserRole::Barber,
            'phone' => '+5511999990002',
            'password' => Hash::make('password'),
            'is_active' => true,
        ]);

        $client = User::query()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Pedro Cliente',
            'email' => 'cliente@domcorte.test',
            'role' => UserRole::Client,
            'phone' => '+5511999990003',
            'password' => Hash::make('password'),
            'is_active' => true,
        ]);

        // Horário padrão do tenant (seg–sáb 09:00–19:00; domingo fechado)
        foreach (range(0, 6) as $day) {
            $closed = $day === 0;
            BusinessHour::query()->create([
                'tenant_id' => $tenant->id,
                'barber_id' => null,
                'day_of_week' => $day,
                'open_time' => $closed ? null : '09:00:00',
                'close_time' => $closed ? null : '19:00:00',
                'is_closed' => $closed,
            ]);
        }

        $corte = Service::query()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Corte masculino',
            'description' => 'Corte tradicional com acabamento',
            'duration_minutes' => 30,
            'price_cents' => 4500,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $barba = Service::query()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Barba',
            'description' => 'Barba completa com toalha quente',
            'duration_minutes' => 30,
            'price_cents' => 3500,
            'is_active' => true,
            'sort_order' => 2,
        ]);

        $combo = Service::query()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Corte + Barba',
            'description' => 'Combo completo',
            'duration_minutes' => 60,
            'price_cents' => 7000,
            'is_active' => true,
            'sort_order' => 3,
        ]);

        $startsAt = now()->timezone($tenant->timezone)->addDay()->setTime(10, 0);
        $appointment = Appointment::query()->create([
            'tenant_id' => $tenant->id,
            'client_id' => $client->id,
            'barber_id' => $barber->id,
            'client_name' => $client->name,
            'client_phone' => $client->phone,
            'client_email' => $client->email,
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addMinutes(60),
            'total_duration_minutes' => 60,
            'total_price_cents' => 8000,
            'status' => AppointmentStatus::Confirmed,
            'notes' => 'Agendamento de exemplo (corte + barba)',
        ]);

        $appointment->services()->attach([
            $corte->id => [
                'duration_minutes' => 30,
                'price_cents' => 4500,
                'sort_order' => 1,
            ],
            $barba->id => [
                'duration_minutes' => 30,
                'price_cents' => 3500,
                'sort_order' => 2,
            ],
        ]);

        // Evita unused variable warnings em análise estática
        unset($owner, $combo);
    }
}
