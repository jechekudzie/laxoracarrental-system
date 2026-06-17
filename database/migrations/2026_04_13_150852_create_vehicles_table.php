<?php

declare(strict_types=1);

use App\Enums\VehicleOwnershipType;
use App\Enums\VehicleStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->string('make');
            $table->string('model');
            $table->unsignedSmallInteger('year');
            $table->string('colour')->nullable();
            $table->string('reg_plate')->unique();
            $table->string('vin')->nullable()->unique();
            $table->string('category');
            $table->string('fuel_type');
            $table->string('transmission');
            $table->unsignedTinyInteger('seats')->default(5);

            $table->string('ownership_type')->default(VehicleOwnershipType::Owned->value);
            $table->foreignId('vehicle_owner_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('owner_agreed_rate', 12, 2)->nullable();
            $table->decimal('owner_markup_percent', 8, 2)->nullable();

            $table->decimal('daily_rate', 12, 2);
            $table->decimal('weekly_rate', 12, 2)->nullable();
            $table->decimal('monthly_rate', 12, 2)->nullable();
            $table->string('currency', 3)->default('USD');

            $table->unsignedInteger('km_per_day_limit')->default(200);
            $table->decimal('excess_km_rate', 8, 2)->default(0.35);

            $table->string('status')->default(VehicleStatus::Available->value);
            $table->unsignedBigInteger('current_odometer')->default(0);

            $table->unsignedInteger('service_interval_km')->nullable();
            $table->unsignedInteger('service_interval_months')->nullable();
            $table->unsignedBigInteger('last_service_odometer')->nullable();
            $table->date('last_service_date')->nullable();

            $table->json('photos')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('ownership_type');
            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
