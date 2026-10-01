<?php

namespace Database\Seeders;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            return;
        }

        User::firstOrCreate(['email' => 'admin@example.com'], [
            'name' => 'Administrator',
            'password' => 'password',
            'role' => 'admin',
            'is_active' => true,
        ]);

        foreach ([
            'app_name' => config('app.name', 'Internal Shortlink'),
            'default_slug_length' => '7',
            'default_redirect_type' => '302',
        ] as $key => $value) {
            Setting::firstOrCreate(['key' => $key], ['value' => $value]);
        }

        $this->call(ShortLinkSeeder::class);
    }
}
