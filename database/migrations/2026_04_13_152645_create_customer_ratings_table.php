<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('booking_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('rated_by_user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->unsignedTinyInteger('score_condition');      // vehicle condition on return (1-5)
            $table->unsignedTinyInteger('score_timeliness');     // returned on time (1-5)
            $table->unsignedTinyInteger('score_payment');        // payment reliability (1-5)
            $table->unsignedTinyInteger('score_communication');  // communication (1-5)
            $table->unsignedTinyInteger('score_care');           // driving care (1-5)
            $table->decimal('average', 4, 2);                    // auto-computed average of the 5

            $table->text('comment')->nullable();

            $table->timestamps();

            $table->index('customer_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_ratings');
    }
};
