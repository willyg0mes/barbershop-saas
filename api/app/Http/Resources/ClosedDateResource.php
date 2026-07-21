<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ClosedDate */
class ClosedDateResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'barber_id' => $this->barber_id,
            'date' => $this->date?->toDateString(),
            'reason' => $this->reason,
        ];
    }
}
