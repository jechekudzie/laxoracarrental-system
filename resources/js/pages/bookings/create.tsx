import { Head, Link, setLayoutProps, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    AlertTriangle,
    ArrowLeft,
    CalendarClock,
    Car,
    CheckCircle2,
    CircleDashed,
    FileText,
    Fuel,
    Gauge,
    MapPin,
    Receipt,
    User,
    UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DateInput, DateTimeInput } from '@/components/ui/date-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import InputError from '@/components/input-error';
import * as Routes from '@/actions/App/Http/Controllers/Web/BookingController';
import * as CustomerRoutes from '@/actions/App/Http/Controllers/Web/CustomerController';
import { dashboard } from '@/routes';

interface CustomerOption {
    id: number;
    name: string;
    phone: string;
    status: string;
}

interface BookingCategoryInfo {
    id: number;
    name: string;
    security_deposit: number;
    km_per_day_limit: number;
    excess_km_rate: number;
    fuel_charge_per_level: number;
    currency: string;
}

interface VehicleOption {
    id: number;
    make: string;
    model: string;
    reg_plate: string;
    daily_rate: number;
    currency: string;
    current_odometer: number;
    booking_category: BookingCategoryInfo | null;
}

function fmt(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function computeDays(pickup: string, ret: string): number | null {
    if (!pickup || !ret) return null;
    const diff = new Date(ret).getTime() - new Date(pickup).getTime();
    if (diff <= 0) return null;
    return Math.max(1, Math.ceil(diff / 86400000));
}

function addDays(pickup: string, days: number): string {
    const d = new Date(pickup);
    d.setDate(d.getDate() + days);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function BookingCreate({
    customers,
    vehicles,
}: {
    customers: CustomerOption[];
    vehicles: VehicleOption[];
}) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Bookings', href: Routes.index.url() },
            { title: 'New Booking', href: '#' },
        ],
    });

    const { flash } = usePage<{ flash?: { new_customer_id?: number } }>().props;
    const [customerModalOpen, setCustomerModalOpen] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        customer_id: '',
        vehicle_id: '',
        pickup_datetime: '',
        return_datetime: '',
        days: '' as string | number,
        pickup_location: 'Harare Office',
        return_location: 'Harare Office',
        cross_border: false as boolean,
        fuel_level_pickup: 'full',
        odometer_start: '' as string | number,
        notes: '',
    });

    useEffect(() => {
        if (flash?.new_customer_id) {
            setData('customer_id', String(flash.new_customer_id));
            setCustomerModalOpen(false);
        }
    }, [flash?.new_customer_id]);

    const selectedVehicle = vehicles.find((v) => v.id === parseInt(data.vehicle_id));

    function handlePickupChange(value: string) {
        setData((prev) => {
            const next = { ...prev, pickup_datetime: value };
            if (value && prev.days && Number(prev.days) > 0) {
                next.return_datetime = addDays(value, Number(prev.days));
            } else if (value && prev.return_datetime) {
                next.days = computeDays(value, prev.return_datetime) ?? '';
            }
            return next;
        });
    }

    function handleReturnChange(value: string) {
        setData((prev) => {
            const next = { ...prev, return_datetime: value };
            if (prev.pickup_datetime && value) {
                next.days = computeDays(prev.pickup_datetime, value) ?? '';
            }
            return next;
        });
    }

    function handleDaysChange(value: string) {
        setData((prev) => {
            const next = { ...prev, days: value };
            if (prev.pickup_datetime && value && Number(value) > 0) {
                next.return_datetime = addDays(prev.pickup_datetime, Number(value));
            }
            return next;
        });
    }

    function handleVehicleChange(id: string) {
        setData((prev) => {
            const next = { ...prev, vehicle_id: id };
            const picked = vehicles.find((v) => String(v.id) === id);
            if (picked && picked.current_odometer > 0) {
                // Pre-fill the pickup odometer with the vehicle's last recorded reading.
                // Operator can still edit it before submitting.
                next.odometer_start = String(picked.current_odometer);
            }
            return next;
        });
    }

    const days = Number(data.days) > 0 ? Number(data.days) : computeDays(data.pickup_datetime, data.return_datetime);
    const estimatedBase = selectedVehicle && days ? days * selectedVehicle.daily_rate : null;
    const category = selectedVehicle?.booking_category ?? null;
    const estimatedDeposit = category?.security_deposit ?? 0;
    const totalDue = estimatedBase !== null ? estimatedBase + estimatedDeposit : null;

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(Routes.store.url());
    }

    const selectedCustomer = customers.find((c) => String(c.id) === data.customer_id) ?? null;

    const requiredChecks: { label: string; done: boolean }[] = [
        { label: 'Customer', done: Boolean(data.customer_id) },
        { label: 'Vehicle', done: Boolean(data.vehicle_id && category) },
        { label: 'Pickup date & time', done: Boolean(data.pickup_datetime) },
        { label: 'Return date & time', done: Boolean(data.return_datetime) },
        { label: 'Pickup fuel level', done: Boolean(data.fuel_level_pickup) },
    ];
    const completed = requiredChecks.filter((c) => c.done).length;
    const progressPct = Math.round((completed / requiredChecks.length) * 100);

    return (
        <>
            <Head title="New Booking" />

            <form onSubmit={submit} className="flex flex-1 flex-col gap-6 p-6">
                {/* Page header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <Link
                            href={Routes.index.url()}
                            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" /> Back to bookings
                        </Link>
                        <h1 className="mt-1 text-2xl font-semibold tracking-tight">New Booking</h1>
                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                            Create a booking for a customer. The deposit, mileage allowance and excess rate come from the
                            vehicle&apos;s booking tier — you don’t set them here.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" asChild>
                            <Link href={Routes.index.url()}>Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing || !category}>
                            {processing ? 'Creating…' : 'Create Booking'}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                    {/* Sections */}
                    <div className="flex flex-col gap-6">
                        {/* Customer */}
                        <Card className="overflow-hidden">
                            <CardHeader className="space-y-1 border-b bg-muted/30 py-4">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <User className="h-4 w-4 text-muted-foreground" /> Customer
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    Who the vehicle is being rented to. Blacklisted customers cannot be selected.
                                </p>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <Label>Select customer</Label>
                                        <button
                                            type="button"
                                            onClick={() => setCustomerModalOpen(true)}
                                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                        >
                                            <UserPlus className="h-3 w-3" /> Add new
                                        </button>
                                    </div>
                                    <Select value={data.customer_id} onValueChange={(v) => setData('customer_id', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select customer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customers.length === 0 && (
                                                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                                    No customers yet.{' '}
                                                    <button
                                                        type="button"
                                                        onClick={() => setCustomerModalOpen(true)}
                                                        className="text-primary hover:underline"
                                                    >
                                                        Create one
                                                    </button>
                                                </div>
                                            )}
                                            {customers.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)} disabled={c.status === 'blacklisted'}>
                                                    {c.name} — {c.phone}
                                                    {c.status !== 'active' && ` (${c.status})`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.customer_id} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Vehicle */}
                        <Card className="overflow-hidden">
                            <CardHeader className="space-y-1 border-b bg-muted/30 py-4">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Car className="h-4 w-4 text-muted-foreground" /> Vehicle
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    Only available vehicles with a booking tier assigned are shown here.
                                </p>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-1">
                                    <Label>Select vehicle</Label>
                                    <Select value={data.vehicle_id} onValueChange={handleVehicleChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select vehicle" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {vehicles.map((v) => (
                                                <SelectItem key={v.id} value={String(v.id)}>
                                                    {v.make} {v.model} ({v.reg_plate}) — {fmt(v.daily_rate, v.currency)}/day
                                                    {v.booking_category ? ` · ${v.booking_category.name}` : ' · ⚠ no tier'}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.vehicle_id} />
                                </div>

                                {selectedVehicle && !category && (
                                    <div className="mt-4 flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800 dark:border-yellow-900/40 dark:bg-yellow-900/20 dark:text-yellow-300">
                                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                        <div>
                                            This vehicle has no booking tier assigned. Assign one on the vehicle first —
                                            otherwise the deposit, km allowance and excess rate can&apos;t be calculated.
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Dates & Locations */}
                        <Card className="overflow-hidden">
                            <CardHeader className="space-y-1 border-b bg-muted/30 py-4">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <CalendarClock className="h-4 w-4 text-muted-foreground" /> Dates & Locations
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    Pickup and return times. Days auto-calculate, or type a number of days to set the return.
                                </p>
                            </CardHeader>
                            <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <Label htmlFor="pickup_datetime">Pickup date & time</Label>
                                    <DateTimeInput
                                        id="pickup_datetime"
                                        value={data.pickup_datetime}
                                        onChange={(e) => handlePickupChange(e.target.value)}
                                    />
                                    <InputError message={errors.pickup_datetime} />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="days">Number of days</Label>
                                    <Input
                                        id="days"
                                        type="number"
                                        min={1}
                                        value={data.days}
                                        onChange={(e) => handleDaysChange(e.target.value)}
                                        placeholder="e.g. 3"
                                    />
                                    <p className="text-xs text-muted-foreground">Auto-sets the return time from pickup.</p>
                                </div>

                                <div className="space-y-1 sm:col-span-2">
                                    <Label htmlFor="return_datetime">Return date & time</Label>
                                    <DateTimeInput
                                        id="return_datetime"
                                        value={data.return_datetime}
                                        onChange={(e) => handleReturnChange(e.target.value)}
                                    />
                                    <InputError message={errors.return_datetime} />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="pickup_location" className="flex items-center gap-1.5">
                                        <MapPin className="h-3 w-3 text-muted-foreground" /> Pickup location
                                    </Label>
                                    <Input
                                        id="pickup_location"
                                        value={data.pickup_location}
                                        onChange={(e) => setData('pickup_location', e.target.value)}
                                    />
                                    <InputError message={errors.pickup_location} />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="return_location" className="flex items-center gap-1.5">
                                        <MapPin className="h-3 w-3 text-muted-foreground" /> Return location
                                    </Label>
                                    <Input
                                        id="return_location"
                                        value={data.return_location}
                                        onChange={(e) => setData('return_location', e.target.value)}
                                    />
                                    <InputError message={errors.return_location} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Trip details */}
                        <Card className="overflow-hidden">
                            <CardHeader className="space-y-1 border-b bg-muted/30 py-4">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FileText className="h-4 w-4 text-muted-foreground" /> Trip Details
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    Fuel level at handover and anything else the team needs to know about this rental.
                                </p>
                            </CardHeader>
                            <CardContent className="grid gap-4 p-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label className="flex items-center gap-1.5">
                                            <Fuel className="h-3 w-3 text-muted-foreground" /> Pickup fuel level
                                        </Label>
                                        <Select
                                            value={data.fuel_level_pickup}
                                            onValueChange={(v) => setData('fuel_level_pickup', v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select pickup fuel level" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="empty">Empty</SelectItem>
                                                <SelectItem value="quarter">Quarter</SelectItem>
                                                <SelectItem value="half">Half</SelectItem>
                                                <SelectItem value="three_quarter">Three Quarter</SelectItem>
                                                <SelectItem value="full">Full</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            Charged per quarter-tank short on return. Surplus fuel is never credited back.
                                        </p>
                                        <InputError message={errors.fuel_level_pickup} />
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="odometer_start" className="flex items-center gap-1.5">
                                            <Gauge className="h-3 w-3 text-muted-foreground" /> Pickup odometer (km)
                                        </Label>
                                        <Input
                                            id="odometer_start"
                                            type="number"
                                            min={0}
                                            value={data.odometer_start}
                                            onChange={(e) => setData('odometer_start', e.target.value)}
                                            placeholder={
                                                selectedVehicle && selectedVehicle.current_odometer > 0
                                                    ? String(selectedVehicle.current_odometer)
                                                    : 'e.g. 42310'
                                            }
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            {selectedVehicle && selectedVehicle.current_odometer > 0 ? (
                                                <>
                                                    Pre-filled from the vehicle&apos;s last recorded reading (
                                                    <span className="font-medium text-foreground">
                                                        {selectedVehicle.current_odometer.toLocaleString()} km
                                                    </span>
                                                    ). Adjust if needed before saving.
                                                </>
                                            ) : (
                                                'Auto-fills from the selected vehicle’s last recorded reading. Optional.'
                                            )}
                                        </p>
                                        <InputError message={errors.odometer_start} />
                                    </div>
                                </div>

                                <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed p-3 transition-colors hover:bg-muted/30">
                                    <input
                                        type="checkbox"
                                        checked={data.cross_border}
                                        onChange={(e) => setData('cross_border', e.target.checked)}
                                        className="h-4 w-4 rounded border-input accent-primary"
                                    />
                                    <div className="flex-1">
                                        <span className="text-sm font-medium">Out of town / Cross border</span>
                                        <p className="text-xs text-muted-foreground">
                                            Vehicle will be taken outside the city or across borders. Flags the booking for
                                            extra compliance checks.
                                        </p>
                                    </div>
                                </label>

                                <div className="space-y-1">
                                    <Label htmlFor="notes">Notes</Label>
                                    <textarea
                                        id="notes"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={3}
                                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        placeholder="Trip purpose, destinations, special instructions…"
                                    />
                                    <InputError message={errors.notes} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Bottom action bar */}
                        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
                            <p className="text-xs text-muted-foreground">
                                Booking will be created as <span className="font-medium">Pending</span>. An agent needs to
                                confirm it before activation.
                            </p>
                            <div className="flex gap-2">
                                <Button variant="outline" asChild>
                                    <Link href={Routes.index.url()}>Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={processing || !category}>
                                    {processing ? 'Creating…' : 'Create Booking'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Right column — sticky quote */}
                    <aside className="flex flex-col gap-4 xl:sticky xl:top-6 xl:self-start">
                        <Card className="overflow-hidden">
                            <CardHeader className="border-b bg-gradient-to-br from-primary/5 to-transparent py-4">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Receipt className="h-4 w-4 text-primary" /> Quote preview
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">Live calculation from the selected vehicle & tier.</p>
                            </CardHeader>
                            <CardContent className="space-y-4 p-5 text-sm">
                                {selectedCustomer && (
                                    <div className="rounded-md border bg-muted/40 px-3 py-2">
                                        <div className="text-xs text-muted-foreground">Customer</div>
                                        <div className="mt-0.5 truncate font-medium">{selectedCustomer.name}</div>
                                        <div className="truncate text-xs text-muted-foreground">{selectedCustomer.phone}</div>
                                    </div>
                                )}

                                {!selectedVehicle && (
                                    <p className="text-muted-foreground">Select a vehicle to see pricing.</p>
                                )}

                                {selectedVehicle && category && (
                                    <>
                                        <div>
                                            <div className="text-base font-semibold leading-tight">
                                                {selectedVehicle.make} {selectedVehicle.model}
                                            </div>
                                            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                                <span className="font-mono">{selectedVehicle.reg_plate}</span>
                                                <span>·</span>
                                                <span>{category.name}</span>
                                            </div>
                                        </div>

                                        <dl className="space-y-1.5 rounded-md border bg-muted/40 p-3 text-xs">
                                            <div className="flex justify-between">
                                                <dt className="text-muted-foreground">Daily rate</dt>
                                                <dd className="font-medium">{fmt(selectedVehicle.daily_rate, selectedVehicle.currency)}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-muted-foreground">KM / day</dt>
                                                <dd className="font-medium">{category.km_per_day_limit.toLocaleString()} km</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-muted-foreground">Excess km rate</dt>
                                                <dd className="font-medium">{fmt(category.excess_km_rate, category.currency)}/km</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-muted-foreground">Fuel / level short</dt>
                                                <dd className="font-medium">
                                                    {category.fuel_charge_per_level > 0
                                                        ? fmt(category.fuel_charge_per_level, category.currency)
                                                        : '—'}
                                                </dd>
                                            </div>
                                        </dl>

                                        {days ? (
                                            <div className="space-y-2 border-t pt-3 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Rental days</span>
                                                    <span className="font-medium">
                                                        {days} day{days !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">
                                                        Hiring fee ({days} × {fmt(selectedVehicle.daily_rate, selectedVehicle.currency)})
                                                    </span>
                                                    <span className="font-medium">{fmt(estimatedBase!, selectedVehicle.currency)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Security deposit</span>
                                                    <span className="font-medium">{fmt(estimatedDeposit, category.currency)}</span>
                                                </div>
                                                <div className="flex items-baseline justify-between border-t pt-3">
                                                    <span className="text-sm font-semibold">Total due now</span>
                                                    <span className="text-xl font-bold">
                                                        {fmt(totalDue!, selectedVehicle.currency)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Mileage allowance for this rental:{' '}
                                                    <span className="font-medium text-foreground">
                                                        {(days * category.km_per_day_limit).toLocaleString()} km
                                                    </span>
                                                    . Deposit is refunded on return, minus any overage, fuel shortfall or damage.
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="border-t pt-3 text-xs text-muted-foreground">
                                                Set pickup & return to see the total.
                                            </p>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="py-4">
                                <CardTitle className="text-sm">Ready to book</CardTitle>
                                <div className="mt-2 space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">
                                            {completed} of {requiredChecks.length} complete
                                        </span>
                                        <span className="font-medium">{progressPct}%</span>
                                    </div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="h-full rounded-full bg-primary transition-all"
                                            style={{ width: `${progressPct}%` }}
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2 pt-0 pb-5 text-xs">
                                {requiredChecks.map((check) => (
                                    <div key={check.label} className="flex items-center gap-2">
                                        {check.done ? (
                                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                        ) : (
                                            <CircleDashed className="h-3.5 w-3.5 text-muted-foreground" />
                                        )}
                                        <span className={check.done ? '' : 'text-muted-foreground'}>{check.label}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </form>

            <QuickAddCustomerDialog open={customerModalOpen} onOpenChange={setCustomerModalOpen} />
        </>
    );
}

function QuickAddCustomerDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        id_number: '',
        phone: '',
        email: '',
        licence_number: '',
        licence_class: '',
        licence_expiry: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(CustomerRoutes.quickStore.url(), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add New Customer</DialogTitle>
                    <DialogDescription>Quickly register a walk-in customer. You can fill in additional details later.</DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="new-name">Full Name</Label>
                        <Input id="new-name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="John Doe" />
                        <InputError message={errors.name} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="new-phone">Phone</Label>
                        <Input id="new-phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} placeholder="+263 77 123 4567" />
                        <InputError message={errors.phone} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="new-id">National ID</Label>
                        <Input id="new-id" value={data.id_number} onChange={(e) => setData('id_number', e.target.value)} placeholder="63-123456-A-78" />
                        <InputError message={errors.id_number} />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="new-email">Email (optional)</Label>
                        <Input id="new-email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                        <InputError message={errors.email} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="new-lic">Licence Number</Label>
                        <Input id="new-lic" value={data.licence_number} onChange={(e) => setData('licence_number', e.target.value)} />
                        <InputError message={errors.licence_number} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="new-lic-class">Licence Class</Label>
                        <Input id="new-lic-class" value={data.licence_class} onChange={(e) => setData('licence_class', e.target.value)} placeholder="Class 4" />
                        <InputError message={errors.licence_class} />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="new-lic-expiry">Licence Expiry</Label>
                        <DateInput id="new-lic-expiry" value={data.licence_expiry} onChange={(e) => setData('licence_expiry', e.target.value)} />
                        <InputError message={errors.licence_expiry} />
                    </div>

                    <DialogFooter className="sm:col-span-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing}>{processing ? 'Creating…' : 'Create Customer'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

