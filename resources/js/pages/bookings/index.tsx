import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as Routes from '@/actions/App/Http/Controllers/Web/BookingController';
import { dashboard } from '@/routes';

interface Booking {
    id: number;
    reference: string;
    customer_name: string;
    vehicle: string;
    reg_plate: string;
    status: string;
    pickup_datetime: string;
    return_datetime: string;
    total_amount: number;
    currency: string;
}

interface PaginatedBookings {
    data: Booking[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    completed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

function fmt(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function BookingsIndex({
    bookings,
    filters,
    statuses,
}: {
    bookings: PaginatedBookings;
    filters: { search?: string; status?: string };
    statuses: { value: string; label: string }[];
}) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Bookings', href: Routes.index.url() },
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
            <Head title="Bookings" />

            <div className="flex flex-1 flex-col gap-4 p-6">
                <div className="flex flex-wrap items-center gap-3">
                    <form onSubmit={handleSearch} className="flex flex-1 gap-2">
                        <Input
                            placeholder="Search reference, customer, plate…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-xs"
                        />
                        <Button type="submit" variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
                    </form>

                    <Select value={filters.status ?? ''} onValueChange={(v) => applyFilter({ status: v === 'all' ? '' : v, search })}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            {statuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Button asChild>
                        <Link href={Routes.create.url()}><Plus className="mr-2 h-4 w-4" /> New Booking</Link>
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        <th className="px-4 py-3">Reference</th>
                                        <th className="px-4 py-3">Customer</th>
                                        <th className="px-4 py-3">Vehicle</th>
                                        <th className="px-4 py-3">Pickup</th>
                                        <th className="px-4 py-3">Return</th>
                                        <th className="px-4 py-3">Total</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {bookings.data.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No bookings found.</td>
                                        </tr>
                                    )}
                                    {bookings.data.map((b) => (
                                        <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 font-mono font-medium">
                                                <Link href={Routes.show.url({ booking: b.id })} className="text-primary hover:underline">
                                                    {b.reference}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">{b.customer_name}</td>
                                            <td className="px-4 py-3">{b.vehicle} <span className="text-xs text-muted-foreground">({b.reg_plate})</span></td>
                                            <td className="px-4 py-3 text-muted-foreground">{fmtDate(b.pickup_datetime)}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{fmtDate(b.return_datetime)}</td>
                                            <td className="px-4 py-3 font-medium">{fmt(b.total_amount, b.currency)}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[b.status] ?? ''}`}>
                                                    {b.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {bookings.last_page > 1 && (
                            <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
                                <span>{bookings.from}–{bookings.to} of {bookings.total}</span>
                                <div className="flex gap-1">
                                    {bookings.links.map((link, i) => (
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

