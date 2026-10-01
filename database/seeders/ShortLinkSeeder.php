<?php

namespace Database\Seeders;

use App\Models\ShortLink;
use App\Models\User;
use Illuminate\Database\Seeder;

class ShortLinkSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            return;
        }

        $admin = User::where('email', 'admin@example.com')->first();
        if (! $admin) {
            return;
        }

        foreach ([
            ['title' => 'Company website', 'slug' => 'company', 'destination_url' => 'https://example.com'],
            ['title' => 'Engineering documentation', 'slug' => 'engineering', 'destination_url' => 'https://laravel.com/docs'],
            ['title' => 'Project resources', 'slug' => 'resources', 'destination_url' => 'https://github.com/laravel/laravel'],
            ['title' => 'Archived handbook', 'slug' => 'handbook', 'destination_url' => 'https://example.com', 'is_active' => false],
            ['title' => 'Previous download', 'slug' => 'download', 'destination_url' => 'https://example.com', 'expires_at' => now()->subDay()],
        ] as $link) {
            ShortLink::firstOrCreate(['slug' => $link['slug']], [
                'created_by' => $admin->id,
                'is_active' => true,
                'redirect_type' => 302,
                ...$link,
            ]);
        }
    }
}
