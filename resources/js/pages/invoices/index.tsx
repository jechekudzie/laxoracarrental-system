import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import { Search } from 'lucide-react';
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

const STATUS_STYLES: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    sent: 'bg-blue-100 text-blue-800',
    partially_paid: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-200 text-gray-500',
};

function fmt(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function fmtDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function InvoicesIndex({
    invoices,
    filters,
    statuses,
}: {
    invoices: PaginatedInvoices;
    filters: { search?: string; status?: string };
    statuses: { value: string; label: string }[];
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

    return (
        <>
            <Head title="Invoices" />

            <div className="flex flex-1 flex-col gap-4 p-6">
                <div className="flex flex-wrap items-center gap-3">
                    <form onSubmit={handleSearch} className="flex flex-1 gap-2">
                        <Input
                            placeholder="Search invoice number, customer…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-xs"
                        />
                        <Button type="submit" variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
                    </form>

                    <Select value={filters.status ?? ''} onValueChange={(v) => applyFilter({ status: v === 'all' ? '' : v, search })}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            {statuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        <th className="px-4 py-3">Invoice #</th>
                                        <th className="px-4 py-3">Customer</th>
                                        <th className="px-4 py-3">Booking</th>
                                        <th className="px-4 py-3">Total</th>
                                        <th className="px-4 py-3">Paid</th>
                                        <th className="px-4 py-3">Due Date</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {invoices.data.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No invoices found.</td>
                                        </tr>
                                    )}
                                    {invoices.data.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 font-mono font-medium">
                                                <Link href={Routes.show.url({ invoice: inv.id })} className="text-primary hover:underline">
                                                    {inv.number}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">{inv.customer_name}</td>
                                            <td className="px-4 py-3 font-mono text-xs">
                                                {inv.booking_id && inv.booking_reference ? (
                                                    <Link
                                                        href={BookingRoutes.show.url({ booking: inv.booking_id })}
                                                        className="text-primary hover:underline"
                                                    >
                                                        {inv.booking_reference}
                                                    </Link>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-medium">{fmt(inv.total_amount, inv.currency)}</td>
                                            <td className="px-4 py-3">{fmt(inv.paid_amount, inv.currency)}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{fmtDate(inv.due_date)}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[inv.status] ?? ''}`}>
                                                    {inv.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {invoices.last_page > 1 && (
                            <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
                                <span>{invoices.from}–{invoices.to} of {invoices.total}</span>
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

