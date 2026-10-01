<?php

namespace App\Models;

use Database\Factories\ShortLinkClickFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $short_link_id
 * @property string|null $referrer
 * @property string|null $user_agent
 * @property Carbon $clicked_at
 * @property-read ShortLink $shortLink
 */
#[Fillable(['short_link_id', 'referrer', 'user_agent', 'clicked_at'])]
class ShortLinkClick extends Model
{
    /** @use HasFactory<ShortLinkClickFactory> */
    use HasFactory;

    public $timestamps = false;

    /** @param Builder<ShortLinkClick> $query */
    #[Scope]
    protected function visibleTo(Builder $query, User $user): void
    {
        if (! $user->isAdmin()) {
            $query->whereIn('short_link_id', ShortLink::visibleTo($user)->select('id'));
        }
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['clicked_at' => 'datetime'];
    }

    /** @return BelongsTo<ShortLink, $this> */
    public function shortLink(): BelongsTo
    {
        return $this->belongsTo(ShortLink::class);
    }
}
