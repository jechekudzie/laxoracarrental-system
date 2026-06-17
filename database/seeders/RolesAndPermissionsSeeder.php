<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\UserRole;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * @var array<int, string>
     */
    private array $permissions = [
        // Vehicles
        'vehicles.view',
        'vehicles.create',
        'vehicles.update',
        'vehicles.delete',

        // Vehicle owners
        'vehicle_owners.view',
        'vehicle_owners.create',
        'vehicle_owners.update',
        'vehicle_owners.delete',

        // Booking categories (commercial tiers)
        'booking_categories.view',
        'booking_categories.create',
        'booking_categories.update',
        'booking_categories.delete',

        // Customers
        'customers.view',
        'customers.create',
        'customers.update',
        'customers.delete',
        'customers.blacklist',

        // Bookings
        'bookings.view',
        'bookings.create',
        'bookings.update',
        'bookings.cancel',
        'bookings.confirm',
        'bookings.activate',
        'bookings.complete',

        // Invoices
        'invoices.view',
        'invoices.create',
        'invoices.update',
        'invoices.send',

        // Payments
        'payments.view',
        'payments.record',
        'payments.refund',

        // Maintenance & costs
        'maintenance.view',
        'maintenance.create',
        'costs.view',
        'costs.create',

        // Licences & compliance
        'licences.view',
        'licences.create',
        'licences.update',
        'licences.delete',

        // Reports
        'reports.fleet',
        'reports.revenue',
        'reports.compliance',
        'reports.vehicle_pnl',

        // Users & settings
        'users.view',
        'users.manage',
        'settings.manage',
    ];

    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach ($this->permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }

        $superAdmin = Role::firstOrCreate(['name' => UserRole::SuperAdmin->value, 'guard_name' => 'web']);
        $fleetManager = Role::firstOrCreate(['name' => UserRole::FleetManager->value, 'guard_name' => 'web']);
        $bookingAgent = Role::firstOrCreate(['name' => UserRole::BookingAgent->value, 'guard_name' => 'web']);
        $finance = Role::firstOrCreate(['name' => UserRole::Finance->value, 'guard_name' => 'web']);
        $customer = Role::firstOrCreate(['name' => UserRole::Customer->value, 'guard_name' => 'web']);

        $superAdmin->syncPermissions(Permission::all());

        $fleetManager->syncPermissions([
            'vehicles.view', 'vehicles.create', 'vehicles.update', 'vehicles.delete',
            'vehicle_owners.view', 'vehicle_owners.create', 'vehicle_owners.update',
            'booking_categories.view', 'booking_categories.create', 'booking_categories.update', 'booking_categories.delete',
            'maintenance.view', 'maintenance.create',
            'costs.view', 'costs.create',
            'licences.view', 'licences.create', 'licences.update', 'licences.delete',
            'bookings.view',
            'reports.fleet', 'reports.compliance',
        ]);

        $bookingAgent->syncPermissions([
            'vehicles.view',
            'booking_categories.view',
            'customers.view', 'customers.create', 'customers.update',
            'bookings.view', 'bookings.create', 'bookings.update',
            'bookings.confirm', 'bookings.activate', 'bookings.complete', 'bookings.cancel',
            'invoices.view', 'invoices.create',
            'payments.view', 'payments.record',
        ]);

        $finance->syncPermissions([
            'vehicles.view',
            'customers.view',
            'bookings.view',
            'invoices.view', 'invoices.create', 'invoices.update', 'invoices.send',
            'payments.view', 'payments.record', 'payments.refund',
            'reports.revenue', 'reports.vehicle_pnl',
        ]);

        $customer->syncPermissions([
            'bookings.view', 'bookings.create',
            'invoices.view',
        ]);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
