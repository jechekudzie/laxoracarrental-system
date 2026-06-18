import { Head, router, setLayoutProps } from '@inertiajs/react';
import { Download, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dashboard } from '@/routes';
import { organisationStatement, organisationStatementPdf } from '@/actions/App/Http/Controllers/Web/ReportController';

interface Props {
    period: string;
    summary: {
        revenue: number;
        collected: number;
        expenses: number;
        payroll: number;
        gross_profit: number;
    };
    expenses_by_category: Array<{ label: string; total: number }>;
    revenue_by_month: Array<{ month: string; revenue: number; collected: number }>;
}

const PERIODS = [
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'this_year', label: 'This Year' },
];

function fmt(amount: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);
}

function periodLabel(period: string) {
    return PERIODS.find((p) => p.value === period)?.label ?? period;
}

function RevenueTrendChart({ data }: { data: Array<{ month: string; revenue: number; collected: number }> }) {
    if (data.length === 0) {
        return (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                No data for this period
            </div>
        );
    }

    const max = Math.max(...data.flatMap((d) => [d.revenue, d.collected]), 1);

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                    Revenue (Invoiced)
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500" />
                    Cash Collected
                </span>
            </div>
            <div className="flex h-48 items-end gap-1">
                {data.map((d) => {
                    const revPct = max > 0 ? (d.revenue / max) * 100 : 0;
                    const colPct = max > 0 ? (d.collected / max) * 100 : 0;
                    return (
                        <div key={d.month} className="group relative flex flex-1 flex-col items-center gap-1">
                            <div className="flex w-full items-end gap-0.5" style={{ height: '100%' }}>
                                <div className="relative flex flex-1 flex-col items-center">
                                    <span className="absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs shadow group-hover:block">
                                        {fmt(d.revenue)}
                                    </span>
                                    <div
                                        className="w-full rounded-t bg-emerald-500 transition-all group-hover:bg-emerald-400"
                                        style={{ height: `${revPct}%` }}
                                    />
                                </div>
                                <div className="relative flex flex-1 flex-col items-center">
                                    <span className="absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs shadow group-hover:block">
                                        {fmt(d.collected)}
                                    </span>
                                    <div
                                        className="w-full rounded-t bg-blue-500 transition-all group-hover:bg-blue-400"
                                        style={{ height: `${colPct}%` }}
                                    />
                                </div>
                            </div>
                            <span className="text-[10px] text-muted-foreground truncate max-w-full text-center">{d.month}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function OrganisationStatement({ period, summary, expenses_by_category, revenue_by_month }: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Reports', href: '/reports' },
            { title: 'Organisation Statement', href: organisationStatement.url() },
        ],
    });

    const isProfitable = summary.gross_profit >= 0;
    const totalExpenses = summary.expenses + summary.payroll;
    const outstanding = summary.revenue - summary.collected;
    const pdfUrl = organisationStatementPdf.url({ query: { period } });

    function setPeriod(value: string) {
        router.get(organisationStatement.url(), { period: value }, { preserveState: true, replace: true });
    }

    return (
        <>
            <Head title="Organisation Statement" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Toolbar */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Organisation Statement</h1>
                        <p className="text-sm text-muted-foreground">Company-wide financial overview for the selected period.</p>
                    </div>
                    <div className="flex items-center gap-3">
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
                            href={pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            Download PDF
                        </a>
                    </div>
                </div>

                {/* Statement document card */}
                <div className={`overflow-hidden rounded-xl border bg-card shadow-sm ${isProfitable ? 'border-t-4 border-t-emerald-500' : 'border-t-4 border-t-red-500'}`}>
                    {/* Document header */}
                    <div className="flex items-center justify-between border-b bg-muted/30 px-8 py-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">
                                L
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-widest text-muted-foreground">Laxora Car Rental</p>
                                <p className="text-sm font-medium text-foreground">Company Financial Statement</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-bold uppercase tracking-widest text-foreground">Financial Statement</p>
                            <p className="mt-0.5 text-sm text-muted-foreground">{periodLabel(period)}</p>
                        </div>
                    </div>

                    <div className="space-y-6 p-8">
                        {/* Income section */}
                        <div className="rounded-lg border-l-4 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 p-6">
                            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                                Income
                            </h2>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Revenue (Invoiced)</span>
                                    <span className="font-semibold text-foreground">{fmt(summary.revenue)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Cash Collected</span>
                                    <span className="font-semibold text-foreground">{fmt(summary.collected)}</span>
                                </div>
                                <div className="flex items-center justify-between border-t pt-3 text-sm">
                                    <span className="text-muted-foreground">Outstanding Receivables</span>
                                    <span className={`font-semibold ${outstanding > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
                                        {fmt(outstanding)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Expenses section */}
                        <div className="rounded-lg border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20 p-6">
                            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-red-700 dark:text-red-400">
                                Expenses
                            </h2>
                            <div className="space-y-3">
                                {expenses_by_category.map((cat) => (
                                    <div key={cat.label} className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">{cat.label}</span>
                                        <span className="font-semibold text-foreground">{fmt(cat.total)}</span>
                                    </div>
                                ))}
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Payroll</span>
                                    <span className="font-semibold text-foreground">{fmt(summary.payroll)}</span>
                                </div>
                                <div className="flex items-center justify-between border-t pt-3 text-sm font-bold">
                                    <span className="text-foreground">Total Expenses</span>
                                    <span className="text-foreground">{fmt(totalExpenses)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Net Position */}
                        <div
                            className={`rounded-xl p-8 text-center ${
                                isProfitable
                                    ? 'bg-emerald-500 text-white dark:bg-emerald-600'
                                    : 'bg-red-500 text-white dark:bg-red-600'
                            }`}
                        >
                            <div className="mb-2 flex items-center justify-center gap-2">
                                {isProfitable ? (
                                    <TrendingUp className="h-6 w-6 opacity-80" />
                                ) : (
                                    <TrendingDown className="h-6 w-6 opacity-80" />
                                )}
                                <p className="text-sm font-semibold uppercase tracking-widest opacity-90">
                                    {isProfitable ? 'Net Profit' : 'Net Loss'}
                                </p>
                            </div>
                            <p className="text-5xl font-extrabold tracking-tight">
                                {fmt(Math.abs(summary.gross_profit))}
                            </p>
                            <p className="mt-2 text-sm opacity-75">{periodLabel(period)}</p>
                        </div>
                    </div>
                </div>

                {/* Revenue Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Revenue Trend</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2 pb-4">
                        <RevenueTrendChart data={revenue_by_month} />
                    </CardContent>
                </Card>

                {/* Bottom download button */}
                <div className="flex justify-end">
                    <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-md border bg-background px-5 py-2.5 text-sm font-medium shadow-sm hover:bg-muted transition-colors"
                    >
                        <Download className="h-4 w-4" />
                        Download PDF
                    </a>
                </div>
            </div>
        </>
    );
}
