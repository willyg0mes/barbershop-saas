<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\RegisterTenantRequest;
use App\Http\Resources\UserResource;
use App\Models\BusinessHour;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class TenantRegisterController extends Controller
{
    public function store(RegisterTenantRequest $request): JsonResponse
    {
        $data = $request->validated();

        $result = DB::transaction(function () use ($data) {
            $slug = Str::slug($data['slug']);
            $subdomain = str_replace('-', '', $slug);

            $tenant = Tenant::query()->create([
                'name' => $data['name'],
                'slug' => $slug,
                'subdomain' => $subdomain,
                'primary_color' => $data['primary_color'] ?? '#3B82F6',
                'secondary_color' => $data['secondary_color'] ?? '#1E40AF',
                'timezone' => 'America/Sao_Paulo',
                'is_active' => true,
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
                'password' => Hash::make($data['owner_password']),
                'role' => UserRole::Owner,
                'is_active' => true,
            ]);

            // Cria horários de funcionamento padrão
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

            $token = $owner->createToken('auth_token')->plainTextToken;

            return [
                'user' => new UserResource($owner),
                'token' => $token,
            ];
        });

        return response()->json([
            'data' => [
                'user' => $result['user'],
                'token' => $result['token'],
            ],
        ], 201);
    }
}
