<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return ($this->user()?->isAdmin() ?? false) && $this->user()->is_active;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['email' => $this->string('email')->lower()->trim()->toString()]);
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')],
            'password' => ['required', 'string', Password::min(12), 'max:128'],
            'role' => ['required', Rule::in(['admin', 'user'])],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
