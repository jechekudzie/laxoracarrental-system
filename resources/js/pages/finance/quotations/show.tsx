import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as Routes from '@/actions/App/Http/Controllers/Web/QuotationController';
import { dashboard } from '@/routes';
import { index as financeIndex } from '@/routes/finance';

interface QuotationDetail {
    id: number;
    number: string;
    subject: string;
    customer: { id: number; name: string; email?: string; phone?: string } | null;
    issued_at: string;
    valid_until: string;
    status: string;
    status_label: string;
    notes: string | null;
    terms: string | null;
    currency: string;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    items: Array<{
        id: number;
        description: string;
        quantity: number;
        unit: string;
        unit_price: number;
        total: number;
    }>;
}

const STATUS_STYLES: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    expired: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

function fmt(amount: number, currency = 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function QuotationShow({
    quotation,
    statuses,
}: {
    quotation: QuotationDetail;
    statuses: { value: string; label: string }[];
}) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Finance', href: financeIndex.url() },
            { title: 'Quotations', href: Routes.index.url() },
            { title: quotation.number, href: Routes.show.url({ quotation: quotation.id }) },
        ],
    });

    const [deleteOpen, setDeleteOpen] = useState(false);

    function handleStatusChange(status: string) {
        router.post(Routes.updateStatus.url({ quotation: quotation.id }), { status }, { preserveScroll: true });
    }

    function handleDelete() {
        router.delete(Routes.destroy.url({ quotation: quotation.id }), {
            onSuccess: () => setDeleteOpen(false),
        });
    }

    return (
        <>
            <Head title={`Quotation ${quotation.number}`} />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Page header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={Routes.index.url()}>← Back</Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight font-mono">{quotation.number}</h1>
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[quotation.status] ?? ''}`}
                                >
                                    {quotation.status_label}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{quotation.subject}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Select value={quotation.status} onValueChange={handleStatusChange}>
                            <SelectTrigger className="w-44">
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

                        <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                            Delete
                        </Button>
                    </div>
                </div>

                {/* Customer + Details */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Customer</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {quotation.customer ? (
                                <dl className="space-y-2 text-sm">
                                    <div className="flex gap-3">
                                        <dt className="w-16 shrink-0 text-muted-foreground">Name</dt>
                                        <dd className="font-medium">{quotation.customer.name}</dd>
                                    </div>
                                    {quotation.customer.email && (
                                        <div className="flex gap-3">
                                            <dt className="w-16 shrink-0 text-muted-foreground">Email</dt>
                                            <dd>{quotation.customer.email}</dd>
                                        </div>
                                    )}
                                    {quotation.customer.phone && (
                                        <div className="flex gap-3">
                                            <dt className="w-16 shrink-0 text-muted-foreground">Phone</dt>
                                            <dd>{quotation.customer.phone}</dd>
                                        </div>
                                    )}
                                </dl>
                            ) : (
                                <p className="text-sm italic text-muted-foreground">No customer assigned.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Quotation Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="space-y-2 text-sm">
                                <div className="flex gap-3">
                                    <dt className="w-24 shrink-0 text-muted-foreground">Issued</dt>
                                    <dd>{fmtDate(quotation.issued_at)}</dd>
                                </div>
                                <div className="flex gap-3">
                                    <dt className="w-24 shrink-0 text-muted-foreground">Valid Until</dt>
                                    <dd>{fmtDate(quotation.valid_until)}</dd>
                                </div>
                                <div className="flex gap-3">
                                    <dt className="w-24 shrink-0 text-muted-foreground">Currency</dt>
                                    <dd>{quotation.currency}</dd>
                                </div>
                                {quotation.notes && (
                                    <div className="flex gap-3">
                                        <dt className="w-24 shrink-0 text-muted-foreground">Notes</dt>
                                        <dd className="text-muted-foreground">{quotation.notes}</dd>
                                    </div>
                                )}
                                {quotation.terms && (
                                    <div className="flex gap-3">
                                        <dt className="w-24 shrink-0 text-muted-foreground">Terms</dt>
                                        <dd className="text-muted-foreground">{quotation.terms}</dd>
                                    </div>
                                )}
                            </dl>
                        </CardContent>
                    </Card>
                </div>

                {/* Line items */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Line Items</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        <th className="px-4 py-3">Description</th>
                                        <th className="px-4 py-3 w-20 text-right">Qty</th>
                                        <th className="px-4 py-3 w-24">Unit</th>
                                        <th className="px-4 py-3 w-32 text-right">Unit Price</th>
                                        <th className="px-4 py-3 w-32 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {quotation.items.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                                No line items.
                                            </td>
                                        </tr>
                                    ) : (
                                        quotation.items.map((item) => (
                                            <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="px-4 py-3">{item.description}</td>
                                                <td className="px-4 py-3 text-right">{item.quantity}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{item.unit}</td>
                                                <td className="px-4 py-3 text-right">
                                                    {fmt(item.unit_price, quotation.currency)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium">
                                                    {fmt(item.total, quotation.currency)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="border-t px-4 py-4">
                            <div className="ml-auto max-w-xs space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{fmt(quotation.subtotal, quotation.currency)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Tax</span>
                                    <span>{fmt(quotation.tax, quotation.currency)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Discount</span>
                                    <span>−{fmt(quotation.discount, quotation.currency)}</span>
                                </div>
                                <div className="flex items-center justify-between border-t pt-2 font-semibold">
                                    <span>Grand Total</span>
                                    <span className="text-lg">{fmt(quotation.total, quotation.currency)}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Quotation</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete quotation{' '}
                            <span className="font-semibold">{quotation.number}</span>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteOpen(false)}>
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
