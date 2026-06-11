<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loan_collaterals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('loan_id')->constrained('loans')->cascadeOnDelete();
            $table->string('collateral_type', 100);
            $table->text('description')->nullable();
            $table->decimal('estimated_value', 15, 2);
            $table->boolean('is_received')->default(false);
            $table->boolean('is_released')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_collaterals');
    }
};
