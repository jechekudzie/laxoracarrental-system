import { Head, router, setLayoutProps } from '@inertiajs/react';
import { AlertCircle, BarChart2, Building2, CheckCircle2, Clock, Download, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dashboard } from '@/routes';
import * as ReportRoutes from '@/actions/App/Http/Controllers/Web/ReportController';

interface Props {
    period: string;
    summary: { total: number; paid: number; pending: number; overdue: number };
    by_category: Array<{ category: string; label: string; total: number; count: number }>;
    by_cost_center: Array<{ name: string; total: number; count: number }>;
    monthly_trend: Array<{ month: string; total: number }>;
    top_providers: Array<{ name: string; total: number; count: number }>;
}

const BAR_COLORS = [
    'bg-indigo-500',
    'bg-violet-500',
    'bg-pink-500',
    'bg-amber-500',
    'bg-emerald-500',
    'bg-blue-500',
    'bg-rose-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
];

const PERIODS = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
];

function fmt(amount: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function StatCard({
    label,
    value,
    icon: Icon,
    accent,
    danger,
}: {
    label: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
    danger?: boolean;
}) {
    return (
        <Card>
            <CardContent className="flex items-start justify-between gap-4 p-5">
                <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                    <p className={`mt-1 text-2xl font-bold ${danger ? 'text-red-600 dark:text-red-400' : ''}`}>{value}</p>
                </div>
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accent}`}>
                    <Icon className="h-6 w-6" />
                </div>
            </CardContent>
        </Card>
    );
}

function MonthlyTrendChart({ data }: { data: Array<{ month: string; total: number }> }) {
    if (data.length === 0) {
        return (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                No data for this period
            </div>
        );
    }

    const max = Math.max(...data.map((d) => d.total), 1);

    return (
        <div className="flex h-40 items-end gap-1.5">
            {data.map((d) => {
                const heightPct = max > 0 ? (d.total / max) * 100 : 0;
                return (
                    <div key={d.month} className="group relative flex flex-1 flex-col items-center gap-1">
                        <div
                            className="w-full rounded-t bg-orange-500 transition-all group-hover:bg-orange-400"
                            style={{ height: `${heightPct}%` }}
                        />
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 hidden whitespace-nowrap rounded bg-popover px-2 py-1 text-xs shadow group-hover:block">
                            {fmt(d.total)}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-full text-center">{d.month}</span>
                    </div>
                );
            })}
        </div>
    );
}

function HorizontalBars({
    rows,
    colorized,
}: {
    rows: Array<{ label: string; total: number; sub?: string }>;
    colorized?: boolean;
}) {
    if (rows.length === 0) {
        return <p className="text-center text-sm text-muted-foreground py-6">No data available.</p>;
    }

    const max = Math.max(...rows.map((r) => r.total), 1);

    return (
        <div className="space-y-4">
            {rows.map((row, i) => {
                const pct = max > 0 ? (row.total / max) * 100 : 0;
                const barColor = colorized ? BAR_COLORS[i % BAR_COLORS.length] : 'bg-primary';
                return (
                    <div key={row.label}>
                        <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                            <div className="min-w-0">
                                <span className="font-medium truncate block">{row.label}</span>
                                {row.sub && <span className="text-xs text-muted-foreground">{row.sub}</span>}
                            </div>
                            <span className="shrink-0 font-semibold">{fmt(row.total)}</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${barColor}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default function ExpensesReport({
    period,
    summary,
    by_category,
    by_cost_center,
    monthly_trend,
    top_providers,
}: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Reports', href: '/reports' },
            { title: 'Expenses', href: ReportRoutes.expenses.url() },
        ],
    });

    function setPeriod(value: string) {
        router.get(ReportRoutes.expenses.url(), { period: value }, { preserveState: true, replace: true });
    }

    const categoryRows = by_category.map((c) => ({
        label: c.label,
        total: c.total,
        sub: `${c.count} ${c.count === 1 ? 'expense' : 'expenses'}`,
    }));

    const costCenterRows = by_cost_center.map((cc) => ({
        label: cc.name,
        total: cc.total,
        sub: `${cc.count} ${cc.count === 1 ? 'expense' : 'expenses'}`,
    }));

    return (
        <>
            <Head title="Expenses Report" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Expenses Report</h1>
                        <p className="text-sm text-muted-foreground">Spending analytics and cost breakdowns.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger className="w-44">
                                <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                                {PERIODS.map((p) => (
                                    <SelectItem key={p.value} value={p.value}>
                                        {p.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <a
                            href={`/reports/expenses/export?period=${period}`}
                            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            Export CSV
                        </a>
                    </div>
                </div>

                {/* Summary stat cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Total Spend"
                        value={fmt(summary.total)}
                        icon={Wallet}
                        accent="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                    />
                    <StatCard
                        label="Paid"
                        value={fmt(summary.paid)}
                        icon={CheckCircle2}
                        accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    />
                    <StatCard
                        label="Pending"
                        value={fmt(summary.pending)}
                        icon={Clock}
                        accent="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    />
                    <StatCard
                        label="Overdue"
                        value={String(summary.overdue)}
                        icon={AlertCircle}
                        accent={summary.overdue > 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-muted text-muted-foreground'}
                        danger={summary.overdue > 0}
                    />
                </div>

                {/* Monthly Trend */}
                <Card>
                    <CardHeader className="flex flex-row items-center gap-2">
                        <BarChart2 className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-base">Monthly Trend</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 pb-2">
                        <MonthlyTrendChart data={monthly_trend} />
                    </CardContent>
                </Card>

                {/* Category + Cost Center side by side */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">By Category</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <HorizontalBars rows={categoryRows} colorized />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">By Cost Center</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <HorizontalBars rows={costCenterRows} colorized />
                        </CardContent>
                    </Card>
                </div>

                {/* Top Service Providers */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Top Service Providers</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {top_providers.length === 0 ? (
                            <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                                No service provider data in this period.
                            </p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="px-4 py-3 text-left font-medium w-12">#</th>
                                        <th className="px-4 py-3 text-left font-medium">Provider</th>
                                        <th className="px-4 py-3 text-right font-medium">Invoices</th>
                                        <th className="px-4 py-3 text-right font-medium">Total Spend</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {top_providers.map((p, i) => (
                                        <tr key={p.name} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                                                    {i + 1}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-medium">{p.name}</td>
                                            <td className="px-4 py-3 text-right text-muted-foreground">{p.count}</td>
                                            <td className="px-4 py-3 text-right font-semibold">{fmt(p.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
