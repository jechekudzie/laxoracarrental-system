import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import {
    ArrowRight,
    Calendar,
    Car,
    CheckCircle,
    ChevronRight,
    Clock,
    Mail,
    MapPin,
    Phone,
    Shield,
    Star,
    Users,
} from 'lucide-react';
import { dashboard, login } from '@/routes';

const GOLD = '#c2943f';
const GOLD_LIGHT = '#d4ab5e';
const DARK = '#0a0a0a';

// ── Fleet data from vehicle register ─────────────────────────────────────────
const fleet = [
    { name: 'Toyota Hilux', variant: 'Double Cab Silver', seats: 5, category: 'SUV / 4×4', highlight: true, tags: ['Off-road', 'Rugged'] },
    { name: 'Toyota Hilux Rocco', variant: 'Double Cab Sport', seats: 5, category: 'SUV / 4×4', highlight: false, tags: ['Sport', 'Style'] },
    { name: 'Toyota Fortuner', variant: 'SUV', seats: 7, category: 'Family SUV', highlight: true, tags: ['Spacious', 'Premium'] },
    { name: 'Toyota Coaster', variant: 'Mini Bus', seats: 25, category: 'Mini Coach', highlight: false, tags: ['Group', 'Corporate'] },
    { name: 'Nissan Bus', variant: 'Coach', seats: 70, category: 'Coach', highlight: false, tags: ['Mass Transit', 'Events'] },
    { name: 'Honda HR-V', variant: 'Hybrid', seats: 5, category: 'Eco Hybrid', highlight: false, tags: ['Fuel-Efficient', 'Modern'] },
];

const benefits = [
    { icon: Shield, title: 'Fully Insured Fleet', body: 'Every vehicle is comprehensively insured and rigorously maintained to the highest safety standards.' },
    { icon: Star, title: 'Premium Experience', body: 'Meticulous attention to cleanliness, comfort, and presentation — because you deserve nothing less.' },
    { icon: Clock, title: 'Flexible Rentals', body: 'From a few hours to several weeks, we tailor every booking to your schedule and requirements.' },
    { icon: Users, title: 'Professional Service', body: 'Our trained team is available to assist from your first inquiry to the moment you return the keys.' },
];

const steps = [
    { num: '01', title: 'Choose Your Vehicle', body: 'Browse our premium fleet and select the car that fits your journey — solo, family, or corporate group.' },
    { num: '02', title: 'Confirm Your Booking', body: 'Get in touch via phone or WhatsApp. We\'ll handle the paperwork and have your vehicle ready.' },
    { num: '03', title: 'Drive With Confidence', body: 'Pick up your fully serviced vehicle and enjoy the road — with Laxora\'s support every mile of the way.' },
];

const TAGLINE = 'Where every ride feels first class.';

// ── Typewriter ─────────────────────────────────────────────────────────────
function TypewriterText() {
    const [displayed, setDisplayed] = useState('');
    const [showCursor, setShowCursor] = useState(true);
    const [done, setDone] = useState(false);

    useEffect(() => {
        let i = 0;
        const type = setInterval(() => {
            i++;
            setDisplayed(TAGLINE.slice(0, i));
            if (i >= TAGLINE.length) { clearInterval(type); setDone(true); }
        }, 45);
        return () => clearInterval(type);
    }, []);

    useEffect(() => {
        if (!done) return;
        const blink = setInterval(() => setShowCursor((c) => !c), 530);
        return () => clearInterval(blink);
    }, [done]);

    return (
        <span>
            {displayed}
            <span
                className="ml-0.5 inline-block w-[2px] rounded-sm align-middle"
                style={{ height: '0.8em', background: GOLD, opacity: showCursor ? 1 : 0, transition: 'opacity 0.1s' }}
            />
        </span>
    );
}

