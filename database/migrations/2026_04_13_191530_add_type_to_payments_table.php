<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('type', 30)->default('rental')->after('customer_id');
            $table->foreignId('parent_payment_id')->nullable()->after('booking_id')->constrained('payments')->nullOnDelete();
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['parent_payment_id']);
            $table->dropColumn(['type', 'parent_payment_id']);
        });
    }
};
