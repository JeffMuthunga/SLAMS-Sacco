<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commodity_request_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('commodity_request_id')->constrained('commodity_requests')->cascadeOnDelete();
            $table->foreignUuid('commodity_id')->constrained('commodities')->cascadeOnDelete();
            $table->integer('quantity');
            $table->decimal('unit_price', 15, 2); // snapshot at request time
            $table->decimal('subtotal', 15, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commodity_request_items');
    }
};
