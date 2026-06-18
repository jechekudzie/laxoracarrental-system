import { Head, router, setLayoutProps } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Clock, Download, ListTodo, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { index as reportsIndex, tasks as tasksRoute } from '@/routes/reports';

interface Props {
    period: string;
    summary: {
        total: number;
        completed: number;
        in_progress: number;
        overdue: number;
        completion_rate: number;
    };
    by_status: Array<{ status: string; label: string; count: number }>;
    by_priority: Array<{ priority: string; label: string; count: number }>;
    monthly_completions: Array<{ month: string; completed: number }>;
    top_performers: Array<{ employee: string; completed: number; total: number; rate: number }>;
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

function CompletionsTrendChart({ data }: { data: Array<{ month: string; completed: number }> }) {
    if (data.length === 0) {
        return (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                No completion data available.
            </div>
        );
    }

    const max = Math.max(...data.map((d) => d.completed), 1);

    return (
        <div className="flex h-40 items-end gap-1">
            {data.map((d) => {
                const heightPct = (d.completed / max) * 100;
                return (
                    <div key={d.month} className="group relative flex flex-1 flex-col items-center gap-1">
                        <div
                            className="w-full rounded-t bg-emerald-500 transition-all group-hover:bg-emerald-400"
                            style={{ height: `${Math.max(heightPct, 2)}%` }}
                        />
                        <span className="text-[10px] text-muted-foreground">{d.month}</span>
                        <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background opacity-0 transition-opacity group-hover:opacity-100">
                            {d.completed} completed
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function priorityColor(priority: string): string {
    switch (priority.toLowerCase()) {
        case 'urgent':
            return 'bg-red-500';
        case 'high':
            return 'bg-orange-500';
        case 'medium':
            return 'bg-blue-500';
        default:
            return 'bg-gray-400';
    }
}

function rateBadge(rate: number): string {
    if (rate >= 80) {
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    }
    if (rate >= 50) {
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    }
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
}

export default function TasksReport({ period, summary, by_status, by_priority, monthly_completions, top_performers }: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Reports', href: reportsIndex.url() },
            { title: 'Tasks Report', href: tasksRoute.url() },
        ],
    });

    const periods = [
        { value: 'week', label: 'Week' },
        { value: 'month', label: 'Month' },
        { value: 'quarter', label: 'Quarter' },
        { value: 'year', label: 'Year' },
    ];

    function setPeriod(p: string) {
        router.get(tasksRoute.url(), { period: p }, { preserveState: true, replace: true });
    }

    const totalByStatus = by_status.reduce((sum, row) => sum + row.count, 0) || 1;
    const totalByPriority = by_priority.reduce((sum, row) => sum + row.count, 0) || 1;

    return (
        <>
            <Head title="Tasks Report" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Tasks Report</h1>
                        <p className="text-sm text-muted-foreground">Task activity and team performance overview.</p>
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
                            href={`/reports/tasks/export?period=${period}`}
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
                        label="Total Tasks"
                        value={String(summary.total)}
                        icon={ListTodo}
                        accent="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    />
                    <StatCard
                        label="Completed"
                        value={String(summary.completed)}
                        icon={CheckCircle}
                        accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    />
                    <StatCard
                        label="In Progress"
                        value={String(summary.in_progress)}
                        icon={Clock}
                        accent="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    />
                    <StatCard
                        label="Overdue"
                        value={String(summary.overdue)}
                        icon={AlertCircle}
                        accent="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    />
                    <StatCard
                        label="Completion Rate"
                        value={`${summary.completion_rate}%`}
                        icon={TrendingUp}
                        accent="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                    />
                </div>

                {/* Completions Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Completions Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CompletionsTrendChart data={monthly_completions} />
                    </CardContent>
                </Card>

                {/* Status + Priority Breakdown */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* By Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">By Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {by_status.length === 0 ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">No status data available.</p>
                            ) : (
                                by_status.map((row) => {
                                    const pct = Math.round((row.count / totalByStatus) * 100);
                                    return (
                                        <div key={row.status} className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium">{row.label}</span>
                                                <span className="text-muted-foreground">
                                                    {row.count} &middot; {pct}%
                                                </span>
                                            </div>
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className="h-full rounded-full bg-blue-500 transition-all"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>

                    {/* By Priority */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">By Priority</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {by_priority.length === 0 ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">No priority data available.</p>
                            ) : (
                                by_priority.map((row) => {
                                    const pct = Math.round((row.count / totalByPriority) * 100);
                                    return (
                                        <div key={row.priority} className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium">{row.label}</span>
                                                <span className="text-muted-foreground">
                                                    {row.count} &middot; {pct}%
                                                </span>
                                            </div>
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className={`h-full rounded-full transition-all ${priorityColor(row.priority)}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Top Performers */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Top Performers</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    <th className="px-4 py-3">Employee</th>
                                    <th className="px-4 py-3 text-center">Total Tasks</th>
                                    <th className="px-4 py-3 text-center">Completed</th>
                                    <th className="px-4 py-3">Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {top_performers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                                            No performance data available.
                                        </td>
                                    </tr>
                                ) : (
                                    top_performers.map((row) => (
                                        <tr key={row.employee} className="transition-colors hover:bg-muted/30">
                                            <td className="px-4 py-3 font-medium">{row.employee}</td>
                                            <td className="px-4 py-3 text-center text-muted-foreground">{row.total}</td>
                                            <td className="px-4 py-3 text-center text-muted-foreground">{row.completed}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${rateBadge(row.rate)}`}
                                                >
                                                    {row.rate}%
                                                </span>
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
