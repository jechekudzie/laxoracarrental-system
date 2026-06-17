<?php

declare(strict_types=1);

use App\Enums\CommissionType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicle_owners', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone');
            $table->string('email')->nullable();
            $table->string('national_id')->nullable();
            $table->text('address')->nullable();
            $table->text('bank_details')->nullable();
            $table->decimal('agreed_daily_rate', 12, 2)->nullable();
            $table->string('commission_type')->default(CommissionType::Percentage->value);
            $table->decimal('commission_value', 8, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_owners');
    }
};
