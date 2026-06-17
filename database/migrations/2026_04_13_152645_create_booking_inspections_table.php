<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_inspections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->foreignId('inspector_user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->string('type'); // pickup | return
            $table->unsignedBigInteger('odometer')->nullable();
            $table->string('fuel_level')->nullable(); // e.g. empty/quarter/half/three-quarter/full
            $table->json('items')->nullable();        // checklist items with conditions + notes
            $table->json('photos')->nullable();       // optional photo references

            $table->text('exterior_notes')->nullable();
            $table->text('interior_notes')->nullable();
            $table->text('damage_summary')->nullable();

            $table->boolean('signed_by_customer')->default(false);
            $table->string('customer_signature_name')->nullable();
            $table->dateTime('signed_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['booking_id', 'type']);
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_inspections');
    }
};
