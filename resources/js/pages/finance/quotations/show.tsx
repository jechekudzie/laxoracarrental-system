import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, FileText, Printer, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    accepted: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    expired: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

const STATUS_ACCENT: Record<string, string> = {
    draft: 'border-gray-300',
    sent: 'border-blue-400',
    accepted: 'border-emerald-500',
    rejected: 'border-red-400',
    expired: 'border-orange-400',
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

    const isExpired = quotation.valid_until && new Date(quotation.valid_until) < new Date() && quotation.status !== 'accepted';

    return (
        <>
            <Head title={`Quotation ${quotation.number}`} />

            <div className="flex flex-1 flex-col gap-4 p-6 print:p-0">
                {/* Toolbar — hidden on print */}
                <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={Routes.index.url()}>
                            <ArrowLeft className="mr-1.5 h-4 w-4" />
                            Back
                        </Link>
                    </Button>

                    <div className="flex flex-wrap items-center gap-2">
                        <Select value={quotation.status} onValueChange={handleStatusChange}>
                            <SelectTrigger className="w-40">
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

                        {quotation.status === 'accepted' && (
                            <Button
                                size="sm"
                                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => router.post(Routes.toRequisition.url({ quotation: quotation.id }), {})}
                            >
                                <FileText className="h-4 w-4" />
                                Convert to Requisition
                            </Button>
                        )}

                        <Button variant="outline" size="sm" onClick={() => window.print()}>
                            <Printer className="mr-1.5 h-4 w-4" />
                            Print
                        </Button>

                        <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                            <Trash2 className="mr-1.5 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                {/* Quotation document */}
                <Card className={`overflow-hidden border-t-4 ${STATUS_ACCENT[quotation.status] ?? 'border-border'} print:shadow-none print:border-0`}>
                    <CardContent className="p-0">

                        {/* Header */}
                        <div className="flex flex-col gap-6 border-b bg-muted/20 px-8 py-8 sm:flex-row sm:items-start sm:justify-between print:bg-white">
                            {/* Logo + company */}
                            <div className="flex flex-col gap-3">
                                <img
                                    src="/brand_assets/Wordmark.svg"
                                    alt="Laxora Car Rental"
                                    className="h-10 w-auto object-contain dark:invert"
                                />
                                <div className="space-y-0.5 text-sm text-muted-foreground">
                                    <p className="font-medium text-foreground">Laxora Car Rental</p>
                                    <p>Vehicle Rental & Fleet Management</p>
                                    <p>info@laxora.com</p>
                                </div>
                            </div>

                            {/* Quotation title + meta */}
                            <div className="sm:text-right">
                                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Quotation</p>
                                <h1 className="mt-1 font-mono text-3xl font-bold tracking-tight">{quotation.number}</h1>
                                <div className="mt-3 space-y-1 text-sm">
                                    <div className="flex items-center gap-2 sm:justify-end">
                                        <span className="text-muted-foreground">Issued</span>
                                        <span className="font-medium">{fmtDate(quotation.issued_at)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 sm:justify-end">
                                        <span className="text-muted-foreground">Valid until</span>
                                        <span className={`font-medium ${isExpired ? 'text-red-500' : ''}`}>
                                            {fmtDate(quotation.valid_until)}
                                            {isExpired && <span className="ml-1 text-xs">(expired)</span>}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 sm:justify-end">
                                        <span className="text-muted-foreground">Currency</span>
                                        <span className="font-medium">{quotation.currency}</span>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <span
                                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[quotation.status] ?? ''}`}
                                    >
                                        {quotation.status_label}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Bill to + Subject */}
                        <div className="grid gap-6 px-8 py-6 sm:grid-cols-2 border-b">
                            {/* Bill to */}
                            <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Bill To</p>
                                {quotation.customer ? (
                                    <div className="space-y-0.5">
                                        <p className="font-semibold text-foreground">{quotation.customer.name}</p>
                                        {quotation.customer.email && (
                                            <p className="text-sm text-muted-foreground">{quotation.customer.email}</p>
                                        )}
                                        {quotation.customer.phone && (
                                            <p className="text-sm text-muted-foreground">{quotation.customer.phone}</p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm italic text-muted-foreground">No customer assigned</p>
                                )}
                            </div>

                            {/* Subject */}
                            <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Subject</p>
                                <p className="font-medium text-foreground">{quotation.subject}</p>
                            </div>
                        </div>

                        {/* Line items */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-muted/40 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        <th className="px-8 py-3">#</th>
                                        <th className="px-4 py-3">Description</th>
                                        <th className="px-4 py-3 w-20 text-right">Qty</th>
                                        <th className="px-4 py-3 w-20">Unit</th>
                                        <th className="px-4 py-3 w-32 text-right">Unit Price</th>
                                        <th className="px-8 py-3 w-32 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {quotation.items.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-12 text-center text-muted-foreground">
                                                No line items on this quotation.
                                            </td>
                                        </tr>
                                    ) : (
                                        quotation.items.map((item, idx) => (
                                            <tr key={item.id} className="transition-colors hover:bg-muted/20">
                                                <td className="px-8 py-3.5 text-muted-foreground">{idx + 1}</td>
                                                <td className="px-4 py-3.5 font-medium">{item.description}</td>
                                                <td className="px-4 py-3.5 text-right text-muted-foreground">{item.quantity}</td>
                                                <td className="px-4 py-3.5 text-muted-foreground">{item.unit || '—'}</td>
                                                <td className="px-4 py-3.5 text-right">{fmt(item.unit_price, quotation.currency)}</td>
                                                <td className="px-8 py-3.5 text-right font-semibold">{fmt(item.total, quotation.currency)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="border-t px-8 py-6">
                            <div className="ml-auto max-w-sm">
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between text-muted-foreground">
                                        <span>Subtotal</span>
                                        <span>{fmt(quotation.subtotal, quotation.currency)}</span>
                                    </div>
                                    {quotation.tax > 0 && (
                                        <div className="flex items-center justify-between text-muted-foreground">
                                            <span>Tax</span>
                                            <span>{fmt(quotation.tax, quotation.currency)}</span>
                                        </div>
                                    )}
                                    {quotation.discount > 0 && (
                                        <div className="flex items-center justify-between text-muted-foreground">
                                            <span>Discount</span>
                                            <span className="text-emerald-600">−{fmt(quotation.discount, quotation.currency)}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between rounded-lg bg-foreground/5 px-4 py-3 font-bold text-base">
                                        <span>Total</span>
                                        <span className="text-xl">{fmt(quotation.total, quotation.currency)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes & Terms */}
                        {(quotation.notes || quotation.terms) && (
                            <div className="grid gap-6 border-t px-8 py-6 sm:grid-cols-2 bg-muted/10">
                                {quotation.notes && (
                                    <div>
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Notes</p>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quotation.notes}</p>
                                    </div>
                                )}
                                {quotation.terms && (
                                    <div>
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Terms & Conditions</p>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quotation.terms}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Footer */}
                        <div className="border-t px-8 py-4 text-center">
                            <p className="text-xs text-muted-foreground">
                                Thank you for your business — Laxora Car Rental · info@laxora.com
                            </p>
                        </div>

                    </CardContent>
                </Card>
            </div>

            {/* Delete dialog */}
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
