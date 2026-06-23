import { Head, Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    CalendarDays,
    Car,
    CheckCircle,
    ChevronRight,
    CircleDollarSign,
    ClipboardList,
    FileText,
    ShieldCheck,
    Users,
} from 'lucide-react';
import { dashboard, login } from '@/routes';

const features = [
    {
        icon: Car,
        title: 'Fleet Management',
        description: 'Track every vehicle — maintenance schedules, compliance, costs, and availability at a glance.',
    },
    {
        icon: CalendarDays,
        title: 'Bookings & Reservations',
        description: 'End-to-end booking workflow with pickup inspections, customer ratings, and automated invoicing.',
    },
    {
        icon: CircleDollarSign,
        title: 'Finance & Payroll',
        description: 'Expenses, salaries, quotations, and requisitions — the full financial pipeline in one system.',
    },
    {
        icon: Users,
        title: 'Customer Management',
        description: 'Complete customer profiles, blacklist management, wallet balances, and rental history.',
    },
    {
        icon: BarChart3,
        title: 'Reports & Analytics',
        description: 'Booking trends, expense breakdowns, HR summaries, and exportable customer statements.',
    },
    {
        icon: ShieldCheck,
        title: 'Compliance & Insurance',
        description: 'Stay ahead of licence renewals, insurance expiry, and roadworthiness with automated alerts.',
    },
];

const workflow = [
    { step: '01', title: 'Add your fleet', body: 'Register vehicles with full specs, costs, and compliance documents.' },
    { step: '02', title: 'Take a booking', body: 'Create reservations, attach customers, and collect deposits in seconds.' },
    { step: '03', title: 'Manage & invoice', body: 'Complete rentals with inspections, generate branded invoices, and log payments.' },
    { step: '04', title: 'Review & grow', body: 'Use built-in reports to track revenue, control costs, and make informed decisions.' },
];

const stats = [
    { value: '360°', label: 'Fleet visibility' },
    { value: 'Real-time', label: 'Financial overview' },
    { value: 'PDF + CSV', label: 'Export-ready reports' },
    { value: 'Multi-role', label: 'Team access control' },
];

export default function Welcome({ canRegister = true }: { canRegister?: boolean }) {
    const { auth } = usePage<{ auth: { user: unknown } }>().props;

    return (
        <>
            <Head title="Laxora Car Rental — Fleet Management Platform">
                <meta name="description" content="Modern car rental management software. Fleet, bookings, finance, and reports in one place." />
            </Head>

            <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">

                {/* ── Nav ── */}
                <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
                    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                        <img
                            src="/brand_assets/Wordmark.svg"
                            alt="Laxora Car Rental"
                            className="h-7 w-auto dark:invert"
                        />
                        <nav className="flex items-center gap-3">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                                >
                                    Go to Dashboard <ChevronRight className="h-3.5 w-3.5" />
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                                    >
                                        Sign in
                                    </Link>
                                    <Link
                                        href={login()}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                                    >
                                        Get Started <ChevronRight className="h-3.5 w-3.5" />
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                {/* ── Hero ── */}
                <section className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950" />
                    <div className="absolute inset-0 opacity-[0.04]"
                        style={{
                            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                            backgroundSize: '40px 40px',
                        }}
                    />
                    <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-600/20 blur-3xl" />

                    <div className="relative mx-auto max-w-6xl px-6 py-28 text-center">
                        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-400">
                            Fleet Management Platform
                        </span>
                        <h1 className="mt-6 text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
                            Run your car rental
                            <br />
                            <span className="text-indigo-400">the smart way.</span>
                        </h1>
                        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
                            Laxora brings your entire operation together — fleet, bookings, customers, finance, and reporting — in one clean, modern platform.
                        </p>
                        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                            <Link
                                href={login()}
                                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-900/40 hover:bg-indigo-500 transition-colors"
                            >
                                Start managing your fleet <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>

                        {/* Stats row */}
                        <div className="mt-20 grid grid-cols-2 gap-6 sm:grid-cols-4">
                            {stats.map((s) => (
                                <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                                    <p className="text-2xl font-bold text-white">{s.value}</p>
                                    <p className="mt-1 text-xs text-slate-400">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Features ── */}
                <section className="py-24">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="text-center">
                            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Everything you need</p>
                            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Built for car rental operators</h2>
                            <p className="mx-auto mt-4 max-w-xl text-slate-500 dark:text-slate-400">
                                From the first inquiry to the final invoice, every part of your workflow is covered.
                            </p>
                        </div>

                        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {features.map(({ icon: Icon, title, description }) => (
                                <div
                                    key={title}
                                    className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:border-indigo-100 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-900"
                                >
                                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <h3 className="font-semibold">{title}</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── How it works ── */}
                <section className="border-t border-slate-100 bg-slate-50 py-24 dark:border-slate-800 dark:bg-slate-900/50">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="text-center">
                            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">How it works</p>
                            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Up and running in minutes</h2>
                        </div>

                        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                            {workflow.map(({ step, title, body }) => (
                                <div key={step} className="relative">
                                    <span className="text-5xl font-black text-slate-100 dark:text-slate-800">{step}</span>
                                    <h3 className="mt-2 font-semibold">{title}</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Module highlights ── */}
                <section className="py-24">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="grid gap-6 sm:grid-cols-3">
                            {[
                                { icon: FileText, title: 'Quotations & Requisitions', body: 'Send professional quotations, convert to purchase requisitions, and track approvals end-to-end.' },
                                { icon: ClipboardList, title: 'Worker Tasks', body: 'Assign operational tasks to your team, set priorities and due dates, and track completion rates.' },
                                { icon: CircleDollarSign, title: 'Statements & Exports', body: 'Generate customer account statements and organisation P&L reports — downloadable as PDF or CSV.' },
                            ].map(({ icon: Icon, title, body }) => (
                                <div key={title} className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                    <div className="shrink-0">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{title}</h3>
                                        <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{body}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CTA banner ── */}
                <section className="py-20">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-800 px-10 py-16 text-center shadow-xl">
                            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
                            <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
                            <div className="relative">
                                <CheckCircle className="mx-auto h-10 w-10 text-indigo-300" />
                                <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
                                    Ready to take control of your fleet?
                                </h2>
                                <p className="mx-auto mt-4 max-w-xl text-indigo-200">
                                    Sign in to your Laxora dashboard and start managing bookings, vehicles, and finances today.
                                </p>
                                <Link
                                    href={login()}
                                    className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-indigo-700 shadow-md hover:bg-indigo-50 transition-colors"
                                >
                                    Sign in to your account <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Footer ── */}
                <footer className="border-t border-slate-100 py-10 dark:border-slate-800">
                    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
                        <img
                            src="/brand_assets/Wordmark.svg"
                            alt="Laxora Car Rental"
                            className="h-6 w-auto opacity-60 dark:invert"
                        />
                        <p className="text-xs text-slate-400">
                            © {new Date().getFullYear()} Laxora Car Rental. All rights reserved.
                        </p>
                    </div>
                </footer>

            </div>
        </>
    );
}
