<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('short_links', function (Blueprint $table): void {
            $table->id();
            $table->string('title');
            $slug = $table->string('slug', 100)->unique();
            if (Schema::getConnection()->getDriverName() === 'mysql') {
                $slug->collation('utf8mb4_bin');
            }
            $table->text('destination_url');
            $table->unsignedSmallInteger('redirect_type')->default(302);
            $table->boolean('is_active')->default(true)->index();
            $table->timestamp('expires_at')->nullable();
            $table->unsignedBigInteger('total_clicks')->default(0);
            $table->timestamp('last_clicked_at')->nullable();
            $table->foreignId('created_by')->index()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('short_links');
    }
};
