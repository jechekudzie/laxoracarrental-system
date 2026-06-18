import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import { Download, FileText, Search, Users } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { dashboard } from '@/routes';
import { index as reportsIndex } from '@/routes/reports';
import { customers as customersRoute, customer as customerRoute } from '@/routes/reports/statements';
import { pdf as customerPdfRoute } from '@/routes/reports/statements/customer';

interface Props {
    customers: {
        data: Array<{ id: number; name: string; email: string | null; phone: string | null; bookings_count: number }>;
        links: any[];
        meta: any;
    };
    filters: { search?: string };
}

const currentYear = new Date().getFullYear();
const defaultStartDate = `${currentYear}-01-01`;
const defaultEndDate = `${currentYear}-12-31`;

export default function CustomerStatements({ customers, filters }: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Reports', href: reportsIndex.url() },
            { title: 'Customer Statements' },
        ],
    });

    const [search, setSearch] = useState(filters.search ?? '');

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get(customersRoute.url(), { search }, { preserveState: true, replace: true });
    }

    return (
        <>
            <Head title="Customer Statements" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Customer Statements</h1>
                    <p className="text-sm text-muted-foreground">Generate account statements for individual customers.</p>
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                        placeholder="Search by name or email…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-sm"
                    />
                    <Button type="submit" variant="outline" size="icon">
                        <Search className="h-4 w-4" />
                    </Button>
                </form>

                {/* Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        <th className="px-4 py-3">Customer</th>
                                        <th className="px-4 py-3">Email</th>
                                        <th className="px-4 py-3">Phone</th>
                                        <th className="px-4 py-3 text-right">Total Bookings</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {customers.data.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-16 text-center">
                                                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                                    <Users className="h-10 w-10 opacity-30" />
                                                    <p className="text-sm">No customers found.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {customers.data.map((c) => (
                                        <tr key={c.id} className="group hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 font-medium">{c.name}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{c.email ?? '—'}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{c.phone ?? '—'}</td>
                                            <td className="px-4 py-3 text-right tabular-nums">{c.bookings_count}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button asChild size="sm" variant="outline">
                                                        <Link href={customerRoute.url({ customer: c.id })}>
                                                            <FileText className="mr-1.5 h-3.5 w-3.5" />
                                                            View Statement
                                                        </Link>
                                                    </Button>
                                                    <Button asChild size="sm" variant="outline">
                                                        <a
                                                            href={`${customerPdfRoute.url({ customer: c.id })}?start_date=${defaultStartDate}&end_date=${defaultEndDate}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <Download className="mr-1.5 h-3.5 w-3.5" />
                                                            Download PDF
                                                        </a>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {customers.links && customers.links.length > 3 && (
                            <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
                                <span>
                                    {customers.meta?.from ?? ''}
                                    {customers.meta?.from && customers.meta?.to ? `–${customers.meta.to} of ${customers.meta.total}` : ''}
                                </span>
                                <div className="flex gap-1">
                                    {customers.links.map((link: any, i: number) => (
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
