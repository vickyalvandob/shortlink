<?php

namespace App\Http\Controllers;

use App\Http\Requests\AnalyticsRequest;
use App\Models\Setting;
use App\Models\ShortLink;
use App\Models\ShortLinkClick;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class AnalyticsController extends Controller
{
    public function __invoke(AnalyticsRequest $request): Response
    {
        $days = $request->integer('days', 7);
        $now = now();
        $today = $now->copy()->startOfDay();
        $start = $today->copy()->subDays($days - 1);
        $previousStart = $start->copy()->subDays($days);
        $previousEnd = $now->copy()->subDays($days);
        $domain = rtrim(Setting::values()['short_domain'], '/');
        $links = ShortLink::visibleTo($request->user());
        $clicks = ShortLinkClick::visibleTo($request->user());
        $selectedLink = null;

        if ($request->filled('link')) {
            $selectedLink = (clone $links)->select(['id', 'title', 'slug'])->findOrFail($request->integer('link'));
            $links->whereKey($selectedLink->id);
            $clicks->where('short_link_id', $selectedLink->id);
        }

        $periodClicks = (clone $clicks)->whereBetween('clicked_at', [$start, $now]);

        return Inertia::render('analytics/index', [
            'filters' => [
                'days' => $days,
                'link' => $selectedLink ? ['id' => $selectedLink->id, 'title' => $selectedLink->title, 'short_url' => $domain.'/'.$selectedLink->slug] : null,
                'start' => $start->toDateString(),
                'end' => $now->toDateString(),
            ],
            'timezone' => config('app.timezone'),
            'generatedAt' => fn () => $now->toIso8601String(),
            'stats' => function () use ($clicks, $links, $days, $now, $today, $start, $previousStart, $previousEnd): array {
                $month = $today->copy()->subDays(29);
                $counts = (clone $clicks)->toBase()
                    ->whereBetween('clicked_at', [$previousStart->min($month), $now])
                    ->selectRaw('COUNT(CASE WHEN clicked_at >= ? THEN 1 END) AS period_clicks', [$start])
                    ->selectRaw('COUNT(CASE WHEN clicked_at BETWEEN ? AND ? THEN 1 END) AS previous_clicks', [$previousStart, $previousEnd])
                    ->selectRaw('COUNT(CASE WHEN clicked_at >= ? THEN 1 END) AS today_count', [$today])
                    ->selectRaw('COUNT(CASE WHEN clicked_at >= ? THEN 1 END) AS week_count', [$today->copy()->subDays(6)])
                    ->selectRaw('COUNT(CASE WHEN clicked_at >= ? THEN 1 END) AS month_count', [$month])
                    ->selectRaw('COUNT(DISTINCT CASE WHEN clicked_at >= ? THEN short_link_id END) AS visited_links', [$start])
                    ->selectRaw("COUNT(CASE WHEN clicked_at >= ? AND (referrer IS NULL OR TRIM(referrer) = '') THEN 1 END) AS direct_clicks", [$start])
                    ->first();
                $current = (int) $counts->period_clicks;
                $previous = (int) $counts->previous_clicks;

                return [
                    'total_clicks' => (int) (clone $links)->sum('total_clicks'),
                    'today' => (int) $counts->today_count,
                    'last_7_days' => (int) $counts->week_count,
                    'last_30_days' => (int) $counts->month_count,
                    'period_clicks' => $current,
                    'previous_clicks' => $previous,
                    'change_percent' => $previous > 0 ? round(($current - $previous) / $previous * 100, 1) : null,
                    'average_daily' => round($current / $days, 1),
                    'visited_links' => (int) $counts->visited_links,
                    'direct_clicks' => (int) $counts->direct_clicks,
                    'referred_clicks' => $current - (int) $counts->direct_clicks,
                ];
            },
            'daily' => function () use ($periodClicks, $days, $start): array {
                $counts = (clone $periodClicks)->toBase()
                    ->selectRaw('DATE(clicked_at) AS day, COUNT(*) AS clicks')
                    ->groupByRaw('DATE(clicked_at)')->pluck('clicks', 'day');
                $daily = [];

                for ($day = 0; $day < $days; $day++) {
                    $date = $start->copy()->addDays($day)->toDateString();
                    $daily[] = ['date' => $date, 'clicks' => (int) ($counts[$date] ?? 0)];
                }

                return $daily;
            },
            'topLinks' => function () use ($periodClicks, $links, $domain) {
                $ranking = (clone $periodClicks)->toBase()->select('short_link_id')
                    ->selectRaw('COUNT(*) AS clicks, MAX(clicked_at) AS last_clicked_at')
                    ->groupBy('short_link_id');

                return (clone $links)->toBase()
                    ->joinSub($ranking, 'activity', 'activity.short_link_id', '=', 'short_links.id')
                    ->select(['short_links.id', 'short_links.title', 'short_links.slug', 'activity.clicks', 'activity.last_clicked_at'])
                    ->orderByDesc('activity.clicks')->orderByDesc('short_links.id')->limit(8)
                    ->get()->map(fn (object $link): array => [
                        'id' => (int) $link->id,
                        'title' => $link->title,
                        'short_url' => $domain.'/'.$link->slug,
                        'clicks' => (int) $link->clicks,
                        'last_clicked_at' => Carbon::parse($link->last_clicked_at)->toIso8601String(),
                    ]);
            },
            'clicks' => function () use ($periodClicks, $domain): array {
                $history = (clone $periodClicks)
                    ->select(['id', 'short_link_id', 'referrer', 'clicked_at'])
                    ->with('shortLink:id,title,slug')->latest('clicked_at')->orderByDesc('id')
                    ->cursorPaginate(20)->withQueryString();

                return [
                    'data' => $history->getCollection()->map(fn (ShortLinkClick $click): array => [
                        'id' => $click->id,
                        'link_id' => $click->short_link_id,
                        'title' => $click->shortLink->title,
                        'short_url' => $domain.'/'.$click->shortLink->slug,
                        'referrer' => $click->referrer,
                        'clicked_at' => $click->clicked_at->toIso8601String(),
                    ]),
                    'per_page' => $history->perPage(),
                    'prev_page_url' => $history->previousPageUrl(),
                    'next_page_url' => $history->nextPageUrl(),
                ];
            },
        ]);
    }
}
