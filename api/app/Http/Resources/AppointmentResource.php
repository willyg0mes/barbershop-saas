<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Appointment */
class AppointmentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'starts_at' => $this->starts_at->toIso8601String(),
            'ends_at' => $this->ends_at->toIso8601String(),
            'total_duration_minutes' => $this->total_duration_minutes,
            'total_price_cents' => $this->total_price_cents,
            'client_name' => $this->client_name,
            'client_phone' => $this->client_phone,
            'client_email' => $this->client_email,
            'notes' => $this->notes,
            'barber' => new UserResource($this->whenLoaded('barber')),
            'services' => ServiceResource::collection($this->whenLoaded('services')),
        ];
    }
}
