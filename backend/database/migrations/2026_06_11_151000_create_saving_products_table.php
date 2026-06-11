<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saving_products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->string('name', 120);
            $table->text('description')->nullable();
            $table->decimal('interest_rate', 6, 4)->default(0);
            $table->decimal('min_opening_balance', 15, 2)->default(0);
            $table->decimal('min_balance', 15, 2)->default(0);
            $table->decimal('max_balance', 15, 2)->nullable();
            $table->decimal('min_deposit', 15, 2)->default(0);
            $table->decimal('max_deposit', 15, 2)->nullable();
            $table->decimal('min_withdrawal', 15, 2)->default(0);
            $table->decimal('max_withdrawal', 15, 2)->nullable();
            $table->integer('lock_in_months')->default(0);
            $table->enum('withdrawal_frequency', ['any', 'daily', 'weekly', 'monthly'])->default('any');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saving_products');
    }
};
