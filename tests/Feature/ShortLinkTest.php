<?php

use App\Models\ShortLink;
use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

test('team members can create links without controlling ownership or counters', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post(route('links.store'), [
        'title' => 'Team handbook', 'destination_url' => 'https://example.com/handbook',
        'slug' => 'handbook', 'is_active' => true, 'total_clicks' => 900,
        'created_by' => 999, 'redirect_type' => 301,
    ])->assertRedirect(route('links.index'))->assertSessionHasNoErrors();

    $this->assertDatabaseHas('short_links', [
        'title' => 'Team handbook', 'slug' => 'handbook', 'created_by' => $user->id,
        'total_clicks' => 0, 'redirect_type' => 302,
    ]);
});

test('empty slugs are generated and existing random slugs are retried', function () {
    $user = User::factory()->create();
    ShortLink::factory()->for($user, 'creator')->create(['slug' => 'Taken77']);
    $slugs = ['Taken77', 'Fresh77'];
    Str::createRandomStringsUsing(function (int $length) use (&$slugs): string {
        return $length === 7 ? array_shift($slugs) : str_repeat('x', $length);
    });

    try {
        $this->actingAs($user)->post(route('links.store'), [
            'title' => 'Generated', 'destination_url' => 'https://example.com', 'slug' => '', 'is_active' => true,
        ])->assertSessionHasNoErrors();
    } finally {
        Str::createRandomStringsNormally();
    }

    $this->assertDatabaseHas('short_links', ['title' => 'Generated', 'slug' => 'Fresh77']);
});

test('invalid and reserved slugs are rejected', function (string $slug) {
    $user = User::factory()->create();

    $this->actingAs($user)->post(route('links.store'), [
        'title' => 'Invalid', 'destination_url' => 'https://example.com', 'slug' => $slug, 'is_active' => true,
    ])->assertSessionHasErrors('slug');

    $this->assertDatabaseCount('short_links', 0);
})->with(['reserved' => 'admin', 'reserved case' => 'LOGINMASUK', 'path' => 'one/two', 'space' => 'two words', 'unicode' => 'café', 'dot' => 'file.php']);

test('only HTTP and HTTPS destinations are accepted', function (string $url) {
    $this->actingAs(User::factory()->create())->post(route('links.store'), [
        'title' => 'Unsafe', 'destination_url' => $url, 'slug' => 'unsafe', 'is_active' => true,
    ])->assertSessionHasErrors('destination_url');

    $this->assertDatabaseCount('short_links', 0);
})->with(['javascript:alert(1)', 'ftp://example.com/file', '//example.com', "https://example.com/\r\nLocation:evil"]);

test('duplicate slug is rejected and an existing link can retain its own slug', function () {
    $user = User::factory()->create();
    $link = ShortLink::factory()->for($user, 'creator')->create(['slug' => 'guide']);
    $payload = ['title' => 'Updated', 'destination_url' => 'https://example.com/new', 'slug' => 'guide', 'is_active' => true];

    $this->actingAs($user)->post(route('links.store'), $payload)->assertSessionHasErrors('slug');
    $this->put(route('links.update', $link), $payload)->assertSessionHasNoErrors()->assertRedirect(route('links.index'));

    $this->assertDatabaseCount('short_links', 1);
    $this->assertDatabaseHas('short_links', ['id' => $link->id, 'title' => 'Updated', 'destination_url' => 'https://example.com/new']);
});

test('admins can edit disable and delete links created by another team member', function () {
    $link = ShortLink::factory()->create();

    $this->actingAs(User::factory()->admin()->create())->get(route('links.edit', $link))
        ->assertInertia(fn (Assert $page) => $page->where('link.id', $link->id));
    $this->put(route('links.update', $link), [
        'title' => 'Admin updated', 'destination_url' => $link->destination_url, 'slug' => $link->slug, 'is_active' => true,
    ])->assertSessionHasNoErrors();
    $this->assertDatabaseHas('short_links', ['id' => $link->id, 'title' => 'Admin updated', 'created_by' => $link->created_by]);

    $this->patch(route('links.status', $link), ['is_active' => false])
        ->assertSessionHasNoErrors();
    expect($link->fresh()->is_active)->toBeFalse();

    $this->delete(route('links.destroy', $link))->assertRedirect(route('links.index'));
    $this->assertModelMissing($link);
});

test('search matches title slug and destination and preserves server pagination', function () {
    $user = User::factory()->create();
    ShortLink::factory()->count(21)->for($user, 'creator')->create(['title' => 'Handbook', 'slug' => fn () => Str::random(7)]);
    ShortLink::factory()->for($user, 'creator')->create(['title' => 'Other', 'slug' => 'docs', 'destination_url' => 'https://example.com/policies']);

    $this->actingAs($user)->get(route('links.index', ['search' => 'Handbook']))
        ->assertInertia(fn (Assert $page) => $page->component('short-links/index')->has('links.data', 20)->where('links.per_page', 20)->where('links.next_page_url', fn ($url) => is_string($url)));
    $this->get(route('links.index', ['search' => 'docs']))->assertInertia(fn (Assert $page) => $page->has('links.data', 1));
    $this->get(route('links.index', ['search' => 'policies']))->assertInertia(fn (Assert $page) => $page->has('links.data', 1));
});

