<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\ShortLink;
use App\Models\ShortLinkClick;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

test('click statistics use calendar days and include exact period boundaries', function () {
    $this->travelTo(now()->setDate(2026, 10, 1)->setTime(12, 0));
    $user = User::factory()->create();
    $link = ShortLink::factory()->for($user, 'creator')->create(['total_clicks' => 5]);
    foreach (['2026-10-01 00:00:00', '2026-09-30 23:59:59', '2026-09-25 00:00:00', '2026-09-02 00:00:00', '2026-09-01 23:59:59'] as $time) {
        ShortLinkClick::factory()->for($link)->create(['clicked_at' => $time]);
    }

    $this->actingAs($user)->get(route('analytics.index'))->assertInertia(fn (Assert $page) => $page
        ->component('analytics/index')->where('stats.total_clicks', 5)->where('stats.today', 1)
        ->where('stats.last_7_days', 3)->where('stats.last_30_days', 4)
        ->has('daily', 7)->where('daily.0.clicks', 1)->where('daily.6.clicks', 1)
        ->has('clicks.data', 3)->where('topLinks.0.id', $link->id)
        ->where('stats.period_clicks', 3)->where('topLinks.0.clicks', 3));
});

test('redirects record bounded metadata and deleting the link removes its history', function () {
    $user = User::factory()->create();
    $link = ShortLink::factory()->for($user, 'creator')->create();

    $this->withHeaders(['Referer' => str_repeat('r', 2200), 'User-Agent' => str_repeat('u', 1200)])
        ->get('/'.$link->slug)->assertRedirect($link->destination_url);

    $this->assertDatabaseHas('short_link_clicks', [
        'short_link_id' => $link->id, 'referrer' => str_repeat('r', 2048), 'user_agent' => str_repeat('u', 1024),
    ]);
    expect($link->fresh()->total_clicks)->toBe(1);

    $this->actingAs($user)->delete(route('links.destroy', $link))->assertRedirect(route('links.index'));
    $this->assertDatabaseCount('short_link_clicks', 0);
});

test('failed click recording rolls back the counter', function () {
    $link = ShortLink::factory()->create();
    ShortLinkClick::creating(function (): void {
        throw new RuntimeException('Simulated storage failure');
    });

    try {
        $this->get('/'.$link->slug)->assertServerError();
    } finally {
        ShortLinkClick::flushEventListeners();
    }

    expect($link->fresh()->total_clicks)->toBe(0);
    expect($link->fresh()->last_clicked_at)->toBeNull();
    $this->assertDatabaseCount('short_link_clicks', 0);
});

test('analytics requires login', function () {
    $this->get(route('analytics.index'))->assertRedirect(route('login'));
});

test('analytics only includes accessible links in totals charts rankings and click history', function () {
    $this->freezeTime();
    $user = User::factory()->create();
    $own = ShortLink::factory()->for($user, 'creator')->create(['total_clicks' => 1]);
    $other = ShortLink::factory()->create(['total_clicks' => 2]);
    $preserved = ShortLink::factory()->create(['created_by' => null, 'total_clicks' => 1]);
    ShortLinkClick::factory()->for($own)->create(['clicked_at' => now()]);
    ShortLinkClick::factory()->for($other)->count(2)->create(['clicked_at' => now()]);
    ShortLinkClick::factory()->for($preserved)->create(['clicked_at' => now()]);

    $this->actingAs($user)->get(route('analytics.index'))->assertInertia(fn (Assert $page) => $page
        ->where('stats.total_clicks', 1)->where('stats.today', 1)->where('stats.last_7_days', 1)->where('stats.last_30_days', 1)
        ->where('daily.6.clicks', 1)->has('topLinks', 1)->where('topLinks.0.id', $own->id)
        ->has('clicks.data', 1)->where('clicks.data.0.title', $own->title));

    $this->actingAs(User::factory()->admin()->create())->get(route('analytics.index'))->assertInertia(fn (Assert $page) => $page
        ->where('stats.total_clicks', 4)->where('stats.today', 4)->where('stats.last_7_days', 4)->where('stats.last_30_days', 4)
        ->where('daily.6.clicks', 4)->has('topLinks', 3)->where('topLinks.0.id', $other->id)->has('clicks.data', 4));

    $this->actingAs(User::factory()->create())->get(route('analytics.index'))->assertInertia(fn (Assert $page) => $page
        ->where('stats.total_clicks', 0)->where('stats.today', 0)->where('daily.6.clicks', 0)
        ->has('topLinks', 0)->has('clicks.data', 0));
});

