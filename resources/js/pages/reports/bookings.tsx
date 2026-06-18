import { Head, router, setLayoutProps } from '@inertiajs/react';
import { BarChart3, Car, CheckCircle, CircleDollarSign, Download, TrendingUp, Users, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dashboard } from '@/routes';
import { index as reportsIndex, bookings as reportsBookings } from '@/routes/reports';

interface Props {
    period: string;
    summary: {
        total: number;
        revenue: number;
        completed: number;
        cancelled: number;
        avg_value: number;
    };
    by_status: Array<{ status: string; label: string; count: number; revenue: number }>;
    monthly_trend: Array<{ month: string; bookings: number; revenue: number }>;
    top_customers: Array<{ name: string; bookings: number; revenue: number }>;
    top_vehicles: Array<{ label: string; bookings: number; revenue: number }>;
}

const PERIOD_LABELS: Record<string, string> = {
    this_month: 'This Month',
    last_month: 'Last Month',
    this_quarter: 'This Quarter',
    this_year: 'This Year',
};

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-500',
    confirmed: 'bg-blue-500',
    active: 'bg-emerald-500',
    completed: 'bg-gray-500',
    cancelled: 'bg-red-500',
};

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const fmtDecimal = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function BarChart({ data }: { data: { label: string; value: number }[] }) {
    const max = Math.max(...data.map((d) => d.value), 1);
    return (
        <div className="flex items-end gap-1 h-40 w-full">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                        title={fmtDecimal.format(d.value)}
                        className="w-full bg-primary/80 rounded-t transition-all"
                        style={{ height: `${(d.value / max) * 100}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground rotate-0 truncate w-full text-center">
                        {d.label.split(' ')[0]}
                    </span>
                </div>
            ))}
        </div>
    );
}

function StatusHBar({ items }: { items: Props['by_status'] }) {
    const maxCount = Math.max(...items.map((s) => s.count), 1);
    return (
        <div className="space-y-3">
            {items.map((s) => {
                const pct = (s.count / maxCount) * 100;
                const color = STATUS_COLORS[s.status] ?? 'bg-slate-400';
                return (
                    <div key={s.status} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-medium capitalize">{s.label}</span>
                            <div className="flex items-center gap-3">
                                <span className="text-muted-foreground">{fmtDecimal.format(s.revenue)}</span>
                                <span className="font-semibold tabular-nums w-8 text-right">{s.count}</span>
                            </div>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${color}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function RankTable({
    rows,
    valueLabel,
    renderValue,
    renderName,
}: {
    rows: Array<{ name?: string; label?: string; bookings: number; revenue: number }>;
    valueLabel: string;
    renderValue: (row: { bookings: number; revenue: number }) => string;
    renderName: (row: { name?: string; label?: string }) => string;
}) {
    if (rows.length === 0) {
        return <p className="text-center text-sm text-muted-foreground py-6">No data for this period.</p>;
    }
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <th className="px-4 py-2.5 w-10">#</th>
                        <th className="px-4 py-2.5">Name</th>
                        <th className="px-4 py-2.5 text-right">Bookings</th>
                        <th className="px-4 py-2.5 text-right">{valueLabel}</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {rows.slice(0, 10).map((row, i) => (
                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{i + 1}</td>
                            <td className="px-4 py-2.5 font-medium truncate max-w-[200px]">{renderName(row)}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{row.bookings}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums font-medium">{renderValue(row)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function BookingsReport({ period, summary, by_status, monthly_trend, top_customers, top_vehicles }: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Reports', href: reportsIndex.url() },
            { title: 'Bookings' },
        ],
    });

    const trendChartData = monthly_trend.map((m) => ({
        label: m.month,
        value: m.revenue,
    }));

    return (
        <>
            <Head title="Bookings Report" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Bookings Report</h1>
                        <p className="text-sm text-muted-foreground">Analytics and trends for your booking activity.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select
                            value={period}
                            onValueChange={(value) => router.get(reportsBookings.url(), { period: value })}
                        >
                            <SelectTrigger className="w-44">
                                <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="this_month">This Month</SelectItem>
                                <SelectItem value="last_month">Last Month</SelectItem>
                                <SelectItem value="this_quarter">This Quarter</SelectItem>
                                <SelectItem value="this_year">This Year</SelectItem>
                            </SelectContent>
                        </Select>
                        <a
                            href={`/reports/bookings/export?period=${period}`}
                            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            Export CSV
                        </a>
                    </div>
                </div>

                {/* Summary cards */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Bookings</p>
                                    <p className="mt-1 text-2xl font-bold">{summary.total}</p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">{PERIOD_LABELS[period] ?? period}</p>
                                </div>
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                    <BarChart3 className="h-5 w-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Revenue</p>
                                    <p className="mt-1 text-2xl font-bold">{fmt.format(summary.revenue)}</p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">from completed bookings</p>
                                </div>
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    <CircleDollarSign className="h-5 w-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Completed</p>
                                    <p className="mt-1 text-2xl font-bold">{summary.completed}</p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {summary.cancelled} cancelled
                                    </p>
                                </div>
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                    <CheckCircle className="h-5 w-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Avg Value</p>
                                    <p className="mt-1 text-2xl font-bold">{fmtDecimal.format(summary.avg_value)}</p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">per booking</p>
                                </div>
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                    <TrendingUp className="h-5 w-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Monthly revenue trend + status breakdown */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" /> Monthly Revenue Trend
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">Revenue per month, USD. Hover a bar to see the value.</p>
                        </CardHeader>
                        <CardContent>
                            {trendChartData.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground py-10">No trend data available.</p>
                            ) : (
                                <BarChart data={trendChartData} />
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <XCircle className="h-4 w-4" /> Status Breakdown
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">Bookings by status for {PERIOD_LABELS[period] ?? period}.</p>
                        </CardHeader>
                        <CardContent>
                            {by_status.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground py-6">No data for this period.</p>
                            ) : (
                                <StatusHBar items={by_status} />
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Top customers + top vehicles */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Users className="h-4 w-4" /> Top Customers
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">Top 10 customers by bookings.</p>
                        </CardHeader>
                        <CardContent className="p-0">
                            <RankTable
                                rows={top_customers}
                                valueLabel="Revenue"
                                renderName={(row) => row.name ?? '—'}
                                renderValue={(row) => fmtDecimal.format(row.revenue)}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Car className="h-4 w-4" /> Top Vehicles
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">Top 10 vehicles by bookings.</p>
                        </CardHeader>
                        <CardContent className="p-0">
                            <RankTable
                                rows={top_vehicles}
                                valueLabel="Revenue"
                                renderName={(row) => row.label ?? '—'}
                                renderValue={(row) => fmtDecimal.format(row.revenue)}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
