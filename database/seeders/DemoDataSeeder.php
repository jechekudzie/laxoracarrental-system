<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\BookingStatus;
use App\Enums\Currency;
use App\Enums\CustomerStatus;
use App\Enums\InvoiceStatus;
use App\Enums\LicenceType;
use App\Enums\MaintenanceType;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\ServiceProviderCategory;
use App\Enums\UserRole;
use App\Enums\VehicleOwnershipType;
use App\Models\Booking;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\MaintenanceRecord;
use App\Models\Payment;
use App\Models\ServiceProvider;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\VehicleLicence;
use App\Models\VehicleOwner;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedServiceProviders();
        $this->seedVehicleOwnersAndOutsourced();
        $this->seedCustomers();
        $this->seedMobileDemoCustomer();
        $this->seedLicences();
        $this->seedMaintenanceRecords();
        $this->seedBookingsAndInvoices();
    }

    /**
     * A customer account with credentials the mobile team can log in with to
     * exercise the self-booking flow end-to-end.
     */
    private function seedMobileDemoCustomer(): void
    {
        $user = User::updateOrCreate(
            ['email' => 'alice@demo.test'],
            [
                'name' => 'Alice Moyo',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        $user->syncRoles(UserRole::Customer->value);

        Customer::updateOrCreate(
            ['phone' => '+263 77 100 2000'],
            [
                'user_id' => $user->id,
                'name' => 'Alice Moyo',
                'id_number' => '63-2000000-A-07',
                'email' => 'alice@demo.test',
                'address' => '12 Samora Machel Ave, Harare',
                'licence_number' => 'DL2024001',
                'licence_class' => 'Class 4',
                'licence_expiry' => now()->addYears(3)->toDateString(),
                'wallet_balance' => 0,
                'wallet_currency' => Currency::USD,
                'status' => CustomerStatus::Active,
            ],
        );
    }

    private function seedServiceProviders(): void
    {
        $providers = [
            ['Kudzai Auto Works', ServiceProviderCategory::Mechanic, '+263 77 111 2233', 'Tendai Moyo', 'Brakes, suspension, diagnostics, full service', 4.6],
            ['Harare Towing 24/7', ServiceProviderCategory::Tow, '+263 77 234 5566', 'Farai Ncube', 'Breakdown recovery, accident tow, flat-bed', 4.2],
            ['Borrowdale Car Wash', ServiceProviderCategory::CarWash, '+263 77 345 6677', 'Ruvimbo Sithole', 'Full valet, engine clean, upholstery', 4.8],
            ['Avondale Tyres', ServiceProviderCategory::Tyres, '+263 24 277 8899', 'Blessing Chikore', 'Fitting, balancing, alignment', 4.5],
            ['Old Mutual Zimbabwe', ServiceProviderCategory::Insurance, '+263 24 275 9900', 'Nyasha Dube', 'Comprehensive fleet insurance, claims handling', 4.1],
            ['Nicoz Diamond Insurance', ServiceProviderCategory::Insurance, '+263 24 277 2200', 'Tafadzwa Mukamuri', 'Motor, third-party, fleet', 4.3],
            ['Toyota Zimbabwe Service', ServiceProviderCategory::Mechanic, '+263 24 275 1000', 'Shamiso Chari', 'Toyota authorised service centre', 4.7],
            ['Msasa Panelbeaters', ServiceProviderCategory::Panelbeater, '+263 77 556 7788', 'Peter Mujuru', 'Accident repair, spray painting, dent removal', 4.4],
            ['AutoMart Parts', ServiceProviderCategory::Parts, '+263 24 277 4433', 'Grace Mawere', 'OEM parts, filters, brake pads, batteries', 4.0],
        ];

        foreach ($providers as [$name, $category, $phone, $contact, $services, $rating]) {
            ServiceProvider::firstOrCreate(
                ['name' => $name],
                [
                    'category' => $category,
                    'phone' => $phone,
                    'email' => Str::slug($name).'@example.co.zw',
                    'contact_person' => $contact,
                    'services_offered' => $services,
                    'rating' => $rating,
                    'is_active' => true,
                ]
            );
        }
    }

    private function seedVehicleOwnersAndOutsourced(): void
    {
        $owners = [
            ['Patrick Zimondi', '+263 77 900 1122', 'patrick.zimondi@example.co.zw', 'CABS Borrowdale 1000201123'],
            ['Grace Chikomba', '+263 77 911 4455', 'grace.chikomba@example.co.zw', 'CBZ Samora 1000445566'],
            ['Tawanda Marufu', '+263 77 922 6677', 'tawanda.marufu@example.co.zw', 'Stanbic Nelson Mandela 9000778899'],
        ];

        $createdOwners = [];
        foreach ($owners as [$name, $phone, $email, $bank]) {
            $createdOwners[] = VehicleOwner::firstOrCreate(
                ['name' => $name],
                ['phone' => $phone, 'email' => $email, 'bank_details' => $bank, 'agreed_daily_rate' => fake()->randomFloat(2, 50, 120)]
            );
        }

        // Turn a few existing vehicles into outsourced ones
        $vehiclesToOutsource = Vehicle::where('ownership_type', VehicleOwnershipType::Owned)
            ->inRandomOrder()
            ->limit(4)
            ->get();

        foreach ($vehiclesToOutsource as $i => $vehicle) {
            $owner = $createdOwners[$i % count($createdOwners)];
            $agreedRate = round($vehicle->daily_rate * 0.7, 2);
            $vehicle->update([
                'ownership_type' => VehicleOwnershipType::Outsourced,
                'vehicle_owner_id' => $owner->id,
                'owner_agreed_rate' => $agreedRate,
                'owner_markup_percent' => round((($vehicle->daily_rate - $agreedRate) / $agreedRate) * 100, 1),
            ]);
        }
    }

    private function seedCustomers(): void
    {
        if (Customer::count() >= 20) {
            return;
        }

        $samples = [
            ['Tinashe Marozva', '+263 77 111 0001', 'tinashe.marozva@example.co.zw'],
            ['Rumbidzai Sibanda', '+263 77 222 0002', 'rumbi.sibanda@example.co.zw'],
            ['Farai Chigwedere', '+263 77 333 0003', 'farai.c@example.co.zw'],
            ['Nyasha Mhlanga', '+263 77 444 0004', 'nyasha.mhlanga@example.co.zw'],
            ['Blessing Kanjedza', '+263 77 555 0005', 'blessing.k@example.co.zw'],
            ['Precious Nhongo', '+263 77 666 0006', 'precious.nhongo@example.co.zw'],
            ['Takudzwa Magaya', '+263 77 777 0007', 'takudzwa.m@example.co.zw'],
            ['Simbarashe Moyo', '+263 77 888 0008', 'simba.moyo@example.co.zw'],
            ['Chipo Dube', '+263 77 999 0009', 'chipo.dube@example.co.zw'],
            ['Tatenda Zvoutete', '+263 77 100 0010', 'tatenda.z@example.co.zw'],
            ['Michael Johnson', '+263 77 100 0011', 'michael.j@example.com'],
            ['Sarah Williams', '+263 77 100 0012', 'sarah.w@example.com'],
        ];

        foreach ($samples as [$name, $phone, $email]) {
            Customer::firstOrCreate(
                ['phone' => $phone],
                [
                    'name' => $name,
                    'id_number' => fake()->numerify('63-#######-?-##'),
                    'email' => $email,
                    'address' => fake()->streetAddress().', Harare',
                    'licence_number' => strtoupper(fake()->bothify('?#######')),
                    'licence_class' => fake()->randomElement(['Class 4', 'Class 2']),
                    'licence_expiry' => now()->addMonths(fake()->numberBetween(6, 60))->toDateString(),
                    'emergency_contact_name' => fake()->name(),
                    'emergency_contact_phone' => '+2637'.fake()->numerify('########'),
                    'wallet_balance' => 0,
                    'wallet_currency' => Currency::USD,
                    'status' => CustomerStatus::Active,
                ]
            );
        }

        // One greylisted, one blacklisted
        Customer::firstOrCreate(
            ['phone' => '+263 77 100 9998'],
            [
                'name' => 'Kenneth Greyson',
                'id_number' => '63-9999999-K-42',
                'email' => 'kenneth.greyson@example.co.zw',
                'licence_number' => 'K1234567',
                'licence_class' => 'Class 4',
                'licence_expiry' => now()->addYear()->toDateString(),
                'wallet_currency' => Currency::USD,
                'status' => CustomerStatus::Greylisted,
                'notes' => 'Late return on last booking',
            ]
        );

        Customer::firstOrCreate(
            ['phone' => '+263 77 100 9999'],
            [
                'name' => 'Brian Blacklist',
                'id_number' => '63-0000000-B-11',
                'licence_number' => 'B1000001',
                'licence_class' => 'Class 4',
                'licence_expiry' => now()->addMonths(6)->toDateString(),
                'wallet_currency' => Currency::USD,
                'status' => CustomerStatus::Blacklisted,
                'blacklist_reason' => 'Non-payment and vehicle damage',
            ]
        );
    }

    private function seedLicences(): void
    {
        $providers = [
            LicenceType::Zinara->value => ['ZINARA'],
            LicenceType::ZBC->value => ['ZBC'],
            LicenceType::Fitness->value => ['VID Harare', 'VID Msasa', 'VID Southerton'],
            LicenceType::Insurance->value => ['Old Mutual Zimbabwe', 'Nicoz Diamond', 'Zimnat Lion', 'Cell Insurance'],
            LicenceType::Registration->value => ['CVR'],
        ];

        Vehicle::all()->each(function (Vehicle $vehicle) use ($providers): void {
            foreach ([LicenceType::Zinara, LicenceType::ZBC, LicenceType::Fitness, LicenceType::Insurance, LicenceType::Registration] as $type) {
                $exists = VehicleLicence::where('vehicle_id', $vehicle->id)->where('type', $type)->exists();
                if ($exists) {
                    continue;
                }

                // Mix of valid, expiring, expired
                $daysOffset = fake()->randomElement([180, 90, 45, 20, 10, -5, -30, 240]);
                $isInsurance = $type === LicenceType::Insurance;

                VehicleLicence::create([
                    'vehicle_id' => $vehicle->id,
                    'type' => $type,
                    'label' => match ($type) {
                        LicenceType::Zinara => 'ZINARA Licence',
                        LicenceType::ZBC => 'ZBC Radio Licence',
                        LicenceType::Fitness => 'Vehicle Fitness',
                        LicenceType::Insurance => 'Motor Insurance',
                        LicenceType::Registration => 'Vehicle Registration',
                        default => null,
                    },
                    'document_number' => strtoupper(fake()->bothify(match ($type) {
                        LicenceType::Zinara => 'ZIN-######',
                        LicenceType::ZBC => 'ZBC-######',
                        LicenceType::Fitness => 'VIF-######',
                        LicenceType::Insurance => 'POL-########',
                        LicenceType::Registration => 'REG-######',
                        default => '########',
                    })),
                    'provider' => fake()->randomElement($providers[$type->value] ?? ['Unknown']),
                    'issue_date' => now()->subMonths(fake()->numberBetween(1, 11))->toDateString(),
                    'expiry_date' => now()->addDays($daysOffset)->toDateString(),
                    'cost' => $isInsurance
                        ? fake()->randomFloat(2, 400, 1200)
                        : fake()->randomFloat(2, 30, 200),
                    'currency' => Currency::USD,
                    'cover_amount' => $isInsurance ? fake()->randomFloat(2, 10_000, 50_000) : null,
                    'cover_type' => $isInsurance ? fake()->randomElement(['comprehensive', 'third_party', 'third_party_fire_theft']) : null,
                ]);
            }
        });
    }

    private function seedMaintenanceRecords(): void
    {
        if (MaintenanceRecord::count() >= 10) {
            return;
        }

        $services = [
            ['Oil Change', 'Engine oil and filter replacement', 80, 120],
            ['Brake Pads', 'Front brake pads replacement', 60, 180],
            ['Full Service', '10,000 km major service', 220, 450],
            ['Tyres', 'Four new tyres fitted and balanced', 40, 600],
            ['Battery', 'New battery installed', 20, 150],
            ['Timing Belt', 'Timing belt and water pump replacement', 300, 480],
        ];

        Vehicle::inRandomOrder()->limit(8)->get()->each(function (Vehicle $vehicle) use ($services): void {
            $serviceCount = fake()->numberBetween(1, 3);
            for ($i = 0; $i < $serviceCount; $i++) {
                [$type, $description, $labour, $parts] = fake()->randomElement($services);
                $startedAt = Carbon::now()->subDays(fake()->numberBetween(5, 300));

                MaintenanceRecord::create([
                    'vehicle_id' => $vehicle->id,
                    'type' => MaintenanceType::Scheduled,
                    'service_type' => $type,
                    'description' => $description,
                    'odometer' => max(0, ($vehicle->current_odometer ?? 50000) - fake()->numberBetween(0, 15000)),
                    'service_provider' => fake()->randomElement(['Kudzai Auto Works', 'Toyota Zimbabwe Service', 'Avondale Tyres']),
                    'labour_cost' => $labour,
                    'parts_cost' => $parts,
                    'tow_cost' => 0,
                    'total_cost' => $labour + $parts,
                    'currency' => Currency::USD,
                    'downtime_days' => fake()->numberBetween(0, 2),
                    'customer_liable' => false,
                    'started_at' => $startedAt,
                    'completed_at' => $startedAt->copy()->addDays(fake()->numberBetween(0, 2)),
                ]);
            }

            // One breakdown record occasionally
            if (fake()->boolean(30)) {
                $at = Carbon::now()->subDays(fake()->numberBetween(30, 200));
                MaintenanceRecord::create([
                    'vehicle_id' => $vehicle->id,
                    'type' => MaintenanceType::Breakdown,
                    'service_type' => 'Roadside Breakdown',
                    'description' => 'Engine overheating along Harare-Bulawayo road, recovered by tow.',
                    'odometer' => $vehicle->current_odometer,
                    'service_provider' => 'Harare Towing 24/7',
                    'labour_cost' => 180,
                    'parts_cost' => 240,
                    'tow_cost' => 150,
                    'total_cost' => 570,
                    'currency' => Currency::USD,
                    'downtime_days' => 3,
                    'customer_liable' => false,
                    'started_at' => $at,
                    'completed_at' => $at->copy()->addDays(3),
                ]);
            }
        });
    }

    private function seedBookingsAndInvoices(): void
    {
        if (Booking::count() >= 10) {
            return;
        }

        $customers = Customer::where('status', CustomerStatus::Active)->get();
        $vehicles = Vehicle::all();

        if ($customers->isEmpty() || $vehicles->isEmpty()) {
            return;
        }

        // 15 bookings across different statuses
        $statuses = [
            BookingStatus::Completed, BookingStatus::Completed, BookingStatus::Completed, BookingStatus::Completed,
            BookingStatus::Active, BookingStatus::Active,
            BookingStatus::Confirmed, BookingStatus::Confirmed, BookingStatus::Confirmed,
            BookingStatus::Pending, BookingStatus::Pending,
            BookingStatus::Cancelled,
        ];

        foreach ($statuses as $index => $status) {
            $customer = $customers->random();
            $vehicle = $vehicles->random();

            $offsetDays = match ($status) {
                BookingStatus::Completed => -fake()->numberBetween(5, 60),
                BookingStatus::Active => -fake()->numberBetween(0, 2),
                BookingStatus::Confirmed => fake()->numberBetween(1, 10),
                BookingStatus::Pending => fake()->numberBetween(3, 20),
                BookingStatus::Cancelled => -fake()->numberBetween(5, 40),
            };

            $pickup = Carbon::now()->addDays($offsetDays)->setTime(10, 0);
            $days = fake()->numberBetween(2, 6);
            $return = $pickup->copy()->addDays($days);

            $vehicle->loadMissing('bookingCategory');
            $category = $vehicle->bookingCategory;

            $kmAllowance = $days * ($category?->km_per_day_limit ?? 200);
            $baseAmount = $days * (float) $vehicle->daily_rate;
            $deposit = (float) ($category?->security_deposit ?? 100);
            $mileageOverage = $status === BookingStatus::Completed ? fake()->randomElement([0, 0, 0, 35, 80, 140]) : 0;
            $totalAmount = $baseAmount + $mileageOverage;

            $odoStart = $vehicle->current_odometer ? max(0, $vehicle->current_odometer - fake()->numberBetween(200, 3000)) : null;
            $odoEnd = match ($status) {
                BookingStatus::Completed, BookingStatus::Active => $odoStart !== null ? $odoStart + fake()->numberBetween(300, $kmAllowance + 200) : null,
                default => null,
            };

            $booking = Booking::create([
                'reference' => 'BK-'.strtoupper(Str::random(8)),
                'customer_id' => $customer->id,
                'vehicle_id' => $vehicle->id,
                'pickup_datetime' => $pickup,
                'return_datetime' => $return,
                'actual_pickup_at' => in_array($status, [BookingStatus::Active, BookingStatus::Completed]) ? $pickup : null,
                'actual_return_at' => $status === BookingStatus::Completed ? $return : null,
                'odometer_start' => in_array($status, [BookingStatus::Active, BookingStatus::Completed]) ? $odoStart : null,
                'odometer_end' => $odoEnd,
                'rental_days' => $days,
                'km_allowance' => $kmAllowance,
                'daily_rate' => $vehicle->daily_rate,
                'excess_km_rate' => $category?->excess_km_rate ?? 0.35,
                'currency' => Currency::USD,
                'base_amount' => $baseAmount,
                'mileage_overage_amount' => $mileageOverage,
                'extras_amount' => 0,
                'fuel_charge' => 0,
                'damage_charge' => 0,
                'tax_amount' => 0,
                'total_amount' => $totalAmount,
                'deposit_amount' => $deposit,
                'paid_amount' => $status === BookingStatus::Completed ? $totalAmount : ($status === BookingStatus::Active ? $deposit + $baseAmount * 0.5 : ($status === BookingStatus::Confirmed ? $deposit : 0)),
                'pickup_location' => 'Harare Office',
                'return_location' => 'Harare Office',
                'cross_border' => fake()->boolean(20),
                'status' => $status,
                'cancellation_reason' => $status === BookingStatus::Cancelled ? 'Customer changed plans' : null,
                'notes' => null,
            ]);

            // Create invoice + matching payment rows for completed bookings.
            // Matters because the invoice's paid_amount/status are now derived
            // from the sum of completed rental payments — there's no shortcut.
            if ($status === BookingStatus::Completed) {
                $invoice = Invoice::create([
                    'number' => 'INV-'.str_pad((string) (1000 + $index), 6, '0', STR_PAD_LEFT),
                    'booking_id' => $booking->id,
                    'customer_id' => $customer->id,
                    'issued_at' => $return->copy()->addDay()->toDateString(),
                    'due_at' => $return->copy()->addDays(14)->toDateString(),
                    'subtotal' => $baseAmount,
                    'mileage_overage' => $mileageOverage,
                    'fuel_charge' => 0,
                    'extras' => 0,
                    'damage_charge' => 0,
                    'tax' => 0,
                    'total' => $totalAmount,
                    'paid_amount' => $totalAmount,
                    'currency' => Currency::USD,
                    'status' => InvoiceStatus::Paid,
                    'line_items' => [
                        ['description' => "{$vehicle->make} {$vehicle->model} — {$days} days @ \${$vehicle->daily_rate}", 'quantity' => $days, 'unit_price' => (float) $vehicle->daily_rate, 'amount' => $baseAmount],
                        ...($mileageOverage > 0 ? [['description' => 'Mileage overage', 'quantity' => 1, 'unit_price' => $mileageOverage, 'amount' => $mileageOverage]] : []),
                    ],
                ]);

                // Deposit was charged at booking time
                Payment::create([
                    'reference' => 'PAY-'.strtoupper(Str::random(8)),
                    'booking_id' => $booking->id,
                    'invoice_id' => $invoice->id,
                    'customer_id' => $customer->id,
                    'type' => PaymentType::Deposit,
                    'amount' => $deposit,
                    'currency' => Currency::USD,
                    'method' => PaymentMethod::Cash,
                    'status' => PaymentStatus::Completed,
                    'paid_at' => $pickup,
                ]);

                // Rental settled on return — full hire fee paid
                Payment::create([
                    'reference' => 'PAY-'.strtoupper(Str::random(8)),
                    'booking_id' => $booking->id,
                    'invoice_id' => $invoice->id,
                    'customer_id' => $customer->id,
                    'type' => PaymentType::Rental,
                    'amount' => $totalAmount,
                    'currency' => Currency::USD,
                    'method' => fake()->randomElement([PaymentMethod::Cash, PaymentMethod::EcoCash, PaymentMethod::BankTransfer]),
                    'status' => PaymentStatus::Completed,
                    'paid_at' => $return,
                ]);
            }

            // For active bookings: deposit was captured at pickup
            if ($status === BookingStatus::Active) {
                Payment::create([
                    'reference' => 'PAY-'.strtoupper(Str::random(8)),
                    'booking_id' => $booking->id,
                    'customer_id' => $customer->id,
                    'type' => PaymentType::Deposit,
                    'amount' => $deposit,
                    'currency' => Currency::USD,
                    'method' => PaymentMethod::Cash,
                    'status' => PaymentStatus::Completed,
                    'paid_at' => $pickup,
                ]);
            }

            // For confirmed bookings: deposit captured at confirmation
            if ($status === BookingStatus::Confirmed) {
                Payment::create([
                    'reference' => 'PAY-'.strtoupper(Str::random(8)),
                    'booking_id' => $booking->id,
                    'customer_id' => $customer->id,
                    'type' => PaymentType::Deposit,
                    'amount' => $deposit,
                    'currency' => Currency::USD,
                    'method' => PaymentMethod::Cash,
                    'status' => PaymentStatus::Completed,
                    'paid_at' => $pickup->copy()->subDays(1),
                ]);
            }
        }
    }
}
