<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\UpdateTenantSettingsRequest;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantSettingsController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $tenant = $request->user()->tenant()->firstOrFail();

        return response()->json([
            'data' => $this->payload($tenant),
        ]);
    }

    public function update(UpdateTenantSettingsRequest $request): JsonResponse
    {
        $tenant = $request->user()->tenant()->firstOrFail();
        $data = $request->validated();

        if (array_key_exists('name', $data)) {
            $tenant->name = $data['name'];
        }

        if (array_key_exists('logo_url', $data)) {
            $tenant->logo_url = $data['logo_url'] ?: null;
        }

        if (array_key_exists('primary_color', $data)) {
            $tenant->primary_color = $data['primary_color'];
        }

        if (array_key_exists('secondary_color', $data)) {
            $tenant->secondary_color = $data['secondary_color'];
        }

        if (array_key_exists('accent_color', $data)) {
            $tenant->accent_color = $data['accent_color'];
        }

        $settings = $tenant->settings ?? [];

        foreach ([
            'slot_interval_minutes',
            'booking_lead_minutes',
            'cancellation_hours_notice',
            'commission_enabled',
            'commission_percent',
            'show_barber_photos',
        ] as $key) {
            if (array_key_exists($key, $data)) {
                $settings[$key] = $data[$key];
            }
        }

        $tenant->settings = $settings;
        $tenant->save();

        return response()->json([
            'data' => $this->payload($tenant->fresh()),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(Tenant $tenant): array
    {
        $bookingBase = rtrim(
            (string) config('app.booking_base_url', env('BOOKING_BASE_URL', 'https://app.wynext.online')),
            '/'
        );

        return [
            'name' => $tenant->name,
            'slug' => $tenant->slug,
            'logo_url' => $tenant->logo_url,
            'primary_color' => $tenant->primary_color,
            'secondary_color' => $tenant->secondary_color,
            'accent_color' => $tenant->accent_color,
            'timezone' => $tenant->timezone,
            'booking_url' => $bookingBase.'/'.$tenant->slug,
            'slot_interval_minutes' => (int) ($tenant->settings['slot_interval_minutes'] ?? 15),
            'booking_lead_minutes' => (int) ($tenant->settings['booking_lead_minutes'] ?? 30),
            'cancellation_hours_notice' => (int) ($tenant->settings['cancellation_hours_notice'] ?? 24),
            'commission_enabled' => (bool) ($tenant->settings['commission_enabled'] ?? false),
            'commission_percent' => (float) ($tenant->settings['commission_percent'] ?? 0),
            'show_barber_photos' => (bool) ($tenant->settings['show_barber_photos'] ?? true),
        ];
    }
}
