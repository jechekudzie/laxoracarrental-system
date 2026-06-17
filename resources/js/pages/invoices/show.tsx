import { Head, Link, setLayoutProps } from '@inertiajs/react';
import { ArrowLeft, Download, ExternalLink, Printer, Receipt as ReceiptIcon } from 'lucide-react';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as Routes from '@/actions/App/Http/Controllers/Web/InvoiceController';
import * as BookingRoutes from '@/actions/App/Http/Controllers/Web/BookingController';
import * as CustomerRoutes from '@/actions/App/Http/Controllers/Web/CustomerController';
import * as PaymentRoutes from '@/actions/App/Http/Controllers/Web/PaymentController';
import { dashboard } from '@/routes';

interface Payment {
    id: number;
    amount: number;
    method: string;
    status: string;
    reference: string | null;
    paid_at: string | null;
}

interface InvoiceDetail {
    id: number;
    number: string;
    status: string;
    customer: { id: number; name: string; phone: string; email: string | null };
    booking: { id: number; reference: string; vehicle: string; reg_plate: string; pickup_datetime: string; return_datetime: string } | null;
    // Canonical shape: {description, quantity, unit_amount, total}.
    // Legacy rows may use {unit_price, amount} instead — normalised on read.
    line_items: Array<{
        description: string;
        quantity?: number;
        unit_amount?: number;
        total?: number;
        unit_price?: number;
        amount?: number;
    }> | null;
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    paid_amount: number;
    currency: string;
    notes: string | null;
    due_date: string | null;
    issued_at: string | null;
    created_at: string;
    payments: Payment[];
}

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft' },
    sent: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Sent' },
    partially_paid: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Partially Paid' },
    paid: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Paid' },
    overdue: { bg: 'bg-red-100', text: 'text-red-800', label: 'Overdue' },
    cancelled: { bg: 'bg-gray-200', text: 'text-gray-500', label: 'Cancelled' },
};

const METHOD_LABELS: Record<string, string> = {
    cash: 'Cash',
    ecocash: 'EcoCash',
    onemoney: 'OneMoney',
    bank_transfer: 'Bank Transfer',
    card: 'Card',
    wallet: 'Wallet',
};

