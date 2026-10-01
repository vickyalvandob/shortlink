<?php

namespace App\Models;

use Database\Factories\ShortLinkFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $title
 * @property string $slug
 * @property string $destination_url
 * @property int $redirect_type
 * @property bool $is_active
 * @property Carbon|null $expires_at
 * @property int $total_clicks
 * @property Carbon|null $last_clicked_at
 * @property int|null $created_by
 * @property Carbon|null $created_at
 * @property-read User|null $creator
 */
#[Fillable(['title', 'slug', 'destination_url', 'redirect_type', 'is_active', 'expires_at', 'created_by'])]
class ShortLink extends Model
{
    /** @use HasFactory<ShortLinkFactory> */
    use HasFactory;

    public const RESERVED_SLUGS = [
        'admin', 'loginmasuk', 'logout', 'login', 'register', 'up',
        'settings', 'user', 'storage', 'build', 'api', 'dashboard',
        'forgot-password', 'reset-password', 'sanctum',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'redirect_type' => 'integer',
            'total_clicks' => 'integer',
            'expires_at' => 'datetime',
            'last_clicked_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** @param Builder<ShortLink> $query */
    #[Scope]
    protected function visibleTo(Builder $query, User $user): void
    {
        if (! $user->isAdmin()) {
            $query->where('created_by', $user->id);
        }
    }

    /** @param Builder<ShortLink> $query */
    #[Scope]
    protected function available(Builder $query): void
    {
        $query->where('is_active', true)
            ->where(fn (Builder $query) => $query->whereNull('expires_at')->orWhere('expires_at', '>', now()));
    }

    public function status(): string
    {
        if ($this->expires_at?->isPast() || $this->expires_at?->equalTo(now())) {
            return 'expired';
        }

        return $this->is_active ? 'active' : 'inactive';
    }

    public static function generateSlug(int $length): string
    {
        do {
            $slug = Str::random($length);
        } while (in_array(strtolower($slug), self::RESERVED_SLUGS, true) || static::where('slug', $slug)->exists());

        return $slug;
    }

    /** @return array<string, mixed> */
    public function forDisplay(string $domain): array
    {
        return [
            ...$this->toArray(),
            'status' => $this->status(),
            'short_url' => rtrim($domain, '/').'/'.$this->slug,
        ];
    }
}
