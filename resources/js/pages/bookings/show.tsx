import { Head, Link, router, setLayoutProps, useForm } from '@inertiajs/react';
import { AlertTriangle, ArrowRight, Banknote, Calendar, Car, CheckCircle, CircleDollarSign, ClipboardCheck, Clock, FileText, Gauge, Globe, MapPin, Phone, PiggyBank, PlayCircle, Plus, Receipt, Shield, Star, Trash2, Undo2, User, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DateTimeInput } from '@/components/ui/date-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/input-error';
import * as Routes from '@/actions/App/Http/Controllers/Web/BookingController';
import * as CustomerRoutes from '@/actions/App/Http/Controllers/Web/CustomerController';
import * as VehicleRoutes from '@/actions/App/Http/Controllers/Web/VehicleController';
import * as InvoiceRoutes from '@/actions/App/Http/Controllers/Web/InvoiceController';
import * as PaymentRoutes from '@/actions/App/Http/Controllers/Web/PaymentController';
import { dashboard } from '@/routes';

interface Inspection {
    id: number;
    type: string;
    odometer: number | null;
    fuel_level: string | null;
    items: Array<{ key: string; label: string; condition: string; notes?: string }>;
    exterior_notes: string | null;
    damage_summary: string | null;
    created_at: string;
}

interface Rating {
    score_condition: number;
    score_timeliness: number;
    score_payment: number;
    score_communication: number;
    score_care: number;
    average: number;
    comment: string | null;
}

interface PaymentRecord {
    id: number;
    reference: string;
    type: string;
    type_label: string;
    amount: number;
    method: string;
    status: string;
    gateway_reference: string | null;
    paid_at: string | null;
    notes: string | null;
}

interface DepositSummary {
    held: number;
    refunded: number;
    balance: number;
    expected: number;
    suggested_refund: number;
    charges_from_deposit: {
        mileage: number;
        damage: number;
        fuel: number;
    };
}

interface BookingDetail {
    id: number;
    reference: string;
    status: string;
    cross_border: boolean;
    customer: { id: number; name: string; phone: string; email: string | null };
    vehicle: { id: number; make: string; model: string; year: number; label: string; reg_plate: string };
    invoice: { id: number; number: string; status: string; total: number; paid_amount: number } | null;
    pickup_datetime: string;
    return_datetime: string;
    actual_pickup_at: string | null;
    actual_return_at: string | null;
    pickup_location: string | null;
    return_location: string | null;
    rental_days: number;
    km_allowance: number;
    daily_rate: number;
    excess_km_rate: number;
    currency: string;
    odometer_start: number | null;
    odometer_end: number | null;
    base_amount: number;
    mileage_overage_amount: number;
    extras_amount: number;
    fuel_charge: number;
    damage_charge: number;
    total_amount: number;
    deposit_amount: number;
    paid_amount: number;
    rental_paid: number;
    notes: string | null;
    cancellation_reason: string | null;
    created_at: string;
    inspections: Inspection[];
    rating: Rating | null;
    payments: PaymentRecord[];
    deposit_summary: DepositSummary;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; ring: string; label: string }> = {
    pending: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-800 dark:text-yellow-400', ring: 'ring-yellow-200 dark:ring-yellow-900/50', label: 'Pending' },
    confirmed: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-800 dark:text-blue-400', ring: 'ring-blue-200 dark:ring-blue-900/50', label: 'Confirmed' },
    active: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-800 dark:text-emerald-400', ring: 'ring-emerald-200 dark:ring-emerald-900/50', label: 'Active Rental' },
    completed: { bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'text-gray-700 dark:text-gray-300', ring: 'ring-gray-200 dark:ring-gray-800', label: 'Completed' },
    cancelled: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-800 dark:text-red-400', ring: 'ring-red-200 dark:ring-red-900/50', label: 'Cancelled' },
};

const CONDITION_STYLES: Record<string, string> = {
    ok: 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20',
    fair: 'text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
    poor: 'text-orange-700 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20',
    damaged: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
    missing: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800',
};

const WORKFLOW = ['pending', 'confirmed', 'active', 'completed'];

