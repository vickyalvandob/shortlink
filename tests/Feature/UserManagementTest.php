<?php

use App\Models\ShortLink;
use App\Models\ShortLinkClick;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

test('admins can create accounts and passwords are hashed', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->post(route('users.store'), [
        'name' => 'Team Member', 'email' => 'TEAM@example.com', 'password' => 'secure-password-123',
        'role' => 'user', 'is_active' => true,
    ])->assertRedirect(route('users.index'))->assertSessionHasNoErrors();

    $member = User::where('email', 'team@example.com')->firstOrFail();
    expect(Hash::check('secure-password-123', $member->password))->toBeTrue();
    expect($member->role)->toBe('user');
    expect($member->is_active)->toBeTrue();
});

test('regular users cannot access any user or settings endpoint', function (string $method, string $path) {
    $member = User::factory()->create();
    $target = User::factory()->create();
    $path = str_replace('{id}', (string) $target->id, $path);

    $this->actingAs($member)->{$method}($path)->assertForbidden();

    $this->assertDatabaseCount('users', 2);
    $this->assertDatabaseCount('settings', 0);
})->with([
    ['get', '/admin/users'], ['get', '/admin/users/create'], ['post', '/admin/users'],
    ['get', '/admin/users/{id}/edit'], ['put', '/admin/users/{id}'],
    ['patch', '/admin/users/{id}/status'], ['delete', '/admin/users/{id}'],
    ['get', '/admin/settings'], ['put', '/admin/settings'],
]);

test('the final active admin cannot be disabled deleted or demoted', function (string $action) {
    $admin = User::factory()->admin()->create();
    User::factory()->admin()->inactive()->create();
    $this->actingAs($admin);

    $response = match ($action) {
        'disable' => $this->patch(route('users.status', $admin), ['is_active' => false]),
        'delete' => $this->delete(route('users.destroy', $admin)),
        'demote' => $this->put(route('users.update', $admin), ['name' => $admin->name, 'email' => $admin->email, 'password' => '', 'role' => 'user', 'is_active' => true]),
    };

    $response->assertSessionHasErrors(['is_active' => 'At least one active administrator must remain.']);
    expect($admin->fresh()->isAdmin())->toBeTrue();
    expect($admin->fresh()->is_active)->toBeTrue();
})->with(['disable', 'delete', 'demote']);

test('blank passwords preserve the existing hash and a new password replaces it', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create();
    $oldHash = $user->password;
    $data = ['name' => 'Updated', 'email' => $user->email, 'password' => '', 'role' => 'user', 'is_active' => true];

    $this->actingAs($admin)->put(route('users.update', $user), $data)->assertSessionHasNoErrors();
    expect($user->fresh()->password)->toBe($oldHash);

    $this->put(route('users.update', $user), [...$data, 'password' => 'updated-password-123'])->assertSessionHasNoErrors();
    expect(Hash::check('updated-password-123', $user->fresh()->password))->toBeTrue();
});

test('admins can disable other users and reenable them', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create();

    $this->actingAs($admin)->patch(route('users.status', $user), ['is_active' => false])->assertSessionHasNoErrors();
    expect($user->fresh()->is_active)->toBeFalse();

    $this->patch(route('users.status', $user), ['is_active' => true])->assertSessionHasNoErrors();
    expect($user->fresh()->is_active)->toBeTrue();
});

test('deleting users preserves their short links and click history', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create();
    $link = ShortLink::factory()->for($user, 'creator')->create();
    ShortLinkClick::factory()->for($link)->create();

    $this->actingAs($admin)->delete(route('users.destroy', $user))->assertRedirect(route('users.index'));

    $this->assertModelMissing($user);
    expect($link->fresh()->created_by)->toBeNull();
    $this->assertDatabaseCount('short_link_clicks', 1);
    $this->get('/'.$link->slug)->assertRedirect($link->destination_url);
});

test('an admin may demote themselves when another active admin remains', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->admin()->create();

    $this->actingAs($admin)->put(route('users.update', $admin), [
        'name' => $admin->name, 'email' => $admin->email, 'role' => 'user', 'is_active' => true,
    ])->assertRedirect(route('dashboard'));

    expect($admin->fresh()->role)->toBe('user');
    $this->get(route('users.index'))->assertForbidden();
});

test('user validation rejects duplicate emails invalid roles and weak passwords', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->post(route('users.store'), [
        'name' => '', 'email' => $admin->email, 'password' => 'short',
        'role' => 'owner', 'is_active' => 'invalid',
    ])->assertSessionHasErrors(['name', 'email', 'password', 'role', 'is_active']);

    $this->assertDatabaseCount('users', 1);
});

test('user forms and lists render without exposing credentials', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->get(route('users.index'))->assertInertia(fn (Assert $page) => $page
        ->component('users/index')->has('users.data', 1)->missing('users.data.0.password')->missing('users.data.0.remember_token'));
    $this->get(route('users.create'))->assertInertia(fn (Assert $page) => $page->component('users/create'));
    $this->get(route('users.edit', $admin))->assertInertia(fn (Assert $page) => $page->component('users/edit')->missing('user.password'));
});

test('admin can delete their account only when another active admin remains', function () {
    $admin = User::factory()->admin()->create();
    $other = User::factory()->admin()->create();

    $this->actingAs($admin)->delete(route('users.destroy', $admin))->assertRedirect(route('login'));

    $this->assertGuest();
    $this->assertModelMissing($admin);
    $this->assertModelExists($other);
});
