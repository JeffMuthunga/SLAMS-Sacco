<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('journal_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('journal_id')->constrained('journals')->cascadeOnDelete();
            $table->foreignUuid('account_id')->constrained('chart_of_accounts')->restrictOnDelete();
            $table->decimal('debit', 15, 2)->default(0);
            $table->decimal('credit', 15, 2)->default(0);
            $table->string('narration', 255)->nullable();
            $table->timestamps();
            // No softDeletes — ledger entries are immutable
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('journal_lines');
    }
};
