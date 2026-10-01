<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('short_link_clicks', function (Blueprint $table): void {
            $table->index(['short_link_id', 'clicked_at']);
        });
    }

    public function down(): void
    {
        Schema::table('short_link_clicks', function (Blueprint $table): void {
            $table->dropIndex(['short_link_id', 'clicked_at']);
        });
    }
};
