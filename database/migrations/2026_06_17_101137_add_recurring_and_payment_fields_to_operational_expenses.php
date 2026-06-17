<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('operational_expenses', function (Blueprint $table) {
            $table->boolean('is_recurring')->default(false)->after('notes');
            $table->string('recurrence_period')->nullable()->after('is_recurring'); // daily, weekly, monthly, quarterly, annually
            $table->date('next_due_date')->nullable()->after('recurrence_period');
            $table->date('recurrence_end_date')->nullable()->after('next_due_date');
            $table->date('paid_at')->nullable()->after('recurrence_end_date');
        });
    }

    public function down(): void
    {
        Schema::table('operational_expenses', function (Blueprint $table) {
            $table->dropColumn(['is_recurring', 'recurrence_period', 'next_due_date', 'recurrence_end_date', 'paid_at']);
        });
    }
};
