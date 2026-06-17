<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            // Personal info
            $table->date('dob')->nullable()->after('id_number');
            $table->string('gender', 20)->nullable()->after('dob');
            $table->string('province', 60)->nullable()->after('address');
            $table->json('languages')->nullable()->after('province');
            $table->string('profile_photo')->nullable()->after('languages');

            // Emergency contact extras
            $table->string('emergency_contact_relationship', 60)->nullable()->after('emergency_contact_phone');

            // Compliance docs (stored URLs from /uploads endpoint)
            $table->string('licence_front')->nullable()->after('licence_expiry');
            $table->string('licence_back')->nullable()->after('licence_front');
            $table->string('defensive_driving_cert')->nullable()->after('licence_back');
            $table->string('police_clearance_cert')->nullable()->after('defensive_driving_cert');

            // Identity docs
            $table->string('national_id_front')->nullable()->after('police_clearance_cert');
            $table->string('national_id_back')->nullable()->after('national_id_front');
            $table->string('selfie_holding_id')->nullable()->after('national_id_back');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn([
                'dob',
                'gender',
                'province',
                'languages',
                'profile_photo',
                'emergency_contact_relationship',
                'licence_front',
                'licence_back',
                'defensive_driving_cert',
                'police_clearance_cert',
                'national_id_front',
                'national_id_back',
                'selfie_holding_id',
            ]);
        });
    }
};
