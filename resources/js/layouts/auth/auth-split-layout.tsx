import { Link } from '@inertiajs/react';
import { CalendarDays, Car, ChartBar, ShieldCheck } from 'lucide-react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

const features = [
    { icon: Car, text: 'Full fleet management & vehicle tracking' },
    { icon: CalendarDays, text: 'Bookings, inspections & customer ratings' },
    { icon: ChartBar, text: 'Finance, expenses & payroll in one place' },
    { icon: ShieldCheck, text: 'Compliance, insurance & maintenance logs' },
];

export default function AuthSplitLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="relative grid h-dvh flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
            {/* Left panel */}
            <div className="relative hidden h-full flex-col overflow-hidden lg:flex">
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950" />

                {/* Subtle grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />

                {/* Accent circles */}
                <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
                <div className="absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />

                {/* Content */}
                <div className="relative z-10 flex h-full flex-col p-12">
                    {/* Logo */}
                    <Link href={home()} className="flex items-center gap-3">
                        <img
                            src="/brand_assets/Wordmark.svg"
                            alt="Laxora Car Rental"
                            className="h-9 w-auto brightness-0 invert"
                        />
                    </Link>

                    {/* Hero text */}
                    <div className="mt-auto">
                        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
                            Fleet Management Platform
                        </p>
                        <h2 className="mt-3 text-4xl font-bold leading-tight text-white">
                            Drive your business
                            <br />
                            <span className="text-indigo-400">forward.</span>
                        </h2>
                        <p className="mt-4 text-base leading-relaxed text-slate-400">
                            Everything you need to run a modern car rental operation — bookings, fleet, finance, and reports — in one place.
                        </p>

                        {/* Feature list */}
                        <ul className="mt-8 space-y-3">
                            {features.map(({ icon: Icon, text }) => (
                                <li key={text} className="flex items-center gap-3 text-sm text-slate-300">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
                                        <Icon className="h-3.5 w-3.5" />
                                    </span>
                                    {text}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Footer */}
                    <p className="mt-12 text-xs text-slate-600">
                        © {new Date().getFullYear()} Laxora Car Rental. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Right panel — form */}
            <div className="flex h-full w-full flex-col items-center justify-center px-8 py-12 lg:px-16">
                {/* Mobile logo */}
                <Link href={home()} className="mb-8 lg:hidden">
                    <img
                        src="/brand_assets/Wordmark.svg"
                        alt="Laxora Car Rental"
                        className="h-8 w-auto dark:invert"
                    />
                </Link>

                <div className="w-full max-w-sm">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                        {description && (
                            <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
                        )}
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
