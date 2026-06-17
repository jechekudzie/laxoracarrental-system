import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import { AlertTriangle, CircleDollarSign, Search, Wrench, Zap } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { index as maintenanceIndex } from '@/routes/maintenance';
import * as VehicleRoutes from '@/actions/App/Http/Controllers/Web/VehicleController';
import { dashboard } from '@/routes';

interface MaintenanceRecord {
    id: number;
    vehicle_id: number;
    vehicle_label: string | null;
    reg_plate: string | null;
    type: string;
    service_type: string | null;
    description: string;
    service_provider: string | null;
    odometer: number | null;
    total_cost: number;
    currency: string;
    downtime_days: number;
    started_at: string | null;
    completed_at: string | null;
}

interface PaginatedRecords {
    data: MaintenanceRecord[];
    links: { url: string | null; label: string; active: boolean }[];
    last_page: number;
    total: number;
    from: number;
    to: number;
}

interface Summary {
    total_records: number;
    total_cost: number;
    scheduled_count: number;
    breakdown_count: number;
    accident_count: number;
}

const TYPE_STYLES: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    breakdown: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    accident: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

function fmt(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function fmtDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; accent: string }) {
    return (
        <Card>
            <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${accent}`}>
                    <Icon className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}

export default function MaintenanceIndex({
    records,
    summary,
    filters,
    types,
}: {
    records: PaginatedRecords;
    summary: Summary;
    filters: { search?: string; type?: string };
    types: { value: string; label: string }[];
}) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Service & Maintenance', href: maintenanceIndex.url() },
        ],
    });

    const [search, setSearch] = useState(filters.search ?? '');

    function applyFilter(params: Record<string, string>) {
        router.get(maintenanceIndex.url(), { ...filters, ...params }, { preserveState: true, replace: true });
    }

    return (
        <>
            <Head title="Service & Maintenance" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Service & Maintenance</h1>
                    <p className="text-sm text-muted-foreground">Every service, breakdown, and accident recorded across the fleet.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Total Records" value={summary.total_records} icon={Wrench} accent="bg-primary/10 text-primary" />
                    <StatCard label="Total Cost" value={fmt(summary.total_cost, 'USD')} icon={CircleDollarSign} accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" />
                    <StatCard label="Breakdowns" value={summary.breakdown_count} icon={Zap} accent="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" />
                    <StatCard label="Accidents" value={summary.accident_count} icon={AlertTriangle} accent="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            applyFilter({ search });
                        }}
                        className="flex flex-1 gap-2"
                    >
                        <Input placeholder="Search description, provider, vehicle…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
                        <Button type="submit" variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
                    </form>

                    <Select value={filters.type ?? ''} onValueChange={(v) => applyFilter({ type: v === 'all' ? '' : v })}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="All types" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All types</SelectItem>
                            {types.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        <th className="px-4 py-3">Vehicle</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Description</th>
                                        <th className="px-4 py-3">Provider</th>
                                        <th className="px-4 py-3">Odo</th>
                                        <th className="px-4 py-3">Cost</th>
                                        <th className="px-4 py-3">Downtime</th>
                                        <th className="px-4 py-3">Started</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {records.data.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No maintenance records yet.</td>
                                        </tr>
                                    )}
                                    {records.data.map((r) => (
                                        <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <Link href={VehicleRoutes.show.url({ vehicle: r.vehicle_id })} className="font-medium hover:underline">
                                                    {r.vehicle_label}
                                                </Link>
                                                <p className="font-mono text-xs text-muted-foreground">{r.reg_plate}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${TYPE_STYLES[r.type] ?? ''}`}>
                                                    {r.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 max-w-sm truncate">
                                                {r.service_type && <span className="font-medium">{r.service_type} · </span>}
                                                <span className="text-muted-foreground">{r.description}</span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">{r.service_provider ?? '—'}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{r.odometer != null ? `${r.odometer.toLocaleString()}` : '—'}</td>
                                            <td className="px-4 py-3 font-medium">{fmt(r.total_cost, r.currency)}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{r.downtime_days}d</td>
                                            <td className="px-4 py-3 text-muted-foreground">{fmtDate(r.started_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {records.last_page > 1 && (
                            <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
                                <span>{records.from}–{records.to} of {records.total}</span>
                                <div className="flex gap-1">
                                    {records.links.map((link, i) => (
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
