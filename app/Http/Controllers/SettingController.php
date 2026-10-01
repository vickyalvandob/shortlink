<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateSettingRequest;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('settings/edit', ['settings' => Setting::values()]);
    }

    public function update(UpdateSettingRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request): void {
            foreach ($request->safe()->only(['app_name', 'default_slug_length', 'default_redirect_type']) as $key => $value) {
                Setting::updateOrCreate(['key' => $key], ['value' => (string) $value]);
            }
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Settings saved successfully.']);

        return to_route('settings.edit');
    }
}
