import { Head, Link, router, setLayoutProps, useForm } from '@inertiajs/react';
import { AlertTriangle, Building2, CalendarDays, CheckCircle2, CircleDollarSign, Edit, Fuel, Gauge, Layers, Plus, Receipt, Shield, Trash2, TrendingUp, UserCircle2, Wrench } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/input-error';
import * as Routes from '@/actions/App/Http/Controllers/Web/VehicleController';
import * as BookingRoutes from '@/actions/App/Http/Controllers/Web/BookingController';
import * as BookingCategoryRoutes from '@/actions/App/Http/Controllers/Web/BookingCategoryController';
import { dashboard } from '@/routes';

interface BookingCategoryRef {
    id: number;
    slug: string;
    name: string;
    security_deposit: number;
    km_per_day_limit: number;
    excess_km_rate: number;
    fuel_charge_per_level: number;
    currency: string;
}

interface Owner {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    agreed_daily_rate: number;
}

interface BookingRef {
    id: number;
    reference: string;
    customer_name: string | null;
    status: string;
    pickup_datetime: string;
    return_datetime: string;
    total_amount: number;
}

interface MaintenanceRecord {
    id: number;
    type: string;
    service_type: string | null;
    description: string;
    odometer: number | null;
    service_provider: string | null;
    total_cost: number;
    currency: string;
    started_at: string | null;
    completed_at: string | null;
    downtime_days: number;
    notes: string | null;
}

interface Licence {
    id: number;
    type: string;
    label: string | null;
    document_number: string | null;
    provider: string | null;
    issue_date: string | null;
    expiry_date: string;
    cost: number;
    currency: string;
    cover_amount: number | null;
    cover_type: string | null;
    notes: string | null;
    days_to_expiry: number;
    is_expired: boolean;
}

interface VehicleCostEntry {
    id: number;
    category: string;
    description: string;
    amount: number;
    currency: string;
    vendor_name: string | null;
    odometer: number | null;
    incident_date: string;
    notes: string | null;
}

interface ServiceProviderOption {
    id: number;
    name: string;
    category: string;
    phone: string;
}

interface VehicleDetail {
    id: number;
    make: string;
    model: string;
    year: number;
    colour: string;
    reg_plate: string;
    vin: string | null;
    category: string;
    fuel_type: string;
    transmission: string;
    seats: number;
    status: string;
    ownership_type: string;
    owner: Owner | null;
    owner_agreed_rate: number | null;
    owner_markup_percent: number | null;
    daily_rate: number;
    booking_category: BookingCategoryRef | null;
    currency: string;
    current_odometer: number | null;
    last_service_odometer: number | null;
    last_service_date: string | null;
    service_interval_km: number | null;
    notes: string | null;
    created_at: string;
    bookings: BookingRef[];
    maintenance_records: MaintenanceRecord[];
    licences: Licence[];
    costs: VehicleCostEntry[];
    total_costs: number;
    total_revenue: number;
}

const STATUS_STYLES: Record<string, string> = {
    available: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    rented: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    maintenance: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    reserved: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    decommissioned: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const BOOKING_STATUS_STYLES: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    active: 'bg-emerald-100 text-emerald-800',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-800',
};

const MAINT_STYLES: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-800',
    breakdown: 'bg-amber-100 text-amber-800',
    accident: 'bg-red-100 text-red-800',
};

