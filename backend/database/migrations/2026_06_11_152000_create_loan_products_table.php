<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loan_products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->string('name', 120);
            $table->text('description')->nullable();
            $table->decimal('interest_rate', 6, 4);
            $table->enum('interest_method', ['flat', 'reducing_balance'])->default('reducing_balance');
            $table->enum('repayment_frequency', ['daily', 'weekly', 'monthly', 'quarterly', 'annually'])->default('monthly');
            $table->decimal('min_amount', 15, 2);
            $table->decimal('max_amount', 15, 2);
            $table->integer('min_period_months');
            $table->integer('max_period_months');
            $table->integer('max_repayments')->nullable();
            $table->boolean('requires_guarantor')->default(true);
            $table->boolean('requires_collateral')->default(false);
            $table->integer('min_membership_months')->default(0);
            $table->decimal('processing_fee_amount', 15, 2)->default(0);
            $table->decimal('processing_fee_percent', 5, 2)->default(0);
            $table->decimal('penalty_rate', 6, 4)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_products');
    }
};
