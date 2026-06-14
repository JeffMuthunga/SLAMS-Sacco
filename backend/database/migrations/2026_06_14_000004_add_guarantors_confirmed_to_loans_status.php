<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_loan_status_check');
        DB::statement("ALTER TABLE loans ADD CONSTRAINT loans_loan_status_check CHECK (
            loan_status IN ('draft','applied','guarantors_confirmed','approved','rejected','disbursed','active','repaid','defaulted')
        )");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_loan_status_check');
        DB::statement("ALTER TABLE loans ADD CONSTRAINT loans_loan_status_check CHECK (
            loan_status IN ('draft','applied','approved','rejected','disbursed','active','repaid','defaulted')
        )");
    }
};
