import { Head, setLayoutProps, useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/input-error';
import * as AgreementRoutes from '@/actions/App/Http/Controllers/Web/RentalAgreementController';

setLayoutProps({ breadcrumbs: [
    { title: 'Legal', href: '/legal/agreements' },
    { title: 'Agreements', href: '/legal/agreements' },
    { title: 'New Agreement', href: '/legal/agreements/create' },
]});

interface Template { id: number; name: string; version: string; }
interface Customer { id: number; name: string; phone: string | null; email: string | null; address: string | null; id_number: string | null; }
interface Booking {
    id: number; booking_number: string; vehicle_label: string | null;
    vehicle_registration: string | null; vehicle_make_model: string | null;
    customer_id: number | null; pickup_at: string | null; return_at: string | null;
    daily_rate: string | null; total_amount: string | null; deposit_amount: string | null;
}

export default function AgreementCreate({ templates, customers, bookings, prefill_booking_id }: {
    templates: Template[]; customers: Customer[]; bookings: Booking[]; prefill_booking_id?: string;
}) {
    const { data, setData, post, processing, errors } = useForm({
        template_id: templates[0]?.id?.toString() ?? '',
        booking_id: prefill_booking_id ?? '',
        customer_id: '',
        renter_name: '',
        renter_id_number: '',
        renter_address: '',
        renter_phone: '',
        renter_email: '',
        vehicle_make_model: '',
        vehicle_registration: '',
        mileage_out: '',
        fuel_level_out: '',
        rental_start: '',
        rental_end: '',
        collection_location: '',
        return_location: '',
        rental_rate: '',
        rental_days: '',
        total_amount: '',
        deposit_amount: '',
        mileage_allowance: '200',
        excess_mileage_fee: '0.35',
        notes: '',
    });

    // Auto-fill from selected booking
    useEffect(() => {
        if (!data.booking_id) return;
        const booking = bookings.find(b => b.id.toString() === data.booking_id);
        if (!booking) return;

        setData(prev => ({
            ...prev,
            vehicle_make_model: booking.vehicle_make_model ?? prev.vehicle_make_model,
            vehicle_registration: booking.vehicle_registration ?? prev.vehicle_registration,
            rental_start: booking.pickup_at ? booking.pickup_at.slice(0, 16) : prev.rental_start,
            rental_end: booking.return_at ? booking.return_at.slice(0, 16) : prev.rental_end,
            rental_rate: booking.daily_rate ?? prev.rental_rate,
            total_amount: booking.total_amount ?? prev.total_amount,
            deposit_amount: booking.deposit_amount ?? prev.deposit_amount,
            customer_id: booking.customer_id?.toString() ?? prev.customer_id,
        }));
    }, [data.booking_id]);

    // Auto-fill from selected customer
    useEffect(() => {
        if (!data.customer_id) return;
        const customer = customers.find(c => c.id.toString() === data.customer_id);
        if (!customer) return;
        setData(prev => ({
            ...prev,
            renter_name: customer.name,
            renter_phone: customer.phone ?? prev.renter_phone,
            renter_email: customer.email ?? prev.renter_email,
            renter_address: customer.address ?? prev.renter_address,
            renter_id_number: customer.id_number ?? prev.renter_id_number,
        }));
    }, [data.customer_id]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(AgreementRoutes.store.url());
    };

    return (
        <>
            <Head title="New Rental Agreement" />
            <div className="mx-auto max-w-4xl space-y-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">New Rental Agreement</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Generate a digital agreement for a booking.</p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Link to booking / customer */}
                    <Card>
                        <CardHeader><CardTitle>Link to Booking</CardTitle></CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label>Booking (auto-fills vehicle & dates)</Label>
                                <Select value={data.booking_id} onValueChange={v => setData('booking_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select booking…" /></SelectTrigger>
                                    <SelectContent>
                                        {bookings.map(b => (
                                            <SelectItem key={b.id} value={b.id.toString()}>
                                                {b.booking_number} {b.vehicle_label ? `— ${b.vehicle_label}` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Agreement Template *</Label>
                                <Select value={data.template_id} onValueChange={v => setData('template_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select template…" /></SelectTrigger>
                                    <SelectContent>
                                        {templates.map(t => (
                                            <SelectItem key={t.id} value={t.id.toString()}>{t.name} v{t.version}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.template_id} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Renter Details */}
                    <Card>
                        <CardHeader><CardTitle>Renter Details</CardTitle></CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label>Auto-fill from Customer</Label>
                                <Select value={data.customer_id} onValueChange={v => setData('customer_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select customer…" /></SelectTrigger>
                                    <SelectContent>
                                        {customers.map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {[
                                { id: 'renter_name', label: 'Full Name *', key: 'renter_name' as const },
                                { id: 'renter_id_number', label: 'ID / Passport Number', key: 'renter_id_number' as const },
                                { id: 'renter_phone', label: 'Phone Number', key: 'renter_phone' as const },
                                { id: 'renter_email', label: 'Email Address', key: 'renter_email' as const },
                            ].map(({ id, label, key }) => (
                                <div key={id} className="space-y-1.5">
                                    <Label htmlFor={id}>{label}</Label>
                                    <Input id={id} value={data[key]} onChange={e => setData(key, e.target.value)} />
                                    <InputError message={errors[key]} />
                                </div>
                            ))}
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label htmlFor="renter_address">Physical Address</Label>
                                <Input id="renter_address" value={data.renter_address} onChange={e => setData('renter_address', e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Vehicle Details */}
                    <Card>
                        <CardHeader><CardTitle>Vehicle Details</CardTitle></CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {[
                                { id: 'vehicle_make_model', label: 'Make & Model', key: 'vehicle_make_model' as const },
                                { id: 'vehicle_registration', label: 'Registration No.', key: 'vehicle_registration' as const },
                                { id: 'mileage_out', label: 'Mileage Out (km)', key: 'mileage_out' as const },
                                { id: 'fuel_level_out', label: 'Fuel Level', key: 'fuel_level_out' as const },
                                { id: 'collection_location', label: 'Collection Location', key: 'collection_location' as const },
                                { id: 'return_location', label: 'Return Location', key: 'return_location' as const },
                            ].map(({ id, label, key }) => (
                                <div key={id} className="space-y-1.5">
                                    <Label htmlFor={id}>{label}</Label>
                                    <Input id={id} value={data[key]} onChange={e => setData(key, e.target.value)} />
                                </div>
                            ))}
                            <div className="space-y-1.5">
                                <Label htmlFor="rental_start">Rental Start</Label>
                                <Input id="rental_start" type="datetime-local" value={data.rental_start} onChange={e => setData('rental_start', e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="rental_end">Rental End</Label>
                                <Input id="rental_end" type="datetime-local" value={data.rental_end} onChange={e => setData('rental_end', e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Fees */}
                    <Card>
                        <CardHeader><CardTitle>Rental Fees & Deposit</CardTitle></CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {[
                                { id: 'rental_rate', label: 'Daily Rate (USD)', key: 'rental_rate' as const },
                                { id: 'rental_days', label: 'Rental Days', key: 'rental_days' as const },
                                { id: 'total_amount', label: 'Total Amount (USD)', key: 'total_amount' as const },
                                { id: 'deposit_amount', label: 'Refundable Deposit (USD)', key: 'deposit_amount' as const },
                                { id: 'mileage_allowance', label: 'Mileage Allowance (km/day)', key: 'mileage_allowance' as const },
                                { id: 'excess_mileage_fee', label: 'Excess Mileage Fee (USD/km)', key: 'excess_mileage_fee' as const },
                            ].map(({ id, label, key }) => (
                                <div key={id} className="space-y-1.5">
                                    <Label htmlFor={id}>{label}</Label>
                                    <Input id={id} type="number" step="0.01" value={data[key]} onChange={e => setData(key, e.target.value)} />
                                    <InputError message={errors[key]} />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => history.back()}>Cancel</Button>
                        <Button type="submit" disabled={processing}>Generate Agreement</Button>
                    </div>
                </form>
            </div>
        </>
    );
}
