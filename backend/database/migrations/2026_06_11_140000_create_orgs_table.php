<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orgs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 100);
            $table->string('full_name', 200)->nullable();
            $table->string('suffix', 10)->nullable();
            $table->string('email', 120)->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('website', 120)->nullable();
            $table->string('logo_path', 255)->nullable();
            $table->text('address')->nullable();
            $table->string('town', 100)->nullable();
            $table->char('country_code', 3)->default('KEN');
            $table->char('currency_code', 3)->default('KES');
            $table->string('pin', 50)->nullable();
            $table->string('reg_number', 50)->nullable();
            $table->integer('member_limit')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orgs');
    }
};
