<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['key', 'value'])]
class Setting extends Model
{
    /** @return array{app_name: string, short_domain: string, default_slug_length: int, default_redirect_type: int} */
    public static function values(): array
    {
        $values = static::query()->pluck('value', 'key');

        return [
            'app_name' => (string) ($values['app_name'] ?? config('app.name', 'Internal Shortlink')),
            'short_domain' => rtrim((string) config('app.url'), '/'),
            'default_slug_length' => (int) ($values['default_slug_length'] ?? 7),
            'default_redirect_type' => (int) ($values['default_redirect_type'] ?? 302),
        ];
    }
}
