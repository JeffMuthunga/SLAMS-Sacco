<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('account_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('deposit_account_id')->constrained('deposit_accounts')->cascadeOnDelete();
            $table->foreignUuid('period_id')->nullable()->constrained('periods')->nullOnDelete();
            $table->enum('transaction_type', [
                'deposit', 'withdrawal', 'interest_credit', 'fee',
                'transfer_in', 'transfer_out',
                'loan_disbursement', 'loan_repayment', 'contribution',
            ]);
            $table->decimal('amount', 15, 2);
            $table->decimal('balance_after', 15, 2);
            $table->string('reference_number', 50)->nullable();
            $table->date('transaction_date');
            $table->date('value_date');
            $table->string('narration', 255)->nullable();
            $table->foreignUuid('created_by')->constrained('users')->restrictOnDelete();
            $table->uuid('linked_transaction_id')->nullable();
            $table->enum('approval_status', ['draft', 'pending', 'approved', 'rejected'])->default('approved');
            $table->foreignUuid('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['deposit_account_id', 'transaction_date']);
        });

        // Self-referential FK added after table creation so PostgreSQL can resolve the PK
        Schema::table('account_transactions', function (Blueprint $table) {
            $table->foreign('linked_transaction_id')
                ->references('id')->on('account_transactions')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_transactions');
    }
};
