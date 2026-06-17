import { Head, Link, setLayoutProps } from '@inertiajs/react';
import { AlertTriangle, CalendarDays, Car, CircleDollarSign, Gauge, ShieldCheck, TrendingUp, Users, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { index as complianceIndex } from '@/routes/compliance';
import { index as maintenanceIndex } from '@/routes/maintenance';
import { index as financeIndex } from '@/routes/finance';
import * as BookingRoutes from '@/actions/App/Http/Controllers/Web/BookingController';
import * as VehicleRoutes from '@/actions/App/Http/Controllers/Web/VehicleController';

interface Stats {
    active_bookings: number;
    pending_bookings: number;
    available_vehicles: number;
    total_vehicles: number;
    total_customers: number;
    revenue_this_month: number;
}

interface RecentBooking {
    id: number;
    reference: string;
    customer_name: string;
    vehicle: string;
    reg_plate: string;
    status: string;
    pickup_datetime: string;
    return_datetime: string;
    total_amount: number;
    currency: string;
}

interface VehicleStat {
    id: number;
    label: string;
    reg_plate: string;
    value: number;
}

interface DueForService {
    id: number;
    label: string;
    reg_plate: string;
    current_odometer: number;
    next_service_at: number;
    km_until_service: number;
}

interface ExpiringCompliance {
    id: number;
    vehicle_id: number;
    vehicle_label: string;
    reg_plate: string;
    type: string;
    expiry_date: string;
    days_to_expiry: number;
}

interface Analytics {
    most_booked: VehicleStat[];
    highest_mileage: VehicleStat[];
    due_for_service: DueForService[];
    expiring_compliance: ExpiringCompliance[];
    status_breakdown: Record<string, number>;
    revenue_trend: Array<{ date: string; value: number }>;
}

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    completed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const VEHICLE_STATUS_COLORS: Record<string, string> = {
    available: '#10b981',
    rented: '#3b82f6',
    maintenance: '#f59e0b',
    reserved: '#8b5cf6',
    decommissioned: '#6b7280',
};

function fmt(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateShort(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function StatCard({ label, value, icon: Icon, accent, sub, href }: { label: string; value: string; icon: React.ComponentType<{ className?: string }>; accent: string; sub?: string; href?: string }) {
    const Wrapper = href ? Link : 'div';
    const props = href ? { href } : {};
    return (
        <Card className="group">
            <CardContent className="p-5">
                <Wrapper {...(props as never)} className="block">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                            <p className="mt-1 text-2xl font-bold group-hover:text-primary transition-colors">{value}</p>
                            {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
                        </div>
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent}`}>
                            <Icon className="h-5 w-5" />
                        </div>
                    </div>
                </Wrapper>
            </CardContent>
        </Card>
    );
}

function RevenueSparkline({ data }: { data: Array<{ date: string; value: number }> }) {
    if (data.length === 0) return null;
    const max = Math.max(...data.map((d) => d.value), 1);
    const width = 600;
    const height = 120;
    const padding = 8;
    const step = (width - padding * 2) / Math.max(1, data.length - 1);

    const points = data.map((d, i) => {
        const x = padding + step * i;
        const y = padding + (height - padding * 2) - ((height - padding * 2) * d.value) / max;
        return { x, y, ...d };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const areaD = `${pathD} L${points[points.length - 1].x},${height - padding} L${points[0].x},${height - padding} Z`;

    return (
        <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${width} ${height + 24}`} className="w-full min-w-[400px]">
                <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(16 185 129)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d={areaD} fill="url(#revenueGradient)" />
                <path d={pathD} fill="none" stroke="rgb(16 185 129)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                {points.map((p, i) => (
                    <g key={i}>
                        <circle cx={p.x} cy={p.y} r="3" className="fill-emerald-500" />
                        {i % 2 === 0 && (
                            <text x={p.x} y={height + 16} textAnchor="middle" className="text-[9px] fill-current opacity-50">
                                {fmtDateShort(p.date)}
                            </text>
                        )}
                    </g>
                ))}
            </svg>
        </div>
    );
}

