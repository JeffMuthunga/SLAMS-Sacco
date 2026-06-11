<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chart_of_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('account_type_id')->constrained('account_types')->restrictOnDelete();
            $table->uuid('parent_id')->nullable();
            $table->string('code', 20);
            $table->string('name', 150);
            $table->boolean('is_header')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['org_id', 'code']);
        });

        // Add self-referential FK in a separate statement so PostgreSQL can
        // resolve the primary key constraint on the now-existing table.
        Schema::table('chart_of_accounts', function (Blueprint $table) {
            $table->foreign('parent_id')->references('id')->on('chart_of_accounts')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chart_of_accounts');
    }
};
