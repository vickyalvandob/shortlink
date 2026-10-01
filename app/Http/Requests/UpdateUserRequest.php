<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends StoreUserRequest
{
    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        $user = $this->route('user');

        return [
            ...parent::rules(),
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user instanceof User ? $user->id : null)],
            'password' => ['nullable', 'string', Password::min(12), 'max:128'],
        ];
    }
}