function StatusRing({ breakdown, total }: { breakdown: Record<string, number>; total: number }) {
    if (total === 0) return null;
    const size = 140;
    const radius = 56;
    const stroke = 18;
    const cx = size / 2;
    const cy = size / 2;
    const circumference = 2 * Math.PI * radius;

    let cumulative = 0;
    const segments = Object.entries(breakdown).map(([status, count]) => {
        const fraction = count / total;
        const length = fraction * circumference;
        const rotation = (cumulative / total) * 360;
        cumulative += count;
        return { status, count, length, rotation };
    });

    return (
        <div className="flex items-center gap-6">
            <div className="relative shrink-0">
                <svg width={size} height={size}>
                    <circle cx={cx} cy={cy} r={radius} fill="none" className="stroke-muted" strokeWidth={stroke} />
                    {segments.map((s, i) => (
                        <circle
                            key={i}
                            cx={cx}
                            cy={cy}
                            r={radius}
                            fill="none"
                            stroke={VEHICLE_STATUS_COLORS[s.status] ?? '#94a3b8'}
                            strokeWidth={stroke}
                            strokeDasharray={`${s.length} ${circumference}`}
                            transform={`rotate(${s.rotation - 90} ${cx} ${cy})`}
                        />
                    ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-2xl font-bold">{total}</p>
                    <p className="text-[10px] uppercase text-muted-foreground">Vehicles</p>
                </div>
            </div>
            <div className="flex-1 space-y-1.5 text-xs">
                {segments.map((s) => (
                    <div key={s.status} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: VEHICLE_STATUS_COLORS[s.status] ?? '#94a3b8' }} />
                            <span className="capitalize">{s.status}</span>
                        </div>
                        <span className="font-semibold">{s.count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function HorizontalBarChart({ data, max, format }: { data: VehicleStat[]; max: number; format?: (v: number) => string }) {
    if (data.length === 0) {
        return <p className="text-center text-sm text-muted-foreground py-6">No data yet.</p>;
    }
    return (
        <div className="space-y-3">
            {data.map((d) => {
                const pct = max > 0 ? (d.value / max) * 100 : 0;
                return (
                    <Link key={d.id} href={VehicleRoutes.show.url({ vehicle: d.id })} className="block group">
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-medium truncate flex-1 min-w-0 group-hover:text-primary transition-colors">{d.label} <span className="text-muted-foreground">· {d.reg_plate}</span></span>
                            <span className="ml-2 font-semibold">{format ? format(d.value) : d.value}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}

export default function Dashboard({
    stats,
    recentBookings,
    analytics,
}: {
    stats: Stats;
    recentBookings: RecentBooking[];
    analytics: Analytics;
}) {
    setLayoutProps({
        breadcrumbs: [{ title: 'Dashboard', href: dashboard.url() }],
    });

    const totalVehicles = Object.values(analytics.status_breakdown).reduce((a, b) => a + b, 0);
    const mostBookedMax = Math.max(...analytics.most_booked.map((v) => v.value), 1);
    const mileageMax = Math.max(...analytics.highest_mileage.map((v) => v.value), 1);

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
                    <p className="text-sm text-muted-foreground">Here's what's happening across your fleet today.</p>
                </div>

                {/* Stat cards */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Active Rentals"
                        value={String(stats.active_bookings)}
                        icon={Car}
                        accent="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        sub={`${stats.pending_bookings} pending confirmation`}
                        href={BookingRoutes.index.url()}
                    />
                    <StatCard
                        label="Fleet Available"
                        value={`${stats.available_vehicles} / ${stats.total_vehicles}`}
                        icon={Gauge}
                        accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        sub="ready to rent"
                        href={VehicleRoutes.index.url()}
                    />
                    <StatCard
                        label="Customers"
                        value={String(stats.total_customers)}
                        icon={Users}
                        accent="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                        sub="registered"
                    />
                    <StatCard
                        label="Revenue This Month"
                        value={fmt(stats.revenue_this_month, 'USD')}
                        icon={CircleDollarSign}
                        accent="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        sub="completed bookings"
                        href={financeIndex.url()}
                    />
                </div>

                {/* Revenue trend + fleet status */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Revenue · Last 14 days</CardTitle>
                                <p className="mt-1 text-xs text-muted-foreground">Completed bookings, USD</p>
                            </div>
                            <Link href={financeIndex.url()} className="text-xs text-primary hover:underline">Finance →</Link>
                        </CardHeader>
                        <CardContent>
                            <RevenueSparkline data={analytics.revenue_trend} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Fleet Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <StatusRing breakdown={analytics.status_breakdown} total={totalVehicles} />
                        </CardContent>
                    </Card>
                </div>

                {/* Vehicle analytics */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Most Booked Vehicles</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <HorizontalBarChart data={analytics.most_booked} max={mostBookedMax} format={(v) => `${v} ${v === 1 ? 'booking' : 'bookings'}`} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Highest Mileage</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <HorizontalBarChart data={analytics.highest_mileage} max={mileageMax} format={(v) => `${v.toLocaleString()} km`} />
                        </CardContent>
                    </Card>
                </div>

                {/* Alerts row */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2"><Wrench className="h-4 w-4" /> Due for Service</CardTitle>
                            <Link href={maintenanceIndex.url()} className="text-xs text-primary hover:underline">All →</Link>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {analytics.due_for_service.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground py-6">Everything's up to date 🎉</p>
                            ) : analytics.due_for_service.map((v) => {
                                const overdue = v.km_until_service <= 0;
                                return (
                                    <Link key={v.id} href={VehicleRoutes.show.url({ vehicle: v.id })} className="flex items-center justify-between gap-3 rounded-lg p-2 -m-2 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${overdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                <Wrench className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm truncate">{v.label}</p>
                                                <p className="font-mono text-xs text-muted-foreground">{v.reg_plate}</p>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-semibold shrink-0 ${overdue ? 'text-red-700' : 'text-amber-700'}`}>
                                            {overdue ? `${Math.abs(v.km_until_service).toLocaleString()} km over` : `${v.km_until_service.toLocaleString()} km left`}
                                        </span>
                                    </Link>
                                );
                            })}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Expiring Compliance</CardTitle>
                            <Link href={complianceIndex.url()} className="text-xs text-primary hover:underline">All →</Link>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {analytics.expiring_compliance.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground py-6">No compliance expiring in 30 days 👍</p>
                            ) : analytics.expiring_compliance.map((c) => (
                                <Link key={c.id} href={VehicleRoutes.show.url({ vehicle: c.vehicle_id })} className="flex items-center justify-between gap-3 rounded-lg p-2 -m-2 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                                            <AlertTriangle className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm truncate capitalize">{c.vehicle_label} · {c.type.replace('_', ' ')}</p>
                                            <p className="font-mono text-xs text-muted-foreground">{c.reg_plate} · expires {fmtDate(c.expiry_date)}</p>
                                        </div>
                                    </div>
                                    <span className="shrink-0 text-xs font-semibold text-amber-700">{c.days_to_expiry}d</span>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent bookings */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CalendarDays className="h-4 w-4" /> Recent Bookings
                        </CardTitle>
                        <Link href={BookingRoutes.index.url()} className="text-sm text-primary hover:underline">
                            View all
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0">
                        {recentBookings.length === 0 ? (
                            <p className="p-6 text-center text-sm text-muted-foreground">No bookings yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            <th className="px-4 py-3">Reference</th>
                                            <th className="px-4 py-3">Customer</th>
                                            <th className="px-4 py-3">Vehicle</th>
                                            <th className="px-4 py-3">Pickup</th>
                                            <th className="px-4 py-3">Return</th>
                                            <th className="px-4 py-3">Total</th>
                                            <th className="px-4 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {recentBookings.map((b) => (
                                            <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 font-mono font-medium">
                                                    <Link href={BookingRoutes.show.url({ booking: b.id })} className="text-primary hover:underline">
                                                        {b.reference}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3">{b.customer_name}</td>
                                                <td className="px-4 py-3">
                                                    <span>{b.vehicle}</span>
                                                    <span className="ml-1 text-xs text-muted-foreground">({b.reg_plate})</span>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{fmtDate(b.pickup_datetime)}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{fmtDate(b.return_datetime)}</td>
                                                <td className="px-4 py-3 font-medium">{fmt(b.total_amount, b.currency)}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[b.status] ?? ''}`}>
                                                        {b.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
