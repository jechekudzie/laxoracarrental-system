import { Head, Link, setLayoutProps } from '@inertiajs/react';
import { AlertCircle, CalendarDays, CheckCircle, TrendingUp, Users, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { dashboard } from '@/routes';

interface Stats {
    bookings_this_month: number;
    revenue_this_month: number;
    expenses_this_month: number;
    active_employees: number;
    tasks_completed_this_month: number;
    tasks_overdue: number;
}

function fmt(amount: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

interface ReportCardProps {
    label: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
    href: string;
}

function ReportCard({ label, value, icon: Icon, accent, href }: ReportCardProps) {
    return (
        <Card className="group hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${accent}`}>
                        <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
                    </div>
                </div>
                <div className="mt-5 pt-4 border-t">
                    <Link
                        href={href}
                        className="text-sm font-medium text-primary hover:underline"
                    >
                        View Report →
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

export default function ReportsIndex({ stats }: { stats: Stats }) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Reports', href: '/reports' },
        ],
    });

    return (
        <>
            <Head title="Reports" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
                    <p className="text-sm text-muted-foreground">Analytics and insights across your operations.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <ReportCard
                        label="Bookings This Month"
                        value={String(stats.bookings_this_month)}
                        icon={CalendarDays}
                        accent="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        href="/reports/bookings"
                    />
                    <ReportCard
                        label="Revenue This Month"
                        value={fmt(stats.revenue_this_month)}
                        icon={TrendingUp}
                        accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        href="/reports/bookings"
                    />
                    <ReportCard
                        label="Expenses This Month"
                        value={fmt(stats.expenses_this_month)}
                        icon={Wallet}
                        accent="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                        href="/reports/expenses"
                    />
                    <ReportCard
                        label="Active Employees"
                        value={String(stats.active_employees)}
                        icon={Users}
                        accent="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                        href="/reports/hr"
                    />
                    <ReportCard
                        label="Tasks Completed"
                        value={String(stats.tasks_completed_this_month)}
                        icon={CheckCircle}
                        accent="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        href="/reports/tasks"
                    />
                    <ReportCard
                        label="Tasks Overdue"
                        value={String(stats.tasks_overdue)}
                        icon={AlertCircle}
                        accent="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        href="/reports/tasks"
                    />
                </div>
            </div>
        </>
    );
}
