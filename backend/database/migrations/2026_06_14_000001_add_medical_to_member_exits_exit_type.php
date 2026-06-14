<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE member_exits DROP CONSTRAINT IF EXISTS member_exits_exit_type_check");
        DB::statement("ALTER TABLE member_exits ADD CONSTRAINT member_exits_exit_type_check CHECK (exit_type IN ('voluntary', 'death', 'expulsion', 'transfer', 'medical'))");
    }

    public function down(): void
    {
        DB::statement("UPDATE member_exits SET exit_type = 'voluntary' WHERE exit_type = 'medical'");
        DB::statement("ALTER TABLE member_exits DROP CONSTRAINT IF EXISTS member_exits_exit_type_check");
        DB::statement("ALTER TABLE member_exits ADD CONSTRAINT member_exits_exit_type_check CHECK (exit_type IN ('voluntary', 'death', 'expulsion', 'transfer'))");
    }
};
