<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('operational_expenses', function (Blueprint $table) {
            $table->string('provider_invoice_number', 60)->nullable()->after('reference_number');
            $table->date('invoice_date')->nullable()->after('expense_date');
            $table->date('due_date')->nullable()->after('invoice_date');
        });
    }

    public function down(): void
    {
        Schema::table('operational_expenses', function (Blueprint $table) {
            $table->dropColumn(['provider_invoice_number', 'invoice_date', 'due_date']);
        });
    }
};
