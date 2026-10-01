<?php

use App\Models\Setting;
use App\Models\ShortLink;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

test('settings affect new slugs redirects previews and application name', function () {
    config(['app.url' => 'https://go.example.com/']);
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->put(route('settings.update'), [
        'app_name' => 'Team Go',
        'default_slug_length' => 10, 'default_redirect_type' => 301, 'unexpected' => 'not saved',
    ])->assertRedirect(route('settings.edit'))->assertSessionHasNoErrors();

    $this->assertDatabaseCount('settings', 3);
    $this->get(route('settings.edit'))->assertInertia(fn (Assert $page) => $page
        ->where('settings.short_domain', 'https://go.example.com')->where('name', 'Team Go'));

    $this->post(route('links.store'), ['title' => 'Generated link', 'destination_url' => 'https://example.com', 'is_active' => true])
        ->assertSessionHasNoErrors();

    $link = ShortLink::firstOrFail();
    expect(strlen($link->slug))->toBe(10);
    expect($link->redirect_type)->toBe(301);
    $this->get(route('links.index'))->assertInertia(fn (Assert $page) => $page
        ->where('links.data.0.short_url', 'https://go.example.com/'.$link->slug));
    $this->get(route('links.generate-slug'))->assertJsonStructure(['slug']);
});

test('invalid settings do not partially persist', function (string $field, mixed $value) {
    $admin = User::factory()->admin()->create();
    $data = ['app_name' => 'Shortlink', 'default_slug_length' => 7, 'default_redirect_type' => 302];

    $this->actingAs($admin)->put(route('settings.update'), [...$data, $field => $value])->assertSessionHasErrors($field);

    $this->assertDatabaseCount('settings', 0);
})->with([
    ['short_domain', 'javascript:alert(1)'], ['short_domain', 'https://example.com/path'],
    ['short_domain', 'https://name:secret@example.com'], ['short_domain', 'https://example.com?x=1'],
    ['short_domain', 'https://example.com#fragment'], ['default_slug_length', 3],
    ['short_domain', 'https://valid.example.com'],
    ['default_slug_length', 33], ['default_redirect_type', 307], ['app_name', ''],
]);

test('development seed data is idempotent and never created in production', function () {
    $this->seed(DatabaseSeeder::class);
    $this->seed(DatabaseSeeder::class);

    $this->assertDatabaseCount('users', 1);
    $this->assertDatabaseCount('short_links', 5);
    expect(Hash::check('password', User::firstOrFail()->password))->toBeTrue();

    $this->app['env'] = 'production';
    Setting::query()->delete();
    $this->artisan('db:seed', ['--class' => DatabaseSeeder::class, '--force' => true])->assertSuccessful();
    $this->assertDatabaseCount('settings', 0);
});

test('self-redirects are rejected and expiration instants preserve their timezone', function () {
    config(['app.url' => 'https://go.example.com/']);
    $admin = User::factory()->admin()->create();
    Setting::create(['key' => 'short_domain', 'value' => 'https://old.example.com']);
    $data = ['title' => 'Example', 'slug' => 'manual', 'is_active' => true];

    $this->actingAs($admin)->post(route('links.store'), [...$data, 'destination_url' => 'https://go.example.com/manual'])
        ->assertSessionHasErrors('destination_url');

    $this->post(route('links.store'), [...$data, 'destination_url' => 'https://example.com', 'expires_at' => '2026-12-01T03:00:00.000Z'])
        ->assertSessionHasNoErrors();

    expect(ShortLink::firstOrFail()->expires_at->utc()->format('Y-m-d H:i:s'))->toBe('2026-12-01 03:00:00');
});

test('short domain always follows APP_URL despite an old saved setting', function () {
    config(['app.url' => 'https://current.example.com/']);
    Setting::create(['key' => 'short_domain', 'value' => 'https://old.example.com']);
    $admin = User::factory()->admin()->create();
    $link = ShortLink::factory()->for($admin, 'creator')->create(['slug' => 'guide']);

    $this->actingAs($admin)->get(route('settings.edit'))->assertInertia(fn (Assert $page) => $page->where('settings.short_domain', 'https://current.example.com'));
    $this->get(route('links.edit', $link))->assertInertia(fn (Assert $page) => $page->where('link.short_url', 'https://current.example.com/guide'));

    config(['app.url' => 'https://new.example.com/']);
    $this->get(route('links.index'))->assertInertia(fn (Assert $page) => $page->where('links.data.0.short_url', 'https://new.example.com/guide'));
});
