<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sacco_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->decimal('registration_fee', 15, 2)->default(0);
            $table->decimal('min_share_capital', 15, 2)->default(0);
            $table->decimal('min_monthly_contribution', 15, 2)->default(0);
            $table->decimal('loan_limit_multiplier', 5, 2)->default(3.00);
            $table->unique('org_id');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sacco_settings');
    }
};