// ── Car SVG silhouette ─────────────────────────────────────────────────────
function CarSilhouette({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 480 180" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
            {/* Ground glow */}
            <ellipse cx="240" cy="160" rx="220" ry="12" fill={GOLD} fillOpacity="0.06" />
            {/* Body */}
            <path
                d="M 38 130 L 38 96 Q 52 58 100 48 L 158 32 Q 210 20 270 22 L 320 26 Q 370 36 400 70 L 420 95 L 440 130 Z"
                fill={GOLD} fillOpacity="0.08" stroke={GOLD} strokeWidth="1.5" strokeOpacity="0.5"
            />
            {/* Roofline */}
            <path
                d="M 105 48 L 140 26 Q 185 14 240 14 L 300 16 Q 348 20 372 40 L 395 60"
                fill="none" stroke={GOLD} strokeWidth="1" strokeOpacity="0.35"
            />
            {/* Window split */}
            <path d="M 238 16 L 232 48" stroke={GOLD} strokeWidth="0.8" strokeOpacity="0.25" />
            {/* Door lines */}
            <path d="M 175 24 L 168 92" stroke={GOLD} strokeWidth="0.8" strokeOpacity="0.2" />
            {/* Front wheel arch */}
            <path d="M 76 130 Q 76 96 110 96 Q 144 96 144 130" fill={GOLD} fillOpacity="0.06" stroke={GOLD} strokeWidth="1" strokeOpacity="0.3" />
            {/* Front wheel */}
            <circle cx="110" cy="132" r="26" fill={GOLD} fillOpacity="0.07" stroke={GOLD} strokeWidth="1.5" strokeOpacity="0.4" />
            <circle cx="110" cy="132" r="14" fill={GOLD} fillOpacity="0.06" stroke={GOLD} strokeWidth="1" strokeOpacity="0.25" />
            <circle cx="110" cy="132" r="4" fill={GOLD} fillOpacity="0.3" />
            {/* Rear wheel arch */}
            <path d="M 348 130 Q 348 96 382 96 Q 416 96 416 130" fill={GOLD} fillOpacity="0.06" stroke={GOLD} strokeWidth="1" strokeOpacity="0.3" />
            {/* Rear wheel */}
            <circle cx="382" cy="132" r="26" fill={GOLD} fillOpacity="0.07" stroke={GOLD} strokeWidth="1.5" strokeOpacity="0.4" />
            <circle cx="382" cy="132" r="14" fill={GOLD} fillOpacity="0.06" stroke={GOLD} strokeWidth="1" strokeOpacity="0.25" />
            <circle cx="382" cy="132" r="4" fill={GOLD} fillOpacity="0.3" />
            {/* Headlight */}
            <rect x="420" y="98" width="16" height="8" rx="2" fill={GOLD} fillOpacity="0.5" />
            <path d="M 436 102 L 460 95" stroke={GOLD} strokeWidth="1" strokeOpacity="0.3" />
            {/* Tail light */}
            <rect x="38" y="98" width="14" height="8" rx="2" fill={GOLD} fillOpacity="0.3" />
        </svg>
    );
}

