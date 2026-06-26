import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    ArrowRight,
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
const TAGLINE = 'Where every ride feels first class.';

// ── Fleet data ─────────────────────────────────────────────────────────────
const fleet = [
    { name: 'Toyota Hilux', variant: 'Double Cab · Silver', seats: 5, category: 'SUV / 4×4', popular: true, tags: ['Off-road', 'Rugged'] },
    { name: 'Toyota Hilux Rocco', variant: 'Double Cab · Sport', seats: 5, category: 'SUV / 4×4', popular: false, tags: ['Sport', 'Style'] },
    { name: 'Toyota Fortuner', variant: 'SUV', seats: 7, category: 'Family SUV', popular: true, tags: ['Spacious', 'Premium'] },
    { name: 'Toyota Coaster', variant: 'Mini Bus', seats: 25, category: 'Mini Coach', popular: false, tags: ['Group', 'Corporate'] },
    { name: 'Nissan Bus', variant: 'Coach', seats: 70, category: 'Coach', popular: false, tags: ['Events', 'Long Distance'] },
    { name: 'Honda HR-V', variant: 'Hybrid', seats: 5, category: 'Eco Hybrid', popular: false, tags: ['Eco-friendly', 'Efficient'] },
];

const benefits = [
    { icon: Shield, title: 'Fully Insured Fleet', body: 'Every vehicle is comprehensively insured and maintained to the highest safety standards.' },
    { icon: Star, title: 'Premium Experience', body: 'Meticulous attention to cleanliness, comfort, and presentation — nothing less.' },
    { icon: Clock, title: 'Flexible Rentals', body: 'Hours to weeks — we tailor every booking to your schedule and requirements.' },
    { icon: Users, title: 'Professional Service', body: 'Our trained team supports you from first enquiry to the moment you return the keys.' },
];

const steps = [
    { num: '01', title: 'Choose Your Vehicle', body: 'Browse our premium fleet and select the car that fits your journey — solo, family, or group.' },
    { num: '02', title: 'Confirm Your Booking', body: 'Call or WhatsApp us. We\'ll handle the paperwork and have your vehicle ready.' },
    { num: '03', title: 'Drive With Confidence', body: 'Pick up your fully serviced vehicle and enjoy the road — with Laxora\'s support every mile.' },
];

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
        const blink = setInterval(() => setShowCursor(c => !c), 530);
        return () => clearInterval(blink);
    }, [done]);

    return (
        <span>
            {displayed}
            <span
                className="ml-0.5 inline-block w-[2px] rounded-sm align-middle"
                style={{ height: '0.8em', background: GOLD_LIGHT, opacity: showCursor ? 1 : 0, transition: 'opacity 0.1s' }}
            />
        </span>
    );
}

// ── Car SVG ────────────────────────────────────────────────────────────────
function CarSilhouette({ dark = true }: { dark?: boolean }) {
    const stroke = dark ? GOLD : DARK;
    const fill = dark ? GOLD : DARK;
    return (
        <svg viewBox="0 0 480 180" xmlns="http://www.w3.org/2000/svg" aria-hidden className="w-full">
            <ellipse cx="240" cy="160" rx="220" ry="10" fill={fill} fillOpacity={dark ? 0.06 : 0.04} />
            <path d="M 38 130 L 38 96 Q 52 58 100 48 L 158 32 Q 210 20 270 22 L 320 26 Q 370 36 400 70 L 420 95 L 440 130 Z"
                fill={fill} fillOpacity={dark ? 0.08 : 0.06} stroke={stroke} strokeWidth="1.5" strokeOpacity={dark ? 0.5 : 0.35} />
            <path d="M 105 48 L 140 26 Q 185 14 240 14 L 300 16 Q 348 20 372 40 L 395 60"
                fill="none" stroke={stroke} strokeWidth="1" strokeOpacity={dark ? 0.35 : 0.25} />
            <path d="M 238 16 L 232 48" stroke={stroke} strokeWidth="0.8" strokeOpacity="0.2" />
            <path d="M 175 24 L 168 92" stroke={stroke} strokeWidth="0.8" strokeOpacity="0.15" />
            <path d="M 76 130 Q 76 96 110 96 Q 144 96 144 130" fill={fill} fillOpacity="0.06" stroke={stroke} strokeWidth="1" strokeOpacity="0.3" />
            <circle cx="110" cy="132" r="26" fill={fill} fillOpacity={dark ? 0.07 : 0.05} stroke={stroke} strokeWidth="1.5" strokeOpacity="0.4" />
            <circle cx="110" cy="132" r="14" fill={fill} fillOpacity="0.05" stroke={stroke} strokeWidth="1" strokeOpacity="0.25" />
            <circle cx="110" cy="132" r="4" fill={fill} fillOpacity="0.3" />
            <path d="M 348 130 Q 348 96 382 96 Q 416 96 416 130" fill={fill} fillOpacity="0.06" stroke={stroke} strokeWidth="1" strokeOpacity="0.3" />
            <circle cx="382" cy="132" r="26" fill={fill} fillOpacity={dark ? 0.07 : 0.05} stroke={stroke} strokeWidth="1.5" strokeOpacity="0.4" />
            <circle cx="382" cy="132" r="14" fill={fill} fillOpacity="0.05" stroke={stroke} strokeWidth="1" strokeOpacity="0.25" />
            <circle cx="382" cy="132" r="4" fill={fill} fillOpacity="0.3" />
            <rect x="420" y="98" width="16" height="8" rx="2" fill={fill} fillOpacity="0.5" />
            <path d="M 436 102 L 460 95" stroke={stroke} strokeWidth="1" strokeOpacity="0.3" />
            <rect x="38" y="98" width="14" height="8" rx="2" fill={fill} fillOpacity="0.3" />
        </svg>
    );
}

