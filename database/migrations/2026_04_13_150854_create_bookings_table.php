<?php

declare(strict_types=1);

use App\Enums\BookingStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();

            $table->foreignId('customer_id')->constrained()->restrictOnDelete();
            $table->foreignId('vehicle_id')->constrained()->restrictOnDelete();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->dateTime('pickup_datetime');
            $table->dateTime('return_datetime');
            $table->dateTime('actual_pickup_at')->nullable();
            $table->dateTime('actual_return_at')->nullable();

            $table->unsignedBigInteger('odometer_start')->nullable();
            $table->unsignedBigInteger('odometer_end')->nullable();

            $table->unsignedInteger('rental_days');
            $table->unsignedInteger('km_allowance');

            $table->decimal('daily_rate', 12, 2);
            $table->decimal('excess_km_rate', 8, 2);
            $table->string('currency', 3)->default('USD');

            $table->decimal('base_amount', 12, 2)->default(0);
            $table->decimal('mileage_overage_amount', 12, 2)->default(0);
            $table->decimal('extras_amount', 12, 2)->default(0);
            $table->decimal('fuel_charge', 12, 2)->default(0);
            $table->decimal('damage_charge', 12, 2)->default(0);
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->decimal('deposit_amount', 12, 2)->default(0);
            $table->decimal('paid_amount', 12, 2)->default(0);

            $table->json('extras')->nullable();

            $table->string('pickup_location')->nullable();
            $table->string('return_location')->nullable();
            $table->string('fuel_level_pickup')->nullable();
            $table->string('fuel_level_return')->nullable();
            $table->boolean('cross_border')->default(false);
            $table->json('cross_border_countries')->nullable();

            $table->string('status')->default(BookingStatus::Pending->value);
            $table->text('cancellation_reason')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['vehicle_id', 'status']);
            $table->index(['customer_id', 'status']);
            $table->index(['pickup_datetime', 'return_datetime']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
