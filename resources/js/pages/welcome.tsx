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

const GOLD = '#c2943f';
const GOLD_LIGHT = '#d4ab5e';
const DARK = '#0a0a0a';

const features = [
    { icon: Car, title: 'Fleet Management', description: 'Track every vehicle — maintenance schedules, compliance, costs, and availability at a glance.' },
    { icon: CalendarDays, title: 'Bookings & Reservations', description: 'End-to-end booking workflow with pickup inspections, customer ratings, and automated invoicing.' },
    { icon: CircleDollarSign, title: 'Finance & Payroll', description: 'Expenses, salaries, quotations, and requisitions — the full financial pipeline in one system.' },
    { icon: Users, title: 'Customer Management', description: 'Complete customer profiles, blacklist management, wallet balances, and rental history.' },
    { icon: BarChart3, title: 'Reports & Analytics', description: 'Booking trends, expense breakdowns, HR summaries, and exportable customer statements.' },
    { icon: ShieldCheck, title: 'Compliance & Insurance', description: 'Stay ahead of licence renewals, insurance expiry, and roadworthiness with automated alerts.' },
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

            <div className="min-h-screen bg-white text-slate-900 dark:bg-[#0a0a0a] dark:text-slate-100">

                {/* ── Nav ── */}
                <header className="sticky top-0 z-50 border-b border-stone-100 bg-white/95 backdrop-blur-md dark:border-stone-900 dark:bg-[#0a0a0a]/95">
                    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                        <a href="#" className="flex-shrink-0">
                            <img src="/logo.jpg" alt="Laxora Car Rental" className="h-10 w-auto object-contain" />
                        </a>

                        {/* Desktop nav links */}
                        <nav className="hidden items-center gap-6 md:flex">
                            <a href="#features" className="text-sm font-medium text-stone-500 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-white">Features</a>
                            <a href="#how-it-works" className="text-sm font-medium text-stone-500 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-white">How it works</a>
                            <a href="#modules" className="text-sm font-medium text-stone-500 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-white">Modules</a>
                        </nav>

                        <div className="flex items-center gap-3">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                                    style={{ background: GOLD }}
                                >
                                    Go to Dashboard <ChevronRight className="h-3.5 w-3.5" />
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="hidden text-sm font-medium text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-white sm:inline"
                                    >
                                        Sign in
                                    </Link>
                                    <Link
                                        href={login()}
                                        className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                                        style={{ background: GOLD }}
                                    >
                                        Get Started <ChevronRight className="h-3.5 w-3.5" />
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* ── Hero ── */}
                <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1208 60%, #2a1e08 100%)' }}>
                    <div
                        className="absolute inset-0 opacity-[0.05]"
                        style={{
                            backgroundImage: `linear-gradient(rgba(194,148,63,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(194,148,63,0.4) 1px, transparent 1px)`,
                            backgroundSize: '40px 40px',
                        }}
                    />
                    <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl" style={{ background: 'rgba(194,148,63,0.15)' }} />

                    <div className="relative mx-auto max-w-6xl px-6 py-28 text-center">
                        <span
                            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
                            style={{ borderColor: 'rgba(194,148,63,0.3)', background: 'rgba(194,148,63,0.1)', color: GOLD_LIGHT }}
                        >
                            Fleet Management Platform
                        </span>
                        <h1 className="mt-6 text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
                            Run your car rental
                            <br />
                            <span style={{ color: GOLD }}>the smart way.</span>
                        </h1>
                        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-stone-400">
                            Laxora brings your entire operation together — fleet, bookings, customers, finance, and reporting — in one clean, modern platform.
                        </p>
                        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                            <Link
                                href={login()}
                                className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
                                style={{ background: GOLD, boxShadow: '0 8px 32px rgba(194,148,63,0.25)' }}
                            >
                                Start managing your fleet <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>

                        {/* Stats */}
                        <div className="mt-20 grid grid-cols-2 gap-6 sm:grid-cols-4">
                            {stats.map((s) => (
                                <div key={s.label} className="rounded-xl border p-5 backdrop-blur" style={{ borderColor: 'rgba(194,148,63,0.15)', background: 'rgba(194,148,63,0.05)' }}>
                                    <p className="text-2xl font-bold text-white">{s.value}</p>
                                    <p className="mt-1 text-xs text-stone-400">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Features ── */}
                <section id="features" className="py-24">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="text-center">
                            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: GOLD }}>Everything you need</p>
                            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Built for car rental operators</h2>
                            <p className="mx-auto mt-4 max-w-xl text-stone-500 dark:text-stone-400">
                                From the first inquiry to the final invoice, every part of your workflow is covered.
                            </p>
                        </div>

                        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {features.map(({ icon: Icon, title, description }) => (
                                <div
                                    key={title}
                                    className="group rounded-2xl border border-stone-100 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-stone-800 dark:bg-stone-900"
                                    style={{ ['--hover-border' as string]: GOLD }}
                                >
                                    <div
                                        className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl"
                                        style={{ background: 'rgba(194,148,63,0.1)', color: GOLD }}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <h3 className="font-semibold">{title}</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-stone-500 dark:text-stone-400">{description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── How it works ── */}
                <section id="how-it-works" className="border-t border-stone-100 bg-stone-50 py-24 dark:border-stone-900 dark:bg-stone-950">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="text-center">
                            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: GOLD }}>How it works</p>
                            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Up and running in minutes</h2>
                        </div>

                        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                            {workflow.map(({ step, title, body }) => (
                                <div key={step}>
                                    <span className="text-5xl font-black text-stone-100 dark:text-stone-800">{step}</span>
                                    <h3 className="mt-2 font-semibold">{title}</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-stone-500 dark:text-stone-400">{body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Module highlights ── */}
                <section id="modules" className="py-24">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="grid gap-6 sm:grid-cols-3">
                            {[
                                { icon: FileText, title: 'Quotations & Requisitions', body: 'Send professional quotations, convert to purchase requisitions, and track approvals end-to-end.' },
                                { icon: ClipboardList, title: 'Worker Tasks', body: 'Assign operational tasks to your team, set priorities and due dates, and track completion rates.' },
                                { icon: CircleDollarSign, title: 'Statements & Exports', body: 'Generate customer account statements and organisation P&L reports — downloadable as PDF or CSV.' },
                            ].map(({ icon: Icon, title, body }) => (
                                <div key={title} className="flex gap-4 rounded-2xl border border-stone-100 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                                    <div className="shrink-0">
                                        <div
                                            className="flex h-10 w-10 items-center justify-center rounded-xl"
                                            style={{ background: 'rgba(194,148,63,0.1)', color: GOLD }}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{title}</h3>
                                        <p className="mt-1.5 text-sm leading-relaxed text-stone-500 dark:text-stone-400">{body}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CTA banner ── */}
                <section className="py-20">
                    <div className="mx-auto max-w-6xl px-6">
                        <div
                            className="relative overflow-hidden rounded-3xl px-10 py-16 text-center shadow-xl"
                            style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1208 60%, #2a1e08 100%)' }}
                        >
                            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full blur-2xl" style={{ background: 'rgba(194,148,63,0.1)' }} />
                            <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full blur-2xl" style={{ background: 'rgba(194,148,63,0.08)' }} />
                            <div className="relative">
                                <CheckCircle className="mx-auto h-10 w-10" style={{ color: GOLD }} />
                                <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
                                    Ready to take control of your fleet?
                                </h2>
                                <p className="mx-auto mt-4 max-w-xl text-stone-400">
                                    Sign in to your Laxora dashboard and start managing bookings, vehicles, and finances today.
                                </p>
                                <Link
                                    href={login()}
                                    className="mt-8 inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-semibold text-white shadow-md transition-opacity hover:opacity-90"
                                    style={{ background: GOLD }}
                                >
                                    Sign in to your account <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Footer ── */}
                <footer className="border-t border-stone-100 py-10 dark:border-stone-900">
                    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
                        <img src="/logo.jpg" alt="Laxora Car Rental" className="h-8 w-auto object-contain opacity-70" />
                        <p className="text-xs text-stone-400">
                            © {new Date().getFullYear()} Laxora Car Rental. All rights reserved.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
