import { Head, router, setLayoutProps, useForm } from '@inertiajs/react';
import { CreditCard, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/input-error';
import * as Routes from '@/actions/App/Http/Controllers/Web/VendorPaymentController';
import { dashboard } from '@/routes';
import { index as financeIndex } from '@/routes/finance';

interface VendorPayment {
    id: number;
    description: string;
    reference_number: string | null;
    provider_invoice_number: string | null;
    amount: number;
    currency: string;
    invoice_date: string | null;
    due_date: string | null;
    payment_date: string | null;
    status: string;
    status_label: string;
    status_color: string;
    service_provider: { id: number; name: string } | null;
    cost_center: { id: number; name: string } | null;
}

interface PaginatedData<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    last_page: number;
    total: number;
    from: number;
    to: number;
}

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    disputed: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

function fmt(amount: number, currency = 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function VendorPaymentsIndex({
    payments,
    filters,
    statuses,
    service_providers,
    cost_centers,
    payment_methods,
    currencies,
    summary,
}: {
    payments: PaginatedData<VendorPayment>;
    filters: { search?: string; status?: string; service_provider_id?: string; cost_center_id?: string };
    statuses: { value: string; label: string }[];
    service_providers: { id: number; name: string }[];
    cost_centers: { id: number; name: string }[];
    payment_methods: { value: string; label: string }[];
    currencies: { value: string; label: string }[];
    summary: { total_pending: number; total_overdue: number };
}) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Finance', href: financeIndex.url() },
            { title: 'Vendor Payments', href: Routes.index.url() },
        ],
    });

    const [search, setSearch] = useState(filters.search ?? '');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<VendorPayment | null>(null);
    const [markPaidTarget, setMarkPaidTarget] = useState<VendorPayment | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<VendorPayment | null>(null);

    function applyFilter(params: Record<string, string>) {
        router.get(Routes.index.url(), { ...filters, ...params }, { preserveState: true, replace: true });
    }

    function openNew() {
        setEditing(null);
        setDialogOpen(true);
    }

    function openEdit(payment: VendorPayment) {
        setEditing(payment);
        setDialogOpen(true);
    }

    function handleDelete() {
        if (!deleteTarget) {
            return;
        }
        router.delete(Routes.destroy.url({ vendorPayment: deleteTarget.id }), {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
        });
    }

    return (
        <>
            <Head title="Vendor Payments" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Vendor Payments</h1>
                        <p className="text-sm text-muted-foreground">Manage payments to service providers and vendors.</p>
                    </div>
                    <Button onClick={openNew}>
                        <Plus className="mr-2 h-4 w-4" /> Add Payment
                    </Button>
                </div>

                {/* Summary cards */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payments</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{fmt(summary.total_pending)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
                            <CreditCard className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-red-600">{fmt(summary.total_overdue)}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            applyFilter({ search });
                        }}
                        className="flex flex-1 gap-2"
                    >
                        <Input
                            placeholder="Search description or invoice…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-xs"
                        />
                        <Button type="submit" variant="outline" size="icon">
                            <Search className="h-4 w-4" />
                        </Button>
                    </form>

                    <Select
                        value={filters.status ?? ''}
                        onValueChange={(v) => applyFilter({ status: v === 'all' ? '' : v })}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            {statuses.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                    {s.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.service_provider_id ?? ''}
                        onValueChange={(v) => applyFilter({ service_provider_id: v === 'all' ? '' : v })}
                    >
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="All providers" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All providers</SelectItem>
                            {service_providers.map((sp) => (
                                <SelectItem key={sp.id} value={String(sp.id)}>
                                    {sp.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.cost_center_id ?? ''}
                        onValueChange={(v) => applyFilter({ cost_center_id: v === 'all' ? '' : v })}
                    >
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="All cost centers" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All cost centers</SelectItem>
                            {cost_centers.map((cc) => (
                                <SelectItem key={cc.id} value={String(cc.id)}>
                                    {cc.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {payments.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                                <CreditCard className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-lg font-semibold">No vendor payments yet</p>
                            <p className="max-w-md text-sm text-muted-foreground">
                                Track payments to service providers and vendors to manage your accounts payable.
                            </p>
                            <Button onClick={openNew} className="mt-2">
                                <Plus className="mr-2 h-4 w-4" /> Add your first payment
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            <th className="px-4 py-3">Service Provider</th>
                                            <th className="px-4 py-3">Description</th>
                                            <th className="px-4 py-3">Invoice #</th>
                                            <th className="px-4 py-3 text-right">Amount</th>
                                            <th className="px-4 py-3">Due Date</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Payment Date</th>
                                            <th className="px-4 py-3" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {payments.data.map((p) => (
                                            <tr key={p.id} className="transition-colors hover:bg-muted/30">
                                                <td className="px-4 py-3">
                                                    <span className="font-medium">
                                                        {p.service_provider?.name ?? <span className="italic text-muted-foreground">—</span>}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium">{p.description}</div>
                                                    {p.reference_number && (
                                                        <div className="text-xs text-muted-foreground">Ref: {p.reference_number}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                                    {p.provider_invoice_number ?? '—'}
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                                                    {fmt(p.amount, p.currency)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                                    {p.due_date ? fmtDate(p.due_date) : '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[p.status] ?? ''}`}
                                                    >
                                                        {p.status_label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                                    {p.payment_date ? fmtDate(p.payment_date) : '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {p.status !== 'paid' && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 text-xs"
                                                                onClick={() => setMarkPaidTarget(p)}
                                                            >
                                                                Mark Paid
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8"
                                                            onClick={() => openEdit(p)}
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                                            onClick={() => setDeleteTarget(p)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {payments.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            {payments.from}–{payments.to} of {payments.total}
                        </span>
                        <div className="flex gap-1">
                            {payments.links.map((link, i) => (
                                <Button
                                    key={i}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <VendorPaymentDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                editing={editing}
                statuses={statuses}
                service_providers={service_providers}
                cost_centers={cost_centers}
                payment_methods={payment_methods}
                currencies={currencies}
            />

            <MarkPaidDialog
                open={!!markPaidTarget}
                onOpenChange={(open) => !open && setMarkPaidTarget(null)}
                payment={markPaidTarget}
                payment_methods={payment_methods}
            />

            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Vendor Payment</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this payment record for{' '}
                            <span className="font-semibold">{deleteTarget?.service_provider?.name ?? 'this vendor'}</span>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function VendorPaymentDialog({
    open,
    onOpenChange,
    editing,
    statuses,
    service_providers,
    cost_centers,
    payment_methods,
    currencies,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editing: VendorPayment | null;
    statuses: { value: string; label: string }[];
    service_providers: { id: number; name: string }[];
    cost_centers: { id: number; name: string }[];
    payment_methods: { value: string; label: string }[];
    currencies: { value: string; label: string }[];
}) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        description: editing?.description ?? '',
        reference_number: editing?.reference_number ?? '',
        provider_invoice_number: editing?.provider_invoice_number ?? '',
        amount: editing?.amount ? String(editing.amount) : '',
        currency: editing?.currency ?? 'USD',
        invoice_date: editing?.invoice_date ?? '',
        due_date: editing?.due_date ?? '',
        payment_date: editing?.payment_date ?? '',
        status: editing?.status ?? 'pending',
        service_provider_id: editing?.service_provider?.id ? String(editing.service_provider.id) : '',
        cost_center_id: editing?.cost_center?.id ? String(editing.cost_center.id) : '',
        payment_method: '',
        notes: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        };
        if (editing) {
            put(Routes.update.url({ vendorPayment: editing.id }), options);
        } else {
            post(Routes.store.url(), options);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editing ? 'Edit Payment' : 'Add Vendor Payment'}</DialogTitle>
                    <DialogDescription>Record a payment to a service provider or vendor.</DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="vp-description">Description</Label>
                        <Input
                            id="vp-description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Monthly vehicle maintenance"
                        />
                        <InputError message={errors.description} />
                    </div>

                    <div className="space-y-1">
                        <Label>Service Provider</Label>
                        <Select
                            value={data.service_provider_id || 'none'}
                            onValueChange={(v) => setData('service_provider_id', v === 'none' ? '' : v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {service_providers.map((sp) => (
                                    <SelectItem key={sp.id} value={String(sp.id)}>
                                        {sp.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.service_provider_id} />
                    </div>

                    <div className="space-y-1">
                        <Label>Cost Center</Label>
                        <Select
                            value={data.cost_center_id || 'none'}
                            onValueChange={(v) => setData('cost_center_id', v === 'none' ? '' : v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select cost center" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {cost_centers.map((cc) => (
                                    <SelectItem key={cc.id} value={String(cc.id)}>
                                        {cc.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.cost_center_id} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="vp-ref">Reference Number</Label>
                        <Input
                            id="vp-ref"
                            value={data.reference_number}
                            onChange={(e) => setData('reference_number', e.target.value)}
                            placeholder="Internal reference"
                        />
                        <InputError message={errors.reference_number} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="vp-invoice-num">Provider Invoice #</Label>
                        <Input
                            id="vp-invoice-num"
                            value={data.provider_invoice_number}
                            onChange={(e) => setData('provider_invoice_number', e.target.value)}
                            placeholder="Vendor invoice number"
                        />
                        <InputError message={errors.provider_invoice_number} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="vp-amount">Amount</Label>
                        <Input
                            id="vp-amount"
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.amount}
                            onChange={(e) => setData('amount', e.target.value)}
                            placeholder="0.00"
                        />
                        <InputError message={errors.amount} />
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

                    <div className="space-y-1">
                        <Label htmlFor="vp-invoice-date">Invoice Date</Label>
                        <DateInput
                            id="vp-invoice-date"
                            value={data.invoice_date}
                            onChange={(e) => setData('invoice_date', e.target.value)}
                        />
                        <InputError message={errors.invoice_date} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="vp-due-date">Due Date</Label>
                        <DateInput
                            id="vp-due-date"
                            value={data.due_date}
                            onChange={(e) => setData('due_date', e.target.value)}
                        />
                        <InputError message={errors.due_date} />
                    </div>

                    <div className="space-y-1">
                        <Label>Payment Method</Label>
                        <Select
                            value={data.payment_method || 'none'}
                            onValueChange={(v) => setData('payment_method', v === 'none' ? '' : v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {payment_methods.map((m) => (
                                    <SelectItem key={m.value} value={m.value}>
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.payment_method} />
                    </div>

                    <div className="space-y-1">
                        <Label>Status</Label>
                        <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {statuses.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.status} />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="vp-notes">Notes</Label>
                        <textarea
                            id="vp-notes"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            rows={2}
                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            placeholder="Additional notes…"
                        />
                    </div>

                    <DialogFooter className="sm:col-span-2 mt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving…' : editing ? 'Save Changes' : 'Add Payment'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function MarkPaidDialog({
    open,
    onOpenChange,
    payment,
    payment_methods,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    payment: VendorPayment | null;
    payment_methods: { value: string; label: string }[];
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        payment_date: '',
        payment_method: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!payment) {
            return;
        }
        post(Routes.markPaid.url({ vendorPayment: payment.id }), {
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
                    <DialogTitle>Mark Payment as Paid</DialogTitle>
                    <DialogDescription>
                        Record payment details for{' '}
                        <span className="font-semibold">{payment?.service_provider?.name ?? 'this vendor'}</span>.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="mp-payment-date">Payment Date</Label>
                        <DateInput
                            id="mp-payment-date"
                            value={data.payment_date}
                            onChange={(e) => setData('payment_date', e.target.value)}
                        />
                        <InputError message={errors.payment_date} />
                    </div>

                    <div className="space-y-1">
                        <Label>Payment Method</Label>
                        <Select value={data.payment_method} onValueChange={(v) => setData('payment_method', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                                {payment_methods.map((m) => (
                                    <SelectItem key={m.value} value={m.value}>
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.payment_method} />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving…' : 'Confirm Payment'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
