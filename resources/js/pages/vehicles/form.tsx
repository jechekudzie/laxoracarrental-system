import { Head, Link, setLayoutProps, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    Car,
    CheckCircle2,
    CircleDashed,
    Fuel,
    Gauge,
    Info,
    Layers,
    Settings2,
    StickyNote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/input-error';
import * as Routes from '@/actions/App/Http/Controllers/Web/VehicleController';
import * as BookingCategoryRoutes from '@/actions/App/Http/Controllers/Web/BookingCategoryController';
import { dashboard } from '@/routes';

const MAKES_MODELS: Record<string, string[]> = {
    Toyota: ['Fortuner', 'Hilux', 'Land Cruiser 70', 'Land Cruiser Prado', 'RAV4', 'Corolla', 'Camry', 'Vitz', 'Rush', 'Hiace', 'Quantum'],
    Honda: ['Fit', 'Jazz', 'Civic', 'Accord', 'CR-V', 'HR-V', 'Pilot'],
    Nissan: ['Patrol', 'X-Trail', 'Navara', 'Tiida', 'Note', 'March', 'NP300'],
    Mitsubishi: ['Pajero', 'L200 Triton', 'Outlander', 'ASX', 'Eclipse Cross', 'Colt'],
    Mazda: ['CX-5', 'CX-3', 'Axela', 'Demio', 'BT-50'],
    Ford: ['Ranger', 'Everest', 'Explorer', 'Fiesta'],
    Isuzu: ['D-Max', 'MU-X'],
    Hyundai: ['Tucson', 'Santa Fe', 'i20', 'Creta', 'H100'],
    Volkswagen: ['Golf', 'Polo', 'Tiguan', 'Amarok', 'Transporter'],
    'Mercedes-Benz': ['GLE', 'GLC', 'C-Class', 'E-Class', 'Sprinter', 'Vito'],
    BMW: ['X5', 'X3', '3 Series', '5 Series'],
    Suzuki: ['Jimny', 'Swift', 'Grand Vitara', 'Ertiga'],
    Subaru: ['Forester', 'Outback', 'XV'],
    Haval: ['H6', 'H9', 'Jolion'],
    GWM: ['P-Series', 'Cannon', 'Steed'],
    'Land Rover': ['Defender', 'Discovery', 'Range Rover Sport'],
    Jeep: ['Grand Cherokee', 'Wrangler', 'Compass'],
};

interface Option { value: string; label: string }

interface Owner { id: number; name: string; phone: string }

interface BookingCategoryOption {
    id: number;
    name: string;
    slug: string;
    security_deposit: number;
    km_per_day_limit: number;
    excess_km_rate: number;
    fuel_charge_per_level: number;
    currency: string;
}

interface Vehicle {
    id?: number;
    make?: string;
    model?: string;
    year?: number;
    colour?: string;
    reg_plate?: string;
    vin?: string;
    category?: string;
    booking_category_id?: number | null;
    fuel_type?: string;
    transmission?: string;
    seats?: number;
    ownership_type?: string;
    vehicle_owner_id?: number | null;
    owner_agreed_rate?: number | null;
    owner_markup_percent?: number | null;
    daily_rate?: number;
    current_odometer?: number;
    service_interval_km?: number;
    notes?: string;
}

function fmt(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

/** Grouping primitive for each form section. */
function FormSection({
    icon: Icon,
    title,
    description,
    children,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="space-y-1 border-b bg-muted/30 py-4">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {title}
                </CardTitle>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </CardHeader>
            <CardContent className="grid gap-4 p-6 sm:grid-cols-2">{children}</CardContent>
        </Card>
    );
}

export default function VehicleForm({
    vehicle,
    categories,
    fuelTypes,
    transmissions,
    ownershipTypes,
    owners,
    bookingCategories,
}: {
    vehicle: Vehicle | null;
    categories: Option[];
    fuelTypes: Option[];
    transmissions: Option[];
    ownershipTypes: Option[];
    owners: Owner[];
    bookingCategories: BookingCategoryOption[];
}) {
    const isEdit = vehicle?.id != null;

    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Vehicles', href: Routes.index.url() },
            { title: isEdit ? 'Edit' : 'Add Vehicle', href: '#' },
        ],
    });

    const { data, setData, post, put, processing, errors } = useForm({
        make: vehicle?.make ?? '',
        model: vehicle?.model ?? '',
        year: vehicle?.year ?? new Date().getFullYear(),
        colour: vehicle?.colour ?? '',
        reg_plate: vehicle?.reg_plate ?? '',
        vin: vehicle?.vin ?? '',
        category: vehicle?.category ?? '',
        booking_category_id: vehicle?.booking_category_id ? String(vehicle.booking_category_id) : '',
        fuel_type: vehicle?.fuel_type ?? '',
        transmission: vehicle?.transmission ?? '',
        seats: vehicle?.seats ?? 5,
        ownership_type: vehicle?.ownership_type ?? 'owned',
        vehicle_owner_id: vehicle?.vehicle_owner_id ? String(vehicle.vehicle_owner_id) : '',
        new_owner_name: '',
        new_owner_phone: '',
        new_owner_bank_details: '',
        owner_agreed_rate: vehicle?.owner_agreed_rate ?? '',
        owner_markup_percent: vehicle?.owner_markup_percent ?? '',
        daily_rate: vehicle?.daily_rate ?? '',
        current_odometer: vehicle?.current_odometer ?? '',
        service_interval_km: vehicle?.service_interval_km ?? 10000,
        notes: vehicle?.notes ?? '',
    });

    const isOutsourced = data.ownership_type === 'outsourced';
    const selectedBookingCategory = bookingCategories.find((c) => String(c.id) === data.booking_category_id) ?? null;

    const requiredChecks: { label: string; done: boolean }[] = [
        { label: 'Make & model', done: Boolean(data.make && data.model) },
        { label: 'Year & colour', done: Boolean(data.year && data.colour) },
        { label: 'Reg plate', done: Boolean(data.reg_plate) },
        { label: 'Body category & specs', done: Boolean(data.category && data.fuel_type && data.transmission && data.seats) },
        { label: 'Ownership', done: data.ownership_type === 'owned' || Boolean(data.vehicle_owner_id || data.new_owner_name) },
        { label: 'Daily rate', done: Boolean(Number(data.daily_rate) > 0) },
        { label: 'Booking tier', done: Boolean(data.booking_category_id) },
    ];
    const completed = requiredChecks.filter((c) => c.done).length;
    const progressPct = Math.round((completed / requiredChecks.length) * 100);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (isEdit) {
            put(Routes.update.url({ vehicle: vehicle!.id! }));
        } else {
            post(Routes.store.url());
        }
    }

    const previewTitle = [data.make, data.model].filter(Boolean).join(' ') || 'New Vehicle';
    const previewYear = data.year || '—';
    const previewPlate = data.reg_plate || 'REG PLATE';
    const previewRate =
        Number(data.daily_rate) > 0
            ? fmt(Number(data.daily_rate), selectedBookingCategory?.currency ?? 'USD')
            : '—';

    return (
        <>
            <Head title={isEdit ? 'Edit Vehicle' : 'Add Vehicle'} />

            <form onSubmit={submit} className="flex flex-1 flex-col gap-6 p-6">
                {/* Page header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <Link
                            href={isEdit ? Routes.show.url({ vehicle: vehicle!.id! }) : Routes.index.url()}
                            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {isEdit ? 'Back to vehicle' : 'Back to vehicles'}
                        </Link>
                        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                            {isEdit ? `Edit ${previewTitle}` : 'Add a Vehicle'}
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                            {isEdit
                                ? 'Update the vehicle’s details, pricing tier and ownership arrangement. Changes apply to all new bookings.'
                                : 'Register a new vehicle in the fleet. Assign a commercial booking tier so it’s ready to be rented.'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" asChild>
                            <Link href={isEdit ? Routes.show.url({ vehicle: vehicle!.id! }) : Routes.index.url()}>
                                Cancel
                            </Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Vehicle'}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                    {/* Left column — sections */}
                    <div className="flex flex-col gap-6">
                        <FormSection
                            icon={Car}
                            title="Identity"
                            description="What this vehicle is and how it's registered with the authorities."
                        >
                            <div className="space-y-1">
                                <Label>Make</Label>
                                <Select value={data.make} onValueChange={(v) => setData({ ...data, make: v, model: '' })}>
                                    <SelectTrigger><SelectValue placeholder="Select make" /></SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(MAKES_MODELS).map((m) => (
                                            <SelectItem key={m} value={m}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.make} />
                            </div>

                            <div className="space-y-1">
                                <Label>Model</Label>
                                <Select value={data.model} onValueChange={(v) => setData('model', v)} disabled={!data.make}>
                                    <SelectTrigger><SelectValue placeholder={data.make ? 'Select model' : 'Select make first'} /></SelectTrigger>
                                    <SelectContent>
                                        {(MAKES_MODELS[data.make] ?? []).map((m) => (
                                            <SelectItem key={m} value={m}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.model} />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="year">Year</Label>
                                <Input id="year" type="number" value={data.year} onChange={(e) => setData('year', parseInt(e.target.value))} />
                                <InputError message={errors.year} />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="colour">Colour</Label>
                                <Input id="colour" value={data.colour} onChange={(e) => setData('colour', e.target.value)} placeholder="White" />
                                <InputError message={errors.colour} />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="reg_plate">Reg Plate</Label>
                                <Input
                                    id="reg_plate"
                                    value={data.reg_plate}
                                    onChange={(e) => setData('reg_plate', e.target.value.toUpperCase())}
                                    placeholder="AAA 1234"
                                    className="font-mono"
                                />
                                <InputError message={errors.reg_plate} />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="vin">VIN (optional)</Label>
                                <Input id="vin" value={data.vin} onChange={(e) => setData('vin', e.target.value)} className="font-mono" />
                                <InputError message={errors.vin} />
                            </div>
                        </FormSection>

                        <FormSection
                            icon={Settings2}
                            title="Specifications"
                            description="Body type, drivetrain and capacity — used for search and customer-facing filters."
                        >
                            <div className="space-y-1">
                                <Label>Body category</Label>
                                <Select value={data.category} onValueChange={(v) => setData('category', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                    <SelectContent>
                                        {categories.map((c) => (
                                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.category} />
                            </div>

                            <div className="space-y-1">
                                <Label>Fuel type</Label>
                                <Select value={data.fuel_type} onValueChange={(v) => setData('fuel_type', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select fuel type" /></SelectTrigger>
                                    <SelectContent>
                                        {fuelTypes.map((f) => (
                                            <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.fuel_type} />
                            </div>

                            <div className="space-y-1">
                                <Label>Transmission</Label>
                                <Select value={data.transmission} onValueChange={(v) => setData('transmission', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select transmission" /></SelectTrigger>
                                    <SelectContent>
                                        {transmissions.map((t) => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.transmission} />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="seats">Seats</Label>
                                <Input id="seats" type="number" value={data.seats} onChange={(e) => setData('seats', parseInt(e.target.value))} />
                                <InputError message={errors.seats} />
                            </div>
                        </FormSection>

                        <Card className="overflow-hidden">
                            <CardHeader className="space-y-1 border-b bg-muted/30 py-4">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Building2 className="h-4 w-4 text-muted-foreground" /> Ownership
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    In-house vehicles are owned by Laxora. Outsourced vehicles belong to a third-party owner
                                    who gets paid a share of the rental.
                                </p>
                            </CardHeader>
                            <CardContent className="grid gap-4 p-6">
                                <div className="grid grid-cols-2 gap-2">
                                    {ownershipTypes.map((ot) => (
                                        <button
                                            key={ot.value}
                                            type="button"
                                            onClick={() => setData('ownership_type', ot.value)}
                                            className={`rounded-lg border p-3 text-sm font-medium transition-colors ${
                                                data.ownership_type === ot.value
                                                    ? 'border-primary bg-primary/5 text-primary'
                                                    : 'border-input hover:bg-muted/50'
                                            }`}
                                        >
                                            {ot.label}
                                        </button>
                                    ))}
                                </div>
                                <InputError message={errors.ownership_type} />

                                {isOutsourced && (
                                    <div className="space-y-4 rounded-lg border border-dashed bg-muted/20 p-4">
                                        <p className="text-xs text-muted-foreground">
                                            Vehicle supplied by a third-party owner. Record their details and the payout arrangement.
                                        </p>

                                        {owners.length > 0 && (
                                            <div className="space-y-1">
                                                <Label>Existing owner</Label>
                                                <Select
                                                    value={data.vehicle_owner_id}
                                                    onValueChange={(v) => setData('vehicle_owner_id', v === 'new' ? '' : v)}
                                                >
                                                    <SelectTrigger><SelectValue placeholder="Select owner or add new" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="new">+ Add new owner</SelectItem>
                                                        {owners.map((o) => (
                                                            <SelectItem key={o.id} value={String(o.id)}>
                                                                {o.name} — {o.phone}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {!data.vehicle_owner_id && (
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <div className="space-y-1 sm:col-span-2">
                                                    <Label htmlFor="new_owner_name">Owner name</Label>
                                                    <Input
                                                        id="new_owner_name"
                                                        value={data.new_owner_name}
                                                        onChange={(e) => setData('new_owner_name', e.target.value)}
                                                        placeholder="John Moyo"
                                                    />
                                                    <InputError message={errors.new_owner_name} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label htmlFor="new_owner_phone">Phone</Label>
                                                    <Input
                                                        id="new_owner_phone"
                                                        value={data.new_owner_phone}
                                                        onChange={(e) => setData('new_owner_phone', e.target.value)}
                                                        placeholder="+263 77 …"
                                                    />
                                                    <InputError message={errors.new_owner_phone} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label htmlFor="new_owner_bank_details">Bank details (optional)</Label>
                                                    <Input
                                                        id="new_owner_bank_details"
                                                        value={data.new_owner_bank_details}
                                                        onChange={(e) => setData('new_owner_bank_details', e.target.value)}
                                                        placeholder="CABS 1000xxxxxx"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="space-y-1">
                                                <Label htmlFor="owner_agreed_rate">Agreed owner rate (USD/day)</Label>
                                                <Input
                                                    id="owner_agreed_rate"
                                                    type="number"
                                                    step="0.01"
                                                    value={data.owner_agreed_rate}
                                                    onChange={(e) => setData('owner_agreed_rate', e.target.value)}
                                                    placeholder="60.00"
                                                />
                                                <InputError message={errors.owner_agreed_rate} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="owner_markup_percent">Laxora markup %</Label>
                                                <Input
                                                    id="owner_markup_percent"
                                                    type="number"
                                                    step="0.1"
                                                    value={data.owner_markup_percent}
                                                    onChange={(e) => setData('owner_markup_percent', e.target.value)}
                                                    placeholder="25"
                                                />
                                                <InputError message={errors.owner_markup_percent} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden">
                            <CardHeader className="space-y-1 border-b bg-muted/30 py-4">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Layers className="h-4 w-4 text-muted-foreground" /> Pricing & Booking Tier
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    The daily rate is per-vehicle. The booking tier sets the deposit, km allowance, excess rate
                                    and fuel policy for every booking on this vehicle.
                                </p>
                            </CardHeader>
                            <CardContent className="grid gap-5 p-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="daily_rate">Daily rate (USD)</Label>
                                        <Input
                                            id="daily_rate"
                                            type="number"
                                            step="0.01"
                                            value={data.daily_rate}
                                            onChange={(e) => setData('daily_rate', e.target.value)}
                                            placeholder="80.00"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Two vehicles in the same tier can have different daily rates (e.g. outsourced vs in-house).
                                        </p>
                                        <InputError message={errors.daily_rate} />
                                    </div>

                                    <div className="space-y-1">
                                        <Label>Booking tier</Label>
                                        {bookingCategories.length === 0 ? (
                                            <div className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
                                                No active tiers.{' '}
                                                <Link href={BookingCategoryRoutes.create.url()} className="text-primary hover:underline">
                                                    Create one
                                                </Link>
                                                .
                                            </div>
                                        ) : (
                                            <Select
                                                value={data.booking_category_id}
                                                onValueChange={(v) => setData('booking_category_id', v)}
                                            >
                                                <SelectTrigger><SelectValue placeholder="Select booking tier" /></SelectTrigger>
                                                <SelectContent>
                                                    {bookingCategories.map((c) => (
                                                        <SelectItem key={c.id} value={String(c.id)}>
                                                            {c.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            <Link href={BookingCategoryRoutes.index.url()} className="text-primary hover:underline">
                                                Manage tiers
                                            </Link>
                                        </p>
                                        <InputError message={errors.booking_category_id} />
                                    </div>
                                </div>

                                {selectedBookingCategory && (
                                    <div className="rounded-lg border bg-muted/40 p-4">
                                        <div className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Terms applied to every booking on this vehicle
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:grid-cols-4">
                                            <TermStat
                                                icon={Info}
                                                label="Deposit"
                                                value={fmt(selectedBookingCategory.security_deposit, selectedBookingCategory.currency)}
                                            />
                                            <TermStat
                                                icon={Gauge}
                                                label="KM / day"
                                                value={`${selectedBookingCategory.km_per_day_limit.toLocaleString()} km`}
                                            />
                                            <TermStat
                                                icon={Info}
                                                label="Excess"
                                                value={`${fmt(selectedBookingCategory.excess_km_rate, selectedBookingCategory.currency)}/km`}
                                            />
                                            <TermStat
                                                icon={Fuel}
                                                label="Fuel / level"
                                                value={
                                                    selectedBookingCategory.fuel_charge_per_level > 0
                                                        ? fmt(
                                                              selectedBookingCategory.fuel_charge_per_level,
                                                              selectedBookingCategory.currency,
                                                          )
                                                        : '—'
                                                }
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <FormSection
                            icon={StickyNote}
                            title="Operational"
                            description="Odometer reading and internal notes. Only visible to staff."
                        >
                            <div className="space-y-1">
                                <Label htmlFor="current_odometer">Current odometer (km)</Label>
                                <Input
                                    id="current_odometer"
                                    type="number"
                                    value={data.current_odometer}
                                    onChange={(e) => setData('current_odometer', e.target.value)}
                                    placeholder="0"
                                />
                                <InputError message={errors.current_odometer} />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="service_interval_km">Service interval (km)</Label>
                                <Input
                                    id="service_interval_km"
                                    type="number"
                                    value={data.service_interval_km}
                                    onChange={(e) => setData('service_interval_km', parseInt(e.target.value) || 0)}
                                    placeholder="10000"
                                />
                                <p className="text-xs text-muted-foreground">Maintenance alerts fire at this interval.</p>
                                <InputError message={errors.service_interval_km} />
                            </div>

                            <div className="space-y-1 sm:col-span-2">
                                <Label htmlFor="notes">Notes</Label>
                                <textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={3}
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    placeholder="Anything the team should know — damage history, quirks, assigned driver, etc."
                                />
                                <InputError message={errors.notes} />
                            </div>
                        </FormSection>

                        {/* Bottom action bar */}
                        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
                            <p className="text-xs text-muted-foreground">
                                {isEdit
                                    ? 'Changes take effect immediately on new bookings.'
                                    : 'Vehicle will be added as Available once saved.'}
                            </p>
                            <div className="flex gap-2">
                                <Button variant="outline" asChild>
                                    <Link href={isEdit ? Routes.show.url({ vehicle: vehicle!.id! }) : Routes.index.url()}>
                                        Cancel
                                    </Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Vehicle'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Right column — sticky live preview */}
                    <aside className="flex flex-col gap-4 xl:sticky xl:top-6 xl:self-start">
                        <Card className="overflow-hidden">
                            <CardHeader className="border-b bg-gradient-to-br from-primary/5 to-transparent py-4">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Car className="h-4 w-4 text-primary" /> Live preview
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">How this vehicle will look in the fleet.</p>
                            </CardHeader>
                            <CardContent className="space-y-4 p-5">
                                <div>
                                    <div className="text-lg font-semibold leading-tight">{previewTitle}</div>
                                    <div className="mt-0.5 text-xs text-muted-foreground">
                                        {previewYear} {data.colour ? `· ${data.colour}` : ''}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
                                    <span className="text-xs text-muted-foreground">Reg</span>
                                    <span className="font-mono text-sm font-semibold tracking-wide">{previewPlate}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <PreviewChip label="Body" value={data.category || '—'} />
                                    <PreviewChip label="Fuel" value={data.fuel_type || '—'} />
                                    <PreviewChip label="Gearbox" value={data.transmission || '—'} />
                                    <PreviewChip label="Seats" value={data.seats ? String(data.seats) : '—'} />
                                </div>

                                <div className="rounded-md border bg-muted/40 p-3">
                                    <div className="text-xs text-muted-foreground">Daily rate</div>
                                    <div className="mt-0.5 text-xl font-semibold">{previewRate}</div>
                                </div>

                                <div className="rounded-md border bg-muted/40 p-3">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs text-muted-foreground">Booking tier</div>
                                        {selectedBookingCategory && (
                                            <span className="font-mono text-[10px] uppercase text-muted-foreground">
                                                {selectedBookingCategory.slug}
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-0.5 text-sm font-semibold">
                                        {selectedBookingCategory?.name ?? 'Not selected'}
                                    </div>
                                    {selectedBookingCategory && (
                                        <dl className="mt-3 space-y-1.5 border-t pt-3 text-xs">
                                            <div className="flex justify-between">
                                                <dt className="text-muted-foreground">Deposit</dt>
                                                <dd className="font-medium">
                                                    {fmt(selectedBookingCategory.security_deposit, selectedBookingCategory.currency)}
                                                </dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-muted-foreground">KM / day</dt>
                                                <dd className="font-medium">
                                                    {selectedBookingCategory.km_per_day_limit.toLocaleString()} km
                                                </dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-muted-foreground">Excess km</dt>
                                                <dd className="font-medium">
                                                    {fmt(selectedBookingCategory.excess_km_rate, selectedBookingCategory.currency)}/km
                                                </dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-muted-foreground">Fuel / level</dt>
                                                <dd className="font-medium">
                                                    {selectedBookingCategory.fuel_charge_per_level > 0
                                                        ? fmt(
                                                              selectedBookingCategory.fuel_charge_per_level,
                                                              selectedBookingCategory.currency,
                                                          )
                                                        : '—'}
                                                </dd>
                                            </div>
                                        </dl>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="py-4">
                                <CardTitle className="text-sm">Ready to save</CardTitle>
                                <div className="mt-2 space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">{completed} of {requiredChecks.length} sections complete</span>
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
        </>
    );
}

function PreviewChip({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border bg-muted/40 px-2 py-1.5">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className="mt-0.5 truncate text-sm font-medium capitalize">{value}</div>
        </div>
    );
}

function TermStat({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
}) {
    return (
        <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon className="h-3 w-3" /> {label}
            </div>
            <div className="mt-0.5 text-base font-semibold">{value}</div>
        </div>
    );
}
