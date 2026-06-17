import { Head, Link, setLayoutProps, useForm } from '@inertiajs/react';
import { useMemo } from 'react';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Fuel,
    Gauge,
    StopCircle,
    Wrench,
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
import InputError from '@/components/input-error';
import * as Routes from '@/actions/App/Http/Controllers/Web/BookingController';
import { dashboard } from '@/routes';

type FuelLevel = 'empty' | 'quarter' | 'half' | 'three_quarter' | 'full';

interface Props {
    booking: {
        id: number;
        reference: string;
        status: string;
        customer: { name: string; phone: string };
        vehicle: { label: string; reg_plate: string };
        currency: string;
        rental_days: number;
        daily_rate: number;
        base_amount: number;
        extras_amount: number;
        km_allowance: number;
        odometer_start: number;
        fuel_level_pickup: FuelLevel | null;
        deposit_amount: number;
        deposit_held: number;
        deposit_refunded: number;
        excess_km_rate: number;
        fuel_charge_per_level: number;
    };
}

const FUEL_OPTIONS: { value: FuelLevel; label: string; quarters: number }[] = [
    { value: 'empty', label: 'Empty', quarters: 0 },
    { value: 'quarter', label: '1/4', quarters: 1 },
    { value: 'half', label: '1/2', quarters: 2 },
    { value: 'three_quarter', label: '3/4', quarters: 3 },
    { value: 'full', label: 'Full', quarters: 4 },
];

const fuelToQuarters = (level: FuelLevel | null): number =>
    FUEL_OPTIONS.find((f) => f.value === level)?.quarters ?? 0;

function fmt(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(amount);
}

