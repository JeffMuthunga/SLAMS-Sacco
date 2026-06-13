<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('member_exits', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('org_id')->index();
            $table->uuid('member_id')->index();
            $table->string('reference_number', 50)->unique();
            $table->enum('exit_type', ['voluntary', 'death', 'expulsion', 'transfer']);
            $table->text('reason')->nullable();
            $table->date('exit_date');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending')->index();
            $table->uuid('requested_by');
            $table->timestamp('requested_at')->nullable();
            $table->uuid('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->uuid('rejected_by')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('org_id')->references('id')->on('orgs');
            $table->foreign('member_id')->references('id')->on('members');
            $table->foreign('requested_by')->references('id')->on('users');
            $table->foreign('approved_by')->references('id')->on('users');
            $table->foreign('rejected_by')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_exits');
    }
};