test('users only see their own links even when searching or changing ownership filters', function () {
    $user = User::factory()->create();
    $own = ShortLink::factory()->for($user, 'creator')->create(['title' => 'Shared keyword']);
    $other = ShortLink::factory()->create(['title' => 'Shared keyword']);
    ShortLink::factory()->create(['title' => 'Shared keyword', 'created_by' => null]);

    $this->actingAs($user)->get(route('links.index', ['search' => 'Shared keyword', 'created_by' => $other->created_by]))
        ->assertInertia(fn (Assert $page) => $page->has('links.data', 1)->where('links.data.0.id', $own->id)->missing('links.data.0.creator'));

    $this->actingAs(User::factory()->create())->get(route('links.index'))
        ->assertInertia(fn (Assert $page) => $page->has('links.data', 0));
});

test('admins see all links and their creators including preserved links without a creator', function () {
    $owner = User::factory()->create();
    $link = ShortLink::factory()->for($owner, 'creator')->create();
    $preserved = ShortLink::factory()->create(['created_by' => null]);

    $this->actingAs(User::factory()->admin()->create())->get(route('links.index'))
        ->assertInertia(fn (Assert $page) => $page->has('links.data', 2)
            ->where('links.data.0.id', $preserved->id)->where('links.data.0.creator', null)
            ->where('links.data.1.id', $link->id)->where('links.data.1.creator.name', $owner->name));
});

test('short link management permits active owners and admins only', function (string $role, bool $active, bool $ownsLink, bool $allowed) {
    $user = User::factory()->create(['role' => $role, 'is_active' => $active]);
    $link = ShortLink::factory()->create(['created_by' => $ownsLink ? $user->id : null]);

    expect(Gate::forUser($user)->allows('manage-short-link', $link))->toBe($allowed);
})->with([
    'owner' => ['user', true, true, true],
    'other user' => ['user', true, false, false],
    'admin' => ['admin', true, false, true],
    'disabled owner' => ['user', false, true, false],
    'disabled admin' => ['admin', false, false, false],
]);

test('users cannot read or mutate links owned by someone else', function (string $method, string $routeName) {
    $link = ShortLink::factory()->create(['title' => 'Private title', 'is_active' => true]);

    $this->actingAs(User::factory()->create())->{$method}(route($routeName, $link), [
        'title' => 'Changed', 'destination_url' => 'https://example.com/changed', 'slug' => $link->slug, 'is_active' => false,
    ])->assertNotFound();

    $this->assertDatabaseHas('short_links', ['id' => $link->id, 'title' => 'Private title', 'is_active' => true, 'destination_url' => $link->destination_url]);
})->with([
    'edit page' => ['get', 'links.edit'],
    'update' => ['put', 'links.update'],
    'toggle status' => ['patch', 'links.status'],
    'delete' => ['delete', 'links.destroy'],
]);

test('owners can open and disable their own links', function () {
    $owner = User::factory()->create();
    $link = ShortLink::factory()->for($owner, 'creator')->create();

    $this->actingAs($owner)->get(route('links.edit', $link))
        ->assertInertia(fn (Assert $page) => $page->where('link.id', $link->id));
    $this->patch(route('links.status', $link), ['is_active' => false])->assertSessionHasNoErrors();

    $this->assertDatabaseHas('short_links', ['id' => $link->id, 'is_active' => false]);
});

test('cursor navigation preserves filters and avoids duplicates when new links are added', function () {
    $this->freezeTime();
    $owner = User::factory()->create();
    $links = ShortLink::factory()->count(21)->for($owner, 'creator')->create(['title' => 'Guide']);
    ShortLink::factory()->create(['title' => 'Guide']);
    $first = $this->actingAs($owner)->get(route('links.index', ['search' => 'Guide', 'per_page' => 20]));
    $first->assertInertia(fn (Assert $page) => $page->has('links.data', 20)->where('links.data.0.id', $links->last()->id));
    ShortLink::factory()->for($owner, 'creator')->create(['title' => 'Guide']);

    $second = $this->get($first->inertiaProps('links.next_page_url'));
    $second->assertInertia(fn (Assert $page) => $page->has('links.data', 1)
        ->where('links.data.0.id', $links->first()->id)->where('links.next_page_url', null)
        ->where('filters.search', 'Guide')->where('filters.per_page', 20));
    $this->get($second->inertiaProps('links.prev_page_url'))
        ->assertInertia(fn (Assert $page) => $page->has('links.data', 20)->where('links.data.0.id', $links->last()->id));
});

test('table page sizes are bounded', function (int $requested, int $expected) {
    $user = User::factory()->create();

    $this->actingAs($user)->get(route('links.index', ['per_page' => $requested]))
        ->assertInertia(fn (Assert $page) => $page->where('links.per_page', $expected));
})->with([[20, 20], [50, 50], [100, 100], [100000, 20], [-1, 20]]);

test('dashboard counts expired links as unavailable', function () {
    $this->freezeTime();
    $user = User::factory()->create();
    ShortLink::factory()->for($user, 'creator')->create(['total_clicks' => 3]);
    ShortLink::factory()->for($user, 'creator')->inactive()->create();
    ShortLink::factory()->for($user, 'creator')->expired()->create();

    $this->actingAs($user)->get(route('dashboard'))->assertInertia(fn (Assert $page) => $page
        ->where('stats.total_links', 3)->where('stats.active_links', 1)->where('stats.inactive_links', 2)->where('stats.total_clicks', 3));
});

test('guests cannot create or manage links', function () {
    $link = ShortLink::factory()->create();

    $this->get(route('links.index'))->assertRedirect(route('login'));
    $this->post(route('links.store'), [])->assertRedirect(route('login'));
    $this->put(route('links.update', $link), [])->assertRedirect(route('login'));
    $this->patch(route('links.status', $link), ['is_active' => false])->assertRedirect(route('login'));
    $this->delete(route('links.destroy', $link))->assertRedirect(route('login'));

    $this->assertModelExists($link);
});
