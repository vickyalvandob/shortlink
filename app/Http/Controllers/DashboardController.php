<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\ShortLink;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $links = ShortLink::visibleTo($request->user());
        $counts = (clone $links)->toBase()
            ->selectRaw('COUNT(*) AS total_links, COALESCE(SUM(total_clicks), 0) AS total_clicks, COALESCE(SUM(CASE WHEN is_active = ? AND (expires_at IS NULL OR expires_at > ?) THEN 1 ELSE 0 END), 0) AS active_links', [true, now()])
            ->first();
        $total = (int) $counts->total_links;
        $active = (int) $counts->active_links;
        $domain = Setting::values()['short_domain'];

        return Inertia::render('dashboard', [
            'stats' => [
                'total_links' => $total,
                'active_links' => $active,
                'inactive_links' => $total - $active,
                'total_clicks' => (int) $counts->total_clicks,
            ],
            'recentLinks' => $links->when($request->user()->isAdmin(), fn (Builder $query) => $query->with('creator:id,name'))->orderByDesc('id')->limit(6)
                ->get()->map(fn (ShortLink $link) => $link->forDisplay($domain)),
        ]);
    }
}
