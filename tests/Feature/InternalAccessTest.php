<?php

use App\Models\User;

test('internal login uses the custom URL and redirects signed in users', function () {
    expect(route('login', absolute: false))->toBe('/loginmasuk');
    $this->actingAs(User::factory()->create())->get('/loginmasuk')->assertRedirect('/admin');
});

test('disabled accounts cannot sign in', function () {
    $user = User::factory()->inactive()->create();

    $this->post('/loginmasuk', ['email' => $user->email, 'password' => 'password'])
        ->assertSessionHasErrors('email');

    $this->assertGuest();
    expect($user->fresh()->last_login_at)->toBeNull();
});

test('disabling an account revokes its existing session', function () {
    $user = User::factory()->inactive()->create();

    $this->actingAs($user)->get('/admin')->assertRedirect('/loginmasuk');

    $this->assertGuest();
});

test('successful login records last login time', function () {
    $this->travelTo(now()->startOfSecond());
    $user = User::factory()->create();

    $this->post('/loginmasuk', ['email' => $user->email, 'password' => 'password'])
        ->assertRedirect('/admin');

    expect($user->fresh()->last_login_at->equalTo(now()))->toBeTrue();
});

test('public registration and email recovery are unavailable', function () {
    $this->get('/register')->assertNotFound();
    $this->post('/register', [])->assertStatus(405);
    $this->get('/forgot-password')->assertNotFound();
});
