<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return ($this->user()?->isAdmin() ?? false) && $this->user()->is_active;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'app_name' => ['required', 'string', 'max:80'],
            'short_domain' => ['prohibited'],
            'default_slug_length' => ['required', 'integer', 'between:4,32'],
            'default_redirect_type' => ['required', 'integer', Rule::in([301, 302])],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['short_domain.prohibited' => 'The short domain is managed by APP_URL and cannot be changed here.'];
    }
}
