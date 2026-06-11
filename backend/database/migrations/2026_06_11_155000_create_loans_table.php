<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('member_id')->constrained('members')->cascadeOnDelete();
            $table->foreignUuid('loan_product_id')->constrained('loan_products')->restrictOnDelete();
            $table->string('account_number', 32)->unique();
            $table->foreignUuid('disburse_account_id')->nullable()->constrained('deposit_accounts')->nullOnDelete();
            $table->decimal('principal_amount', 15, 2);
            $table->decimal('interest_rate', 6, 4);
            $table->integer('repayment_period');
            $table->enum('repayment_frequency', ['daily', 'weekly', 'monthly', 'quarterly', 'annually'])->default('monthly');
            $table->decimal('repayment_amount', 15, 2);
            $table->decimal('total_payable', 15, 2);
            $table->decimal('outstanding_balance', 15, 2);
            $table->date('disbursed_date')->nullable();
            $table->date('maturity_date')->nullable();
            $table->date('expected_maturity_date')->nullable();
            $table->enum('loan_status', [
                'draft', 'applied', 'approved', 'rejected',
                'disbursed', 'active', 'repaid', 'defaulted',
            ])->default('draft');
            $table->enum('approval_status', ['draft', 'pending', 'approved', 'rejected'])->default('draft');
            $table->foreignUuid('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->foreignUuid('disbursed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('applied_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['member_id', 'loan_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loans');
    }
};
