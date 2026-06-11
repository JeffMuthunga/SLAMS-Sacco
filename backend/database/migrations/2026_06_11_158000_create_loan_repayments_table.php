<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loan_repayments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('loan_id')->constrained('loans')->cascadeOnDelete();
            $table->foreignUuid('period_id')->nullable()->constrained('periods')->nullOnDelete();
            $table->date('due_date');
            $table->date('paid_date')->nullable();
            $table->decimal('principal_due', 15, 2);
            $table->decimal('principal_paid', 15, 2)->default(0);
            $table->decimal('interest_due', 15, 2);
            $table->decimal('interest_paid', 15, 2)->default(0);
            $table->decimal('penalty_due', 15, 2)->default(0);
            $table->decimal('penalty_paid', 15, 2)->default(0);
            $table->decimal('total_due', 15, 2);
            $table->decimal('total_paid', 15, 2)->default(0);
            $table->decimal('balance', 15, 2);
            $table->enum('repayment_status', ['pending', 'partial', 'paid', 'overdue'])->default('pending');
            $table->foreignUuid('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['loan_id', 'due_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_repayments');
    }
};
