<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_categories', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('description')->nullable();

            $table->decimal('security_deposit', 12, 2)->default(0);
            $table->unsignedInteger('km_per_day_limit')->default(200);
            $table->decimal('excess_km_rate', 8, 2)->default(0);
            $table->decimal('fuel_charge_per_level', 12, 2)->default(0);
            $table->string('currency', 3)->default('USD');

            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_categories');
    }
};
