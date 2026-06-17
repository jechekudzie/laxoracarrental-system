import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import { ArrowLeft, Car, Fuel, Gauge, Pencil, ShieldCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as Routes from '@/actions/App/Http/Controllers/Web/BookingCategoryController';
import * as VehicleRoutes from '@/actions/App/Http/Controllers/Web/VehicleController';
import { dashboard } from '@/routes';

interface VehicleRow {
    id: number;
    label: string;
    reg_plate: string;
    daily_rate: number;
    currency: string;
    status: string;
}

interface Category {
    id: number;
    slug: string;
    name: string;
    description: string | null;
    security_deposit: number;
    km_per_day_limit: number;
    excess_km_rate: number;
    fuel_charge_per_level: number;
    currency: string;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    vehicles: VehicleRow[];
}

function fmt(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

const STATUS_STYLES: Record<string, string> = {
    available: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    rented: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    reserved: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    decommissioned: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export default function BookingCategoryShow({ category }: { category: Category }) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Booking Categories', href: Routes.index.url() },
            { title: category.name, href: Routes.show.url({ bookingCategory: category.id }) },
        ],
    });

    function handleDelete() {
        if (category.vehicles.length > 0) {
            alert('Reassign vehicles off this category before deleting it.');
            return;
        }
        if (!confirm(`Delete booking category "${category.name}"?`)) return;
        router.delete(Routes.destroy.url({ bookingCategory: category.id }));
    }

    return (
        <>
            <Head title={category.name} />

            <div className="flex flex-1 flex-col gap-4 p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <Link href={Routes.index.url()} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" /> Back to categories
                        </Link>
                        <div className="mt-1 flex items-center gap-3">
                            <h1 className="text-2xl font-semibold tracking-tight">{category.name}</h1>
                            <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                    category.is_active
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                }`}
                            >
                                {category.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className="mt-1 font-mono text-xs text-muted-foreground">{category.slug}</div>
                        {category.description && (
                            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{category.description}</p>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href={Routes.edit.url({ bookingCategory: category.id })}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </Link>
                        </Button>
                        <Button variant="outline" onClick={handleDelete} className="text-destructive hover:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-2 pb-2">
                            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                            <CardTitle className="text-sm font-medium text-muted-foreground">Security Deposit</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold">{fmt(category.security_deposit, category.currency)}</div>
                            <p className="mt-1 text-xs text-muted-foreground">Refundable on return, less any deductions.</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center gap-2 pb-2">
                            <Gauge className="h-4 w-4 text-muted-foreground" />
                            <CardTitle className="text-sm font-medium text-muted-foreground">Mileage</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold">{category.km_per_day_limit.toLocaleString()} km/day</div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Excess: {fmt(category.excess_km_rate, category.currency)}/km
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center gap-2 pb-2">
                            <Fuel className="h-4 w-4 text-muted-foreground" />
                            <CardTitle className="text-sm font-medium text-muted-foreground">Fuel Top-up</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold">
                                {category.fuel_charge_per_level > 0 ? fmt(category.fuel_charge_per_level, category.currency) : '—'}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {category.fuel_charge_per_level > 0 ? 'Per quarter-tank short on return.' : 'Fuel reconciliation disabled.'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Car className="h-4 w-4 text-muted-foreground" /> Vehicles in this category
                        </CardTitle>
                        <span className="text-sm text-muted-foreground">{category.vehicles.length} vehicle{category.vehicles.length === 1 ? '' : 's'}</span>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        <th className="px-4 py-3">Vehicle</th>
                                        <th className="px-4 py-3">Reg Plate</th>
                                        <th className="px-4 py-3">Daily Rate</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {category.vehicles.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                                                No vehicles assigned to this category yet.
                                            </td>
                                        </tr>
                                    )}
                                    {category.vehicles.map((v) => (
                                        <tr key={v.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3 font-medium">
                                                <Link
                                                    href={VehicleRoutes.show.url({ vehicle: v.id })}
                                                    className="hover:text-primary hover:underline"
                                                >
                                                    {v.label}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 font-mono">{v.reg_plate}</td>
                                            <td className="px-4 py-3">{fmt(v.daily_rate, v.currency)}/day</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[v.status] ?? ''}`}
                                                >
                                                    {v.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
