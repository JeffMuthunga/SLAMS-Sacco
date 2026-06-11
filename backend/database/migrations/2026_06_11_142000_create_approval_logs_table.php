<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approval_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->string('approvable_type', 50);
            $table->uuid('approvable_id');
            $table->enum('action', ['submitted', 'approved', 'rejected', 'flagged']);
            $table->string('from_status', 20);
            $table->string('to_status', 20);
            $table->foreignId('performed_by')->constrained('users')->cascadeOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['approvable_type', 'approvable_id']);
        });
        // No softDeletes — audit log is immutable
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_logs');
    }
};
