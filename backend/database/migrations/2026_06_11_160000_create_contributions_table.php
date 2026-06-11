<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contributions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('member_id')->constrained('members')->cascadeOnDelete();
            $table->foreignUuid('deposit_account_id')->constrained('deposit_accounts')->cascadeOnDelete();
            $table->foreignUuid('period_id')->constrained('periods')->restrictOnDelete();
            $table->decimal('expected_amount', 15, 2);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->date('due_date');
            $table->date('paid_date')->nullable();
            $table->enum('status', ['pending', 'partial', 'paid', 'waived'])->default('pending');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['member_id', 'period_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contributions');
    }
};
