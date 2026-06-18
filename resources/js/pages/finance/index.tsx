import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import { ArrowDownLeft, ArrowUpRight, Building2, CircleDollarSign, ClipboardList, FileText, PieChart, Receipt, TrendingUp, Users, Wallet, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { index as financeIndex } from '@/routes/finance';
import * as VehicleRoutes from '@/actions/App/Http/Controllers/Web/VehicleController';
import * as InvoiceRoutes from '@/actions/App/Http/Controllers/Web/InvoiceController';
import * as CostCenterRoutes from '@/actions/App/Http/Controllers/Web/CostCenterController';
import * as EmployeeRoutes from '@/actions/App/Http/Controllers/Web/EmployeeController';
import * as QuotationRoutes from '@/actions/App/Http/Controllers/Web/QuotationController';
import * as RequisitionRoutes from '@/actions/App/Http/Controllers/Web/RequisitionController';
import * as ExpenseRoutes from '@/actions/App/Http/Controllers/Web/OperationalExpenseController';
import * as SalaryRoutes from '@/actions/App/Http/Controllers/Web/SalaryController';
import * as TaskRoutes from '@/actions/App/Http/Controllers/Web/WorkerTaskController';
import { dashboard } from '@/routes';

interface SeriesPoint {
    date: string;
    income: number;
    expense: number;
}

interface Summary {
    income: number;
    expense: number;
    profit: number;
    margin: number;
    expense_adhoc: number;
    expense_maintenance: number;
    expense_licence: number;
    booking_count: number;
    completed_bookings: number;
}

interface Transaction {
    id: number | string;
    date: string;
    type: 'income' | 'expense';
    description: string;
    amount: number;
}

interface VehicleStat {
    id: number;
    label: string;
    reg_plate: string;
    amount: number;
}

interface Props {
    period: string;
    range: { start: string; end: string; label: string };
    summary: Summary;
    series: SeriesPoint[];
    expense_by_category: Array<{ category: string; amount: number }>;
    top_earners: VehicleStat[];
    top_cost_centers: VehicleStat[];
    transactions: Transaction[];
}

function fmt(amount: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateShort(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

const CATEGORY_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6', '#f97316'];

function StatCard({ label, value, icon: Icon, accent, sub }: { label: string; value: string; icon: React.ComponentType<{ className?: string }>; accent: string; sub?: string }) {
    return (
        <Card>
            <CardContent className="flex items-start justify-between gap-4 p-5">
                <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                    <p className="mt-1 text-2xl font-bold">{value}</p>
                    {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
                </div>
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accent}`}>
                    <Icon className="h-6 w-6" />
                </div>
            </CardContent>
        </Card>
    );
}

function IncomeExpenseChart({ series }: { series: SeriesPoint[] }) {
    if (series.length === 0) {
        return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">No activity in this period</div>;
    }

    const max = Math.max(...series.map((s) => Math.max(s.income, s.expense)), 10);
    const width = 800;
    const height = 260;
    const padding = { top: 20, right: 20, bottom: 36, left: 50 };
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;
    const barW = Math.max(2, (innerW / series.length) * 0.35);

    const yTicks = 4;
    const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => (max / yTicks) * i);

    return (
        <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[600px]">
                {/* Grid */}
                {yTickValues.map((v, i) => {
                    const y = padding.top + innerH - (innerH * v) / max;
                    return (
                        <g key={i}>
                            <line x1={padding.left} y1={y} x2={padding.left + innerW} y2={y} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="2 4" />
                            <text x={padding.left - 8} y={y + 4} textAnchor="end" className="text-[10px] fill-current opacity-50">
                                {v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0)}
                            </text>
                        </g>
                    );
                })}

                {/* Bars */}
                {series.map((s, i) => {
                    const groupX = padding.left + (innerW / series.length) * i + (innerW / series.length) / 2;
                    const incomeH = (innerH * s.income) / max;
                    const expenseH = (innerH * s.expense) / max;
                    return (
                        <g key={s.date}>
                            <rect
                                x={groupX - barW - 1}
                                y={padding.top + innerH - incomeH}
                                width={barW}
                                height={incomeH}
                                className="fill-emerald-500"
                                rx="2"
                            />
                            <rect
                                x={groupX + 1}
                                y={padding.top + innerH - expenseH}
                                width={barW}
                                height={expenseH}
                                className="fill-red-500"
                                rx="2"
                            />
                            {(series.length <= 16 || i % Math.ceil(series.length / 12) === 0) && (
                                <text x={groupX} y={height - 16} textAnchor="middle" className="text-[10px] fill-current opacity-60">
                                    {fmtDateShort(s.date)}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
            <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" />Income</span>
                <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-500" />Expense</span>
            </div>
        </div>
    );
}

function DonutChart({ data }: { data: Array<{ category: string; amount: number }> }) {
    if (data.length === 0) {
        return <p className="text-center text-sm text-muted-foreground py-8">No expenses recorded.</p>;
    }

    const total = data.reduce((a, b) => a + b.amount, 0);
    const size = 180;
    const radius = 70;
    const stroke = 24;
    const cx = size / 2;
    const cy = size / 2;
    const circumference = 2 * Math.PI * radius;

    let cumulative = 0;
    const segments = data.map((d, i) => {
        const fraction = d.amount / total;
        const length = fraction * circumference;
        const offset = circumference - length;
        const rotation = (cumulative / total) * 360;
        cumulative += d.amount;
        return {
            length,
            offset,
            rotation,
            color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
            ...d,
        };
    });

    return (
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="relative">
                <svg width={size} height={size}>
                    <circle cx={cx} cy={cy} r={radius} fill="none" className="stroke-muted" strokeWidth={stroke} />
                    {segments.map((s, i) => (
                        <circle
                            key={i}
                            cx={cx}
                            cy={cy}
                            r={radius}
                            fill="none"
                            stroke={s.color}
                            strokeWidth={stroke}
                            strokeDasharray={`${s.length} ${circumference}`}
                            transform={`rotate(${s.rotation - 90} ${cx} ${cy})`}
                            strokeLinecap="butt"
                        />
                    ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-bold">{fmt(total)}</p>
                </div>
            </div>
            <div className="flex-1 space-y-2 text-sm">
                {segments.map((s, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="inline-block h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                            <span className="truncate">{s.category}</span>
                        </div>
                        <span className="font-medium">{fmt(s.amount)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function FinanceDashboard({
    period,
    range,
    summary,
    series,
    expense_by_category,
    top_earners,
    top_cost_centers,
    transactions,
}: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Finance', href: financeIndex.url() },
        ],
    });

    function setPeriod(p: string) {
        router.get(financeIndex.url(), { period: p }, { preserveState: true, replace: true });
    }

    const periods = [
        { value: 'day', label: 'Day' },
        { value: 'week', label: 'Week' },
        { value: 'month', label: 'Month' },
        { value: 'year', label: 'Year' },
    ];

    return (
        <>
            <Head title="Finance Dashboard" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Finance Dashboard</h1>
                        <p className="text-sm text-muted-foreground">
                            {range.label} · {fmtDate(range.start)} — {fmtDate(range.end)}
                        </p>
                    </div>
                    <div className="inline-flex rounded-lg border p-1">
                        {periods.map((p) => (
                            <button
                                key={p.value}
                                type="button"
                                onClick={() => setPeriod(p.value)}
                                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                                    period === p.value ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Finance sub-module navigation */}
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
                    {([
                        { label: 'Cost Centers', icon: Building2, href: CostCenterRoutes.index.url(), accent: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
                        { label: 'Employees', icon: Users, href: EmployeeRoutes.index.url(), accent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
                        { label: 'Quotations', icon: FileText, href: QuotationRoutes.index.url(), accent: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
                        { label: 'Requisitions', icon: ClipboardList, href: RequisitionRoutes.index.url(), accent: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
                        { label: 'Expenses', icon: Wallet, href: ExpenseRoutes.index.url(), accent: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
                        { label: 'Salaries', icon: CircleDollarSign, href: SalaryRoutes.index.url(), accent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
                        { label: 'Tasks', icon: Wrench, href: TaskRoutes.index.url(), accent: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
                    ] as const).map(({ label, icon: Icon, href, accent }) => (
                        <Link key={label} href={href} className="group">
                            <Card className="transition-all hover:shadow-md hover:-translate-y-0.5">
                                <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <p className="text-xs font-medium leading-tight">{label}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                {/* Primary stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Income"
                        value={fmt(summary.income)}
                        icon={ArrowUpRight}
                        accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        sub={`${summary.completed_bookings} completed bookings`}
                    />
                    <StatCard
                        label="Expense"
                        value={fmt(summary.expense)}
                        icon={ArrowDownLeft}
                        accent="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        sub="Ad-hoc + maintenance + licensing"
                    />
                    <StatCard
                        label="Net Profit"
                        value={fmt(summary.profit)}
                        icon={TrendingUp}
                        accent={summary.profit >= 0 ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-700'}
                        sub={`${summary.margin}% margin`}
                    />
                    <StatCard
                        label="Bookings"
                        value={String(summary.booking_count)}
                        icon={Receipt}
                        accent="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        sub="Created in period"
                    />
                </div>

                {/* Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Income vs Expense</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <IncomeExpenseChart series={series} />
                    </CardContent>
                </Card>

                {/* Expense breakdown + top vehicles */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-1">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <PieChart className="h-5 w-5 text-muted-foreground" />
                            <CardTitle className="text-base">Expense Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DonutChart data={expense_by_category} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Top Earning Vehicles</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {top_earners.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground py-8">No completed bookings in this period.</p>
                            ) : top_earners.map((v, i) => (
                                <Link key={v.id} href={VehicleRoutes.show.url({ vehicle: v.id })} className="flex items-center gap-3 rounded-lg hover:bg-muted/50 p-2 -m-2 transition-colors">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{i + 1}</div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{v.label}</p>
                                        <p className="font-mono text-xs text-muted-foreground">{v.reg_plate}</p>
                                    </div>
                                    <span className="shrink-0 text-sm font-semibold">{fmt(v.amount)}</span>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Top Cost Centers</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {top_cost_centers.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground py-8">No costs recorded in this period.</p>
                            ) : top_cost_centers.map((v, i) => (
                                <Link key={v.id} href={VehicleRoutes.show.url({ vehicle: v.id })} className="flex items-center gap-3 rounded-lg hover:bg-muted/50 p-2 -m-2 transition-colors">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">{i + 1}</div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{v.label}</p>
                                        <p className="font-mono text-xs text-muted-foreground">{v.reg_plate}</p>
                                    </div>
                                    <span className="shrink-0 text-sm font-semibold">{fmt(v.amount)}</span>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent transactions */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Recent Transactions</CardTitle>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={InvoiceRoutes.index.url()}>
                                <CircleDollarSign className="mr-2 h-4 w-4" /> View all invoices
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Description</th>
                                    <th className="px-4 py-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {transactions.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">No transactions in this period.</td>
                                    </tr>
                                )}
                                {transactions.map((t) => (
                                    <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 text-muted-foreground">{fmtDate(t.date)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                                t.type === 'income'
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                                {t.type === 'income' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                                                {t.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">{t.description}</td>
                                        <td className={`px-4 py-3 text-right font-semibold ${t.type === 'income' ? 'text-emerald-700' : 'text-red-700'}`}>
                                            {t.type === 'income' ? '+' : '−'}{fmt(t.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