function fmt(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function fmtDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function expiryBadgeClass(days: number, expired: boolean): string {
    if (expired) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    if (days <= 30) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }> }) {
    return (
        <Card>
            <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="truncate text-lg font-semibold">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}

type Tab = 'overview' | 'bookings' | 'licences' | 'maintenance' | 'costs';

export default function VehicleShow({
    vehicle,
    maintenanceTypes,
    licenceTypes,
    costCategories,
    serviceProviders,
}: {
    vehicle: VehicleDetail;
    maintenanceTypes: { value: string; label: string }[];
    licenceTypes: { value: string; label: string }[];
    costCategories: { value: string; label: string }[];
    serviceProviders: ServiceProviderOption[];
}) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Vehicles', href: Routes.index.url() },
            { title: `${vehicle.make} ${vehicle.model}`, href: Routes.show.url({ vehicle: vehicle.id }) },
        ],
    });

    const [tab, setTab] = useState<Tab>('overview');
    const [maintenanceOpen, setMaintenanceOpen] = useState(false);
    const [licenceOpen, setLicenceOpen] = useState(false);
    const [costOpen, setCostOpen] = useState(false);

    function handleDelete() {
        if (confirm(`Delete ${vehicle.make} ${vehicle.model} (${vehicle.reg_plate})?`)) {
            router.delete(Routes.destroy.url({ vehicle: vehicle.id }));
        }
    }

    const tabs: { id: Tab; label: string; count?: number; icon: React.ComponentType<{ className?: string }> }[] = [
        { id: 'overview', label: 'Overview', icon: Gauge },
        { id: 'bookings', label: 'Bookings', count: vehicle.bookings.length, icon: CalendarDays },
        { id: 'licences', label: 'Compliance & Insurance', count: vehicle.licences.length, icon: Shield },
        { id: 'maintenance', label: 'Maintenance', count: vehicle.maintenance_records.length, icon: Wrench },
        { id: 'costs', label: 'Other Costs', count: vehicle.costs.length, icon: Receipt },
    ];

    const expiredCount = vehicle.licences.filter((l) => l.is_expired).length;
    const expiringCount = vehicle.licences.filter((l) => !l.is_expired && l.days_to_expiry <= 30).length;

    return (
        <>
            <Head title={`${vehicle.make} ${vehicle.model} — ${vehicle.reg_plate}`} />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Hero header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                            <CalendarDays className="h-8 w-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight">{vehicle.make} {vehicle.model}</h1>
                                <span className="text-muted-foreground">{vehicle.year}</span>
                            </div>
                            <p className="font-mono text-sm text-muted-foreground">{vehicle.reg_plate} · {vehicle.colour}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[vehicle.status] ?? ''}`}>
                                    {vehicle.status}
                                </span>
                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                    {vehicle.category}
                                </span>
                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${vehicle.ownership_type === 'owned' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                                    <Building2 className="h-3 w-3" /> {vehicle.ownership_type === 'owned' ? 'In-house' : 'Outsourced'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link href={Routes.edit.url({ vehicle: vehicle.id })}><Edit className="mr-2 h-4 w-4" /> Edit</Link>
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Daily Rate" value={fmt(vehicle.daily_rate, vehicle.currency)} icon={CircleDollarSign} />
                    <StatCard label="Odometer" value={vehicle.current_odometer != null ? `${vehicle.current_odometer.toLocaleString()} km` : '—'} icon={Gauge} />
                    <StatCard label="Total Revenue" value={fmt(vehicle.total_revenue, vehicle.currency)} icon={TrendingUp} />
                    <StatCard label="Total Costs" value={fmt(vehicle.total_costs, vehicle.currency)} icon={Receipt} />
                </div>

                {expiredCount + expiringCount > 0 && (
                    <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/10">
                        <CardContent className="flex items-center gap-3 p-4">
                            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                            <p className="text-sm text-amber-900 dark:text-amber-200">
                                {expiredCount > 0 && <><strong>{expiredCount}</strong> expired document{expiredCount > 1 ? 's' : ''}</>}
                                {expiredCount > 0 && expiringCount > 0 && ' · '}
                                {expiringCount > 0 && <><strong>{expiringCount}</strong> expiring within 30 days</>}
                                . Renew to keep the vehicle road-legal.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Tabs */}
                <div className="flex gap-1 border-b">
                    {tabs.map((t) => {
                        const Icon = t.icon;
                        return (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setTab(t.id)}
                                className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                                    tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {t.label}
                                {t.count != null && t.count > 0 && (
                                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs">{t.count}</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {tab === 'overview' && <OverviewTab vehicle={vehicle} />}
                {tab === 'bookings' && <BookingsTab vehicle={vehicle} />}
                {tab === 'licences' && (
                    <LicencesTab vehicle={vehicle} onAdd={() => setLicenceOpen(true)} />
                )}
                {tab === 'maintenance' && (
                    <MaintenanceTab vehicle={vehicle} onAdd={() => setMaintenanceOpen(true)} />
                )}
                {tab === 'costs' && (
                    <CostsTab vehicle={vehicle} onAdd={() => setCostOpen(true)} />
                )}
            </div>

            <AddMaintenanceDialog
                open={maintenanceOpen}
                onOpenChange={setMaintenanceOpen}
                vehicleId={vehicle.id}
                types={maintenanceTypes}
                providers={serviceProviders}
                currentOdometer={vehicle.current_odometer ?? 0}
            />
            <AddLicenceDialog open={licenceOpen} onOpenChange={setLicenceOpen} vehicleId={vehicle.id} types={licenceTypes} />
            <AddCostDialog
                open={costOpen}
                onOpenChange={setCostOpen}
                vehicleId={vehicle.id}
                categories={costCategories}
                providers={serviceProviders}
                currentOdometer={vehicle.current_odometer ?? 0}
            />
        </>
    );
}

function CostsTab({ vehicle, onAdd }: { vehicle: VehicleDetail; onAdd: () => void }) {
    function handleDelete(id: number) {
        if (confirm('Remove this cost entry?')) {
            router.delete(Routes.destroyCost.url({ vehicle: vehicle.id, cost: id }), { preserveScroll: true });
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Ad-hoc costs: fuel, car wash, fines, parking, cleaning and other expenses.</p>
                <Button size="sm" onClick={onAdd}><Plus className="mr-2 h-4 w-4" /> Log Cost</Button>
            </div>

            {vehicle.costs.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
                        <Receipt className="h-10 w-10" />
                        <p className="font-semibold">No cost entries yet</p>
                        <p className="text-sm">Track every dollar spent on this vehicle for accurate P&amp;L.</p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3">Description</th>
                                    <th className="px-4 py-3">Vendor</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {vehicle.costs.map((c) => (
                                    <tr key={c.id} className="group hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 text-muted-foreground">{fmtDate(c.incident_date)}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize">
                                                {c.category.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">{c.description}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{c.vendor_name ?? '—'}</td>
                                        <td className="px-4 py-3 font-medium">{fmt(c.amount, c.currency)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive" onClick={() => handleDelete(c.id)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function AddCostDialog({
    open,
    onOpenChange,
    vehicleId,
    categories,
    providers,
    currentOdometer,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    vehicleId: number;
    categories: { value: string; label: string }[];
    providers: ServiceProviderOption[];
    currentOdometer: number;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        category: 'fuel',
        description: '',
        amount: '',
        service_provider_id: '',
        vendor_name: '',
        vendor_phone: '',
        odometer: currentOdometer > 0 ? String(currentOdometer) : '',
        incident_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(Routes.storeCost.url({ vehicle: vehicleId }), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Log Cost Entry</DialogTitle>
                    <DialogDescription>Fuel, fines, car wash, cleaning and any other vehicle expense.</DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                        <Label>Category</Label>
                        <Select value={data.category} onValueChange={(v) => setData('category', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.category} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="c-amount">Amount (USD)</Label>
                        <Input id="c-amount" type="number" step="0.01" value={data.amount} onChange={(e) => setData('amount', e.target.value)} placeholder="0.00" />
                        <InputError message={errors.amount} />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="c-description">Description</Label>
                        <Input id="c-description" value={data.description} onChange={(e) => setData('description', e.target.value)} placeholder="e.g. 40L diesel refuel" />
                        <InputError message={errors.description} />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                        <Label>Vendor / Service Provider</Label>
                        <Select
                            value={data.service_provider_id}
                            onValueChange={(v) => setData('service_provider_id', v === 'none' ? '' : v)}
                        >
                            <SelectTrigger><SelectValue placeholder="Select from directory (optional)" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Not from directory</SelectItem>
                                {providers.map((p) => (
                                    <SelectItem key={p.id} value={String(p.id)}>
                                        {p.name} — {p.category.replace('_', ' ')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {!data.service_provider_id && (
                        <div className="space-y-1 sm:col-span-2">
                            <Label htmlFor="c-vendor">Vendor Name (if not in directory)</Label>
                            <Input id="c-vendor" value={data.vendor_name} onChange={(e) => setData('vendor_name', e.target.value)} placeholder="Total Harare Rd" />
                        </div>
                    )}

                    <div className="space-y-1">
                        <Label htmlFor="c-date">Date</Label>
                        <DateInput id="c-date" value={data.incident_date} onChange={(e) => setData('incident_date', e.target.value)} />
                        <InputError message={errors.incident_date} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="c-odo">Odometer (km)</Label>
                        <Input id="c-odo" type="number" value={data.odometer} onChange={(e) => setData('odometer', e.target.value)} />
                    </div>

                    <DialogFooter className="sm:col-span-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing}>{processing ? 'Saving…' : 'Log Cost'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex justify-between gap-4 border-b py-2 text-sm last:border-0">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-right font-medium">{value}</span>
        </div>
    );
}

function OverviewTab({ vehicle }: { vehicle: VehicleDetail }) {
    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader><CardTitle className="text-base">Vehicle Details</CardTitle></CardHeader>
                <CardContent>
                    <Row label="VIN" value={vehicle.vin ?? '—'} />
                    <Row label="Colour" value={vehicle.colour} />
                    <Row label="Fuel Type" value={<span className="capitalize">{vehicle.fuel_type}</span>} />
                    <Row label="Transmission" value={<span className="capitalize">{vehicle.transmission}</span>} />
                    <Row label="Seats" value={vehicle.seats} />
                    <Row label="Last Service" value={vehicle.last_service_date ? `${fmtDate(vehicle.last_service_date)} @ ${vehicle.last_service_odometer?.toLocaleString() ?? '?'} km` : '—'} />
                    {vehicle.service_interval_km && <Row label="Service Interval" value={`every ${vehicle.service_interval_km.toLocaleString()} km`} />}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="text-base">Pricing</CardTitle></CardHeader>
                <CardContent>
                    <Row label="Daily Rate" value={`${fmt(vehicle.daily_rate, vehicle.currency)}/day`} />
                    {vehicle.notes && <Row label="Notes" value={vehicle.notes} />}
                </CardContent>
            </Card>

            {vehicle.booking_category ? (
                <Card className="lg:col-span-2 border-blue-200 bg-blue-50/30 dark:border-blue-900/30 dark:bg-blue-900/5">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Layers className="h-5 w-5 text-blue-600" />
                            <CardTitle className="text-base">Booking Category: {vehicle.booking_category.name}</CardTitle>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={BookingCategoryRoutes.show.url({ bookingCategory: vehicle.booking_category.id })}>
                                View tier
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            <div>
                                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    <Shield className="h-3 w-3" /> Security Deposit
                                </div>
                                <div className="mt-1 text-xl font-semibold">
                                    {fmt(vehicle.booking_category.security_deposit, vehicle.booking_category.currency)}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">Charged on booking, refundable on return.</p>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    <Gauge className="h-3 w-3" /> KM Allowance
                                </div>
                                <div className="mt-1 text-xl font-semibold">
                                    {vehicle.booking_category.km_per_day_limit.toLocaleString()} km/day
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    <TrendingUp className="h-3 w-3" /> Excess KM Rate
                                </div>
                                <div className="mt-1 text-xl font-semibold">
                                    {fmt(vehicle.booking_category.excess_km_rate, vehicle.booking_category.currency)}/km
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    <Fuel className="h-3 w-3" /> Fuel / level
                                </div>
                                <div className="mt-1 text-xl font-semibold">
                                    {vehicle.booking_category.fuel_charge_per_level > 0
                                        ? fmt(vehicle.booking_category.fuel_charge_per_level, vehicle.booking_category.currency)
                                        : '—'}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">Per quarter-tank short on return.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="lg:col-span-2 border-yellow-200 bg-yellow-50/40 dark:border-yellow-900/40 dark:bg-yellow-900/10">
                    <CardContent className="flex items-start gap-3 p-4">
                        <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-600" />
                        <div className="flex-1 text-sm">
                            <div className="font-medium">No booking category assigned</div>
                            <p className="mt-1 text-muted-foreground">
                                This vehicle can&apos;t be booked until you assign a booking category. Categories set the deposit,
                                km allowance, excess km rate and fuel top-up charge.
                            </p>
                        </div>
                        <Button size="sm" asChild>
                            <Link href={Routes.edit.url({ vehicle: vehicle.id })}>Edit vehicle</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {vehicle.ownership_type === 'outsourced' && vehicle.owner && (
                <Card className="lg:col-span-2 border-orange-200 bg-orange-50/30 dark:border-orange-900/30 dark:bg-orange-900/5">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <UserCircle2 className="h-5 w-5 text-orange-600" />
                        <CardTitle className="text-base">Outsourced Owner</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <Row label="Name" value={vehicle.owner.name} />
                            <Row label="Phone" value={vehicle.owner.phone} />
                            {vehicle.owner.email && <Row label="Email" value={vehicle.owner.email} />}
                        </div>
                        <div>
                            {vehicle.owner_agreed_rate != null && <Row label="Agreed Rate" value={`${fmt(vehicle.owner_agreed_rate, vehicle.currency)}/day`} />}
                            {vehicle.owner_markup_percent != null && <Row label="Laxora Markup" value={`${vehicle.owner_markup_percent}%`} />}
                            <Row label="Payout Model" value="Per completed booking" />
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function BookingsTab({ vehicle }: { vehicle: VehicleDetail }) {
    if (vehicle.bookings.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
                    <CalendarDays className="h-10 w-10" />
                    <p className="font-semibold">No bookings yet for this vehicle</p>
                    <p className="text-sm">When the vehicle is rented out, bookings will appear here.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="p-0">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            <th className="px-4 py-3">Reference</th>
                            <th className="px-4 py-3">Customer</th>
                            <th className="px-4 py-3">Pickup</th>
                            <th className="px-4 py-3">Return</th>
                            <th className="px-4 py-3">Amount</th>
                            <th className="px-4 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {vehicle.bookings.map((b) => (
                            <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                                <td className="px-4 py-3 font-mono">
                                    <Link href={BookingRoutes.show.url({ booking: b.id })} className="text-primary hover:underline">{b.reference}</Link>
                                </td>
                                <td className="px-4 py-3">{b.customer_name ?? '—'}</td>
                                <td className="px-4 py-3 text-muted-foreground">{fmtDate(b.pickup_datetime)}</td>
                                <td className="px-4 py-3 text-muted-foreground">{fmtDate(b.return_datetime)}</td>
                                <td className="px-4 py-3 font-medium">{fmt(b.total_amount, vehicle.currency)}</td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${BOOKING_STATUS_STYLES[b.status] ?? ''}`}>
                                        {b.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    );
}

