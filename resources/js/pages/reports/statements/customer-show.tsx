import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { index as reportsIndex } from '@/routes/reports';
import { customers as customerStatements, customer as customerStatement } from '@/routes/reports/statements';
import { pdf as customerStatementPdf } from '@/routes/reports/statements/customer';

interface Props {
    customer: {
        id: number;
        name: string;
        email: string | null;
        phone: string | null;
        id_number: string | null;
    };
    bookings: Array<{
        id: number;
        reference: string;
        vehicle: string | null;
        status: string;
        status_label: string;
        pickup_datetime: string;
        return_datetime: string;
        total_amount: number;
        currency: string;
        invoice: { number: string; total: number; paid: number; balance: number; status: string } | null;
    }>;
    payments: Array<{
        id: number;
        paid_at: string;
        amount: number;
        method: string;
        reference: string | null;
    }>;
    summary: {
        total_bookings: number;
        total_billed: number;
        total_paid: number;
        outstanding: number;
    };
    period: { start: string; end: string };
}

const BOOKING_STATUS_STYLES: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    completed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const INVOICE_STATUS_STYLES: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    partial: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
};

function fmt(amount: number, currency = 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateInput(d: string) {
    return d.split('T')[0];
}

export default function CustomerStatementShow({ customer, bookings, payments, summary, period }: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Reports', href: reportsIndex.url() },
            { title: 'Customer Statements', href: customerStatements.url() },
            { title: customer.name, href: customerStatement.url({ customer: customer.id }) },
        ],
    });

    const [startDate, setStartDate] = useState(fmtDateInput(period.start));
    const [endDate, setEndDate] = useState(fmtDateInput(period.end));

    function applyDateFilter() {
        router.get(
            customerStatement.url({ customer: customer.id }),
            { start_date: startDate, end_date: endDate },
            { preserveScroll: true },
        );
    }

    const pdfUrl = customerStatementPdf.url(
        { customer: customer.id },
        { query: { start_date: fmtDateInput(period.start), end_date: fmtDateInput(period.end) } },
    );

    return (
        <>
            <Head title={`Statement — ${customer.name}`} />

            <div className="flex flex-1 flex-col gap-4 p-6">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={customerStatements.url()}>
                            <ArrowLeft className="mr-1.5 h-4 w-4" />
                            Back
                        </Link>
                    </Button>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-muted-foreground whitespace-nowrap">From</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-muted-foreground whitespace-nowrap">To</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <Button size="sm" variant="outline" onClick={applyDateFilter}>
                            Apply
                        </Button>

                        <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white" asChild>
                            <a href={pdfUrl} target="_blank" rel="noreferrer">
                                <Download className="h-4 w-4" />
                                Download PDF
                            </a>
                        </Button>
                    </div>
                </div>

                {/* Statement document */}
                <Card className="overflow-hidden border-t-4 border-blue-500">
                    <CardContent className="p-0">

                        {/* Header */}
                        <div className="flex flex-col gap-6 border-b bg-muted/20 px-8 py-8 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex flex-col gap-3">
                                <img
                                    src="/brand_assets/Wordmark.svg"
                                    alt="Laxora Car Rental"
                                    className="h-10 w-auto object-contain dark:invert"
                                />
                                <div className="space-y-0.5 text-sm text-muted-foreground">
                                    <p className="font-medium text-foreground">Laxora Car Rental</p>
                                    <p>Vehicle Rental &amp; Fleet Management</p>
                                    <p>info@laxora.com</p>
                                </div>
                            </div>

                            <div className="sm:text-right">
                                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Customer Statement</p>
                                <h1 className="mt-1 text-2xl font-bold tracking-tight">{customer.name}</h1>
                                <div className="mt-3 space-y-1 text-sm">
                                    <div className="flex items-center gap-2 sm:justify-end">
                                        <span className="text-muted-foreground">Period</span>
                                        <span className="font-medium">
                                            {fmtDate(period.start)} — {fmtDate(period.end)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Customer info box */}
                        <div className="border-b px-8 py-6">
                            <div className="inline-block rounded-lg bg-blue-50 px-5 py-4 dark:bg-blue-950/30">
                                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">Account Holder</p>
                                <p className="text-base font-bold text-foreground">{customer.name}</p>
                                {customer.email && (
                                    <p className="mt-0.5 text-sm text-muted-foreground">{customer.email}</p>
                                )}
                                {customer.phone && (
                                    <p className="text-sm text-muted-foreground">{customer.phone}</p>
                                )}
                                {customer.id_number && (
                                    <p className="text-sm text-muted-foreground">ID: {customer.id_number}</p>
                                )}
                            </div>
                        </div>

                        {/* Summary stat cards */}
                        <div className="grid grid-cols-2 gap-4 border-b px-8 py-6 sm:grid-cols-4">
                            <div className="rounded-lg border bg-card p-4 text-center shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Bookings</p>
                                <p className="mt-1 text-2xl font-bold text-foreground">{summary.total_bookings}</p>
                            </div>
                            <div className="rounded-lg border bg-card p-4 text-center shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Billed</p>
                                <p className="mt-1 text-2xl font-bold text-foreground">{fmt(summary.total_billed)}</p>
                            </div>
                            <div className="rounded-lg border bg-card p-4 text-center shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Paid</p>
                                <p className="mt-1 text-2xl font-bold text-emerald-600">{fmt(summary.total_paid)}</p>
                            </div>
                            <div className="rounded-lg border bg-card p-4 text-center shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outstanding</p>
                                <p className={`mt-1 text-2xl font-bold ${summary.outstanding > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {fmt(summary.outstanding)}
                                </p>
                            </div>
                        </div>

                        {/* Bookings table */}
                        <div className="border-b px-8 py-6">
                            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Bookings</h2>
                            <div className="overflow-x-auto rounded-lg border">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted/40 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Booking Ref</th>
                                            <th className="px-4 py-3">Vehicle</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3 text-right">Amount</th>
                                            <th className="px-4 py-3">Invoice Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {bookings.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                                                    No bookings in this period.
                                                </td>
                                            </tr>
                                        ) : (
                                            bookings.map((booking, idx) => (
                                                <tr
                                                    key={booking.id}
                                                    className={`transition-colors hover:bg-muted/20 ${idx % 2 === 0 ? '' : 'bg-muted/10'}`}
                                                >
                                                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                                        {fmtDate(booking.pickup_datetime)}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono font-semibold tracking-tight">
                                                        {booking.reference}
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {booking.vehicle ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${BOOKING_STATUS_STYLES[booking.status] ?? 'bg-gray-100 text-gray-700'}`}
                                                        >
                                                            {booking.status_label}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                                                        {fmt(booking.total_amount, booking.currency)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {booking.invoice ? (
                                                            <span
                                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${INVOICE_STATUS_STYLES[booking.invoice.status] ?? 'bg-gray-100 text-gray-600'}`}
                                                            >
                                                                {booking.invoice.status.charAt(0).toUpperCase() + booking.invoice.status.slice(1)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">No invoice</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Payments table */}
                        <div className="border-b px-8 py-6">
                            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Payments Received</h2>
                            <div className="overflow-x-auto rounded-lg border">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted/40 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Method</th>
                                            <th className="px-4 py-3">Reference</th>
                                            <th className="px-4 py-3 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {payments.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                                                    No payments in this period.
                                                </td>
                                            </tr>
                                        ) : (
                                            payments.map((payment, idx) => (
                                                <tr
                                                    key={payment.id}
                                                    className={`transition-colors hover:bg-muted/20 ${idx % 2 === 0 ? '' : 'bg-muted/10'}`}
                                                >
                                                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                                        {fmtDate(payment.paid_at)}
                                                    </td>
                                                    <td className="px-4 py-3 capitalize text-muted-foreground">
                                                        {payment.method}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                                        {payment.reference ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold text-emerald-600 whitespace-nowrap">
                                                        {fmt(payment.amount)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Account balance box */}
                        <div className="px-8 py-6">
                            <div className="ml-auto max-w-sm">
                                <div className="rounded-lg border bg-muted/10 p-5 space-y-3 text-sm">
                                    <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Account Balance</p>
                                    <div className="flex items-center justify-between text-muted-foreground">
                                        <span>Total Billed</span>
                                        <span className="font-medium text-foreground">{fmt(summary.total_billed)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-muted-foreground">
                                        <span>Total Paid</span>
                                        <span className="font-medium text-emerald-600">{fmt(summary.total_paid)}</span>
                                    </div>
                                    <div className="border-t pt-3 flex items-center justify-between font-bold text-base">
                                        <span>Outstanding</span>
                                        <span className={summary.outstanding > 0 ? 'text-red-600' : 'text-emerald-600'}>
                                            {fmt(summary.outstanding)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom download button */}
                        <div className="border-t px-8 py-6 flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                                Generated {fmtDate(new Date().toISOString())} — Laxora Car Rental · info@laxora.com
                            </p>
                            <Button className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white" asChild>
                                <a href={pdfUrl} target="_blank" rel="noreferrer">
                                    <Download className="h-4 w-4" />
                                    Download PDF
                                </a>
                            </Button>
                        </div>

                    </CardContent>
                </Card>
            </div>
        </>
    );
}
