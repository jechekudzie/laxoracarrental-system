import { Head, Link, setLayoutProps } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Download, Printer } from 'lucide-react';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/button';
import * as InvoiceRoutes from '@/actions/App/Http/Controllers/Web/InvoiceController';
import * as BookingRoutes from '@/actions/App/Http/Controllers/Web/BookingController';
import * as PaymentRoutes from '@/actions/App/Http/Controllers/Web/PaymentController';
import { dashboard } from '@/routes';

interface Payment {
    id: number;
    reference: string;
    type: string;
    type_label: string;
    amount: number;
    currency: string;
    method: string;
    gateway_reference: string | null;
    status: string;
    paid_at: string | null;
    notes: string | null;
    customer: { id: number; name: string; phone: string; email: string | null };
    booking: { id: number; reference: string; vehicle_label: string | null; reg_plate: string | null } | null;
    invoice: { id: number; number: string } | null;
}

function fmt(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function fmtDatetime(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

const METHOD_LABELS: Record<string, string> = {
    cash: 'Cash',
    ecocash: 'EcoCash',
    onemoney: 'OneMoney',
    bank_transfer: 'Bank Transfer',
    card: 'Card',
    wallet: 'Customer Wallet',
};

export default function ReceiptShow({ payment }: { payment: Payment }) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            ...(payment.invoice
                ? [
                      { title: 'Invoices', href: InvoiceRoutes.index.url() },
                      { title: payment.invoice.number, href: InvoiceRoutes.show.url({ invoice: payment.invoice.id }) },
                  ]
                : []),
            { title: `Receipt ${payment.reference}`, href: '#' },
        ],
    });

    const receiptRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: `Receipt-${payment.reference}`,
        pageStyle: `
            @page { size: A5 portrait; margin: 12mm; }
            @media print {
                body { background: white !important; }
            }
        `,
    });

    const isRefund = payment.type === 'deposit_refund' || payment.type === 'refund';
    const accent = isRefund ? 'from-purple-500 to-pink-600' : 'from-emerald-500 to-teal-600';

    return (
        <>
            <Head title={`Receipt ${payment.reference}`} />

            <div className="flex flex-1 flex-col gap-4 p-6">
                <div className="flex items-center justify-between print:hidden">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={payment.invoice ? InvoiceRoutes.show.url({ invoice: payment.invoice.id }) : dashboard.url()}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Link>
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => handlePrint()}>
                            <Printer className="mr-2 h-4 w-4" /> Print
                        </Button>
                        <Button asChild>
                            <a href={PaymentRoutes.downloadReceipt.url({ payment: payment.id })} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-2 h-4 w-4" /> Open PDF
                            </a>
                        </Button>
                    </div>
                </div>

                <div className="mx-auto w-full max-w-md">
                    <div ref={receiptRef} className="rounded-2xl border bg-white text-slate-900 shadow-sm overflow-hidden print:border-0 print:shadow-none print:rounded-none">
                        {/* Top band */}
                        <div className={`bg-gradient-to-br ${accent} p-6 text-white`}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
                                            <span className="text-lg font-black">L</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold leading-none">Laxora</p>
                                            <p className="text-[10px] uppercase tracking-widest opacity-80">Car Rental</p>
                                        </div>
                                    </div>
                                    <p className="mt-3 text-xs opacity-80">Harare Office · +263 77 000 0000</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs uppercase tracking-wider opacity-80">
                                        {isRefund ? 'Refund' : 'Receipt'}
                                    </p>
                                    <p className="mt-1 font-mono text-sm font-bold">{payment.reference}</p>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            {/* Amount headline */}
                            <div className="text-center py-4">
                                <p className="text-xs uppercase tracking-wider text-slate-500">{payment.type_label}</p>
                                <p className={`mt-1 text-4xl font-bold tracking-tight ${isRefund ? 'text-purple-700' : 'text-slate-900'}`}>
                                    {isRefund && '−'}{fmt(payment.amount, payment.currency)}
                                </p>
                                <div className={`mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                                    payment.status === 'completed'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-amber-100 text-amber-800'
                                }`}>
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span className="capitalize">{payment.status}</span>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="mt-4 space-y-3 border-t border-dashed pt-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Paid on</span>
                                    <span className="font-medium">{fmtDatetime(payment.paid_at)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Method</span>
                                    <span className="font-medium">{METHOD_LABELS[payment.method] ?? payment.method}</span>
                                </div>
                                {payment.gateway_reference && (
                                    <div className="flex justify-between gap-2">
                                        <span className="text-slate-500">Txn Reference</span>
                                        <span className="font-mono text-xs text-right break-all">{payment.gateway_reference}</span>
                                    </div>
                                )}
                            </div>

                            {/* Customer */}
                            <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Customer</p>
                                <p className="mt-1 font-semibold">{payment.customer.name}</p>
                                <p className="text-xs text-slate-600">{payment.customer.phone}</p>
                                {payment.customer.email && <p className="text-xs text-slate-600">{payment.customer.email}</p>}
                            </div>

                            {/* Booking link */}
                            {payment.booking && (
                                <div className="mt-3 rounded-lg border border-dashed p-4 text-sm">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Rental</p>
                                    <Link
                                        href={BookingRoutes.show.url({ booking: payment.booking.id })}
                                        className="mt-1 inline-block font-mono font-semibold text-primary hover:underline print:text-inherit print:no-underline"
                                        title="Open booking"
                                    >
                                        {payment.booking.reference}
                                    </Link>
                                    {payment.booking.vehicle_label && (
                                        <p className="text-xs text-slate-600">
                                            {payment.booking.vehicle_label}
                                            {payment.booking.reg_plate && <span className="font-mono"> · {payment.booking.reg_plate}</span>}
                                        </p>
                                    )}
                                </div>
                            )}

                            {payment.notes && (
                                <div className="mt-3 text-xs text-slate-500 italic">
                                    "{payment.notes}"
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-dashed bg-slate-50 p-4 text-center text-[10px] text-slate-500">
                            <p>Thank you for your payment.</p>
                            <p className="mt-1">This receipt confirms the transaction above.</p>
                            {payment.invoice && (
                                <p className="mt-1 font-mono">Invoice ref: {payment.invoice.number}</p>
                            )}
                        </div>
                    </div>

                    {/* Quick link on screen */}
                    {payment.booking && (
                        <div className="mt-4 text-center print:hidden">
                            <Link
                                href={BookingRoutes.show.url({ booking: payment.booking.id })}
                                className="text-xs text-muted-foreground hover:text-primary hover:underline"
                            >
                                View booking → {payment.booking.reference}
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
