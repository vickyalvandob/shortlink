<?php

use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\RedirectShortLinkController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\ShortLinkController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => abort(403))->name('home');

Route::middleware(['auth', 'active', 'auth.session'])->group(function () {
    Route::get('admin', DashboardController::class)->name('dashboard');
    Route::prefix('admin')->group(function (): void {
        Route::get('analytics', AnalyticsController::class)->name('analytics.index');
        Route::get('links/generate-slug', [ShortLinkController::class, 'generateSlug'])->name('links.generate-slug');
        Route::patch('links/{link}/status', [ShortLinkController::class, 'status'])->name('links.status')->can('manage-short-link', 'link');
        Route::resource('links', ShortLinkController::class)->except('show')
            ->middlewareFor(['edit', 'update', 'destroy'], 'can:manage-short-link,link');
        Route::middleware('admin')->group(function (): void {
            Route::patch('users/{user}/status', [UserController::class, 'status'])->name('users.status');
            Route::resource('users', UserController::class)->except('show');
            Route::get('settings', [SettingController::class, 'edit'])->name('settings.edit');
            Route::put('settings', [SettingController::class, 'update'])->name('settings.update');
        });
    });
});

Route::get('/{slug}', RedirectShortLinkController::class)
    ->where('slug', '[A-Za-z0-9_-]+')
    ->withoutMiddleware('web')
    ->name('short-link.redirect');
