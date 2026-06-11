<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('periods', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('fiscal_year_id')->constrained('fiscal_years')->cascadeOnDelete();
            $table->string('name', 30);
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_opened')->default(false);
            $table->boolean('is_closed')->default(false);
            $table->boolean('is_posted')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('periods');
    }
};
