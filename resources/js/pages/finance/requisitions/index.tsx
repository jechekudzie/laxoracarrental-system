import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import { ClipboardList, DollarSign, Eye, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as Routes from '@/actions/App/Http/Controllers/Web/RequisitionController';
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

interface Requisition {
    id: number;
    number: string;
    title: string;
    status: string;
    status_label: string;
    priority: string;
    priority_label: string;
    required_by: string | null;
    total_estimated: number;
    cost_center: { id: number; name: string } | null;
    requested_by: string | null;
    created_at: string;
}

interface Summary {
    total: number;
    pending: number;
    approved: number;
    total_value: number;
}

const PRIORITY_STYLES: Record<string, string> = {
    low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    fulfilled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

function fmt(amount: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function fmtDate(d: string | null) {
    if (!d) {
        return '—';
    }

    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function RequisitionsIndex({
    requisitions,
    filters,
    statuses,
    priorities,
    cost_centers,
    summary,
}: {
    requisitions: PaginatedData<Requisition>;
    filters: { search?: string; status?: string; priority?: string; cost_center_id?: string };
    statuses: { value: string; label: string }[];
    priorities: { value: string; label: string }[];
    cost_centers: { id: number; name: string }[];
    summary: Summary;
}) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Finance', href: financeIndex.url() },
            { title: 'Requisitions', href: Routes.index.url() },
        ],
    });

    const [search, setSearch] = useState(filters.search ?? '');
    const [deleteTarget, setDeleteTarget] = useState<Requisition | null>(null);

    function applyFilter(params: Record<string, string>) {
        router.get(Routes.index.url(), { ...filters, ...params }, { preserveState: true, replace: true });
    }

    function handleDelete() {
        if (!deleteTarget) {
            return;
        }

        router.delete(Routes.destroy.url({ requisition: deleteTarget.id }), {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
        });
    }

    return (
        <>
            <Head title="Requisitions" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Page header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Requisitions</h1>
                        <p className="text-sm text-muted-foreground">Track purchase requests and approvals.</p>
                    </div>
                    <Button asChild>
                        <Link href={Routes.create.url()}>
                            <Plus className="mr-2 h-4 w-4" /> New Requisition
                        </Link>
                    </Button>
                </div>

                {/* Summary stat cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Requisitions</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-end justify-between">
                            <p className="text-2xl font-bold">{summary.total}</p>
                            <ClipboardList className="h-5 w-5 text-muted-foreground" />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-end justify-between">
                            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summary.pending}</p>
                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                Pending
                            </span>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-end justify-between">
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.approved}</p>
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                Approved
                            </span>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Est. Value</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-end justify-between">
                            <p className="text-2xl font-bold">{fmt(summary.total_value)}</p>
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            applyFilter({ search });
                        }}
                        className="flex flex-1 gap-2"
                    >
                        <Input
                            placeholder="Search by number or title…"
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

                    <Select
                        value={filters.priority ?? ''}
                        onValueChange={(v) => applyFilter({ priority: v === 'all' ? '' : v })}
                    >
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="All priorities" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All priorities</SelectItem>
                            {priorities.map((p) => (
                                <SelectItem key={p.value} value={p.value}>
                                    {p.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.cost_center_id ?? ''}
                        onValueChange={(v) => applyFilter({ cost_center_id: v === 'all' ? '' : v })}
                    >
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="All cost centers" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All cost centers</SelectItem>
                            {cost_centers.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                    {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Table or empty state */}
                {requisitions.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                                <ClipboardList className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-lg font-semibold">No requisitions found</p>
                            <p className="max-w-md text-sm text-muted-foreground">
                                Create a purchase requisition to request items or services for your operations.
                            </p>
                            <Button asChild className="mt-2">
                                <Link href={Routes.create.url()}>
                                    <Plus className="mr-2 h-4 w-4" /> Create your first requisition
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
                                        <tr className="border-b bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            <th className="px-4 py-3">Requisition</th>
                                            <th className="px-4 py-3">Badges</th>
                                            <th className="px-4 py-3">Cost Center</th>
                                            <th className="px-4 py-3">Required By</th>
                                            <th className="px-4 py-3 text-right">Est. Total</th>
                                            <th className="px-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {requisitions.data.map((r) => (
                                            <tr key={r.id} className="transition-colors hover:bg-muted/30">
                                                {/* Number + Title combined */}
                                                <td className="px-4 py-3">
                                                    <Link
                                                        href={Routes.show.url({ requisition: r.id })}
                                                        className="font-mono text-xs font-semibold text-primary hover:underline"
                                                    >
                                                        {r.number}
                                                    </Link>
                                                    <p className="mt-0.5 font-medium text-foreground">{r.title}</p>
                                                    {r.requested_by && (
                                                        <p className="text-xs text-muted-foreground">{r.requested_by}</p>
                                                    )}
                                                </td>

                                                {/* Status + Priority badges side by side */}
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status] ?? ''}`}
                                                        >
                                                            {r.status_label}
                                                        </span>
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[r.priority] ?? ''}`}
                                                        >
                                                            {r.priority_label}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {r.cost_center?.name ?? <span className="italic">—</span>}
                                                </td>

                                                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                                    {fmtDate(r.required_by)}
                                                </td>

                                                <td className="px-4 py-3 text-right font-semibold">{fmt(r.total_estimated)}</td>

                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                                                            <Link href={Routes.show.url({ requisition: r.id })}>
                                                                <Eye className="h-3.5 w-3.5" />
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                                            onClick={() => setDeleteTarget(r)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Pagination */}
                {requisitions.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            {requisitions.from}–{requisitions.to} of {requisitions.total}
                        </span>
                        <div className="flex gap-1">
                            {requisitions.links.map((link, i) => (
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

            {/* Delete confirmation dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Requisition</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete requisition{' '}
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
