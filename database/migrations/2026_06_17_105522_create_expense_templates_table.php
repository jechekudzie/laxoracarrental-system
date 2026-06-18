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
        Schema::create('expense_templates', function (Blueprint $table) {
            $table->id();
            $table->string('category');
            $table->string('description');
            $table->foreignId('default_cost_center_id')->nullable()->constrained('cost_centers')->nullOnDelete();
            $table->foreignId('default_service_provider_id')->nullable()->constrained('service_providers')->nullOnDelete();
            $table->decimal('typical_amount', 15, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expense_templates');
    }
};
