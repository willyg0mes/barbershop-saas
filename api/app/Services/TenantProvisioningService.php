<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\BusinessHour;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TenantProvisioningService
{
    /**
     * @param  array{
     *     name: string,
     *     slug: string,
     *     owner_name: string,
     *     owner_email: string,
     *     owner_password: string,
     *     primary_color?: string|null,
     *     secondary_color?: string|null,
     *     accent_color?: string|null,
     *     is_active?: bool
     * }  $data
     * @return array{tenant: Tenant, owner: User}
     */
    public function create(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $slug = Str::slug($data['slug']);
            $subdomain = str_replace('-', '', $slug);

            $tenant = Tenant::query()->create([
                'name' => $data['name'],
                'slug' => $slug,
                'subdomain' => $subdomain,
                'primary_color' => $data['primary_color'] ?? '#D4AF37',
                'secondary_color' => $data['secondary_color'] ?? '#1A1A1A',
                'accent_color' => $data['accent_color'] ?? '#C5A028',
                'timezone' => 'America/Sao_Paulo',
                'is_active' => $data['is_active'] ?? true,
                'settings' => [
                    'slot_interval_minutes' => 15,
                    'booking_lead_minutes' => 30,
                    'cancellation_hours_notice' => 24,
                    'commission_enabled' => false,
                    'commission_percent' => 0,
                    'show_barber_photos' => true,
                ],
            ]);

            $owner = User::query()->create([
                'tenant_id' => $tenant->id,
                'name' => $data['owner_name'],
                'email' => $data['owner_email'],
                'password' => $data['owner_password'],
                'role' => UserRole::Owner,
                'is_active' => true,
            ]);

            $defaultHours = [
                ['day_of_week' => 0, 'is_closed' => true, 'open_time' => null, 'close_time' => null],
                ['day_of_week' => 1, 'is_closed' => false, 'open_time' => '09:00:00', 'close_time' => '19:00:00'],
                ['day_of_week' => 2, 'is_closed' => false, 'open_time' => '09:00:00', 'close_time' => '19:00:00'],
                ['day_of_week' => 3, 'is_closed' => false, 'open_time' => '09:00:00', 'close_time' => '19:00:00'],
                ['day_of_week' => 4, 'is_closed' => false, 'open_time' => '09:00:00', 'close_time' => '19:00:00'],
                ['day_of_week' => 5, 'is_closed' => false, 'open_time' => '09:00:00', 'close_time' => '19:00:00'],
                ['day_of_week' => 6, 'is_closed' => false, 'open_time' => '09:00:00', 'close_time' => '19:00:00'],
            ];

            foreach ($defaultHours as $hour) {
                BusinessHour::query()->create([
                    'tenant_id' => $tenant->id,
                    'barber_id' => null,
                    'day_of_week' => $hour['day_of_week'],
                    'is_closed' => $hour['is_closed'],
                    'open_time' => $hour['open_time'],
                    'close_time' => $hour['close_time'],
                ]);
            }

            return ['tenant' => $tenant, 'owner' => $owner];
        });
    }

    public function delete(Tenant $tenant): void
    {
        DB::transaction(function () use ($tenant): void {
            // users usam nullOnDelete — remover antes do tenant
            $tenant->users()->each(function (User $user): void {
                $user->tokens()->delete();
                $user->delete();
            });
            $tenant->delete();
        });
    }
}
