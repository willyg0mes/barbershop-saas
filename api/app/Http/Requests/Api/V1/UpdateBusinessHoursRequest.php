<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateBusinessHoursRequest extends FormRequest
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
            'days' => ['required', 'array', 'size:7'],
            'days.*.day_of_week' => ['required', 'integer', 'between:0,6', 'distinct'],
            'days.*.is_closed' => ['required', 'boolean'],
            'days.*.open_time' => ['nullable', 'date_format:H:i'],
            'days.*.close_time' => ['nullable', 'date_format:H:i'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $days = $this->input('days', []);

            foreach ($days as $index => $day) {
                if (($day['is_closed'] ?? false) === true) {
                    continue;
                }

                $open = $day['open_time'] ?? null;
                $close = $day['close_time'] ?? null;

                if (! is_string($open) || ! is_string($close)) {
                    $validator->errors()->add("days.{$index}.open_time", 'Open and close times are required when the day is open.');

                    continue;
                }

                if ($open >= $close) {
                    $validator->errors()->add("days.{$index}.close_time", 'Close time must be after open time.');
                }
            }
        });
    }
}