function LicencesTab({ vehicle, onAdd }: { vehicle: VehicleDetail; onAdd: () => void }) {
    function handleDelete(id: number) {
        if (confirm('Remove this compliance record?')) {
            router.delete(Routes.destroyLicence.url({ vehicle: vehicle.id, licence: id }), { preserveScroll: true });
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">ZINARA, ZBC, Insurance, Fitness, Registration and more.</p>
                <Button size="sm" onClick={onAdd}><Plus className="mr-2 h-4 w-4" /> Add Record</Button>
            </div>

            {vehicle.licences.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
                        <Shield className="h-10 w-10" />
                        <p className="font-semibold">No compliance records yet</p>
                        <p className="text-sm">Log insurance policies, ZINARA licences and other documents.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3 md:grid-cols-2">
                    {vehicle.licences.map((l) => (
                        <Card key={l.id} className="group">
                            <CardContent className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold capitalize">{l.label ?? l.type.replace('_', ' ')}</p>
                                        {l.provider && <p className="text-xs text-muted-foreground">{l.provider}</p>}
                                    </div>
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${expiryBadgeClass(l.days_to_expiry, l.is_expired)}`}>
                                        {l.is_expired ? `Expired ${Math.abs(l.days_to_expiry)}d ago` : l.days_to_expiry <= 30 ? `${l.days_to_expiry}d left` : 'Valid'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-1 text-xs">
                                    {l.document_number && <div className="col-span-2"><span className="text-muted-foreground">Doc #: </span><span className="font-mono">{l.document_number}</span></div>}
                                    <div><span className="text-muted-foreground">Expires: </span>{fmtDate(l.expiry_date)}</div>
                                    <div><span className="text-muted-foreground">Cost: </span>{fmt(l.cost, l.currency)}</div>
                                    {l.cover_amount != null && (
                                        <div className="col-span-2"><span className="text-muted-foreground">Cover: </span>{fmt(l.cover_amount, l.currency)} {l.cover_type && `(${l.cover_type})`}</div>
                                    )}
                                </div>
                                <div className="flex justify-end pt-1 border-t opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive h-7" onClick={() => handleDelete(l.id)}>
                                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

function MaintenanceTab({ vehicle, onAdd }: { vehicle: VehicleDetail; onAdd: () => void }) {
    function handleDelete(id: number) {
        if (confirm('Remove this maintenance record?')) {
            router.delete(Routes.destroyMaintenance.url({ vehicle: vehicle.id, record: id }), { preserveScroll: true });
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Scheduled service, breakdowns and accident repairs.</p>
                <Button size="sm" onClick={onAdd}><Plus className="mr-2 h-4 w-4" /> Log Record</Button>
            </div>

            {vehicle.maintenance_records.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
                        <Wrench className="h-10 w-10" />
                        <p className="font-semibold">No maintenance logged yet</p>
                        <p className="text-sm">Record your first service to start tracking costs.</p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Description</th>
                                    <th className="px-4 py-3">Provider</th>
                                    <th className="px-4 py-3">Odo</th>
                                    <th className="px-4 py-3">Cost</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {vehicle.maintenance_records.map((r) => (
                                    <tr key={r.id} className="group hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 text-muted-foreground">{fmtDate(r.started_at)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${MAINT_STYLES[r.type] ?? ''}`}>
                                                {r.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {r.service_type && <span className="font-medium">{r.service_type} · </span>}
                                            <span className="text-muted-foreground">{r.description}</span>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{r.service_provider ?? '—'}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{r.odometer?.toLocaleString() ?? '—'}</td>
                                        <td className="px-4 py-3 font-medium">{fmt(r.total_cost, r.currency)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive" onClick={() => handleDelete(r.id)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function AddMaintenanceDialog({
    open,
    onOpenChange,
    vehicleId,
    types,
    providers,
    currentOdometer,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    vehicleId: number;
    types: { value: string; label: string }[];
    providers: ServiceProviderOption[];
    currentOdometer: number;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        type: 'scheduled',
        service_type: '',
        description: '',
        odometer: currentOdometer > 0 ? String(currentOdometer) : '',
        service_provider_id: '',
        labour_cost: '',
        parts_cost: '',
        tow_cost: '',
        downtime_days: 0,
        started_at: new Date().toISOString().split('T')[0],
        completed_at: '',
        notes: '',
    });

    const relevantProviders = providers.filter((p) => ['mechanic', 'tow', 'parts', 'tyres', 'panelbeater'].includes(p.category));

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(Routes.storeMaintenance.url({ vehicle: vehicleId }), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Log Maintenance</DialogTitle>
                    <DialogDescription>Record a service, breakdown or accident repair.</DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                        <Label>Type</Label>
                        <Select value={data.type} onValueChange={(v) => setData('type', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {types.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.type} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="m-service-type">Service Type</Label>
                        <Input id="m-service-type" value={data.service_type} onChange={(e) => setData('service_type', e.target.value)} placeholder="Oil change, brakes…" />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="m-description">Description</Label>
                        <textarea
                            id="m-description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={2}
                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            placeholder="What was done…"
                        />
                        <InputError message={errors.description} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="m-odometer">Odometer (km)</Label>
                        <Input id="m-odometer" type="number" value={data.odometer} onChange={(e) => setData('odometer', e.target.value)} />
                    </div>

                    <div className="space-y-1">
                        <Label>Service Provider</Label>
                        <Select value={data.service_provider_id} onValueChange={(v) => setData('service_provider_id', v === 'none' ? '' : v)}>
                            <SelectTrigger><SelectValue placeholder="Select from directory" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">— None —</SelectItem>
                                {relevantProviders.map((p) => (
                                    <SelectItem key={p.id} value={String(p.id)}>
                                        {p.name} ({p.category.replace('_', ' ')})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="m-labour">Labour Cost</Label>
                        <Input id="m-labour" type="number" step="0.01" value={data.labour_cost} onChange={(e) => setData('labour_cost', e.target.value)} placeholder="0.00" />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="m-parts">Parts Cost</Label>
                        <Input id="m-parts" type="number" step="0.01" value={data.parts_cost} onChange={(e) => setData('parts_cost', e.target.value)} placeholder="0.00" />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="m-tow">Tow Cost</Label>
                        <Input id="m-tow" type="number" step="0.01" value={data.tow_cost} onChange={(e) => setData('tow_cost', e.target.value)} placeholder="0.00" />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="m-downtime">Downtime (days)</Label>
                        <Input id="m-downtime" type="number" value={data.downtime_days} onChange={(e) => setData('downtime_days', Number(e.target.value))} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="m-started">Started</Label>
                        <DateInput id="m-started" value={data.started_at} onChange={(e) => setData('started_at', e.target.value)} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="m-completed">Completed</Label>
                        <DateInput id="m-completed" value={data.completed_at} onChange={(e) => setData('completed_at', e.target.value)} />
                    </div>

                    <DialogFooter className="sm:col-span-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing}>{processing ? 'Saving…' : 'Log Record'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function AddLicenceDialog({
    open,
    onOpenChange,
    vehicleId,
    types,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    vehicleId: number;
    types: { value: string; label: string }[];
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        type: 'insurance',
        label: '',
        document_number: '',
        provider: '',
        issue_date: '',
        expiry_date: '',
        cost: '',
        cover_amount: '',
        cover_type: '',
        notes: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(Routes.storeLicence.url({ vehicle: vehicleId }), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    }

    const isInsurance = data.type === 'insurance';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Compliance Record</DialogTitle>
                    <DialogDescription>Log insurance, ZINARA, ZBC, fitness or registration details.</DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1 sm:col-span-2">
                        <Label>Type</Label>
                        <Select value={data.type} onValueChange={(v) => setData('type', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {types.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.type} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="l-provider">Provider / Authority</Label>
                        <Input id="l-provider" value={data.provider} onChange={(e) => setData('provider', e.target.value)} placeholder={isInsurance ? 'Old Mutual, Nicoz Diamond…' : 'ZINARA, ZBC…'} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="l-docnum">Document Number</Label>
                        <Input id="l-docnum" value={data.document_number} onChange={(e) => setData('document_number', e.target.value)} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="l-issue">Issue Date</Label>
                        <DateInput id="l-issue" value={data.issue_date} onChange={(e) => setData('issue_date', e.target.value)} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="l-expiry">Expiry Date</Label>
                        <DateInput id="l-expiry" value={data.expiry_date} onChange={(e) => setData('expiry_date', e.target.value)} />
                        <InputError message={errors.expiry_date} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="l-cost">Cost Paid (USD)</Label>
                        <Input id="l-cost" type="number" step="0.01" value={data.cost} onChange={(e) => setData('cost', e.target.value)} placeholder="0.00" />
                    </div>

                    {isInsurance && (
                        <>
                            <div className="space-y-1">
                                <Label htmlFor="l-cover">Cover Amount (USD)</Label>
                                <Input id="l-cover" type="number" step="0.01" value={data.cover_amount} onChange={(e) => setData('cover_amount', e.target.value)} placeholder="15000.00" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="l-cover-type">Cover Type</Label>
                                <Select value={data.cover_type} onValueChange={(v) => setData('cover_type', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select cover type" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="comprehensive">Comprehensive</SelectItem>
                                        <SelectItem value="third_party">Third Party</SelectItem>
                                        <SelectItem value="third_party_fire_theft">Third Party, Fire & Theft</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}

                    {data.type === 'custom' && (
                        <div className="space-y-1 sm:col-span-2">
                            <Label htmlFor="l-label">Custom Label</Label>
                            <Input id="l-label" value={data.label} onChange={(e) => setData('label', e.target.value)} placeholder="e.g. Cross-border permit" />
                        </div>
                    )}

                    <DialogFooter className="sm:col-span-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing}>{processing ? 'Saving…' : 'Add Record'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
