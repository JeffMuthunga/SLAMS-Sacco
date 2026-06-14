<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('share_products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('share_capital_account_id')->nullable()->constrained('chart_of_accounts')->nullOnDelete();
            $table->string('name', 120);
            $table->decimal('price_per_share', 15, 2);
            $table->integer('min_shares')->default(1);
            $table->integer('max_shares')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('share_products');
    }
};
