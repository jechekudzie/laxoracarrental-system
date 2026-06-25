import { Head, setLayoutProps, useForm } from '@inertiajs/react';
import { SignaturePad } from '@/components/signature-pad';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/input-error';
import * as CashRoutes from '@/actions/App/Http/Controllers/Web/CashDeclarationController';

setLayoutProps({ breadcrumbs: [
    { title: 'Legal', href: '/legal/cash-declarations' },
    { title: 'Cash Declarations', href: '/legal/cash-declarations' },
    { title: 'New Declaration', href: '/legal/cash-declarations/create' },
]});

interface Source { value: string; label: string; }
interface Customer { id: number; name: string; }
interface BookingOption { id: number; label: string; }

export default function CashDeclarationCreate({ sources, customers, bookings, prefill_booking_id }: {
    sources: Source[]; customers: Customer[]; bookings: BookingOption[]; prefill_booking_id?: string;
}) {
    const now = new Date();
    const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    const { data, setData, post, processing, errors } = useForm({
        amount: '',
        currency: 'USD',
        source: '',
        reference: '',
        booking_id: prefill_booking_id ?? '',
        customer_id: '',
        description: '',
        signature: '' as string,
        declared_at: localNow,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(CashRoutes.store.url());
    };

    return (
        <>
            <Head title="New Cash Declaration" />
            <div className="mx-auto max-w-2xl space-y-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Declare Cash Received</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Record cash received with an admin digital signature.</p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Payment Details</CardTitle></CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="amount">Amount *</Label>
                                <Input id="amount" type="number" step="0.01" value={data.amount} onChange={e => setData('amount', e.target.value)} placeholder="0.00" />
                                <InputError message={errors.amount} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Currency</Label>
                                <Select value={data.currency} onValueChange={v => setData('currency', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="ZWG">ZWG</SelectItem>
                                        <SelectItem value="ZAR">ZAR</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Source *</Label>
                                <Select value={data.source} onValueChange={v => setData('source', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select source…" /></SelectTrigger>
                                    <SelectContent>
                                        {sources.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.source} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="reference">Reference No.</Label>
                                <Input id="reference" value={data.reference} onChange={e => setData('reference', e.target.value)} placeholder="Invoice / booking no." />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Customer</Label>
                                <Select value={data.customer_id} onValueChange={v => setData('customer_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select customer…" /></SelectTrigger>
                                    <SelectContent>
                                        {customers.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Link to Booking</Label>
                                <Select value={data.booking_id} onValueChange={v => setData('booking_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select booking…" /></SelectTrigger>
                                    <SelectContent>
                                        {bookings.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label htmlFor="description">Description *</Label>
                                <Input id="description" value={data.description} onChange={e => setData('description', e.target.value)} placeholder="e.g. Cash rental payment for booking BK-XXXX" />
                                <InputError message={errors.description} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="declared_at">Declaration Date & Time *</Label>
                                <Input id="declared_at" type="datetime-local" value={data.declared_at} onChange={e => setData('declared_at', e.target.value)} />
                                <InputError message={errors.declared_at} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Signature */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Admin Signature</CardTitle>
                            <p className="text-sm text-muted-foreground">Sign below to confirm you personally received this cash.</p>
                        </CardHeader>
                        <CardContent>
                            <SignaturePad
                                label="Your signature"
                                value={data.signature || null}
                                onChange={sig => setData('signature', sig ?? '')}
                            />
                            <InputError message={errors.signature} />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => history.back()}>Cancel</Button>
                        <Button type="submit" disabled={processing}>Save Declaration</Button>
                    </div>
                </form>
            </div>
        </>
    );
}
