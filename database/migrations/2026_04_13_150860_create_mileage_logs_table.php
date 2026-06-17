<?php

declare(strict_types=1);

use App\Enums\MileageSource;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mileage_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_id')->constrained()->cascadeOnDelete();
            $table->foreignId('booking_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('recorded_by_user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->unsignedBigInteger('odometer_reading');
            $table->string('source')->default(MileageSource::Manual->value);
            $table->dateTime('recorded_at');
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index(['vehicle_id', 'recorded_at']);
            $table->index(['booking_id', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mileage_logs');
    }
};
