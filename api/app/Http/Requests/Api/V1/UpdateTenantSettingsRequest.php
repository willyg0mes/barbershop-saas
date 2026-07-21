<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateTenantSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'max:120'],
            'logo_url' => ['nullable', 'string', 'max:500'],
            'primary_color' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'secondary_color' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'accent_color' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'slot_interval_minutes' => ['nullable', 'integer', 'in:5,10,15,20,30,60'],
            'booking_lead_minutes' => ['nullable', 'integer', 'min:0', 'max:1440'],
            'cancellation_hours_notice' => ['nullable', 'integer', 'min:0', 'max:168'],
            'commission_enabled' => ['nullable', 'boolean'],
            'commission_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'show_barber_photos' => ['nullable', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($this->boolean('commission_enabled') && ! $this->filled('commission_percent')) {
                if (! $this->user()?->tenant?->settings['commission_percent']) {
                    $validator->errors()->add('commission_percent', 'Commission percent is required when commission is enabled.');
                }
            }
        });
    }
}
