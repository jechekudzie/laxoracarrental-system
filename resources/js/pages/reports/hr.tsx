import { Head, router, setLayoutProps } from '@inertiajs/react';
import { Building2, CheckSquare, DollarSign, Download, UserCheck, UserPlus, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { index as reportsIndex, hr as hrRoute } from '@/routes/reports';

interface Props {
    period: string;
    summary: {
        total_employees: number;
        active: number;
        total_payroll: number;
        paid_payroll: number;
        new_hires: number;
    };
    by_employment_type: Array<{ employment_type: string; count: number }>;
    by_cost_center: Array<{ name: string; count: number; payroll: number }>;
    salary_trend: Array<{ month: string; total: number }>;
    task_completion: Array<{ employee: string; completed: number; total: number; rate: number }>;
}

function fmt(amount: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function StatCard({
    label,
    value,
    icon: Icon,
    accent,
}: {
    label: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
}) {
    return (
        <Card>
            <CardContent className="flex items-start justify-between gap-4 p-5">
                <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                    <p className="mt-1 text-2xl font-bold">{value}</p>
                </div>
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accent}`}>
                    <Icon className="h-6 w-6" />
                </div>
            </CardContent>
        </Card>
    );
}

function PayrollTrendChart({ data }: { data: Array<{ month: string; total: number }> }) {
    if (data.length === 0) {
        return (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                No payroll data available.
            </div>
        );
    }

    const max = Math.max(...data.map((d) => d.total), 1);

    return (
        <div className="flex h-40 items-end gap-1">
            {data.map((d) => {
                const heightPct = (d.total / max) * 100;
                return (
                    <div key={d.month} className="group relative flex flex-1 flex-col items-center gap-1">
                        <div
                            className="w-full rounded-t bg-indigo-500 transition-all group-hover:bg-indigo-400"
                            style={{ height: `${Math.max(heightPct, 2)}%` }}
                        />
                        <span className="text-[10px] text-muted-foreground">{d.month}</span>
                        <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background opacity-0 transition-opacity group-hover:opacity-100">
                            {fmt(d.total)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default function HrReport({ period, summary, by_employment_type, by_cost_center, salary_trend, task_completion }: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Reports', href: reportsIndex.url() },
            { title: 'HR Report', href: hrRoute.url() },
        ],
    });

    const periods = [
        { value: 'week', label: 'Week' },
        { value: 'month', label: 'Month' },
        { value: 'quarter', label: 'Quarter' },
        { value: 'year', label: 'Year' },
    ];

    function setPeriod(p: string) {
        router.get(hrRoute.url(), { period: p }, { preserveState: true, replace: true });
    }

    const totalByType = by_employment_type.reduce((sum, row) => sum + row.count, 0) || 1;

    return (
        <>
            <Head title="HR Report" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">HR Report</h1>
                        <p className="text-sm text-muted-foreground">Human resources and payroll overview.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="inline-flex rounded-lg border p-1">
                            {periods.map((p) => (
                                <button
                                    key={p.value}
                                    type="button"
                                    onClick={() => setPeriod(p.value)}
                                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                                        period === p.value
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        <a
                            href={`/reports/hr/export?period=${period}`}
                            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            Export CSV
                        </a>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <StatCard
                        label="Total Employees"
                        value={String(summary.total_employees)}
                        icon={Users}
                        accent="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    />
                    <StatCard
                        label="Active"
                        value={String(summary.active)}
                        icon={UserCheck}
                        accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    />
                    <StatCard
                        label="Monthly Payroll"
                        value={fmt(summary.total_payroll)}
                        icon={DollarSign}
                        accent="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                    />
                    <StatCard
                        label="Paid Payroll"
                        value={fmt(summary.paid_payroll)}
                        icon={CheckSquare}
                        accent="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
                    />
                    <StatCard
                        label="New Hires"
                        value={String(summary.new_hires)}
                        icon={UserPlus}
                        accent="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    />
                </div>

                {/* Payroll Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Payroll Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PayrollTrendChart data={salary_trend} />
                    </CardContent>
                </Card>

                {/* Employment Type + Cost Centers */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Employment Type Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">By Employment Type</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {by_employment_type.length === 0 ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">No data available.</p>
                            ) : (
                                by_employment_type.map((row) => {
                                    const pct = Math.round((row.count / totalByType) * 100);
                                    return (
                                        <div key={row.employment_type} className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium capitalize">{row.employment_type}</span>
                                                <span className="text-muted-foreground">
                                                    {row.count} &middot; {pct}%
                                                </span>
                                            </div>
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className="h-full rounded-full bg-indigo-500 transition-all"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>

                    {/* By Cost Center Table */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <CardTitle className="text-base">By Cost Center</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        <th className="px-4 py-3">Department</th>
                                        <th className="px-4 py-3 text-center">Headcount</th>
                                        <th className="px-4 py-3 text-right">Total Payroll</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {by_cost_center.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">
                                                No cost center data available.
                                            </td>
                                        </tr>
                                    ) : (
                                        by_cost_center.map((row) => (
                                            <tr key={row.name} className="transition-colors hover:bg-muted/30">
                                                <td className="px-4 py-3 font-medium">{row.name}</td>
                                                <td className="px-4 py-3 text-center text-muted-foreground">{row.count}</td>
                                                <td className="px-4 py-3 text-right font-semibold">{fmt(row.payroll)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </div>

                {/* Task Completion by Employee */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Task Completion by Employee</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    <th className="px-4 py-3">Employee</th>
                                    <th className="px-4 py-3 text-center">Assigned</th>
                                    <th className="px-4 py-3 text-center">Completed</th>
                                    <th className="px-4 py-3">Completion Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {task_completion.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                                            No task data available.
                                        </td>
                                    </tr>
                                ) : (
                                    task_completion.map((row) => (
                                        <tr key={row.employee} className="transition-colors hover:bg-muted/30">
                                            <td className="px-4 py-3 font-medium">{row.employee}</td>
                                            <td className="px-4 py-3 text-center text-muted-foreground">{row.total}</td>
                                            <td className="px-4 py-3 text-center text-muted-foreground">{row.completed}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${
                                                                row.rate >= 80
                                                                    ? 'bg-emerald-500'
                                                                    : row.rate >= 50
                                                                      ? 'bg-amber-500'
                                                                      : 'bg-red-500'
                                                            }`}
                                                            style={{ width: `${row.rate}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">{row.rate}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
