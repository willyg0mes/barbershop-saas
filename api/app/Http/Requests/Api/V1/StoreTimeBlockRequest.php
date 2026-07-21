<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreTimeBlockRequest extends FormRequest
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
            'barber_id' => ['nullable', 'integer', 'exists:users,id'],
            'starts_at' => ['required', 'date', 'date_format:Y-m-d\TH:i:sP'],
            'ends_at' => ['required', 'date', 'date_format:Y-m-d\TH:i:sP'],
            'reason' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $start = $this->input('starts_at');
            $end = $this->input('ends_at');

            if (is_string($start) && is_string($end) && $start >= $end) {
                $validator->errors()->add('ends_at', 'End time must be after start time.');
            }
        });
    }
}
