import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, Clock, Search, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { index as complianceIndex } from '@/routes/compliance';
import * as VehicleRoutes from '@/actions/App/Http/Controllers/Web/VehicleController';
import { dashboard } from '@/routes';

interface Licence {
    id: number;
    vehicle_id: number;
    vehicle_label: string | null;
    reg_plate: string | null;
    type: string;
    type_label: string;
    provider: string | null;
    document_number: string | null;
    expiry_date: string;
    cost: number;
    currency: string;
    cover_amount: number | null;
    days_to_expiry: number;
    is_expired: boolean;
}

interface PaginatedLicences {
    data: Licence[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

interface Summary {
    total: number;
    valid: number;
    expiring: number;
    expired: number;
}

function fmt(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function expiryBadgeClass(days: number, expired: boolean): string {
    if (expired) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    if (days <= 30) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
}

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; accent: string }) {
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

export default function ComplianceIndex({
    licences,
    summary,
    filters,
    types,
}: {
    licences: PaginatedLicences;
    summary: Summary;
    filters: { search?: string; type?: string; status?: string };
    types: { value: string; label: string }[];
}) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Compliance & Insurance', href: complianceIndex.url() },
        ],
    });

    const [search, setSearch] = useState(filters.search ?? '');

    function applyFilter(params: Record<string, string>) {
        router.get(complianceIndex.url(), { ...filters, ...params }, { preserveState: true, replace: true });
    }

    return (
        <>
            <Head title="Compliance & Insurance" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Compliance & Insurance</h1>
                    <p className="text-sm text-muted-foreground">Track ZINARA, ZBC, Fitness, Insurance and Registration across the fleet.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Total Records" value={summary.total} icon={ShieldCheck} accent="bg-primary/10 text-primary" />
                    <StatCard label="Valid" value={summary.valid} icon={CheckCircle2} accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" />
                    <StatCard label="Expiring ≤ 30d" value={summary.expiring} icon={Clock} accent="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" />
                    <StatCard label="Expired" value={summary.expired} icon={AlertTriangle} accent="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            applyFilter({ search });
                        }}
                        className="flex flex-1 gap-2"
                    >
                        <Input placeholder="Search vehicle, plate…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
                        <Button type="submit" variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
                    </form>

                    <Select value={filters.type ?? ''} onValueChange={(v) => applyFilter({ type: v === 'all' ? '' : v })}>
                        <SelectTrigger className="w-48"><SelectValue placeholder="All types" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All types</SelectItem>
                            {types.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={filters.status ?? ''} onValueChange={(v) => applyFilter({ status: v === 'all' ? '' : v })}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="Any status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Any status</SelectItem>
                            <SelectItem value="valid">Valid</SelectItem>
                            <SelectItem value="expiring">Expiring ≤ 30d</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
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
                                        <th className="px-4 py-3">Provider</th>
                                        <th className="px-4 py-3">Document #</th>
                                        <th className="px-4 py-3">Cost</th>
                                        <th className="px-4 py-3">Expiry</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {licences.data.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                                                No compliance records found.
                                            </td>
                                        </tr>
                                    )}
                                    {licences.data.map((l) => (
                                        <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <Link href={VehicleRoutes.show.url({ vehicle: l.vehicle_id })} className="font-medium hover:underline">
                                                    {l.vehicle_label}
                                                </Link>
                                                <p className="font-mono text-xs text-muted-foreground">{l.reg_plate}</p>
                                            </td>
                                            <td className="px-4 py-3 font-medium">{l.type_label}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{l.provider ?? '—'}</td>
                                            <td className="px-4 py-3 font-mono text-xs">{l.document_number ?? '—'}</td>
                                            <td className="px-4 py-3">{fmt(l.cost, l.currency)}</td>
                                            <td className="px-4 py-3">{fmtDate(l.expiry_date)}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${expiryBadgeClass(l.days_to_expiry, l.is_expired)}`}>
                                                    {l.is_expired ? `Expired ${Math.abs(l.days_to_expiry)}d ago` : l.days_to_expiry <= 30 ? `${l.days_to_expiry}d left` : 'Valid'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {licences.last_page > 1 && (
                            <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
                                <span>{licences.from}–{licences.to} of {licences.total}</span>
                                <div className="flex gap-1">
                                    {licences.links.map((link, i) => (
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
