<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rental_agreements', function (Blueprint $table) {
            $table->id();
            $table->string('agreement_number')->unique();
            $table->foreignId('booking_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('template_id')->nullable()->constrained('agreement_templates')->nullOnDelete();

            // Renter details (snapshot at signing time)
            $table->string('renter_name');
            $table->string('renter_id_number')->nullable();
            $table->text('renter_address')->nullable();
            $table->string('renter_phone')->nullable();
            $table->string('renter_email')->nullable();

            // Vehicle details
            $table->string('vehicle_make_model')->nullable();
            $table->string('vehicle_registration')->nullable();
            $table->string('mileage_out')->nullable();
            $table->string('fuel_level_out')->nullable();
            $table->datetime('rental_start')->nullable();
            $table->datetime('rental_end')->nullable();
            $table->string('collection_location')->nullable();
            $table->string('return_location')->nullable();

            // Fees
            $table->decimal('rental_rate', 12, 2)->nullable();
            $table->integer('rental_days')->nullable();
            $table->decimal('total_amount', 12, 2)->nullable();
            $table->decimal('deposit_amount', 12, 2)->nullable();
            $table->integer('mileage_allowance')->nullable();
            $table->decimal('excess_mileage_fee', 8, 2)->nullable();

            // Legal clauses snapshot (HTML from template at generation time)
            $table->longText('template_content')->nullable();

            // Digital signatures (base64 PNG from canvas)
            $table->text('renter_signature')->nullable();
            $table->string('renter_representative_name')->nullable();
            $table->timestamp('renter_signed_at')->nullable();
            $table->text('company_signature')->nullable();
            $table->string('company_representative_name')->nullable();
            $table->timestamp('company_signed_at')->nullable();

            $table->string('status')->default('draft'); // draft, sent, renter_signed, fully_signed, expired
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('agreement_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_agreements');
    }
};
