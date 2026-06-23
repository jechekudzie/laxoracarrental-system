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
                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1208 60%, #2a1e08 100%)' }} />

                {/* Subtle grid */}
                <div
                    className="absolute inset-0 opacity-[0.05]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(194,148,63,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(194,148,63,0.4) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />

                {/* Glow accents */}
                <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl" style={{ background: 'rgba(194,148,63,0.12)' }} />
                <div className="absolute -bottom-32 right-0 h-80 w-80 rounded-full blur-3xl" style={{ background: 'rgba(194,148,63,0.08)' }} />

                {/* Content */}
                <div className="relative z-10 flex h-full flex-col p-12">
                    <Link href={home()}>
                        <div className="inline-block rounded-xl bg-white/95 px-4 py-2 shadow-sm">
                            <img
                                src="/logo.jpg"
                                alt="Laxora Car Rental"
                                className="h-10 w-auto object-contain"
                            />
                        </div>
                    </Link>

                    <div className="mt-auto">
                        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#c2943f' }}>
                            Fleet Management Platform
                        </p>
                        <h2 className="mt-3 text-4xl font-bold leading-tight text-white">
                            Drive your business
                            <br />
                            <span style={{ color: '#c2943f' }}>forward.</span>
                        </h2>
                        <p className="mt-4 text-base leading-relaxed text-stone-400">
                            Everything you need to run a modern car rental operation — bookings, fleet, finance, and reports — in one place.
                        </p>

                        <ul className="mt-8 space-y-3">
                            {features.map(({ icon: Icon, text }) => (
                                <li key={text} className="flex items-center gap-3 text-sm text-stone-300">
                                    <span
                                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                                        style={{ background: 'rgba(194,148,63,0.15)', color: '#c2943f' }}
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                    </span>
                                    {text}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <p className="mt-12 text-xs text-stone-700">
                        © {new Date().getFullYear()} Laxora Car Rental. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Right panel */}
            <div className="flex h-full w-full flex-col items-center justify-center px-8 py-12 lg:px-16">
                <Link href={home()} className="mb-8 lg:hidden">
                    <img
                        src="/logo.jpg"
                        alt="Laxora Car Rental"
                        className="h-10 w-auto object-contain"
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
