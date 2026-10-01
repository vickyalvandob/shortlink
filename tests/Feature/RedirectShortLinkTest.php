<?php

use App\Models\ShortLink;
use App\Models\User;

test('a public link redirects directly and records a click without a session or Inertia', function () {
    $this->travelTo(now()->startOfSecond());
    $link = ShortLink::factory()->create(['slug' => 'Guide_1', 'destination_url' => 'https://example.com/guide']);

    $this->get('/Guide_1')
        ->assertRedirect('https://example.com/guide')
        ->assertStatus(302)
        ->assertHeaderMissing('X-Inertia')
        ->assertHeaderMissing('Set-Cookie')
        ->assertHeader('Cache-Control', 'no-store, private');

    expect($link->fresh()->total_clicks)->toBe(1);
    expect($link->fresh()->last_clicked_at->equalTo(now()))->toBeTrue();
});

test('missing links return the minimal 404 page', function () {
    $this->get('/unknown-link')->assertNotFound()->assertSee('Link Not Found')->assertDontSee('data-page');
});

test('disabled and expired links return 410 without counting a click', function (string $state) {
    $this->freezeTime();
    $link = ShortLink::factory()->$state()->create();

    $this->get('/'.$link->slug)->assertGone()->assertSee('Link No Longer Available');

    expect($link->fresh()->total_clicks)->toBe(0);
    expect($link->fresh()->last_clicked_at)->toBeNull();
})->with(['inactive', 'expired']);

test('expiration at the current second is unavailable', function () {
    $this->travelTo(now()->startOfSecond());
    $link = ShortLink::factory()->create(['expires_at' => now()]);

    $this->get('/'.$link->slug)->assertGone();

    expect($link->fresh()->total_clicks)->toBe(0);
});

test('HEAD requests do not inflate clicks', function () {
    $link = ShortLink::factory()->create();

    $this->head('/'.$link->slug)->assertRedirect($link->destination_url);

    expect($link->fresh()->total_clicks)->toBe(0);
});

test('an edited destination and slug take effect on the next request', function () {
    $user = User::factory()->create();
    $link = ShortLink::factory()->for($user, 'creator')->create(['slug' => 'old-path']);

    $this->actingAs($user)->put(route('links.update', $link), [
        'title' => 'New destination', 'slug' => 'new-path', 'destination_url' => 'https://example.com/new', 'is_active' => true,
    ])->assertSessionHasNoErrors();

    $this->get('/old-path')->assertNotFound();
    $this->get('/new-path')->assertRedirect('https://example.com/new');
});

test('slugs are case sensitive and configured redirect status is respected', function () {
    ShortLink::factory()->create(['slug' => 'CaseSensitive', 'redirect_type' => 301]);

    $this->get('/casesensitive')->assertNotFound();
    $this->get('/CaseSensitive')->assertStatus(301)->assertHeader('Cache-Control', 'no-store, private');
});
