<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deposit_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('member_id')->constrained('members')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('saving_products')->restrictOnDelete();
            $table->string('account_number', 32)->unique();
            $table->decimal('balance', 15, 2)->default(0);
            $table->decimal('interest_rate', 6, 4)->default(0);
            $table->date('opening_date');
            $table->date('last_activity_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_locked')->default(false);
            $table->date('locked_until_date')->nullable();
            $table->enum('approval_status', ['draft', 'pending', 'approved', 'rejected'])->default('draft');
            $table->foreignUuid('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deposit_accounts');
    }
};