export default function CompleteBooking({ booking }: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Bookings', href: Routes.index.url() },
            {
                title: booking.reference,
                href: Routes.show.url({ booking: booking.id }),
            },
            { title: 'Return vehicle', href: '#' },
        ],
    });

    const { data, setData, post, processing, errors } = useForm({
        odometer_end: String(booking.odometer_start ?? ''),
        fuel_level_return: (booking.fuel_level_pickup ??
            'full') as FuelLevel,
        damage_charge: '',
    });

    // Client-side preview — matches PricingService::quote + reconcileDeposit
    // so staff see the exact math the server will run on submit.
    const preview = useMemo(() => {
        const odometerEnd = parseInt(data.odometer_end, 10);
        const damage = parseFloat(data.damage_charge) || 0;

        if (
            !Number.isFinite(odometerEnd) ||
            odometerEnd < booking.odometer_start
        ) {
            return null;
        }

        const distance = Math.max(0, odometerEnd - booking.odometer_start);
        const excessKm = Math.max(0, distance - booking.km_allowance);
        const mileageOverage = +(excessKm * booking.excess_km_rate).toFixed(2);

        const pickupQ = fuelToQuarters(booking.fuel_level_pickup);
        const returnQ = fuelToQuarters(data.fuel_level_return);
        const levelsShort = Math.max(0, pickupQ - returnQ);
        const fuelCharge = +(
            levelsShort * booking.fuel_charge_per_level
        ).toFixed(2);

        const deductions = +(mileageOverage + fuelCharge + damage).toFixed(2);

        const depositBalance = Math.max(
            0,
            booking.deposit_held - booking.deposit_refunded,
        );
        const refund = Math.max(0, depositBalance - deductions);
        const balanceOwed = Math.max(0, deductions - depositBalance);

        const newTotal = +(
            booking.base_amount +
            booking.extras_amount +
            mileageOverage +
            fuelCharge +
            damage
        ).toFixed(2);

        return {
            distance,
            excessKm,
            mileageOverage,
            levelsShort,
            fuelCharge,
            damage,
            deductions,
            depositBalance,
            refund,
            balanceOwed,
            newTotal,
        };
    }, [
        data.odometer_end,
        data.damage_charge,
        data.fuel_level_return,
        booking,
    ]);

    const odometerInvalid =
        data.odometer_end !== '' &&
        parseInt(data.odometer_end, 10) < booking.odometer_start;

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(Routes.complete.url({ booking: booking.id }), {
            preserveScroll: true,
        });
    };

    return (
        <div className="mx-auto max-w-4xl p-6">
            <Head title={`Return vehicle · ${booking.reference}`} />

            <div className="mb-4 flex items-center gap-3">
                <Link href={Routes.show.url({ booking: booking.id })}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">Return vehicle</h1>
                    <p className="text-sm text-muted-foreground">
                        {booking.reference} · {booking.vehicle.label} ·{' '}
                        {booking.vehicle.reg_plate}
                    </p>
                </div>
            </div>

            <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-5">
                {/* Inputs */}
                <div className="space-y-4 lg:col-span-3">
                    {/* Pickup snapshot */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">
                                Pickup snapshot
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1 text-sm">
                            <Row
                                label="Start odometer"
                                value={`${booking.odometer_start.toLocaleString()} km`}
                            />
                            <Row
                                label="Included mileage"
                                value={`${booking.km_allowance.toLocaleString()} km`}
                            />
                            <Row
                                label="No overage up to"
                                value={`${(
                                    booking.odometer_start +
                                    booking.km_allowance
                                ).toLocaleString()} km`}
                            />
                            {booking.fuel_level_pickup ? (
                                <Row
                                    label="Fuel at pickup"
                                    value={
                                        FUEL_OPTIONS.find(
                                            (f) =>
                                                f.value ===
                                                booking.fuel_level_pickup,
                                        )?.label ?? booking.fuel_level_pickup
                                    }
                                />
                            ) : null}
                            <Row
                                label="Deposit held"
                                value={fmt(
                                    Math.max(
                                        0,
                                        booking.deposit_held -
                                            booking.deposit_refunded,
                                    ),
                                    booking.currency,
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Odometer */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Gauge className="h-4 w-4" />
                                Odometer
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Label htmlFor="odometer_end">Return reading (km)</Label>
                            <Input
                                id="odometer_end"
                                type="number"
                                value={data.odometer_end}
                                onChange={(e) =>
                                    setData('odometer_end', e.target.value)
                                }
                                placeholder={`≥ ${booking.odometer_start.toLocaleString()}`}
                                className={odometerInvalid ? 'border-red-500' : ''}
                            />
                            {odometerInvalid ? (
                                <p className="mt-1 text-xs text-red-600">
                                    End reading must be ≥ start (
                                    {booking.odometer_start.toLocaleString()} km).
                                </p>
                            ) : null}
                            <InputError message={errors.odometer_end} />
                        </CardContent>
                    </Card>

                    {/* Fuel */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Fuel className="h-4 w-4" />
                                Fuel at return
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                                Short of pickup level → fuel top-up charge. Surplus
                                is not credited.
                            </p>
                        </CardHeader>
                        <CardContent>
                            <Select
                                value={data.fuel_level_return}
                                onValueChange={(v) =>
                                    setData('fuel_level_return', v as FuelLevel)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {FUEL_OPTIONS.map((f) => (
                                        <SelectItem key={f.value} value={f.value}>
                                            {f.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.fuel_level_return} />
                        </CardContent>
                    </Card>

                    {/* Damage */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Wrench className="h-4 w-4" />
                                Damage charge ({booking.currency})
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                                Optional. Leave blank or 0 if inspection was clean.
                            </p>
                        </CardHeader>
                        <CardContent>
                            <Input
                                type="number"
                                step="0.01"
                                value={data.damage_charge}
                                onChange={(e) =>
                                    setData('damage_charge', e.target.value)
                                }
                                placeholder="0.00"
                            />
                            <InputError message={errors.damage_charge} />
                        </CardContent>
                    </Card>
                </div>

                {/* Preview */}
                <div className="lg:col-span-2">
                    <Card className="sticky top-4 border-accent bg-accent/5">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Reconciliation</CardTitle>
                            <p className="text-xs text-muted-foreground">
                                Live preview. Matches the server math that runs on
                                submit.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            {preview ? (
                                <>
                                    <div className="space-y-1">
                                        <Row
                                            label="Distance driven"
                                            value={`${preview.distance.toLocaleString()} km`}
                                        />
                                        <Row
                                            label="Excess km"
                                            value={
                                                preview.excessKm > 0
                                                    ? `${preview.excessKm.toLocaleString()} km × ${fmt(
                                                          booking.excess_km_rate,
                                                          booking.currency,
                                                      )}`
                                                    : 'None'
                                            }
                                        />
                                    </div>

                                    <div className="space-y-1 border-t pt-2">
                                        <Row
                                            label="Mileage overage"
                                            value={fmt(
                                                preview.mileageOverage,
                                                booking.currency,
                                            )}
                                        />
                                        <Row
                                            label="Fuel shortfall"
                                            value={
                                                preview.levelsShort > 0
                                                    ? `${preview.levelsShort} × ${fmt(
                                                          booking.fuel_charge_per_level,
                                                          booking.currency,
                                                      )} = ${fmt(
                                                          preview.fuelCharge,
                                                          booking.currency,
                                                      )}`
                                                    : fmt(0, booking.currency)
                                            }
                                        />
                                        <Row
                                            label="Damage"
                                            value={fmt(
                                                preview.damage,
                                                booking.currency,
                                            )}
                                        />
                                        <Row
                                            label="Total deductions"
                                            value={fmt(
                                                preview.deductions,
                                                booking.currency,
                                            )}
                                            bold
                                        />
                                    </div>

                                    <div className="space-y-1 border-t pt-3">
                                        <Row
                                            label="Deposit held"
                                            value={fmt(
                                                preview.depositBalance,
                                                booking.currency,
                                            )}
                                        />
                                    </div>

                                    {preview.refund > 0 ? (
                                        <div className="flex items-start gap-2 rounded-md border border-green-300 bg-green-50 p-3 text-green-900">
                                            <CheckCircle2 className="mt-0.5 h-5 w-5" />
                                            <div className="flex-1">
                                                <div className="text-[10px] font-semibold uppercase tracking-wider">
                                                    Deposit refund
                                                </div>
                                                <div className="text-lg font-bold">
                                                    {fmt(
                                                        preview.refund,
                                                        booking.currency,
                                                    )}
                                                </div>
                                                <div className="text-[11px]">
                                                    Auto-recorded on submit.
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}

                                    {preview.balanceOwed > 0 ? (
                                        <div className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 p-3 text-red-900">
                                            <AlertTriangle className="mt-0.5 h-5 w-5" />
                                            <div className="flex-1">
                                                <div className="text-[10px] font-semibold uppercase tracking-wider">
                                                    Balance owed
                                                </div>
                                                <div className="text-lg font-bold">
                                                    {fmt(
                                                        preview.balanceOwed,
                                                        booking.currency,
                                                    )}
                                                </div>
                                                <div className="text-[11px]">
                                                    Deductions exceed the deposit —
                                                    customer owes the difference on
                                                    the invoice.
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}

                                    {preview.refund === 0 &&
                                    preview.balanceOwed === 0 ? (
                                        <p className="rounded-md border border-muted bg-muted/30 p-3 text-xs text-muted-foreground">
                                            Deposit exactly covers the deductions.
                                        </p>
                                    ) : null}

                                    <div className="border-t pt-3">
                                        <Row
                                            label="New booking total"
                                            value={fmt(
                                                preview.newTotal,
                                                booking.currency,
                                            )}
                                            bold
                                        />
                                    </div>
                                </>
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    Enter a valid return odometer to see the
                                    reconciliation.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="flex items-center justify-end gap-3 lg:col-span-5">
                    <Link href={Routes.show.url({ booking: booking.id })}>
                        <Button type="button" variant="outline">
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        disabled={processing || preview === null}
                    >
                        <StopCircle className="mr-2 h-4 w-4" />
                        Confirm return
                    </Button>
                </div>
            </form>
        </div>
    );
}

function Row({
    label,
    value,
    bold,
}: {
    label: string;
    value: string;
    bold?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-3 py-0.5">
            <span
                className={`text-sm ${bold ? 'font-semibold' : 'text-muted-foreground'}`}
            >
                {label}
            </span>
            <span
                className={`text-sm ${bold ? 'text-base font-bold' : 'font-semibold'}`}
            >
                {value}
            </span>
        </div>
    );
}