function fmt(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function fmtDatetime(d: string) {
    return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function WorkflowStepper({ status }: { status: string }) {
    if (status === 'cancelled') return null;
    const currentIndex = WORKFLOW.indexOf(status);

    return (
        <div className="flex items-center gap-2">
            {WORKFLOW.map((step, i) => {
                const isDone = i < currentIndex;
                const isCurrent = i === currentIndex;
                return (
                    <div key={step} className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                                isDone ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : 'bg-muted text-muted-foreground'
                            }`}>
                                {isDone ? <CheckCircle className="h-4 w-4" /> : i + 1}
                            </div>
                            <span className={`text-xs font-medium capitalize ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>{step}</span>
                        </div>
                        {i < WORKFLOW.length - 1 && <div className={`h-0.5 w-8 ${i < currentIndex ? 'bg-emerald-500' : 'bg-muted'}`} />}
                    </div>
                );
            })}
        </div>
    );
}

function ConfirmAction({ bookingId }: { bookingId: number }) {
    const { post, processing } = useForm({});
    return (
        <Button onClick={() => post(Routes.confirm.url({ booking: bookingId }))} disabled={processing}>
            <CheckCircle className="mr-2 h-4 w-4" /> Confirm Booking
        </Button>
    );
}

function ActivateAction({ bookingId }: { bookingId: number }) {
    const { data, setData, post, processing, errors } = useForm({ odometer_start: '' });
    const [open, setOpen] = useState(false);

    if (!open) {
        return <Button onClick={() => setOpen(true)}><PlayCircle className="mr-2 h-4 w-4" /> Pick Up Vehicle</Button>;
    }

    return (
        <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
                e.preventDefault();
                post(Routes.activate.url({ booking: bookingId }), { onSuccess: () => setOpen(false) });
            }}
        >
            <div className="space-y-1">
                <Label htmlFor="odometer_start" className="text-xs">Pickup Odometer (km)</Label>
                <Input id="odometer_start" type="number" value={data.odometer_start} onChange={(e) => setData('odometer_start', e.target.value)} className="w-40" />
                <InputError message={errors.odometer_start} />
            </div>
            <Button type="submit" disabled={processing}>Confirm Pickup</Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
        </form>
    );
}

function CancelAction({ bookingId }: { bookingId: number }) {
    const { data, setData, post, processing, errors } = useForm({ reason: '' });
    const [open, setOpen] = useState(false);

    if (!open) {
        return (
            <Button variant="outline" onClick={() => setOpen(true)}>
                <XCircle className="mr-2 h-4 w-4" /> Cancel
            </Button>
        );
    }

    return (
        <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
                e.preventDefault();
                post(Routes.cancel.url({ booking: bookingId }), { onSuccess: () => setOpen(false) });
            }}
        >
            <div className="space-y-1">
                <Label htmlFor="reason" className="text-xs">Cancellation Reason</Label>
                <Input id="reason" value={data.reason} onChange={(e) => setData('reason', e.target.value)} className="w-64" />
                <InputError message={errors.reason} />
            </div>
            <Button type="submit" variant="destructive" disabled={processing}>Cancel Booking</Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Back</Button>
        </form>
    );
}

