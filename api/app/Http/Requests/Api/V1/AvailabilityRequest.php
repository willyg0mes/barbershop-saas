<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class AvailabilityRequest extends FormRequest
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
            'date' => ['required', 'date_format:Y-m-d'],
            'duration_minutes' => ['nullable', 'integer', 'min:1', 'max:480'],
            'service_ids' => ['nullable', 'array', 'min:1'],
            'service_ids.*' => ['integer', 'distinct'],
            'barber_id' => ['nullable', 'integer'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if (! $this->filled('duration_minutes') && ! $this->filled('service_ids')) {
                $validator->errors()->add('duration_minutes', 'Provide duration_minutes or service_ids.');
            }
        });
    }
}