// ── Scroll-aware nav ───────────────────────────────────────────────────────
function useScrolled(threshold = 60) {
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > threshold);
        window.addEventListener('scroll', fn, { passive: true });
        return () => window.removeEventListener('scroll', fn);
    }, [threshold]);
    return scrolled;
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function Welcome() {
    const { auth } = usePage<{ auth: { user: unknown } }>().props;
    const scrolled = useScrolled();

    return (
        <>
            <Head title="Laxora Car Rental — Premium Car Hire Zimbabwe">
                <meta name="description" content="Laxora Car Rental offers premium SUVs, minibuses, and coaches for hire in Zimbabwe. Where every ride feels first class." />
            </Head>

            <div className="min-h-screen">

                {/* ══ NAV ══════════════════════════════════════════════════ */}
                <header
                    className="fixed top-0 z-50 w-full transition-all duration-300"
                    style={{
                        background: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
                        backdropFilter: scrolled ? 'blur(12px)' : 'none',
                        borderBottom: scrolled ? '1px solid #e5e7eb' : '1px solid transparent',
                        boxShadow: scrolled ? '0 1px 12px rgba(0,0,0,0.08)' : 'none',
                    }}
                >
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                        <a href="#">
                            <div className={`inline-block rounded-lg px-3 py-1.5 transition-colors ${scrolled ? 'bg-white' : 'bg-white/90'}`}>
                                <img src="/logo.jpg" alt="Laxora Car Rental" className="h-9 w-auto object-contain" />
                            </div>
                        </a>

                        <nav className="hidden items-center gap-7 md:flex">
                            {[
                                ['#fleet', 'Our Fleet'],
                                ['#why-us', 'Why Laxora'],
                                ['#how-it-works', 'How It Works'],
                                ['#about', 'About'],
                                ['#contact', 'Contact'],
                            ].map(([href, label]) => (
                                <a
                                    key={href} href={href}
                                    className="text-sm font-medium transition-colors"
                                    style={{ color: scrolled ? '#374151' : 'rgba(255,255,255,0.75)' }}
                                    onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
                                    onMouseLeave={e => (e.currentTarget.style.color = scrolled ? '#374151' : 'rgba(255,255,255,0.75)')}
                                >
                                    {label}
                                </a>
                            ))}
                        </nav>

                        <Link
                            href={auth.user ? dashboard() : login()}
                            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-black transition-all hover:opacity-90 hover:shadow-lg"
                            style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})` }}
                        >
                            {auth.user ? 'Dashboard' : 'Book Now'} <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </header>

                {/* ══ HERO — dark ══════════════════════════════════════════ */}
                <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden pt-16"
                    style={{ background: 'linear-gradient(160deg, #0a0a0a 0%, #130e01 55%, #0a0a0a 100%)' }}>

                    {/* Grid overlay */}
                    <div className="absolute inset-0 opacity-[0.04]"
                        style={{ backgroundImage: `linear-gradient(rgba(194,148,63,1) 1px, transparent 1px), linear-gradient(90deg, rgba(194,148,63,1) 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />

                    {/* Glow orbs */}
                    <div className="absolute top-24 right-1/3 h-80 w-80 rounded-full blur-3xl" style={{ background: 'rgba(194,148,63,0.1)' }} />
                    <div className="absolute bottom-32 left-1/4 h-64 w-64 rounded-full blur-3xl" style={{ background: 'rgba(194,148,63,0.06)' }} />

                    <div className="relative z-10 mx-auto max-w-7xl px-6 text-center">
                        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-[3px]"
                            style={{ borderColor: 'rgba(194,148,63,0.4)', background: 'rgba(194,148,63,0.08)', color: GOLD_LIGHT }}>
                            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: GOLD }} />
                            Premium Car Rental · Zimbabwe
                        </div>

                        <h1 className="mx-auto max-w-4xl text-6xl font-black leading-[1.05] tracking-tight text-white sm:text-7xl lg:text-8xl">
                            Luxury On<br />
                            <span style={{ color: GOLD }}>Every Road.</span>
                        </h1>

                        <p className="mx-auto mt-5 text-lg font-medium sm:text-xl" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            <TypewriterText />
                        </p>

                        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                            <a href="#fleet"
                                className="inline-flex items-center gap-2.5 rounded-xl px-8 py-4 text-sm font-bold text-black transition-all hover:scale-[1.02] hover:shadow-2xl"
                                style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, boxShadow: `0 8px 40px rgba(194,148,63,0.3)` }}>
                                View Our Fleet <ArrowRight className="h-4 w-4" />
                            </a>
                            <a href="#contact"
                                className="inline-flex items-center gap-2.5 rounded-xl border px-8 py-4 text-sm font-bold text-white transition-all hover:scale-[1.02]"
                                style={{ borderColor: 'rgba(194,148,63,0.4)', background: 'rgba(194,148,63,0.06)' }}>
                                Book a Vehicle <Phone className="h-4 w-4" />
                            </a>
                        </div>

                        {/* Car SVG */}
                        <div className="mx-auto mt-14 max-w-3xl">
                            <CarSilhouette dark />
                        </div>

                        {/* Stats */}
                        <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
                            {[
                                { value: '8+', label: 'Premium Vehicles' },
                                { value: '4×4', label: 'Off-Road Ready' },
                                { value: '70', label: 'Seat Capacity' },
                                { value: '24/7', label: 'Support' },
                            ].map(s => (
                                <div key={s.label} className="rounded-xl p-4 text-center"
                                    style={{ background: 'rgba(194,148,63,0.06)', border: '1px solid rgba(194,148,63,0.12)' }}>
                                    <p className="text-2xl font-extrabold" style={{ color: GOLD }}>{s.value}</p>
                                    <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/40">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Scroll cue */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                        <div className="h-10 w-6 rounded-full border" style={{ borderColor: 'rgba(194,148,63,0.3)' }}>
                            <div className="mx-auto mt-2 h-2 w-1 rounded-full" style={{ background: GOLD }} />
                        </div>
                    </div>
                </section>

                {/* ══ FLEET — light ════════════════════════════════════════ */}
                <section id="fleet" className="bg-white py-28">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="mb-14 text-center">
                            <span className="text-xs font-bold uppercase tracking-[3px]" style={{ color: GOLD }}>Our Fleet</span>
                            <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                                Drive the best.
                            </h2>
                            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-gray-500">
                                From rugged 4×4s to executive coaches — our premium fleet is maintained to the highest standards and ready when you are.
                            </p>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {fleet.map(v => (
                                <div key={v.name + v.variant}
                                    className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                                    style={{ borderTopColor: v.popular ? GOLD : undefined, borderTopWidth: v.popular ? 3 : undefined }}>

                                    {v.popular && (
                                        <span className="absolute right-4 top-4 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-black"
                                            style={{ background: GOLD }}>Popular</span>
                                    )}

                                    {/* Car image area — light-themed */}
                                    <div className="flex items-center justify-center bg-gray-50 px-6 pt-8 pb-2">
                                        <CarSilhouette dark={false} />
                                    </div>

                                    <div className="p-6 pt-4">
                                        <span className="text-[10px] font-bold uppercase tracking-[2px]" style={{ color: GOLD }}>{v.category}</span>
                                        <h3 className="mt-1 text-xl font-extrabold text-gray-900">{v.name}</h3>
                                        <p className="text-sm text-gray-400">{v.variant}</p>

                                        <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
                                            <Users className="h-3.5 w-3.5" style={{ color: GOLD }} />
                                            <span>{v.seats} seats</span>
                                        </div>

                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {v.tags.map(t => (
                                                <span key={t} className="rounded-md px-2 py-0.5 text-[10px] font-semibold"
                                                    style={{ background: 'rgba(194,148,63,0.08)', color: GOLD, border: '1px solid rgba(194,148,63,0.2)' }}>
                                                    {t}
                                                </span>
                                            ))}
                                        </div>

                                        <a href="#contact"
                                            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-bold transition-all duration-200"
                                            style={{ borderColor: GOLD, color: GOLD }}
                                            onMouseEnter={e => { e.currentTarget.style.background = GOLD; e.currentTarget.style.color = '#000'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = GOLD; }}>
                                            Enquire <ArrowRight className="h-3.5 w-3.5" />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══ WHY LAXORA — dark ════════════════════════════════════ */}
                <section id="why-us" className="py-28" style={{ background: DARK }}>
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="mb-14 text-center">
                            <span className="text-xs font-bold uppercase tracking-[3px]" style={{ color: GOLD }}>Why Laxora</span>
                            <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">The Laxora difference.</h2>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {benefits.map(({ icon: Icon, title, body }) => (
                                <div key={title}
                                    className="group rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1"
                                    style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)' }}
                                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(194,148,63,0.35)')}
                                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}>
                                    <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl"
                                        style={{ background: 'rgba(194,148,63,0.1)', border: '1px solid rgba(194,148,63,0.2)' }}>
                                        <Icon className="h-5 w-5" style={{ color: GOLD }} />
                                    </div>
                                    <h3 className="text-base font-bold text-white">{title}</h3>
                                    <p className="mt-3 text-sm leading-relaxed text-white/40">{body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══ HOW IT WORKS — light ═════════════════════════════════ */}
                <section id="how-it-works" className="bg-stone-50 py-28">
                    <div className="mx-auto max-w-5xl px-6">
                        <div className="mb-14 text-center">
                            <span className="text-xs font-bold uppercase tracking-[3px]" style={{ color: GOLD }}>How It Works</span>
                            <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                                Three steps to the road.
                            </h2>
                        </div>

                        <div className="grid gap-8 sm:grid-cols-3">
                            {steps.map(({ num, title, body }) => (
                                <div key={num} className="text-center">
                                    <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl"
                                        style={{ background: 'linear-gradient(135deg, rgba(194,148,63,0.12), rgba(194,148,63,0.04))', border: `1px solid rgba(194,148,63,0.3)` }}>
                                        <span className="text-3xl font-black" style={{ color: GOLD }}>{num}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                                    <p className="mt-3 text-sm leading-relaxed text-gray-500">{body}</p>
                                </div>
                            ))}
                        </div>

                        {/* Connector line (decorative) */}
                        <div className="relative mt-4 hidden sm:block">
                            <div className="mx-auto mt-2 h-px max-w-sm" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}40, transparent)` }} />
                        </div>
                    </div>
                </section>

                {/* ══ ABOUT — dark ═════════════════════════════════════════ */}
                <section id="about" className="py-28" style={{ background: '#080808' }}>
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="mx-auto mb-14 max-w-3xl text-center">
                            <span className="text-xs font-bold uppercase tracking-[3px]" style={{ color: GOLD }}>About Us</span>
                            <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                                Redefining mobility<br />
                                <span style={{ color: GOLD }}>in Zimbabwe.</span>
                            </h2>
                            <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-white/50">
                                At LAXORA, we redefine mobility through elegance, precision and refined travel experiences.
                                We provide premium car rental solutions that blend luxury, comfort and reliability — ensuring
                                every journey is seamless, sophisticated and memorable. Committed to exceptional service and
                                uncompromising standards, we deliver a travel experience distinguished by comfort, prestige
                                and confidence.
                            </p>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                            {[
                                { label: 'Vision', text: 'To become the world\'s leading mobility brand, delivering luxury and first-class travel experiences defined by excellence, precision, trust and innovation — where every journey reflects comfort, reliability, elevated service standards and exceptional customer satisfaction.' },
                                { label: 'Mission', text: 'To provide premium, dependable mobility through operational excellence and continuous improvement guided by customer needs — delivering safe, seamless and consistently superior travel experiences that embody the Laxora standard.' },
                            ].map(({ label, text }) => (
                                <div key={label} className="relative overflow-hidden rounded-3xl p-10"
                                    style={{ background: 'linear-gradient(135deg, #110d02, #0a0a0a)', border: '1px solid rgba(194,148,63,0.15)' }}>
                                    <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full blur-3xl" style={{ background: 'rgba(194,148,63,0.08)' }} />
                                    <div className="relative">
                                        <p className="text-[10px] font-bold uppercase tracking-[3px] text-white/30">Our</p>
                                        <h3 className="mt-1 text-5xl font-black" style={{ color: GOLD }}>{label}</h3>
                                        <p className="mt-5 text-sm leading-relaxed text-white/60">{text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══ CONTACT — light ══════════════════════════════════════ */}
                <section id="contact" className="bg-white py-28">
                    <div className="mx-auto max-w-4xl px-6">
                        {/* Header */}
                        <div className="mb-12 text-center">
                            <span className="text-xs font-bold uppercase tracking-[3px]" style={{ color: GOLD }}>Get In Touch</span>
                            <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                                Ready to hit the road?
                            </h2>
                            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-gray-500">
                                Contact us to check availability, discuss your requirements, and get a quote.
                                We'll have your vehicle ready and waiting.
                            </p>
                        </div>

                        {/* Contact card */}
                        <div className="overflow-hidden rounded-3xl border border-gray-100 shadow-xl">
                            {/* Gold top bar */}
                            <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})` }} />

                            <div className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                                {[
                                    { icon: Phone, label: 'Call Us', value: '+263 77 000 0000', href: 'tel:+26377000000', cta: 'Call Now' },
                                    { icon: Mail, label: 'Email Us', value: 'hello@laxora.co.zw', href: 'mailto:hello@laxora.co.zw', cta: 'Send Email' },
                                    { icon: MapPin, label: 'Find Us', value: 'Harare, Zimbabwe', href: '#', cta: 'Get Directions' },
                                ].map(({ icon: Icon, label, value, href, cta }) => (
                                    <div key={label} className="flex flex-col items-center p-8 text-center">
                                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                                            style={{ background: 'rgba(194,148,63,0.08)', border: '1px solid rgba(194,148,63,0.2)' }}>
                                            <Icon className="h-5 w-5" style={{ color: GOLD }} />
                                        </div>
                                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
                                        <p className="mt-1 font-bold text-gray-900">{value}</p>
                                        <a href={href}
                                            className="mt-4 rounded-lg px-5 py-2 text-sm font-bold transition-all hover:opacity-90"
                                            style={{ background: GOLD, color: '#000' }}>
                                            {cta}
                                        </a>
                                    </div>
                                ))}
                            </div>

                            {/* WhatsApp CTA */}
                            <div className="border-t bg-gray-50 px-8 py-5 text-center">
                                <p className="text-sm text-gray-500">
                                    Prefer WhatsApp?{' '}
                                    <a href="https://wa.me/26377000000" target="_blank" rel="noopener noreferrer"
                                        className="font-bold" style={{ color: GOLD }}>
                                        Message us directly →
                                    </a>
                                </p>
                            </div>
                        </div>

                        {/* Guarantee badges */}
                        <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
                            {['Insured Fleet', 'Professional Service', 'Flexible Bookings'].map(t => (
                                <div key={t} className="flex items-center gap-2 text-sm text-gray-500">
                                    <CheckCircle className="h-4 w-4" style={{ color: GOLD }} />
                                    {t}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══ FOOTER — dark ════════════════════════════════════════ */}
                <footer className="py-10" style={{ background: DARK, borderTop: '1px solid rgba(194,148,63,0.1)' }}>
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
                            <div className="inline-block rounded-lg bg-white/90 px-3 py-1.5">
                                <img src="/logo.jpg" alt="Laxora Car Rental" className="h-8 w-auto object-contain" />
                            </div>

                            <nav className="flex flex-wrap justify-center gap-6">
                                {[['#fleet', 'Fleet'], ['#why-us', 'Why Laxora'], ['#how-it-works', 'How It Works'], ['#about', 'About'], ['#contact', 'Contact']].map(([href, label]) => (
                                    <a key={href} href={href}
                                        className="text-xs text-white/30 transition-colors hover:text-white/70">
                                        {label}
                                    </a>
                                ))}
                            </nav>

                            <p className="text-xs text-white/25">© {new Date().getFullYear()} Laxora Car Rental</p>
                        </div>
                        <p className="mt-6 text-center text-[10px] text-white/15">Where every ride feels first class.</p>
                    </div>
                </footer>

            </div>
        </>
    );
}