export default function BookingShow({
    booking,
    paymentMethods,
    paymentTypes,
}: {
    booking: BookingDetail;
    paymentMethods: { value: string; label: string }[];
    paymentTypes: { value: string; label: string }[];
}) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Bookings', href: Routes.index.url() },
            { title: booking.reference, href: Routes.show.url({ booking: booking.id }) },
        ],
    });

    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [refundDialogOpen, setRefundDialogOpen] = useState(false);
    const statusStyle = STATUS_STYLES[booking.status] ?? STATUS_STYLES.pending;
    const pickupInspection = booking.inspections.find((i) => i.type === 'pickup');
    const returnInspection = booking.inspections.find((i) => i.type === 'return');
    const balance = booking.total_amount - booking.paid_amount;

    return (
        <>
            <Head title={`Booking ${booking.reference}`} />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Hero header */}
                <div className={`relative overflow-hidden rounded-2xl ${statusStyle.bg} p-6 ring-1 ${statusStyle.ring}`}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="font-mono text-2xl font-bold tracking-tight">{booking.reference}</h1>
                                <span className={`inline-flex items-center rounded-full bg-white/60 backdrop-blur px-3 py-1 text-xs font-semibold ring-1 ${statusStyle.ring} ${statusStyle.text}`}>
                                    {statusStyle.label}
                                </span>
                                {booking.cross_border && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-white/60 backdrop-blur px-3 py-1 text-xs font-medium text-orange-700 ring-1 ring-orange-200">
                                        <Globe className="h-3 w-3" /> Cross border
                                    </span>
                                )}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">Created {fmtDatetime(booking.created_at)}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {booking.status === 'pending' && (
                                <>
                                    <ConfirmAction bookingId={booking.id} />
                                    <CancelAction bookingId={booking.id} />
                                </>
                            )}
                            {booking.status === 'confirmed' && (
                                <>
                                    <ActivateAction bookingId={booking.id} />
                                    <CancelAction bookingId={booking.id} />
                                </>
                            )}
                            {booking.status === 'active' && (
                                <>
                                    <Link href={`/bookings/${booking.id}/inspections/create?type=return`}>
                                        <Button variant="outline">
                                            <ClipboardCheck className="mr-2 h-4 w-4" />
                                            Return inspection
                                        </Button>
                                    </Link>
                                    <Link href={`/bookings/${booking.id}/complete`}>
                                        <Button>
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Return vehicle
                                        </Button>
                                    </Link>
                                </>
                            )}
                            {booking.status === 'confirmed' && (
                                <Link href={`/bookings/${booking.id}/inspections/create?type=pickup`}>
                                    <Button variant="outline">
                                        <ClipboardCheck className="mr-2 h-4 w-4" />
                                        Pickup inspection
                                    </Button>
                                </Link>
                            )}
                            {booking.status === 'completed' && !booking.rating && (
                                <Link href={`/bookings/${booking.id}/rating/create`}>
                                    <Button variant="outline">
                                        <Star className="mr-2 h-4 w-4" />
                                        Rate customer
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="mt-6">
                        <WorkflowStepper status={booking.status} />
                    </div>
                </div>

                {booking.cancellation_reason && (
                    <Card className="border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10">
                        <CardContent className="flex items-start gap-3 p-4">
                            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-red-900 dark:text-red-400">Booking cancelled</p>
                                <p className="text-sm text-red-800 dark:text-red-300">{booking.cancellation_reason}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Parties — customer + vehicle + invoice link */}
                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Customer card */}
                    <Link href={CustomerRoutes.show.url({ customer: booking.customer.id })} className="group">
                        <Card className="transition-shadow group-hover:shadow-md h-full">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Customer</p>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="mt-3 flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <User className="h-6 w-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold truncate">{booking.customer.name}</p>
                                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Phone className="h-3 w-3" /> {booking.customer.phone}
                                        </p>
                                        {booking.customer.email && <p className="truncate text-xs text-muted-foreground">{booking.customer.email}</p>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Vehicle card */}
                    <Link href={VehicleRoutes.show.url({ vehicle: booking.vehicle.id })} className="group">
                        <Card className="transition-shadow group-hover:shadow-md h-full">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Vehicle</p>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="mt-3 flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                        <Car className="h-6 w-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold truncate">{booking.vehicle.make} {booking.vehicle.model}</p>
                                        <p className="text-xs text-muted-foreground">{booking.vehicle.year}</p>
                                        <p className="font-mono text-xs text-muted-foreground">{booking.vehicle.reg_plate}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Invoice card */}
                    {booking.invoice ? (
                        <Link href={InvoiceRoutes.show.url({ invoice: booking.invoice.id })} className="group">
                            <Card className="transition-shadow group-hover:shadow-md h-full">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between">
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Invoice</p>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="mt-3 flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                            <Receipt className="h-6 w-6" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-mono font-semibold truncate">{booking.invoice.number}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{booking.invoice.status.replace('_', ' ')}</p>
                                            <p className="text-sm font-semibold">{fmt(booking.invoice.total, booking.currency)}</p>
                                        </div>
                                    </div>
                                    <p className="mt-3 text-xs text-primary font-medium">View & print invoice →</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ) : (
                        <Card className="h-full border-dashed">
                            <CardContent className="flex flex-col items-center justify-center gap-3 p-5 text-center">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                                <p className="text-sm font-medium">No invoice yet</p>
                                <Button
                                    size="sm"
                                    onClick={() => router.post(Routes.generateInvoice.url({ booking: booking.id }), {}, { preserveScroll: true })}
                                >
                                    <FileText className="mr-2 h-4 w-4" /> Generate Invoice
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Schedule & financials */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-2">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <CardTitle className="text-base">Schedule</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-lg border p-3">
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Pickup</p>
                                    <p className="mt-1 font-semibold">{fmtDatetime(booking.pickup_datetime)}</p>
                                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                        <MapPin className="h-3 w-3" /> {booking.pickup_location ?? '—'}
                                    </p>
                                </div>
                                <div className="rounded-lg border p-3">
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Return</p>
                                    <p className="mt-1 font-semibold">{fmtDatetime(booking.return_datetime)}</p>
                                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                        <MapPin className="h-3 w-3" /> {booking.return_location ?? '—'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3 text-sm">
                                <span className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /> Rental duration</span>
                                <span className="font-semibold">{booking.rental_days} {booking.rental_days === 1 ? 'day' : 'days'}</span>
                            </div>

                            {(booking.actual_pickup_at || booking.actual_return_at) && (
                                <div className="space-y-1 rounded-lg border border-dashed p-3 text-xs">
                                    {booking.actual_pickup_at && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Actual pickup</span>
                                            <span>{fmtDatetime(booking.actual_pickup_at)}</span>
                                        </div>
                                    )}
                                    {booking.actual_return_at && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Actual return</span>
                                            <span>{fmtDatetime(booking.actual_return_at)}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {(booking.odometer_start != null || booking.odometer_end != null) && (
                                <div className="flex items-center justify-between rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-sm">
                                    <span className="flex items-center gap-2 text-blue-900 dark:text-blue-400"><Gauge className="h-4 w-4" /> Odometer</span>
                                    <span className="font-semibold text-blue-900 dark:text-blue-400">
                                        {booking.odometer_start?.toLocaleString() ?? '—'} → {booking.odometer_end?.toLocaleString() ?? '—'} km
                                        {booking.odometer_start != null && booking.odometer_end != null && (
                                            <span className="ml-2 text-xs opacity-70">({(booking.odometer_end - booking.odometer_start).toLocaleString()} km driven)</span>
                                        )}
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center gap-2">
                            <CircleDollarSign className="h-5 w-5 text-muted-foreground" />
                            <CardTitle className="text-base">Pricing Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between py-1.5 border-b">
                                <span className="text-muted-foreground">Daily rate × {booking.rental_days} days</span>
                                <span className="font-medium">{fmt(booking.base_amount, booking.currency)}</span>
                            </div>
                            {booking.mileage_overage_amount > 0 && (
                                <div className="flex justify-between py-1.5 border-b">
                                    <span className="text-muted-foreground">Mileage overage</span>
                                    <span className="font-medium">{fmt(booking.mileage_overage_amount, booking.currency)}</span>
                                </div>
                            )}
                            {booking.extras_amount > 0 && (
                                <div className="flex justify-between py-1.5 border-b">
                                    <span className="text-muted-foreground">Extras</span>
                                    <span className="font-medium">{fmt(booking.extras_amount, booking.currency)}</span>
                                </div>
                            )}
                            {booking.fuel_charge > 0 && (
                                <div className="flex justify-between py-1.5 border-b">
                                    <span className="text-muted-foreground">Fuel</span>
                                    <span className="font-medium">{fmt(booking.fuel_charge, booking.currency)}</span>
                                </div>
                            )}
                            {booking.damage_charge > 0 && (
                                <div className="flex justify-between py-1.5 border-b">
                                    <span className="text-muted-foreground">Damage</span>
                                    <span className="font-medium">{fmt(booking.damage_charge, booking.currency)}</span>
                                </div>
                            )}
                            <div className="flex justify-between py-2 border-b-2 border-t">
                                <span className="font-semibold">Total</span>
                                <span className="text-lg font-bold">{fmt(booking.total_amount, booking.currency)}</span>
                            </div>
                            <div className="flex justify-between py-1.5 text-xs">
                                <span className="text-muted-foreground">Deposit</span>
                                <span>{fmt(booking.deposit_amount, booking.currency)}</span>
                            </div>
                            <div className="flex justify-between py-1.5 text-xs">
                                <span className="text-muted-foreground">Paid</span>
                                <span className="text-emerald-600">{fmt(booking.paid_amount, booking.currency)}</span>
                            </div>
                            <div className={`flex justify-between rounded-lg p-3 mt-2 ${balance > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'}`}>
                                <span className={`font-semibold ${balance > 0 ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                                    {balance > 0 ? 'Outstanding balance' : 'Fully settled'}
                                </span>
                                <span className={`font-bold ${balance > 0 ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                                    {fmt(Math.abs(balance), booking.currency)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Deposit tracker */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Shield className="h-5 w-5 text-muted-foreground" /> Security Deposit
                        </CardTitle>
                        {booking.deposit_summary.balance > 0 && (
                            <Button size="sm" onClick={() => setRefundDialogOpen(true)}>
                                <Undo2 className="mr-2 h-4 w-4" /> Refund Deposit
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-4 text-sm">
                            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
                                <p className="text-xs uppercase text-blue-700 dark:text-blue-400">Expected</p>
                                <p className="mt-1 text-xl font-bold text-blue-900 dark:text-blue-300">{fmt(booking.deposit_summary.expected, booking.currency)}</p>
                                <p className="text-xs text-blue-700/70 dark:text-blue-400/70">per booking terms</p>
                            </div>
                            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-3">
                                <p className="text-xs uppercase text-emerald-700 dark:text-emerald-400">Held</p>
                                <p className="mt-1 text-xl font-bold text-emerald-900 dark:text-emerald-300">{fmt(booking.deposit_summary.held, booking.currency)}</p>
                                <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70">collected from customer</p>
                            </div>
                            <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 p-3">
                                <p className="text-xs uppercase text-purple-700 dark:text-purple-400">Refunded</p>
                                <p className="mt-1 text-xl font-bold text-purple-900 dark:text-purple-300">{fmt(booking.deposit_summary.refunded, booking.currency)}</p>
                                <p className="text-xs text-purple-700/70 dark:text-purple-400/70">returned to customer</p>
                            </div>
                            {(() => {
                                // Deducted = portion of the deposit the business
                                // kept to cover overage / fuel / damage, capped at
                                // what was actually held. Only surfaces after
                                // completion (deduction fields are 0 before that).
                                const totalDeductions =
                                    booking.deposit_summary.charges_from_deposit.mileage +
                                    booking.deposit_summary.charges_from_deposit.damage +
                                    booking.deposit_summary.charges_from_deposit.fuel;
                                const isCompleted = booking.status === 'completed';
                                const deducted = isCompleted
                                    ? Math.min(booking.deposit_summary.held, totalDeductions)
                                    : 0;

                                if (deducted > 0) {
                                    return (
                                        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3">
                                            <p className="text-xs uppercase text-red-700 dark:text-red-400">Deducted</p>
                                            <p className="mt-1 text-xl font-bold text-red-900 dark:text-red-300">
                                                {fmt(deducted, booking.currency)}
                                            </p>
                                            <p className="text-xs text-red-700/70 dark:text-red-400/70">
                                                kept for overage / fuel / damage
                                            </p>
                                        </div>
                                    );
                                }

                                const balance = Math.max(
                                    0,
                                    booking.deposit_summary.balance - deducted,
                                );
                                return (
                                    <div className={`rounded-lg p-3 ${balance > 0 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-muted/40'}`}>
                                        <p className={`text-xs uppercase ${balance > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'}`}>
                                            Balance Held
                                        </p>
                                        <p className={`mt-1 text-xl font-bold ${balance > 0 ? 'text-amber-900 dark:text-amber-300' : 'text-foreground'}`}>
                                            {fmt(balance, booking.currency)}
                                        </p>
                                        <p className={`text-xs ${balance > 0 ? 'text-amber-700/70 dark:text-amber-400/70' : 'text-muted-foreground'}`}>
                                            {balance > 0 ? 'pending return' : 'settled'}
                                        </p>
                                    </div>
                                );
                            })()}
                        </div>

                        {(booking.deposit_summary.charges_from_deposit.mileage > 0 ||
                          booking.deposit_summary.charges_from_deposit.damage > 0 ||
                          booking.deposit_summary.charges_from_deposit.fuel > 0) && (
                            <div className="mt-4 rounded-lg border border-dashed p-4">
                                <p className="text-xs font-semibold uppercase text-muted-foreground">Deductions from deposit</p>
                                <div className="mt-2 space-y-1 text-sm">
                                    {booking.deposit_summary.charges_from_deposit.mileage > 0 && (
                                        <div className="flex justify-between"><span>Mileage overage</span><span className="font-medium text-red-600">−{fmt(booking.deposit_summary.charges_from_deposit.mileage, booking.currency)}</span></div>
                                    )}
                                    {booking.deposit_summary.charges_from_deposit.damage > 0 && (
                                        <div className="flex justify-between"><span>Damage charge</span><span className="font-medium text-red-600">−{fmt(booking.deposit_summary.charges_from_deposit.damage, booking.currency)}</span></div>
                                    )}
                                    {booking.deposit_summary.charges_from_deposit.fuel > 0 && (
                                        <div className="flex justify-between"><span>Fuel</span><span className="font-medium text-red-600">−{fmt(booking.deposit_summary.charges_from_deposit.fuel, booking.currency)}</span></div>
                                    )}
                                    <div className="flex justify-between border-t pt-2 font-semibold">
                                        <span>Suggested refund</span>
                                        <span className="text-emerald-600">{fmt(booking.deposit_summary.suggested_refund, booking.currency)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {booking.deposit_summary.held === 0 && booking.status !== 'cancelled' && (
                            <p className="mt-4 text-xs text-muted-foreground text-center">
                                No deposit collected yet. Use <span className="font-medium">Record Payment</span> below and choose "Deposit".
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Payments */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Banknote className="h-5 w-5 text-muted-foreground" /> Payments
                        </CardTitle>
                        <Button size="sm" onClick={() => setPaymentDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Record Payment
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        {booking.payments.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
                                <PiggyBank className="h-10 w-10" />
                                <p className="font-semibold">No payments yet</p>
                                <p className="text-sm">Record the customer's first payment to track amounts due.</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        <th className="px-4 py-3">Reference</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Method</th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Amount</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {booking.payments.map((p) => {
                                        const isRefund = p.type === 'deposit_refund' || p.type === 'refund';
                                        return (
                                            <tr key={p.id} className="group hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 font-mono text-xs">{p.reference}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                        p.type === 'deposit' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                                        p.type === 'deposit_refund' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                                                        'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    }`}>
                                                        {p.type_label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 capitalize text-muted-foreground">{p.method.replace('_', ' ')}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{p.paid_at ? fmtDatetime(p.paid_at) : '—'}</td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 capitalize dark:bg-emerald-900/30 dark:text-emerald-400">
                                                        <CheckCircle className="h-3 w-3" /> {p.status}
                                                    </span>
                                                </td>
                                                <td className={`px-4 py-3 text-right font-semibold ${isRefund ? 'text-purple-700' : 'text-emerald-700'}`}>
                                                    {isRefund ? '−' : '+'}{fmt(p.amount, booking.currency)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button size="sm" variant="outline" asChild>
                                                            <Link href={PaymentRoutes.showReceipt.url({ payment: p.id })}>
                                                                <Receipt className="mr-1 h-3 w-3" /> Receipt
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                                                            onClick={() => {
                                                                if (confirm('Remove this payment?')) {
                                                                    router.delete(Routes.destroyPayment.url({ booking: booking.id, payment: p.id }), { preserveScroll: true });
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>

                {/* Mileage allowance */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2"><Gauge className="h-5 w-5 text-muted-foreground" /> Mileage Allowance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-3 text-sm">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Included</p>
                                <p className="mt-1 text-2xl font-bold">{booking.km_allowance.toLocaleString()} km</p>
                                <p className="text-xs text-muted-foreground">{Math.round(booking.km_allowance / booking.rental_days)} km/day × {booking.rental_days} days</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Excess Rate</p>
                                <p className="mt-1 text-2xl font-bold">{booking.currency} {booking.excess_km_rate.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground">per km over allowance</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Actual Driven</p>
                                <p className="mt-1 text-2xl font-bold">
                                    {booking.odometer_start != null && booking.odometer_end != null
                                        ? `${(booking.odometer_end - booking.odometer_start).toLocaleString()} km`
                                        : '—'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {booking.mileage_overage_amount > 0 ? `+${fmt(booking.mileage_overage_amount, booking.currency)} charged` : 'Within allowance'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Inspections */}
                {(pickupInspection || returnInspection) && (
                    <div className="grid gap-6 lg:grid-cols-2">
                        {[pickupInspection, returnInspection].filter(Boolean).map((insp) => (
                            <Card key={insp!.id}>
                                <CardHeader>
                                    <CardTitle className="text-base capitalize flex items-center justify-between">
                                        <span>{insp!.type} Inspection</span>
                                        <span className="text-xs text-muted-foreground font-normal">{fmtDate(insp!.created_at)}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        {insp!.odometer != null && (
                                            <div className="rounded-lg bg-muted/40 p-2">
                                                <p className="text-xs text-muted-foreground">Odometer</p>
                                                <p className="font-semibold">{insp!.odometer.toLocaleString()} km</p>
                                            </div>
                                        )}
                                        {insp!.fuel_level && (
                                            <div className="rounded-lg bg-muted/40 p-2">
                                                <p className="text-xs text-muted-foreground">Fuel level</p>
                                                <p className="font-semibold">{insp!.fuel_level}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        {insp!.items?.map((item) => (
                                            <div key={item.key} className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">{item.label}</span>
                                                <span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${CONDITION_STYLES[item.condition] ?? ''}`}>
                                                    {item.condition}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    {insp!.exterior_notes && <p className="text-xs text-muted-foreground">{insp!.exterior_notes}</p>}
                                    {insp!.damage_summary && (
                                        <div className="rounded-md border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800 dark:border-orange-900/30 dark:bg-orange-900/20 dark:text-orange-400">
                                            <strong>Damage:</strong> {insp!.damage_summary}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Customer rating */}
                {booking.rating && (
                    <Card>
                        <CardHeader><CardTitle className="text-base">Customer Rating</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            {([
                                ['Vehicle condition', booking.rating.score_condition],
                                ['Timeliness', booking.rating.score_timeliness],
                                ['Payment', booking.rating.score_payment],
                                ['Communication', booking.rating.score_communication],
                                ['Care', booking.rating.score_care],
                            ] as const).map(([label, score]) => (
                                <div key={label} className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">{label}</span>
                                    <span className="flex items-center gap-0.5">
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <Star key={n} className={`h-3.5 w-3.5 ${n <= score ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
                                        ))}
                                        <span className="ml-1 font-medium">{score}</span>
                                    </span>
                                </div>
                            ))}
                            <div className="flex items-center justify-between border-t pt-2 font-semibold text-sm">
                                <span>Average</span>
                                <span>{booking.rating.average.toFixed(2)} / 5</span>
                            </div>
                            {booking.rating.comment && <p className="text-xs italic text-muted-foreground">"{booking.rating.comment}"</p>}
                        </CardContent>
                    </Card>
                )}

                {booking.notes && (
                    <Card>
                        <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{booking.notes}</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            <RecordPaymentDialog
                open={paymentDialogOpen}
                onOpenChange={setPaymentDialogOpen}
                bookingId={booking.id}
                outstandingRental={Math.max(0, booking.total_amount - booking.rental_paid)}
                depositExpected={booking.deposit_amount}
                depositHeld={booking.deposit_summary.held}
                currency={booking.currency}
                paymentTypes={paymentTypes}
                paymentMethods={paymentMethods}
            />

            <RefundDepositDialog
                open={refundDialogOpen}
                onOpenChange={setRefundDialogOpen}
                bookingId={booking.id}
                availableBalance={booking.deposit_summary.balance}
                suggestedRefund={booking.deposit_summary.suggested_refund}
                currency={booking.currency}
                paymentMethods={paymentMethods}
            />
        </>
    );
}

function RecordPaymentDialog({
    open,
    onOpenChange,
    bookingId,
    outstandingRental,
    depositExpected,
    depositHeld,
    currency,
    paymentTypes,
    paymentMethods,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bookingId: number;
    outstandingRental: number;
    depositExpected: number;
    depositHeld: number;
    currency: string;
    paymentTypes: { value: string; label: string }[];
    paymentMethods: { value: string; label: string }[];
}) {
    const depositOutstanding = Math.max(0, depositExpected - depositHeld);
    const { data, setData, post, processing, errors, reset } = useForm({
        type: 'rental',
        amount: outstandingRental > 0 ? String(outstandingRental) : '',
        method: 'cash',
        gateway_reference: '',
        paid_at: new Date().toISOString().slice(0, 16),
        notes: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(Routes.storePayment.url({ booking: bookingId }), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    }

    function handleTypeChange(v: string) {
        setData((prev) => ({
            ...prev,
            type: v,
            amount: v === 'deposit'
                ? (depositOutstanding > 0 ? String(depositOutstanding) : '')
                : (outstandingRental > 0 ? String(outstandingRental) : ''),
        }));
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                    <DialogDescription>Log a payment from the customer against this booking.</DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-4">
                    <div className="grid grid-cols-2 gap-2">
                        {paymentTypes.map((t) => (
                            <button
                                key={t.value}
                                type="button"
                                onClick={() => handleTypeChange(t.value)}
                                className={`rounded-lg border p-3 text-sm font-medium transition-colors ${
                                    data.type === t.value ? 'border-primary bg-primary/5 text-primary' : 'border-input hover:bg-muted/50'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                    <InputError message={errors.type} />

                    {data.type === 'rental' && outstandingRental > 0 && (
                        <p className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                            Outstanding rental balance: <strong>{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(outstandingRental)}</strong>
                        </p>
                    )}
                    {data.type === 'deposit' && depositOutstanding > 0 && (
                        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                            Deposit still needed: <strong>{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(depositOutstanding)}</strong>
                        </p>
                    )}

                    <div className="space-y-1">
                        <Label htmlFor="pay-amount">Amount ({currency})</Label>
                        <Input id="pay-amount" type="number" step="0.01" value={data.amount} onChange={(e) => setData('amount', e.target.value)} placeholder="0.00" />
                        <InputError message={errors.amount} />
                    </div>

                    <div className="space-y-1">
                        <Label>Payment Method</Label>
                        <Select value={data.method} onValueChange={(v) => setData('method', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {paymentMethods.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.method} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="pay-ref">Transaction Reference (optional)</Label>
                        <Input id="pay-ref" value={data.gateway_reference} onChange={(e) => setData('gateway_reference', e.target.value)} placeholder="EcoCash txn ID, cheque #…" />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="pay-date">Paid At</Label>
                        <DateTimeInput id="pay-date" value={data.paid_at} onChange={(e) => setData('paid_at', e.target.value)} />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing}>{processing ? 'Saving…' : 'Record Payment'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function RefundDepositDialog({
    open,
    onOpenChange,
    bookingId,
    availableBalance,
    suggestedRefund,
    currency,
    paymentMethods,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bookingId: number;
    availableBalance: number;
    suggestedRefund: number;
    currency: string;
    paymentMethods: { value: string; label: string }[];
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        amount: String(suggestedRefund),
        method: 'cash',
        notes: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(Routes.refundDeposit.url({ booking: bookingId }), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Refund Deposit</DialogTitle>
                    <DialogDescription>Return the deposit to the customer. We pre-fill the suggested amount based on any charges.</DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-4">
                    <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Balance held</span>
                            <span className="font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(availableBalance)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Suggested refund</span>
                            <span className="font-semibold text-emerald-700">{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(suggestedRefund)}</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="refund-amount">Refund Amount ({currency})</Label>
                        <Input id="refund-amount" type="number" step="0.01" value={data.amount} onChange={(e) => setData('amount', e.target.value)} />
                        <InputError message={errors.amount} />
                    </div>

                    <div className="space-y-1">
                        <Label>Refund Method</Label>
                        <Select value={data.method} onValueChange={(v) => setData('method', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {paymentMethods.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="refund-notes">Notes (optional)</Label>
                        <Input id="refund-notes" value={data.notes} onChange={(e) => setData('notes', e.target.value)} placeholder="Why is this different from suggested?" />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing}><Undo2 className="mr-2 h-4 w-4" /> Refund</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