test('every reporting period includes its boundaries and excludes future clicks', function (int $days, string $start) {
    $this->travelTo(now()->setDate(2026, 10, 1)->setTime(12, 0));
    $user = User::factory()->create();
    $link = ShortLink::factory()->for($user, 'creator')->create();
    ShortLinkClick::factory()->for($link)->create(['clicked_at' => $start.' 00:00:00']);
    ShortLinkClick::factory()->for($link)->create(['clicked_at' => now()->startOfDay()->subDays($days - 1)->subSecond()]);
    ShortLinkClick::factory()->for($link)->create(['clicked_at' => now()]);
    ShortLinkClick::factory()->for($link)->create(['clicked_at' => now()->addSecond()]);

    $this->actingAs($user)->get(route('analytics.index', ['days' => $days]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.days', $days)->where('filters.start', $start)
            ->has('daily', $days)->where('daily.0.date', $start)->where('daily.0.clicks', 1)
            ->where('daily.'.($days - 1).'.clicks', 1)->where('daily.1.clicks', 0)
            ->where('stats.period_clicks', 2)->where('stats.today', 1)
            ->where('topLinks.0.clicks', 2)->has('clicks.data', 2));
})->with([
    'week' => [7, '2026-09-25'],
    'month' => [30, '2026-09-02'],
    'quarter' => [90, '2026-07-04'],
]);

test('analytics compares equal elapsed periods and accurately groups unattributed traffic', function () {
    $this->travelTo(now()->setDate(2026, 10, 1)->setTime(12, 0));
    $user = User::factory()->create();
    $link = ShortLink::factory()->for($user, 'creator')->create();
    ShortLinkClick::factory()->for($link)->create(['clicked_at' => '2026-09-18 00:00:00']);
    ShortLinkClick::factory()->for($link)->create(['clicked_at' => '2026-09-24 12:00:00']);
    ShortLinkClick::factory()->for($link)->create(['clicked_at' => '2026-09-24 12:00:01']);
    ShortLinkClick::factory()->for($link)->create(['clicked_at' => '2026-09-17 23:59:59']);
    ShortLinkClick::factory()->for($link)->count(3)->sequence(
        ['referrer' => null], ['referrer' => '   '], ['referrer' => 'https://example.org/article'],
    )->create(['clicked_at' => now()]);

    $this->actingAs($user)->get(route('analytics.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('stats.period_clicks', 3)->where('stats.previous_clicks', 2)
            ->where('stats.change_percent', 50)->where('stats.average_daily', 0.4)
            ->where('stats.visited_links', 1)->where('stats.direct_clicks', 2)->where('stats.referred_clicks', 1));
});

test('rankings use clicks in the selected period instead of lifetime counters', function () {
    $this->freezeTime();
    $user = User::factory()->create();
    $historical = ShortLink::factory()->for($user, 'creator')->create(['total_clicks' => 100]);
    $trending = ShortLink::factory()->for($user, 'creator')->create(['total_clicks' => 3]);
    ShortLinkClick::factory()->for($historical)->count(4)->create(['clicked_at' => now()->subDays(10)]);
    ShortLinkClick::factory()->for($historical)->create(['clicked_at' => now()]);
    ShortLinkClick::factory()->for($trending)->count(3)->create(['clicked_at' => now()]);

    $this->actingAs($user)->get(route('analytics.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('stats.total_clicks', 103)->where('stats.period_clicks', 4)
            ->where('stats.visited_links', 2)->where('topLinks.0.id', $trending->id)
            ->where('topLinks.0.clicks', 3)->where('topLinks.1.clicks', 1));
});

test('link drilldown scopes every report and rejects inaccessible links', function () {
    $this->freezeTime();
    $user = User::factory()->create();
    $selected = ShortLink::factory()->for($user, 'creator')->create(['total_clicks' => 1]);
    $otherOwn = ShortLink::factory()->for($user, 'creator')->create(['total_clicks' => 2]);
    $foreign = ShortLink::factory()->create(['total_clicks' => 1]);
    ShortLinkClick::factory()->for($selected)->create(['clicked_at' => now(), 'referrer' => 'https://example.org']);
    ShortLinkClick::factory()->for($otherOwn)->count(2)->create(['clicked_at' => now()]);
    ShortLinkClick::factory()->for($foreign)->create(['clicked_at' => now()]);

    $this->actingAs($user)->get(route('analytics.index', ['link' => $selected->id]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.link.id', $selected->id)->where('stats.total_clicks', 1)
            ->where('stats.period_clicks', 1)->where('stats.direct_clicks', 0)->where('stats.referred_clicks', 1)
            ->where('daily.6.clicks', 1)->has('topLinks', 1)->where('topLinks.0.id', $selected->id)
            ->has('clicks.data', 1)->where('clicks.data.0.link_id', $selected->id));

    $this->get(route('analytics.index', ['link' => $foreign->id]))->assertNotFound();
    $this->get(route('analytics.index', ['link' => 999999]))->assertNotFound();
    $this->actingAs(User::factory()->admin()->create())->get(route('analytics.index', ['link' => $foreign->id]))
        ->assertInertia(fn (Assert $page) => $page->where('stats.period_clicks', 1)->where('filters.link.id', $foreign->id));
});

test('empty analytics zero fills dates without inventing growth or traffic', function () {
    $this->freezeTime();
    $this->actingAs(User::factory()->create())->get(route('analytics.index', ['days' => 30]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('stats.period_clicks', 0)->where('stats.previous_clicks', 0)->where('stats.change_percent', null)
            ->where('stats.average_daily', 0)->where('stats.visited_links', 0)
            ->where('stats.direct_clicks', 0)->where('stats.referred_clicks', 0)
            ->has('daily', 30)->where('daily', fn ($days) => $days->every(fn ($day) => $day['clicks'] === 0))
            ->has('topLinks', 0)->has('clicks.data', 0));
});

test('invalid analytics filters are rejected', function (array $query, string $field) {
    $this->actingAs(User::factory()->create())->get(route('analytics.index', $query))->assertSessionHasErrors($field);
})->with([
    'unbounded period' => [['days' => 36500], 'days'],
    'non numeric period' => [['days' => 'week'], 'days'],
    'array period' => [['days' => [7]], 'days'],
    'invalid link' => [['link' => -1], 'link'],
    'array cursor' => [['cursor' => ['bad']], 'cursor'],
]);

test('click pagination preserves filters and avoids recalculating analytics aggregates', function () {
    $this->freezeTime();
    $user = User::factory()->create();
    $link = ShortLink::factory()->for($user, 'creator')->create();
    $records = ShortLinkClick::factory()->for($link)->count(21)->create(['clicked_at' => now()]);
    $this->actingAs($user);
    $headers = ['X-Inertia' => 'true', 'X-Inertia-Version' => app(HandleInertiaRequests::class)->version(request()) ?? '', 'X-Inertia-Partial-Component' => 'analytics/index', 'X-Inertia-Partial-Data' => 'clicks'];

    $first = $this->get(route('analytics.index', ['days' => 30, 'link' => $link->id]), $headers)
        ->assertJsonCount(20, 'props.clicks.data')->assertJsonPath('props.clicks.data.0.id', $records->last()->id)
        ->assertJsonMissingPath('props.stats')->assertJsonMissingPath('props.daily')->assertJsonMissingPath('props.topLinks')
        ->assertJsonMissingPath('props.clicks.data.0.user_agent');
    $nextUrl = $first->json('props.clicks.next_page_url');
    expect($nextUrl)->toContain('days=30')->toContain('link='.$link->id);

    DB::enableQueryLog();
    try {
        $this->get($nextUrl, $headers)->assertJsonCount(1, 'props.clicks.data')
            ->assertJsonPath('props.clicks.data.0.id', $records->first()->id)
            ->assertJsonPath('props.clicks.next_page_url', null);
        $clickQueries = collect(DB::getQueryLog())->pluck('query')->filter(fn (string $query) => str_contains($query, 'short_link_clicks'));
        expect($clickQueries)->toHaveCount(1);
        expect(strtolower($clickQueries->first()))->not->toContain('count(')->not->toContain('group by')->not->toContain('offset');
    } finally {
        DB::disableQueryLog();
        DB::flushQueryLog();
    }
});
