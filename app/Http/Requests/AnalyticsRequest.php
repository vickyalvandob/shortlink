<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AnalyticsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->is_active;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'days' => ['sometimes', 'required', 'integer', Rule::in([7, 30, 90])],
            'link' => ['nullable', 'integer', 'min:1'],
            'cursor' => ['nullable', 'string', 'max:2048'],
        ];
    }
}
