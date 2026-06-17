import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import { FileText, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as Routes from '@/actions/App/Http/Controllers/Web/QuotationController';
import { dashboard } from '@/routes';
import { index as financeIndex } from '@/routes/finance';

interface PaginatedData<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    last_page: number;
    total: number;
    from: number;
    to: number;
}

interface Quotation {
    id: number;
    number: string;
    subject: string;
    customer: { name: string } | null;
    issued_at: string;
    valid_until: string;
    status: string;
    status_label: string;
    status_color: string;
    total: number;
    currency: string;
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

export default function QuotationsIndex({
    quotations,
    filters,
    statuses,
}: {
    quotations: PaginatedData<Quotation>;
    filters: { search?: string; status?: string };
    statuses: { value: string; label: string }[];
}) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Finance', href: financeIndex.url() },
            { title: 'Quotations', href: Routes.index.url() },
        ],
    });

    const [search, setSearch] = useState(filters.search ?? '');
    const [deleteTarget, setDeleteTarget] = useState<Quotation | null>(null);

    function applyFilter(params: Record<string, string>) {
        router.get(Routes.index.url(), { ...filters, ...params }, { preserveState: true, replace: true });
    }

    function handleDelete() {
        if (!deleteTarget) {
            return;
        }

        router.delete(Routes.destroy.url({ quotation: deleteTarget.id }), {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
        });
    }

    return (
        <>
            <Head title="Quotations" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Quotations</h1>
                        <p className="text-sm text-muted-foreground">Manage customer quotations and proposals.</p>
                    </div>
                    <Button asChild>
                        <Link href={Routes.create.url()}>
                            <Plus className="mr-2 h-4 w-4" /> New Quotation
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            applyFilter({ search });
                        }}
                        className="flex flex-1 gap-2"
                    >
                        <Input
                            placeholder="Search quotations…"
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
                        <SelectTrigger className="w-48">
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

                {quotations.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                                <FileText className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-lg font-semibold">No quotations yet</p>
                            <p className="max-w-md text-sm text-muted-foreground">
                                Create a quotation to send a formal proposal to your customers.
                            </p>
                            <Button asChild className="mt-2">
                                <Link href={Routes.create.url()}>
                                    <Plus className="mr-2 h-4 w-4" /> Create your first quotation
                                </Link>
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
                                            <th className="px-4 py-3">#</th>
                                            <th className="px-4 py-3">Subject</th>
                                            <th className="px-4 py-3">Customer</th>
                                            <th className="px-4 py-3">Issued</th>
                                            <th className="px-4 py-3">Valid Until</th>
                                            <th className="px-4 py-3 text-right">Total</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {quotations.data.map((q) => (
                                            <tr key={q.id} className="transition-colors hover:bg-muted/30">
                                                <td className="px-4 py-3 font-mono text-xs">
                                                    <Link
                                                        href={Routes.show.url({ quotation: q.id })}
                                                        className="font-medium text-primary hover:underline"
                                                    >
                                                        {q.number}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="font-medium">{q.subject}</span>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {q.customer?.name ?? <span className="italic">No customer</span>}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{fmtDate(q.issued_at)}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{fmtDate(q.valid_until)}</td>
                                                <td className="px-4 py-3 text-right font-semibold">
                                                    {fmt(q.total, q.currency)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[q.status] ?? ''}`}
                                                    >
                                                        {q.status_label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                                        onClick={() => setDeleteTarget(q)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {quotations.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            {quotations.from}–{quotations.to} of {quotations.total}
                        </span>
                        <div className="flex gap-1">
                            {quotations.links.map((link, i) => (
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

            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Quotation</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete quotation{' '}
                            <span className="font-semibold">{deleteTarget?.number}</span>? This action cannot be undone.
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
