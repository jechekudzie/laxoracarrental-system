import { Head, Link, setLayoutProps, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    ClipboardCheck,
    Fuel,
    Gauge,
    ShieldCheck,
    XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import InputError from '@/components/input-error';
import * as Routes from '@/actions/App/Http/Controllers/Web/BookingController';
import { dashboard } from '@/routes';

type Condition = 'ok' | 'fair' | 'poor' | 'damaged' | 'missing';
type FuelLevel = 'empty' | 'quarter' | 'half' | 'three_quarter' | 'full';
type InspectionType = 'pickup' | 'return';

interface ChecklistItem {
    key: string;
    label: string;
    condition: Condition | null;
    notes: string;
}

interface Props {
    booking: {
        id: number;
        reference: string;
        status: string;
        customer: { name: string; phone: string };
        vehicle: {
            label: string;
            reg_plate: string;
            current_odometer: number;
        };
        odometer_start: number | null;
        odometer_end: number | null;
        fuel_level_pickup: string | null;
        fuel_level_return: string | null;
    };
    type: InspectionType;
    items: ChecklistItem[];
    existing: {
        odometer: number | null;
        fuel_level: FuelLevel | null;
        exterior_notes: string | null;
        interior_notes: string | null;
        damage_summary: string | null;
        customer_signature_name: string | null;
        signed_by_customer: boolean;
        photos: string[];
    } | null;
}

const FUEL_OPTIONS: { value: FuelLevel; label: string }[] = [
    { value: 'empty', label: 'Empty' },
    { value: 'quarter', label: '1/4' },
    { value: 'half', label: '1/2' },
    { value: 'three_quarter', label: '3/4' },
    { value: 'full', label: 'Full' },
];

const CONDITION_STYLES: Record<
    Condition,
    { label: string; badge: string; button: string }
> = {
    ok: {
        label: 'OK',
        badge: 'bg-green-100 text-green-800 border-green-300',
        button:
            'data-[selected=true]:bg-green-600 data-[selected=true]:text-white data-[selected=true]:border-green-600',
    },
    fair: {
        label: 'Fair',
        badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        button:
            'data-[selected=true]:bg-yellow-500 data-[selected=true]:text-white data-[selected=true]:border-yellow-500',
    },
    poor: {
        label: 'Poor',
        badge: 'bg-orange-100 text-orange-800 border-orange-300',
        button:
            'data-[selected=true]:bg-orange-500 data-[selected=true]:text-white data-[selected=true]:border-orange-500',
    },
    damaged: {
        label: 'Damaged',
        badge: 'bg-red-100 text-red-800 border-red-300',
        button:
            'data-[selected=true]:bg-red-600 data-[selected=true]:text-white data-[selected=true]:border-red-600',
    },
    missing: {
        label: 'Missing',
        badge: 'bg-slate-200 text-slate-800 border-slate-300',
        button:
            'data-[selected=true]:bg-slate-700 data-[selected=true]:text-white data-[selected=true]:border-slate-700',
    },
};

const CONDITIONS: Condition[] = ['ok', 'fair', 'poor', 'damaged', 'missing'];

export default function InspectionForm({ booking, type, items, existing }: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Bookings', href: Routes.index.url() },
            {
                title: booking.reference,
                href: Routes.show.url({ booking: booking.id }),
            },
            {
                title: `${type === 'pickup' ? 'Pickup' : 'Return'} inspection`,
                href: '#',
            },
        ],
    });

    const defaultOdometer =
        existing?.odometer ??
        (type === 'pickup'
            ? booking.odometer_start ?? booking.vehicle.current_odometer
            : booking.odometer_end ?? booking.vehicle.current_odometer);

    const defaultFuel =
        existing?.fuel_level ??
        ((type === 'pickup'
            ? booking.fuel_level_pickup
            : booking.fuel_level_return) as FuelLevel | null) ??
        'full';

    const { data, setData, post, processing, errors } = useForm({
        type,
        odometer: String(defaultOdometer ?? ''),
        fuel_level: defaultFuel as FuelLevel,
        items: items as ChecklistItem[],
        exterior_notes: existing?.exterior_notes ?? '',
        interior_notes: existing?.interior_notes ?? '',
        damage_summary: existing?.damage_summary ?? '',
        customer_signature_name: existing?.customer_signature_name ?? '',
        signed_by_customer: existing?.signed_by_customer ?? false,
    });

    const updateItem = (index: number, patch: Partial<ChecklistItem>) => {
        const next = [...data.items];
        next[index] = { ...next[index], ...patch };
        setData('items', next);
    };

    const completedCount = data.items.filter((i) => i.condition !== null).length;
    const damagedCount = data.items.filter(
        (i) => i.condition === 'damaged' || i.condition === 'missing',
    ).length;

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(
            Routes.storeInspection.url({ booking: booking.id }),
            { preserveScroll: true },
        );
    };

    return (
        <div className="mx-auto max-w-4xl p-6">
            <Head title={`${type === 'pickup' ? 'Pickup' : 'Return'} inspection · ${booking.reference}`} />

            <div className="mb-4 flex items-center gap-3">
                <Link href={Routes.show.url({ booking: booking.id })}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold capitalize">
                        {type} inspection
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {booking.reference} · {booking.vehicle.label} ·{' '}
                        {booking.vehicle.reg_plate}
                    </p>
                </div>
                {damagedCount > 0 ? (
                    <div className="flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-800">
                        <AlertTriangle className="h-4 w-4" />
                        {damagedCount} issue{damagedCount === 1 ? '' : 's'}
                    </div>
                ) : null}
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
                {/* Readings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Gauge className="h-4 w-4" />
                            Readings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div>
                            <Label htmlFor="odometer">Odometer (km)</Label>
                            <Input
                                id="odometer"
                                type="number"
                                value={data.odometer}
                                onChange={(e) => setData('odometer', e.target.value)}
                                placeholder="e.g. 42510"
                            />
                            <InputError message={errors.odometer} />
                        </div>
                        <div>
                            <Label htmlFor="fuel_level">Fuel level</Label>
                            <Select
                                value={data.fuel_level}
                                onValueChange={(v) => setData('fuel_level', v as FuelLevel)}
                            >
                                <SelectTrigger id="fuel_level">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {FUEL_OPTIONS.map((f) => (
                                        <SelectItem key={f.value} value={f.value}>
                                            <Fuel className="mr-2 inline h-3 w-3" />
                                            {f.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.fuel_level} />
                        </div>
                    </CardContent>
                </Card>

                {/* Checklist */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ClipboardCheck className="h-4 w-4" />
                            Checklist
                            <span className="ml-auto text-xs font-normal text-muted-foreground">
                                {completedCount} / {data.items.length} items
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {data.items.map((item, i) => (
                            <div
                                key={item.key}
                                className="space-y-2 rounded-lg border p-4"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <Label className="text-sm font-semibold">
                                        {item.label}
                                    </Label>
                                    <div className="flex flex-wrap gap-1">
                                        {CONDITIONS.map((c) => {
                                            const selected = item.condition === c;
                                            const style = CONDITION_STYLES[c];
                                            return (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    data-selected={selected}
                                                    onClick={() =>
                                                        updateItem(i, {
                                                            condition: selected ? null : c,
                                                        })
                                                    }
                                                    className={`rounded-md border px-2.5 py-1 text-xs font-medium transition hover:bg-muted/50 ${style.button}`}
                                                >
                                                    {style.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                {item.condition && item.condition !== 'ok' ? (
                                    <Input
                                        placeholder={`Notes on ${item.label.toLowerCase()}…`}
                                        value={item.notes}
                                        onChange={(e) =>
                                            updateItem(i, { notes: e.target.value })
                                        }
                                        className="text-sm"
                                    />
                                ) : null}
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Notes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ShieldCheck className="h-4 w-4" />
                            Notes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="exterior_notes">Exterior notes</Label>
                            <textarea
                                id="exterior_notes"
                                rows={3}
                                value={data.exterior_notes}
                                onChange={(e) =>
                                    setData('exterior_notes', e.target.value)
                                }
                                className="w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="Scratches, dents, missing trim…"
                            />
                        </div>
                        <div>
                            <Label htmlFor="interior_notes">Interior notes</Label>
                            <textarea
                                id="interior_notes"
                                rows={3}
                                value={data.interior_notes}
                                onChange={(e) =>
                                    setData('interior_notes', e.target.value)
                                }
                                className="w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="Seats, dashboard, cleanliness…"
                            />
                        </div>
                        <div>
                            <Label htmlFor="damage_summary">
                                Damage summary{' '}
                                {damagedCount > 0 ? (
                                    <span className="text-red-600">(required)</span>
                                ) : null}
                            </Label>
                            <textarea
                                id="damage_summary"
                                rows={3}
                                value={data.damage_summary}
                                onChange={(e) =>
                                    setData('damage_summary', e.target.value)
                                }
                                className="w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="Describe any new damage vs. pickup…"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Signature */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Customer sign-off</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="signed_by_customer"
                                checked={data.signed_by_customer}
                                onCheckedChange={(v) =>
                                    setData('signed_by_customer', Boolean(v))
                                }
                            />
                            <Label htmlFor="signed_by_customer">
                                Customer has reviewed and agreed to this inspection
                            </Label>
                        </div>
                        <div>
                            <Label htmlFor="customer_signature_name">
                                Customer name (typed signature)
                            </Label>
                            <Input
                                id="customer_signature_name"
                                value={data.customer_signature_name}
                                onChange={(e) =>
                                    setData('customer_signature_name', e.target.value)
                                }
                                placeholder={booking.customer.name}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-center justify-end gap-3">
                    <Link href={Routes.show.url({ booking: booking.id })}>
                        <Button type="button" variant="outline">
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                    </Link>
                    <Button type="submit" disabled={processing}>
                        <ClipboardCheck className="mr-2 h-4 w-4" />
                        Save inspection
                    </Button>
                </div>
            </form>
        </div>
    );
}
