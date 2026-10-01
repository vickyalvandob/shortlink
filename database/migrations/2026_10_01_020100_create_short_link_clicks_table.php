<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('short_link_clicks', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('short_link_id')->index()->constrained()->cascadeOnDelete();
            $table->text('referrer')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('clicked_at')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('short_link_clicks');
    }
};
