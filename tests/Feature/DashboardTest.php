<?php

use App\Models\ShortLink;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('dashboard summaries and recent links follow the current users access', function () {
    $this->freezeTime();
    $user = User::factory()->create();
    $own = ShortLink::factory()->for($user, 'creator')->create(['total_clicks' => 3]);
    ShortLink::factory()->inactive()->create(['total_clicks' => 20]);

    $this->actingAs($user)->get(route('dashboard'))->assertInertia(fn (Assert $page) => $page
        ->where('stats.total_links', 1)->where('stats.active_links', 1)->where('stats.inactive_links', 0)->where('stats.total_clicks', 3)
        ->has('recentLinks', 1)->where('recentLinks.0.id', $own->id));

    $this->actingAs(User::factory()->admin()->create())->get(route('dashboard'))->assertInertia(fn (Assert $page) => $page
        ->where('stats.total_links', 2)->where('stats.active_links', 1)->where('stats.inactive_links', 1)->where('stats.total_clicks', 23)
        ->has('recentLinks', 2));

    $this->actingAs(User::factory()->create())->get(route('dashboard'))->assertInertia(fn (Assert $page) => $page
        ->where('stats.total_links', 0)->where('stats.active_links', 0)->where('stats.total_clicks', 0)->has('recentLinks', 0));
});