function fmt(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function fmtDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function InvoiceShow({ invoice }: { invoice: InvoiceDetail }) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Invoices', href: Routes.index.url() },
            { title: invoice.number, href: Routes.show.url({ invoice: invoice.id }) },
        ],
    });

    const balance = invoice.total_amount - invoice.paid_amount;
    const isPaid = balance <= 0;
    const status = STATUS_BADGE[invoice.status] ?? STATUS_BADGE.draft;

    const invoiceRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: invoiceRef,
        documentTitle: `Invoice-${invoice.number}`,
        pageStyle: `
            @page { size: A4 portrait; margin: 15mm; }
            @media print {
                body { background: white !important; }
            }
        `,
    });

    return (
        <>
            <Head title={`Invoice ${invoice.number}`} />

            <div className="flex flex-1 flex-col gap-4 p-6">
                {/* Toolbar */}
                <div className="flex items-center justify-between print:hidden">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={Routes.index.url()}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> All Invoices
                        </Link>
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => handlePrint()}>
                            <Printer className="mr-2 h-4 w-4" /> Print
                        </Button>
                        <Button asChild>
                            <a href={Routes.downloadPdf.url({ invoice: invoice.id })} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-2 h-4 w-4" /> Open PDF
                            </a>
                        </Button>
                    </div>
                </div>

                <div className="mx-auto w-full max-w-3xl">
                    {/* Printable invoice document */}
                    <div ref={invoiceRef} className="rounded-2xl border bg-white text-slate-900 shadow-sm overflow-hidden print:border-0 print:shadow-none print:rounded-none">
                        {/* Header band */}
                        <div className="relative bg-gradient-to-br from-indigo-600 to-purple-600 p-8 text-white">
                            <div className="flex items-start justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                                            <span className="text-2xl font-black">L</span>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold leading-none">Laxora</p>
                                            <p className="text-[10px] uppercase tracking-widest opacity-80">Car Rental</p>
                                        </div>
                                    </div>
                                    <p className="mt-4 text-xs opacity-80">Harare Office · Zimbabwe</p>
                                    <p className="text-xs opacity-70">+263 77 000 0000 · hello@laxora.co.zw</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase tracking-widest opacity-70">Invoice</p>
                                    <p className="font-mono text-2xl font-bold">{invoice.number}</p>
                                    <span className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${status.bg} ${status.text}`}>
                                        {status.label}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Bill to + dates */}
                        <div className="grid gap-6 border-b p-8 sm:grid-cols-3">
                            <div className="sm:col-span-2">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Billed to</p>
                                <p className="mt-2 text-lg font-semibold">{invoice.customer.name}</p>
                                <p className="text-sm text-slate-500">{invoice.customer.phone}</p>
                                {invoice.customer.email && <p className="text-sm text-slate-500">{invoice.customer.email}</p>}
                            </div>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Issued</p>
                                    <p className="font-medium">{fmtDate(invoice.issued_at)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Due</p>
                                    <p className="font-medium">{fmtDate(invoice.due_date)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Booking ref */}
                        {invoice.booking && (
                            <div className="border-b p-8">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Rental Details</p>
                                <div className="mt-2 flex flex-wrap items-center gap-3">
                                    <Link
                                        href={BookingRoutes.show.url({ booking: invoice.booking.id })}
                                        className="font-mono font-semibold text-primary hover:underline"
                                        title="Open booking"
                                    >
                                        {invoice.booking.reference}
                                    </Link>
                                    <span className="text-slate-400">·</span>
                                    <span>{invoice.booking.vehicle}</span>
                                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">{invoice.booking.reg_plate}</span>
                                </div>
                                <p className="mt-1 text-sm text-slate-500">
                                    {fmtDate(invoice.booking.pickup_datetime)} → {fmtDate(invoice.booking.return_datetime)}
                                </p>
                            </div>
                        )}

                        {/* Line items */}
                        <div className="p-8">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                        <th className="pb-3">Description</th>
                                        <th className="pb-3 text-right">Qty</th>
                                        <th className="pb-3 text-right">Unit Price</th>
                                        <th className="pb-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {(invoice.line_items ?? []).map((item, i) => {
                                        // Normalise: canonical shape is
                                        // {quantity, unit_amount, total}; older
                                        // rows used {unit_price, amount}.
                                        const qty = item.quantity ?? 1;
                                        const unit =
                                            item.unit_amount ?? item.unit_price ?? 0;
                                        const total =
                                            item.total ?? item.amount ?? qty * unit;
                                        return (
                                            <tr key={i}>
                                                <td className="py-3">{item.description}</td>
                                                <td className="py-3 text-right text-slate-500">{qty}</td>
                                                <td className="py-3 text-right text-slate-500">{fmt(unit, invoice.currency)}</td>
                                                <td className="py-3 text-right font-medium">{fmt(total, invoice.currency)}</td>
                                            </tr>
                                        );
                                    })}
                                    {(invoice.line_items ?? []).length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-6 text-center text-slate-500">No line items.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            <div className="ml-auto mt-4 w-full max-w-xs space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Subtotal</span>
                                    <span>{fmt(invoice.subtotal, invoice.currency)}</span>
                                </div>
                                {invoice.tax_amount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Tax</span>
                                        <span>{fmt(invoice.tax_amount, invoice.currency)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t pt-2 text-base font-bold">
                                    <span>Total</span>
                                    <span>{fmt(invoice.total_amount, invoice.currency)}</span>
                                </div>
                                <div className="flex justify-between text-emerald-700">
                                    <span>Paid</span>
                                    <span>−{fmt(invoice.paid_amount, invoice.currency)}</span>
                                </div>
                                <div className={`flex justify-between rounded-md p-2 font-bold ${isPaid ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                                    <span>{isPaid ? 'Settled' : 'Balance Due'}</span>
                                    <span>{fmt(Math.abs(balance), invoice.currency)}</span>
                                </div>
                            </div>
                        </div>

                        {invoice.notes && (
                            <div className="border-t p-8">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Notes</p>
                                <p className="mt-2 text-sm text-slate-500">{invoice.notes}</p>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="border-t bg-slate-50 p-6 text-center text-[10px] text-slate-500">
                            <p>Thank you for choosing Laxora Car Rental.</p>
                            <p className="mt-1">Payment reference: <span className="font-mono">{invoice.number}</span></p>
                        </div>
                    </div>

                    {/* Non-printable: payments list with individual receipt links */}
                    {invoice.payments.length > 0 && (
                        <div className="mt-8 print:hidden">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <ReceiptIcon className="h-4 w-4 text-muted-foreground" /> Payments on this Invoice
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                <th className="px-4 py-3">Reference</th>
                                                <th className="px-4 py-3">Method</th>
                                                <th className="px-4 py-3">Paid</th>
                                                <th className="px-4 py-3 text-right">Amount</th>
                                                <th className="px-4 py-3 text-right">Receipt</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {invoice.payments.map((p) => (
                                                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 py-3 font-mono text-xs">{p.reference ?? `RC-${p.id}`}</td>
                                                    <td className="px-4 py-3">{METHOD_LABELS[p.method] ?? p.method}</td>
                                                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(p.paid_at)}</td>
                                                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">{fmt(p.amount, invoice.currency)}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Button size="sm" variant="outline" asChild>
                                                            <Link href={PaymentRoutes.showReceipt.url({ payment: p.id })}>
                                                                <ExternalLink className="mr-1 h-3 w-3" /> View
                                                            </Link>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* On-screen navigation hints */}
                    <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground print:hidden">
                        <Link href={CustomerRoutes.show.url({ customer: invoice.customer.id })} className="hover:text-primary hover:underline">
                            View customer →
                        </Link>
                        {invoice.booking && (
                            <Link href={BookingRoutes.show.url({ booking: invoice.booking.id })} className="hover:text-primary hover:underline">
                                View booking →
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
