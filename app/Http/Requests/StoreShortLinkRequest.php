<?php

namespace App\Http\Requests;

use App\Models\ShortLink;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreShortLinkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->is_active;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        $link = $this->route('link');

        return [
            'title' => ['required', 'string', 'max:255'],
            'destination_url' => ['required', 'string', 'max:4096', 'url:http,https', 'not_regex:/[\x00-\x20\x7f]/'],
            'slug' => [
                'nullable', 'string', 'max:100', 'regex:/\A[A-Za-z0-9_-]+\z/',
                Rule::unique('short_links', 'slug')->ignore($link instanceof ShortLink ? $link->id : null),
                function (string $attribute, mixed $value, Closure $fail): void {
                    if (in_array(strtolower((string) $value), ShortLink::RESERVED_SLUGS, true)) {
                        $fail('This slug is reserved for the application.');
                    }
                },
            ],
            'expires_at' => ['nullable', 'date'],
            'is_active' => ['required', 'boolean'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'slug.regex' => 'Use only letters, numbers, hyphens, and underscores.',
            'slug.unique' => 'This slug is already in use. Choose another one.',
            'destination_url.url' => 'Enter a valid URL starting with http:// or https://.',
        ];
    }
}
