<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_declarations', function (Blueprint $table) {
            $table->id();
            $table->string('declaration_number')->unique();
            $table->foreignId('declared_by')->constrained('users')->cascadeOnDelete();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('USD');
            $table->string('source'); // customer_payment, deposit, petty_cash, other
            $table->string('reference')->nullable();
            $table->foreignId('booking_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->text('description');
            $table->text('signature')->nullable(); // base64 PNG from canvas
            $table->timestamp('declared_at');
            $table->timestamps();
            $table->softDeletes();

            $table->index('declared_at');
            $table->index('source');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_declarations');
    }
};
