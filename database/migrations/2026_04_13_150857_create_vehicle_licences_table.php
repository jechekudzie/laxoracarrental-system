<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicle_licences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_id')->constrained()->cascadeOnDelete();

            $table->string('type');
            $table->string('label')->nullable();
            $table->string('document_number')->nullable();
            $table->string('provider')->nullable();

            $table->date('issue_date')->nullable();
            $table->date('expiry_date');

            $table->decimal('cost', 12, 2)->default(0);
            $table->string('currency', 3)->default('USD');

            $table->decimal('cover_amount', 14, 2)->nullable();
            $table->string('cover_type')->nullable();

            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['vehicle_id', 'type']);
            $table->index('expiry_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_licences');
    }
};
