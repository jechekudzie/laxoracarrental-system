import { Head, Link, router, setLayoutProps, useForm, usePage } from '@inertiajs/react';
import { Plus, UserPlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/input-error';
import * as Routes from '@/actions/App/Http/Controllers/Web/QuotationController';
import * as CustomerRoutes from '@/actions/App/Http/Controllers/Web/CustomerController';
import { dashboard } from '@/routes';
import { index as financeIndex } from '@/routes/finance';

interface LineItem {
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
}

const DEFAULT_LINE_ITEM: LineItem = { description: '', quantity: 1, unit: '', unit_price: 0 };

function fmt(amount: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function QuickAddCustomerDialog({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const { data, setData, processing, errors, reset } = useForm({
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
        router.post(CustomerRoutes.quickStore.url(), data, {
            preserveState: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add New Customer</DialogTitle>
                    <DialogDescription>
                        Create a customer record to attach to this quotation.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1 sm:col-span-2">
                            <Label htmlFor="cq-name">Full Name *</Label>
                            <Input
                                id="cq-name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="John Doe"
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="cq-phone">Phone *</Label>
                            <Input
                                id="cq-phone"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                placeholder="+263 77 123 4567"
                            />
                            <InputError message={errors.phone} />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="cq-email">Email</Label>
                            <Input
                                id="cq-email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="john@example.com"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="cq-idnum">ID Number *</Label>
                            <Input
                                id="cq-idnum"
                                value={data.id_number}
                                onChange={(e) => setData('id_number', e.target.value)}
                            />
                            <InputError message={errors.id_number} />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="cq-licence">Licence Number *</Label>
                            <Input
                                id="cq-licence"
                                value={data.licence_number}
                                onChange={(e) => setData('licence_number', e.target.value)}
                            />
                            <InputError message={errors.licence_number} />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="cq-class">Licence Class *</Label>
                            <Input
                                id="cq-class"
                                value={data.licence_class}
                                onChange={(e) => setData('licence_class', e.target.value)}
                                placeholder="e.g. Class 4"
                            />
                            <InputError message={errors.licence_class} />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="cq-expiry">Licence Expiry *</Label>
                            <DateInput
                                id="cq-expiry"
                                value={data.licence_expiry}
                                onChange={(e) => setData('licence_expiry', e.target.value)}
                            />
                            <InputError message={errors.licence_expiry} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving…' : 'Add Customer'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function QuotationCreate({
    customers,
    currencies,
    next_number,
}: {
    customers: { id: number; name: string }[];
    currencies: { value: string; label: string }[];
    next_number: string;
}) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Finance', href: financeIndex.url() },
            { title: 'Quotations', href: Routes.index.url() },
            { title: 'New Quotation', href: Routes.create.url() },
        ],
    });

    const page = usePage<{ flash?: Record<string, unknown> }>();
    const flash = page.props.flash ?? {};

    const { data, setData, errors, processing } = useForm({
        number: next_number,
        customer_id: '',
        subject: '',
        issued_at: '',
        valid_until: '',
        currency: 'USD',
        notes: '',
        terms: '',
        tax: 0,
        discount: 0,
    });

    const [lineItems, setLineItems] = useState<LineItem[]>([{ ...DEFAULT_LINE_ITEM }]);
    const [addCustomerOpen, setAddCustomerOpen] = useState(false);

    // Auto-select newly created customer
    useEffect(() => {
        const newId = flash?.new_customer_id;
        if (newId) {
            setData('customer_id', String(newId));
        }
    }, [flash?.new_customer_id]);

    function addLineItem() {
        setLineItems((prev) => [...prev, { ...DEFAULT_LINE_ITEM }]);
    }

    function removeLineItem(index: number) {
        setLineItems((prev) => prev.filter((_, i) => i !== index));
    }

    function updateLineItem<K extends keyof LineItem>(index: number, key: K, value: LineItem[K]) {
        setLineItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
    }

    const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const taxAmount = subtotal * (data.tax / 100);
    const grandTotal = subtotal + taxAmount - data.discount;

    function submit(e: React.FormEvent) {
        e.preventDefault();
        router.post(Routes.store.url(), { ...data, items: lineItems });
    }

    return (
        <>
            <Head title="New Quotation" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex flex-wrap items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={Routes.index.url()}>← Back</Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">New Quotation</h1>
                        <p className="text-sm text-muted-foreground">Create a new quotation for a customer.</p>
                    </div>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-6">
                    <div className="grid gap-6 lg:grid-cols-3">
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-base">Quotation Details</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <Label htmlFor="q-number">Quotation #</Label>
                                    <Input
                                        id="q-number"
                                        value={data.number}
                                        readOnly
                                        className="bg-muted/50 cursor-not-allowed"
                                    />
                                    <InputError message={errors.number} />
                                </div>

                                {/* Customer with quick-add */}
                                <div className="space-y-1">
                                    <Label>Customer</Label>
                                    <div className="flex gap-2">
                                        <Select
                                            value={data.customer_id}
                                            onValueChange={(v) => setData('customer_id', v)}
                                        >
                                            <SelectTrigger className="flex-1">
                                                <SelectValue placeholder="Select customer" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {customers.map((c) => (
                                                    <SelectItem key={c.id} value={String(c.id)}>
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setAddCustomerOpen(true)}
                                            title="Add new customer"
                                        >
                                            <UserPlus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <InputError message={errors.customer_id} />
                                </div>

                                <div className="space-y-1 sm:col-span-2">
                                    <Label htmlFor="q-subject">Subject</Label>
                                    <Input
                                        id="q-subject"
                                        value={data.subject}
                                        onChange={(e) => setData('subject', e.target.value)}
                                        placeholder="e.g. Vehicle rental for corporate event"
                                    />
                                    <InputError message={errors.subject} />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="q-issued">Issued At</Label>
                                    <DateInput
                                        id="q-issued"
                                        value={data.issued_at}
                                        onChange={(e) => setData('issued_at', e.target.value)}
                                    />
                                    <InputError message={errors.issued_at} />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="q-valid">Valid Until</Label>
                                    <DateInput
                                        id="q-valid"
                                        value={data.valid_until}
                                        onChange={(e) => setData('valid_until', e.target.value)}
                                    />
                                    <InputError message={errors.valid_until} />
                                </div>

                                <div className="space-y-1">
                                    <Label>Currency</Label>
                                    <Select value={data.currency} onValueChange={(v) => setData('currency', v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {currencies.map((c) => (
                                                <SelectItem key={c.value} value={c.value}>
                                                    {c.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.currency} />
                                </div>

                                <div className="space-y-1 sm:col-span-2">
                                    <Label htmlFor="q-notes">Notes</Label>
                                    <textarea
                                        id="q-notes"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={3}
                                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        placeholder="Additional notes for the customer…"
                                    />
                                    <InputError message={errors.notes} />
                                </div>

                                <div className="space-y-1 sm:col-span-2">
                                    <Label htmlFor="q-terms">Terms &amp; Conditions</Label>
                                    <textarea
                                        id="q-terms"
                                        value={data.terms}
                                        onChange={(e) => setData('terms', e.target.value)}
                                        rows={3}
                                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        placeholder="Payment terms, delivery conditions…"
                                    />
                                    <InputError message={errors.terms} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Totals summary */}
                        <Card className="h-fit">
                            <CardHeader>
                                <CardTitle className="text-base">Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-medium">{fmt(subtotal)}</span>
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="q-tax">Tax (%)</Label>
                                    <Input
                                        id="q-tax"
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={data.tax}
                                        onChange={(e) => setData('tax', parseFloat(e.target.value) || 0)}
                                    />
                                    <InputError message={errors.tax} />
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Tax Amount</span>
                                    <span>{fmt(taxAmount)}</span>
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="q-discount">Discount ($)</Label>
                                    <Input
                                        id="q-discount"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={data.discount}
                                        onChange={(e) => setData('discount', parseFloat(e.target.value) || 0)}
                                    />
                                    <InputError message={errors.discount} />
                                </div>

                                <div className="flex items-center justify-between border-t pt-3">
                                    <span className="font-semibold">Grand Total</span>
                                    <span className="text-lg font-bold">{fmt(grandTotal)}</span>
                                </div>

                                <Button type="submit" className="w-full" disabled={processing}>
                                    {processing ? 'Saving…' : 'Create Quotation'}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Line items */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base">Line Items</CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                                <Plus className="mr-2 h-4 w-4" /> Add Item
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            <th className="px-4 py-3">Description</th>
                                            <th className="px-4 py-3 w-24">Qty</th>
                                            <th className="px-4 py-3 w-28">Unit</th>
                                            <th className="px-4 py-3 w-32">Unit Price</th>
                                            <th className="px-4 py-3 w-32 text-right">Total</th>
                                            <th className="px-4 py-3 w-10" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {lineItems.map((item, i) => (
                                            <tr key={i}>
                                                <td className="px-4 py-2">
                                                    <Input
                                                        value={item.description}
                                                        onChange={(e) => updateLineItem(i, 'description', e.target.value)}
                                                        placeholder="Item description"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        value={item.quantity}
                                                        onChange={(e) =>
                                                            updateLineItem(i, 'quantity', parseFloat(e.target.value) || 0)
                                                        }
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <Input
                                                        value={item.unit}
                                                        onChange={(e) => updateLineItem(i, 'unit', e.target.value)}
                                                        placeholder="e.g. day"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.unit_price}
                                                        onChange={(e) =>
                                                            updateLineItem(i, 'unit_price', parseFloat(e.target.value) || 0)
                                                        }
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-right font-medium">
                                                    {fmt(item.quantity * item.unit_price)}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                                        onClick={() => removeLineItem(i)}
                                                        disabled={lineItems.length === 1}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t bg-muted/20">
                                            <td colSpan={4} className="px-4 py-3 text-right text-sm font-medium">
                                                Subtotal
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold">{fmt(subtotal)}</td>
                                            <td />
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>

            <QuickAddCustomerDialog open={addCustomerOpen} onClose={() => setAddCustomerOpen(false)} />
        </>
    );
}
