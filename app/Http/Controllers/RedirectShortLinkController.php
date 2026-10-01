<?php

namespace App\Http\Controllers;

use App\Models\ShortLink;
use App\Models\ShortLinkClick;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RedirectShortLinkController extends Controller
{
    public function __invoke(Request $request, string $slug): RedirectResponse
    {
        return DB::transaction(function () use ($request, $slug): RedirectResponse {
            $link = ShortLink::where('slug', $slug)->lockForUpdate()->firstOrFail();
            abort_unless($link->is_active && (! $link->expires_at || $link->expires_at->isFuture()), 410);

            if (! $request->isMethod('HEAD')) {
                $link->increment('total_clicks', 1, ['last_clicked_at' => now()]);
                ShortLinkClick::create([
                    'short_link_id' => $link->id,
                    'referrer' => $request->header('referer') ? mb_substr($request->header('referer'), 0, 2048) : null,
                    'user_agent' => $request->userAgent() ? mb_substr($request->userAgent(), 0, 1024) : null,
                    'clicked_at' => now(),
                ]);
            }

            return redirect()->away($link->destination_url, $link->redirect_type)
                ->withHeaders(['Cache-Control' => 'no-store, private', 'X-Robots-Tag' => 'noindex, nofollow']);
        }, 3);
    }
}