// ── Scroll-aware nav ───────────────────────────────────────────────────────
function useScrolled(threshold = 40) {
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > threshold);
        window.addEventListener('scroll', fn, { passive: true });
        return () => window.removeEventListener('scroll', fn);
    }, [threshold]);
    return scrolled;
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function Welcome({ canRegister = true }: { canRegister?: boolean }) {
    const { auth } = usePage<{ auth: { user: unknown } }>().props;
    const scrolled = useScrolled();

    return (
        <>
            <Head title="Laxora Car Rental — Premium Car Hire Zimbabwe">
                <meta name="description" content="Laxora Car Rental offers premium SUVs, minibuses, and coaches for hire in Zimbabwe. Where every ride feels first class." />
            </Head>

            <div className="min-h-screen" style={{ background: DARK, color: '#f1f1f1' }}>

                {/* ── NAV ── */}
                <header
                    className="fixed top-0 z-50 w-full transition-all duration-300"
                    style={{
                        background: scrolled ? 'rgba(10,10,10,0.95)' : 'transparent',
                        backdropFilter: scrolled ? 'blur(12px)' : 'none',
                        borderBottom: scrolled ? '1px solid rgba(194,148,63,0.15)' : '1px solid transparent',
                    }}
                >
                    <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6 py-4">
                        <a href="#" className="flex-shrink-0">
                            <div className="inline-block rounded-lg bg-white/90 px-3 py-1.5">
                                <img src="/logo.jpg" alt="Laxora Car Rental" className="h-9 w-auto object-contain" />
                            </div>
                        </a>

                        <nav className="hidden items-center gap-8 md:flex">
                            {[
                                { href: '#fleet', label: 'Our Fleet' },
                                { href: '#why-us', label: 'Why Laxora' },
                                { href: '#how-it-works', label: 'How It Works' },
                                { href: '#about', label: 'About' },
                                { href: '#contact', label: 'Contact' },
                            ].map(({ href, label }) => (
                                <a
                                    key={href} href={href}
                                    className="text-sm font-medium tracking-wide transition-colors"
                                    style={{ color: 'rgba(255,255,255,0.7)' }}
                                    onMouseEnter={e => (e.currentTarget.style.color = GOLD_LIGHT)}
                                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                                >
                                    {label}
                                </a>
                            ))}
                        </nav>

                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold tracking-wide text-black transition-opacity hover:opacity-90"
                                style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})` }}
                            >
                                Dashboard <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                        ) : (
                            <Link
                                href={login()}
                                className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold tracking-wide text-black transition-opacity hover:opacity-90"
                                style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})` }}
                            >
                                Book Now <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                        )}
                    </div>
                </header>

                {/* ── HERO ── */}
                <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden pt-20">
                    {/* Background layers */}
                    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(194,148,63,0.12) 0%, transparent 70%)' }} />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #120d00 50%, #0a0a0a 100%)' }} />
                    {/* Grid lines */}
                    <div
                        className="absolute inset-0 opacity-[0.04]"
                        style={{
                            backgroundImage: `linear-gradient(rgba(194,148,63,1) 1px, transparent 1px), linear-gradient(90deg, rgba(194,148,63,1) 1px, transparent 1px)`,
                            backgroundSize: '60px 60px',
                        }}
                    />
                    {/* Ambient orbs */}
                    <div className="absolute top-32 left-1/4 h-72 w-72 rounded-full blur-3xl" style={{ background: 'rgba(194,148,63,0.08)' }} />
                    <div className="absolute bottom-40 right-1/4 h-56 w-56 rounded-full blur-3xl" style={{ background: 'rgba(194,148,63,0.06)' }} />

                    <div className="relative z-10 mx-auto max-w-7xl px-6 text-center">
                        {/* Label pill */}
                        <div
                            className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-[3px]"
                            style={{ borderColor: 'rgba(194,148,63,0.4)', background: 'rgba(194,148,63,0.08)', color: GOLD_LIGHT }}
                        >
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: GOLD }} />
                            Premium Car Rental · Zimbabwe
                        </div>

                        {/* Main headline */}
                        <h1
                            className="mx-auto max-w-4xl text-6xl font-black leading-[1.05] tracking-tight sm:text-7xl lg:text-8xl"
                            style={{ textShadow: '0 0 80px rgba(194,148,63,0.15)' }}
                        >
                            Luxury On
                            <br />
                            <span style={{ color: GOLD }}>Every Road.</span>
                        </h1>

                        {/* Typewriter */}
                        <p className="mx-auto mt-6 text-lg font-medium tracking-wide sm:text-xl" style={{ color: 'rgba(255,255,255,0.55)' }}>
                            <TypewriterText />
                        </p>

                        {/* CTAs */}
                        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                            <a
                                href="#fleet"
                                className="inline-flex items-center gap-2.5 rounded-xl px-8 py-4 text-base font-bold tracking-wide text-black transition-all hover:scale-[1.03] hover:shadow-2xl"
                                style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, boxShadow: `0 8px 40px rgba(194,148,63,0.3)` }}
                            >
                                View Our Fleet <ArrowRight className="h-4 w-4" />
                            </a>
                            <a
                                href="#contact"
                                className="inline-flex items-center gap-2.5 rounded-xl border px-8 py-4 text-base font-bold tracking-wide text-white transition-all hover:scale-[1.03]"
                                style={{ borderColor: 'rgba(194,148,63,0.4)', background: 'rgba(194,148,63,0.06)' }}
                            >
                                Book a Vehicle <Phone className="h-4 w-4" />
                            </a>
                        </div>

                        {/* Car SVG */}
                        <div className="relative mx-auto mt-16 max-w-3xl">
                            <CarSilhouette className="w-full" />
                            {/* Reflection */}
                            <div
                                className="absolute inset-x-0 bottom-0 h-16 blur-sm"
                                style={{ background: 'linear-gradient(to top, rgba(194,148,63,0.04), transparent)' }}
                            />
                        </div>

                        {/* Stats strip */}
                        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
                            {[
                                { value: '8+', label: 'Premium Vehicles' },
                                { value: '4x4', label: 'Off-Road Capable' },
                                { value: '70', label: 'Seat Coach Available' },
                                { value: '24/7', label: 'Customer Support' },
                            ].map((s) => (
                                <div
                                    key={s.label}
                                    className="rounded-xl p-4 text-center"
                                    style={{ background: 'rgba(194,148,63,0.06)', border: '1px solid rgba(194,148,63,0.12)' }}
                                >
                                    <p className="text-2xl font-extrabold" style={{ color: GOLD }}>{s.value}</p>
                                    <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Scroll indicator */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                        <div className="h-10 w-6 rounded-full border" style={{ borderColor: 'rgba(194,148,63,0.3)' }}>
                            <div className="mx-auto mt-2 h-2 w-1 rounded-full" style={{ background: GOLD }} />
                        </div>
                    </div>
                </section>

                {/* ── FLEET ── */}
                <section id="fleet" className="relative py-28" style={{ background: '#080808' }}>
                    <div
                        className="absolute inset-0 opacity-[0.025]"
                        style={{
                            backgroundImage: `linear-gradient(rgba(194,148,63,1) 1px, transparent 1px), linear-gradient(90deg, rgba(194,148,63,1) 1px, transparent 1px)`,
                            backgroundSize: '40px 40px',
                        }}
                    />
                    <div className="relative mx-auto max-w-7xl px-6">
                        <div className="mb-16 text-center">
                            <p className="text-xs font-bold uppercase tracking-[3px]" style={{ color: GOLD }}>Our Fleet</p>
                            <h2 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
                                Drive the best.<br />
                                <span style={{ color: GOLD_LIGHT }}>Choose your experience.</span>
                            </h2>
                            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                From rugged 4×4s to executive coaches, our premium fleet is maintained to the highest standards — ready when you are.
                            </p>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {fleet.map((v) => (
                                <div
                                    key={v.name + v.variant}
                                    className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                                    style={{
                                        background: 'linear-gradient(145deg, #111 0%, #0d0d0d 100%)',
                                        border: v.highlight ? `1px solid rgba(194,148,63,0.35)` : '1px solid rgba(255,255,255,0.06)',
                                        boxShadow: v.highlight ? '0 0 30px rgba(194,148,63,0.08)' : 'none',
                                    }}
                                >
                                    {v.highlight && (
                                        <div
                                            className="absolute right-4 top-4 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                                            style={{ background: GOLD, color: '#000' }}
                                        >
                                            Popular
                                        </div>
                                    )}

                                    {/* Gold top accent line */}
                                    <div className="h-[2px] w-full" style={{ background: v.highlight ? `linear-gradient(90deg, ${GOLD}, transparent)` : 'rgba(255,255,255,0.04)' }} />

                                    {/* Car silhouette mini */}
                                    <div className="flex items-center justify-center px-8 pt-6 pb-2">
                                        <CarSilhouette className="w-full max-w-[220px] opacity-60 transition-opacity duration-300 group-hover:opacity-90" />
                                    </div>

                                    <div className="p-6 pt-2">
                                        {/* Category */}
                                        <span
                                            className="text-[10px] font-bold uppercase tracking-[2px]"
                                            style={{ color: GOLD }}
                                        >
                                            {v.category}
                                        </span>

                                        {/* Name */}
                                        <h3 className="mt-1 text-xl font-extrabold tracking-tight text-white">{v.name}</h3>
                                        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{v.variant}</p>

                                        {/* Specs */}
                                        <div className="mt-4 flex items-center gap-4 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                            <span className="flex items-center gap-1">
                                                <Users className="h-3.5 w-3.5" style={{ color: GOLD }} />
                                                {v.seats} seats
                                            </span>
                                        </div>

                                        {/* Tags */}
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {v.tags.map((t) => (
                                                <span
                                                    key={t}
                                                    className="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                                                    style={{ background: 'rgba(194,148,63,0.1)', color: GOLD_LIGHT, border: '1px solid rgba(194,148,63,0.15)' }}
                                                >
                                                    {t}
                                                </span>
                                            ))}
                                        </div>

                                        {/* CTA */}
                                        <a
                                            href="#contact"
                                            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold tracking-wide transition-all duration-200 group-hover:shadow-lg"
                                            style={{
                                                background: 'rgba(194,148,63,0.1)',
                                                color: GOLD_LIGHT,
                                                border: '1px solid rgba(194,148,63,0.2)',
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.background = GOLD;
                                                e.currentTarget.style.color = '#000';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background = 'rgba(194,148,63,0.1)';
                                                e.currentTarget.style.color = GOLD_LIGHT;
                                            }}
                                        >
                                            Enquire About This Vehicle <ArrowRight className="h-3.5 w-3.5" />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── WHY LAXORA ── */}
                <section id="why-us" className="py-28" style={{ background: '#060606' }}>
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="mb-16 text-center">
                            <p className="text-xs font-bold uppercase tracking-[3px]" style={{ color: GOLD }}>Why Laxora</p>
                            <h2 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
                                The Laxora difference.
                            </h2>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {benefits.map(({ icon: Icon, title, body }) => (
                                <div
                                    key={title}
                                    className="group rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1"
                                    style={{
                                        background: 'linear-gradient(145deg, #0f0f0f, #0a0a0a)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(194,148,63,0.3)'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                                >
                                    <div
                                        className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl"
                                        style={{ background: 'rgba(194,148,63,0.1)', border: '1px solid rgba(194,148,63,0.2)' }}
                                    >
                                        <Icon className="h-5 w-5" style={{ color: GOLD }} />
                                    </div>
                                    <h3 className="text-base font-bold text-white">{title}</h3>
                                    <p className="mt-3 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── HOW IT WORKS ── */}
                <section id="how-it-works" className="relative overflow-hidden py-28" style={{ background: '#080808' }}>
                    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(194,148,63,0.05) 0%, transparent 70%)' }} />

                    <div className="relative mx-auto max-w-5xl px-6">
                        <div className="mb-16 text-center">
                            <p className="text-xs font-bold uppercase tracking-[3px]" style={{ color: GOLD }}>How It Works</p>
                            <h2 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
                                Three steps to the road.
                            </h2>
                        </div>

                        <div className="relative grid gap-8 sm:grid-cols-3">
                            {/* Connector line */}
                            <div
                                className="absolute top-12 left-1/6 right-1/6 hidden h-px sm:block"
                                style={{ background: `linear-gradient(90deg, transparent, ${GOLD}40, transparent)` }}
                            />

                            {steps.map(({ num, title, body }) => (
                                <div key={num} className="text-center">
                                    <div
                                        className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl"
                                        style={{
                                            background: 'linear-gradient(145deg, rgba(194,148,63,0.12), rgba(194,148,63,0.04))',
                                            border: '1px solid rgba(194,148,63,0.25)',
                                        }}
                                    >
                                        <span className="text-3xl font-black" style={{ color: GOLD }}>{num}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white">{title}</h3>
                                    <p className="mt-3 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── ABOUT ── */}
                <section id="about" className="py-28" style={{ background: '#050505' }}>
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="mx-auto mb-16 max-w-3xl text-center">
                            <p className="text-xs font-bold uppercase tracking-[3px]" style={{ color: GOLD }}>About Us</p>
                            <h2 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
                                Redefining mobility
                                <br />
                                <span style={{ color: GOLD }}>in Zimbabwe.</span>
                            </h2>
                            <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                At LAXORA, we redefine mobility through elegance, precision and refined travel experiences.
                                We provide premium car rental solutions that blend luxury, comfort and reliability — ensuring
                                every journey is seamless, sophisticated and memorable. Committed to exceptional service and
                                uncompromising standards, we deliver a travel experience distinguished by comfort, prestige
                                and confidence.
                            </p>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                            {[
                                {
                                    label: 'Vision',
                                    text: 'To become the world\'s leading mobility brand, delivering luxury and first-class travel experiences defined by excellence, precision, trust and innovation — where every journey reflects comfort, reliability, elevated service standards and exceptional customer satisfaction.',
                                    pos: { top: true, right: true },
                                },
                                {
                                    label: 'Mission',
                                    text: 'To provide premium, dependable mobility through operational excellence and continuous improvement guided by customer needs — delivering safe, seamless and consistently superior travel experiences that embody the Laxora standard.',
                                    pos: { top: false, right: false },
                                },
                            ].map(({ label, text, pos }) => (
                                <div
                                    key={label}
                                    className="relative overflow-hidden rounded-3xl p-10"
                                    style={{ background: 'linear-gradient(135deg, #0f0c04, #0a0a0a, #080808)', border: '1px solid rgba(194,148,63,0.15)' }}
                                >
                                    <div
                                        className={`absolute ${pos.top ? '-top-10' : '-bottom-10'} ${pos.right ? '-right-10' : '-left-10'} h-48 w-48 rounded-full blur-3xl`}
                                        style={{ background: 'rgba(194,148,63,0.1)' }}
                                    />
                                    <div className="relative">
                                        <p className="text-[10px] font-bold uppercase tracking-[3px]" style={{ color: 'rgba(194,148,63,0.6)' }}>Our</p>
                                        <h3 className="mt-1 text-5xl font-black" style={{ color: GOLD }}>{label}</h3>
                                        <p className="mt-5 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CONTACT / BOOK ── */}
                <section id="contact" className="py-28" style={{ background: '#080808' }}>
                    <div className="mx-auto max-w-4xl px-6">
                        <div
                            className="relative overflow-hidden rounded-3xl p-12 text-center"
                            style={{ background: 'linear-gradient(135deg, #100d02, #0a0a0a)', border: '1px solid rgba(194,148,63,0.25)' }}
                        >
                            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl" style={{ background: 'rgba(194,148,63,0.08)' }} />
                            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full blur-3xl" style={{ background: 'rgba(194,148,63,0.05)' }} />

                            <div className="relative">
                                <div
                                    className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl"
                                    style={{ background: 'rgba(194,148,63,0.12)', border: '1px solid rgba(194,148,63,0.25)' }}
                                >
                                    <Car className="h-7 w-7" style={{ color: GOLD }} />
                                </div>

                                <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                                    Ready to hit the road?
                                </h2>
                                <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                    Contact us to check availability, discuss requirements, and get a quote — we'll have your vehicle ready and waiting.
                                </p>

                                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                                    <a
                                        href="tel:+26377000000"
                                        className="inline-flex items-center gap-3 rounded-xl px-7 py-4 text-sm font-bold text-black transition-all hover:scale-[1.02]"
                                        style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, boxShadow: `0 8px 30px rgba(194,148,63,0.25)` }}
                                    >
                                        <Phone className="h-4 w-4" /> Call to Book
                                    </a>
                                    <a
                                        href="https://wa.me/26377000000"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-3 rounded-xl border px-7 py-4 text-sm font-bold text-white transition-all hover:scale-[1.02]"
                                        style={{ borderColor: 'rgba(194,148,63,0.35)', background: 'rgba(194,148,63,0.06)' }}
                                    >
                                        WhatsApp Us <ArrowRight className="h-4 w-4" />
                                    </a>
                                </div>

                                <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                    <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" style={{ color: GOLD }} /> +263 77 000 0000</span>
                                    <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" style={{ color: GOLD }} /> hello@laxora.co.zw</span>
                                    <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" style={{ color: GOLD }} /> Harare, Zimbabwe</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── FOOTER ── */}
                <footer className="py-10" style={{ borderTop: '1px solid rgba(194,148,63,0.1)', background: DARK }}>
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
                            <div className="inline-block rounded-lg bg-white/90 px-3 py-1.5">
                                <img src="/logo.jpg" alt="Laxora Car Rental" className="h-8 w-auto object-contain" />
                            </div>

                            <nav className="flex flex-wrap items-center justify-center gap-6">
                                {['Our Fleet', 'Why Laxora', 'How It Works', 'About', 'Contact'].map((l, i) => (
                                    <a
                                        key={l}
                                        href={`#${['fleet', 'why-us', 'how-it-works', 'about', 'contact'][i]}`}
                                        className="text-xs transition-colors"
                                        style={{ color: 'rgba(255,255,255,0.35)' }}
                                        onMouseEnter={e => (e.currentTarget.style.color = GOLD_LIGHT)}
                                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
                                    >
                                        {l}
                                    </a>
                                ))}
                            </nav>

                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                                © {new Date().getFullYear()} Laxora Car Rental
                            </p>
                        </div>

                        <div className="mt-6 text-center text-[10px]" style={{ color: 'rgba(255,255,255,0.15)' }}>
                            Where every ride feels first class.
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
