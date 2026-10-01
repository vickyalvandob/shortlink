<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreShortLinkRequest;
use App\Http\Requests\UpdateShortLinkRequest;
use App\Models\Setting;
use App\Models\ShortLink;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ShortLinkController extends Controller
{
    public function index(Request $request): Response
    {
        $search = mb_substr($request->string('search')->trim()->toString(), 0, 200);
        $perPage = $request->integer('per_page', 20);
        $perPage = in_array($perPage, [20, 50, 100], true) ? $perPage : 20;
        $settings = Setting::values();
        $links = ShortLink::visibleTo($request->user())
            ->when($request->user()->isAdmin(), fn (Builder $query) => $query->with('creator:id,name'))
            ->when($search !== '', fn (Builder $query) => $query->where(function (Builder $query) use ($search): void {
                $query->where('title', 'like', '%'.$search.'%')
                    ->orWhere('slug', 'like', '%'.$search.'%')
                    ->orWhere('destination_url', 'like', '%'.$search.'%');
            }))
            ->orderByDesc('id')->cursorPaginate($perPage)->appends(['search' => $search, 'per_page' => $perPage])
            ->through(fn (ShortLink $link) => $link->forDisplay($settings['short_domain']));

        return Inertia::render('short-links/index', [
            'links' => $links,
            'filters' => ['search' => $search, 'per_page' => $perPage],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('short-links/create', ['settings' => Setting::values()]);
    }

    public function store(StoreShortLinkRequest $request): RedirectResponse
    {
        $settings = Setting::values();
        $this->saveLink(new ShortLink, [
            ...$request->validated(),
            'created_by' => $request->user()->id,
            'redirect_type' => $settings['default_redirect_type'],
        ], $settings['default_slug_length']);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Short link created successfully.']);

        return to_route('links.index');
    }

    public function edit(ShortLink $link): Response
    {
        $settings = Setting::values();

        return Inertia::render('short-links/edit', [
            'link' => $link->load('creator:id,name')->forDisplay($settings['short_domain']),
            'settings' => $settings,
        ]);
    }

    public function update(UpdateShortLinkRequest $request, ShortLink $link): RedirectResponse
    {
        $this->saveLink($link, $request->validated(), Setting::values()['default_slug_length']);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Short link updated successfully.']);

        return to_route('links.index');
    }

    public function status(Request $request, ShortLink $link): RedirectResponse
    {
        $data = $request->validate(['is_active' => ['required', 'boolean']]);
        $link->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => $link->is_active ? 'Short link enabled.' : 'Short link disabled.']);

        return back();
    }

    public function destroy(ShortLink $link): RedirectResponse
    {
        $link->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Short link deleted.']);

        return to_route('links.index');
    }

    public function generateSlug(): JsonResponse
    {
        return response()->json(['slug' => ShortLink::generateSlug(Setting::values()['default_slug_length'])]);
    }

    /** @param array<string, mixed> $data */
    private function saveLink(ShortLink $link, array $data, int $length): void
    {
        if (! empty($data['expires_at'])) {
            $data['expires_at'] = Carbon::parse($data['expires_at'])->setTimezone(config('app.timezone'))->toDateTimeString();
        }

        $generate = empty($data['slug']);

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $data['slug'] = $generate ? ShortLink::generateSlug($length) : $data['slug'];

            $destination = parse_url($data['destination_url']);
            $origin = parse_url(rtrim(config('app.url'), '/').'/'.$data['slug']);
            if (strtolower($destination['host'] ?? '') === strtolower($origin['host'] ?? '')
                && ($destination['port'] ?? null) === ($origin['port'] ?? null)
                && trim(rawurldecode($destination['path'] ?? ''), '/') === trim(rawurldecode($origin['path'] ?? ''), '/')) {
                throw ValidationException::withMessages(['destination_url' => 'A short link cannot redirect to itself.']);
            }

            try {
                $link->fill($data)->save();

                return;
            } catch (UniqueConstraintViolationException) {
                if (! $generate) {
                    break;
                }
            }
        }

        throw ValidationException::withMessages(['slug' => 'This slug is already in use. Please generate another one.']);
    }
}
