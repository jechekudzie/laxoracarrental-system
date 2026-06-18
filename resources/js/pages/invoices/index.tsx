import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import { Download, Eye, FileX, Receipt, Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as Routes from '@/actions/App/Http/Controllers/Web/InvoiceController';
import * as BookingRoutes from '@/actions/App/Http/Controllers/Web/BookingController';
import { dashboard } from '@/routes';

interface Invoice {
    id: number;
    number: string;
    customer_name: string;
    booking_id: number | null;
    booking_reference: string | null;
    status: string;
    total_amount: number;
    paid_amount: number;
    currency: string;
    due_date: string | null;
    issued_at: string | null;
}

interface PaginatedInvoices {
    data: Invoice[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

interface Summary {
    total: number;
    outstanding: number;
    paid_this_month: number;
    overdue: number;
}

const STATUS_STYLES: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    partially_paid: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    cancelled: 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
};

function fmt(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function fmtDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isOverdue(inv: Invoice): boolean {
    return inv.status === 'overdue';
}

function isDueSoon(inv: Invoice): boolean {
    if (!inv.due_date || inv.status === 'paid' || inv.status === 'cancelled') {
        return false;
    }
    const diff = new Date(inv.due_date).getTime() - Date.now();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <Card className="gap-3 py-4">
            <CardContent className="px-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
                {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
            </CardContent>
        </Card>
    );
}

export default function InvoicesIndex({
    invoices,
    filters,
    statuses,
    summary,
}: {
    invoices: PaginatedInvoices;
    filters: { search?: string; status?: string };
    statuses: { value: string; label: string }[];
    summary: Summary;
}) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Invoices', href: Routes.index.url() },
        ],
    });

    const [search, setSearch] = useState(filters.search ?? '');

    function applyFilter(params: Record<string, string>) {
        router.get(Routes.index.url(), { ...filters, ...params }, { preserveState: true, replace: true });
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        applyFilter({ search });
    }

    const currency = invoices.data[0]?.currency ?? 'USD';

    return (
        <>
            <Head title="Invoices" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Page header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Track customer billing and payment status.</p>
                </div>

                {/* Summary stat cards */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <StatCard label="Total Invoices" value={summary.total.toString()} sub="all time" />
                    <StatCard label="Outstanding" value={fmt(summary.outstanding, currency)} sub="unpaid balance" />
                    <StatCard label="Paid This Month" value={fmt(summary.paid_this_month, currency)} sub="collected" />
                    <StatCard
                        label="Overdue"
                        value={summary.overdue.toString()}
                        sub={summary.overdue === 1 ? 'invoice' : 'invoices'}
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <form onSubmit={handleSearch} className="flex flex-1 gap-2">
                        <Input
                            placeholder="Search invoice number, customer…"
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
                        onValueChange={(v) => applyFilter({ status: v === 'all' ? '' : v, search })}
                    >
                        <SelectTrigger className="w-44">
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
                </div>

                {/* Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        <th className="px-4 py-3">Invoice #</th>
                                        <th className="px-4 py-3">Customer</th>
                                        <th className="px-4 py-3">Amount</th>
                                        <th className="px-4 py-3">Due Date</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {invoices.data.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-16 text-center">
                                                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                                    <Receipt className="h-10 w-10 opacity-30" />
                                                    <div>
                                                        <p className="font-medium">No invoices found</p>
                                                        <p className="mt-0.5 text-xs">
                                                            {filters.search || filters.status
                                                                ? 'Try adjusting your search or filter.'
                                                                : 'Invoices are generated automatically from bookings.'}
                                                        </p>
                                                    </div>
                                                    {(filters.search || filters.status) && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSearch('');
                                                                router.get(Routes.index.url(), {}, { replace: true });
                                                            }}
                                                        >
                                                            <FileX className="mr-1.5 h-3.5 w-3.5" />
                                                            Clear filters
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {invoices.data.map((inv) => (
                                        <tr
                                            key={inv.id}
                                            className={`transition-colors hover:bg-muted/30 ${isOverdue(inv) ? 'bg-red-50/60 dark:bg-red-950/20' : ''}`}
                                        >
                                            {/* Invoice number */}
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={Routes.show.url({ invoice: inv.id })}
                                                    className="font-mono text-sm font-semibold text-primary hover:underline"
                                                >
                                                    {inv.number}
                                                </Link>
                                            </td>

                                            {/* Customer + booking sub-line */}
                                            <td className="px-4 py-3">
                                                <span className="font-medium">{inv.customer_name}</span>
                                                {inv.booking_id && inv.booking_reference && (
                                                    <div className="mt-0.5">
                                                        <Link
                                                            href={BookingRoutes.show.url({ booking: inv.booking_id })}
                                                            className="font-mono text-xs text-muted-foreground hover:text-primary hover:underline"
                                                        >
                                                            {inv.booking_reference}
                                                        </Link>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Amount: total + paid sub-line */}
                                            <td className="px-4 py-3">
                                                <span className="font-semibold">{fmt(inv.total_amount, inv.currency)}</span>
                                                {inv.paid_amount > 0 && (
                                                    <div className="mt-0.5 text-xs text-green-600 dark:text-green-400">
                                                        {fmt(inv.paid_amount, inv.currency)} paid
                                                    </div>
                                                )}
                                            </td>

                                            {/* Due date — red if overdue, amber if due soon */}
                                            <td className="px-4 py-3">
                                                <span
                                                    className={
                                                        isOverdue(inv)
                                                            ? 'font-medium text-red-600 dark:text-red-400'
                                                            : isDueSoon(inv)
                                                              ? 'font-medium text-yellow-600 dark:text-yellow-400'
                                                              : 'text-muted-foreground'
                                                    }
                                                >
                                                    {fmtDate(inv.due_date)}
                                                </span>
                                            </td>

                                            {/* Status badge */}
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[inv.status] ?? ''}`}
                                                >
                                                    {inv.status.replace('_', ' ')}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                                                        <Link href={Routes.show.url({ invoice: inv.id })} title="View invoice">
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </Link>
                                                    </Button>
                                                    <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                                                        <a
                                                            href={Routes.downloadPdf.url({ invoice: inv.id })}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            title="Download PDF"
                                                        >
                                                            <Download className="h-3.5 w-3.5" />
                                                        </a>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {invoices.last_page > 1 && (
                            <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
                                <span>
                                    {invoices.from}–{invoices.to} of {invoices.total}
                                </span>
                                <div className="flex gap-1">
                                    {invoices.links.map((link, i) => (
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
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
