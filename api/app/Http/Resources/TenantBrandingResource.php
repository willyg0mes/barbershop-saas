<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Tenant */
class TenantBrandingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'name' => $this->name,
            'slug' => $this->slug,
            'subdomain' => $this->subdomain,
            'custom_domain' => $this->custom_domain,
            'logo_url' => $this->logo_url,
            'primary_color' => $this->primary_color,
            'secondary_color' => $this->secondary_color,
            'accent_color' => $this->accent_color,
            'timezone' => $this->timezone,
            'settings' => [
                'slot_interval_minutes' => $this->settings['slot_interval_minutes'] ?? 15,
                'booking_lead_minutes' => $this->settings['booking_lead_minutes'] ?? 30,
            ],
        ];
    }
}
