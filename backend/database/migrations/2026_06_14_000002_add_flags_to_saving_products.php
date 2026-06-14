<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('saving_products', function (Blueprint $table) {
            $table->boolean('is_mandatory')->default(false)->after('is_active');
            $table->boolean('block_withdrawal_on_active_loan')->default(false)->after('is_mandatory');
        });
    }

    public function down(): void
    {
        Schema::table('saving_products', function (Blueprint $table) {
            $table->dropColumn(['is_mandatory', 'block_withdrawal_on_active_loan']);
        });
    }
};
