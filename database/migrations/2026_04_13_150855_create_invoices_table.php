<?php

declare(strict_types=1);

use App\Enums\InvoiceStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('number')->unique();

            $table->foreignId('booking_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('customer_id')->constrained()->restrictOnDelete();

            $table->date('issued_at');
            $table->date('due_at')->nullable();

            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('mileage_overage', 12, 2)->default(0);
            $table->decimal('fuel_charge', 12, 2)->default(0);
            $table->decimal('extras', 12, 2)->default(0);
            $table->decimal('damage_charge', 12, 2)->default(0);
            $table->decimal('tax', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->string('currency', 3)->default('USD');

            $table->json('line_items')->nullable();

            $table->string('status')->default(InvoiceStatus::Draft->value);
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('issued_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
