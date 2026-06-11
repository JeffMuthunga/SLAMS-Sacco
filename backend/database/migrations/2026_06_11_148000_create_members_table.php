<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('members', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('member_number', 20);
            $table->string('title', 10)->nullable();
            $table->string('full_name', 150);
            $table->string('id_number', 50);
            $table->enum('id_type', ['national', 'passport', 'alien', 'military'])->default('national');
            $table->string('email', 120)->nullable();
            $table->string('phone', 20);
            $table->string('phone2', 20)->nullable();
            $table->date('date_of_birth');
            $table->char('gender', 1)->nullable();
            $table->char('nationality', 3)->default('KEN');
            $table->enum('marital_status', ['single', 'married', 'divorced', 'widowed'])->nullable();
            $table->text('address')->nullable();
            $table->string('town', 100)->nullable();
            $table->string('postal_code', 20)->nullable();
            $table->string('photo_path', 255)->nullable();
            $table->boolean('employed')->default(false);
            $table->boolean('self_employed')->default(false);
            $table->string('employer_name', 120)->nullable();
            $table->decimal('monthly_salary', 15, 2)->nullable();
            $table->decimal('monthly_net_income', 15, 2)->nullable();
            $table->date('entry_date');
            $table->boolean('is_active')->default(true);
            $table->enum('approval_status', ['draft', 'pending', 'approved', 'rejected'])->default('draft');
            $table->foreignUuid('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('terminated_at')->nullable();
            $table->text('termination_reason')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['org_id', 'member_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('members');
    }
};
