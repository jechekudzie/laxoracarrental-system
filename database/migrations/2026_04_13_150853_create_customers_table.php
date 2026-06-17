<?php

declare(strict_types=1);

use App\Enums\CustomerStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->unique()->constrained()->nullOnDelete();

            $table->string('name');
            $table->string('id_number')->nullable();
            $table->string('phone');
            $table->string('email')->nullable();
            $table->text('address')->nullable();

            $table->string('licence_number')->nullable();
            $table->string('licence_class')->nullable();
            $table->date('licence_expiry')->nullable();

            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone')->nullable();

            $table->decimal('wallet_balance', 12, 2)->default(0);
            $table->string('wallet_currency', 3)->default('USD');

            $table->string('status')->default(CustomerStatus::Active->value);
            $table->text('blacklist_reason')->nullable();
            $table->decimal('average_rating', 4, 2)->nullable();
            $table->unsignedInteger('ratings_count')->default(0);
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('phone');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
