<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_kins', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('member_id')->constrained('members')->cascadeOnDelete();
            $table->string('full_name', 150);
            $table->enum('relationship', ['spouse', 'child', 'parent', 'sibling', 'other']);
            $table->date('date_of_birth')->nullable();
            $table->string('id_number', 50)->nullable();
            $table->string('id_type', 20)->nullable();
            $table->string('phone', 20)->nullable();
            $table->boolean('is_emergency_contact')->default(false);
            $table->boolean('is_beneficiary')->default(false);
            $table->decimal('beneficiary_percent', 5, 2)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_kins');
    }
};
