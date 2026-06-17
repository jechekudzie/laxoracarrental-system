import { Head, Link, router, setLayoutProps, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    BadgeCheck,
    CalendarDays,
    Edit,
    FileBadge,
    IdCard,
    Image as ImageIcon,
    Languages,
    LifeBuoy,
    Mail,
    MapPin,
    Phone,
    ShieldAlert,
    ShieldCheck,
    Star,
    User,
    Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import * as Routes from '@/actions/App/Http/Controllers/Web/CustomerController';
import * as BookingRoutes from '@/actions/App/Http/Controllers/Web/BookingController';
import { dashboard } from '@/routes';

interface Rating {
    id: number;
    score_condition: number;
    score_timeliness: number;
    score_payment: number;
    score_communication: number;
    score_care: number;
    average: number;
    comment: string | null;
    created_at: string;
}

interface BookingSummary {
    id: number;
    reference: string;
    vehicle: string;
    reg_plate: string;
    status: string;
    pickup_datetime: string;
    return_datetime: string;
    total_amount: number;
}

interface CustomerDetail {
    id: number;
    name: string;
    id_number: string;
    dob: string | null;
    gender: string | null;
    phone: string;
    email: string | null;
    address: string | null;
    province: string | null;
    languages: string[] | null;
    profile_photo: string | null;
    licence_number: string;
    licence_class: string;
    licence_issued_date: string | null;
    licence_expiry: string;
    licence_front: string | null;
    licence_back: string | null;
    defensive_driving_cert: string | null;
    police_clearance_cert: string | null;
    national_id_front: string | null;
    national_id_back: string | null;
    selfie_holding_id: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    emergency_contact_relationship: string | null;
    status: string;
    blacklist_reason: string | null;
    ratings_count: number;
    average_rating: number | null;
    wallet_balance: number;
    wallet_currency: string;
    notes: string | null;
    created_at: string;
    ratings: Rating[];
    bookings: BookingSummary[];
}

const STATUS_STYLES: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    greylisted: 'bg-yellow-100 text-yellow-800',
    blacklisted: 'bg-red-100 text-red-800',
    suspended: 'bg-gray-100 text-gray-600',
};

const BOOKING_STATUS_STYLES: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-800',
};

function fmtDate(d: string | null | undefined) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ageFromDob(dob: string | null): number | null {
    if (!dob) return null;
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
}

function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
    return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
}

function Field({ icon: Icon, label, value }: { icon?: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
    return (
        <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {Icon ? <Icon className="h-3 w-3" /> : null}
                {label}
            </div>
            <div className="text-sm font-medium text-foreground">{value || <span className="text-muted-foreground">—</span>}</div>
        </div>
    );
}

function DocCard({ label, url, onOpen }: { label: string; url: string | null; onOpen: (url: string, label: string) => void }) {
    if (!url) {
        return (
            <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed bg-muted/30 px-3 py-6 text-center">
                <ImageIcon className="h-5 w-5 text-muted-foreground/60" />
                <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
                <div className="text-[10px] text-muted-foreground/70">Not uploaded</div>
            </div>
        );
    }
    return (
        <button
            type="button"
            onClick={() => onOpen(url, label)}
            className="group relative overflow-hidden rounded-lg border bg-muted/30 text-left transition hover:ring-2 hover:ring-primary/40"
        >
            <img src={url} alt={label} className="block h-32 w-full object-cover" />
            <div className="flex items-center justify-between gap-2 border-t bg-card px-3 py-1.5">
                <span className="truncate text-[11px] font-medium">{label}</span>
                <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-green-600" />
            </div>
        </button>
    );
}

function ImageLightbox({ url, label, onClose }: { url: string; label: string; onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
            onClick={onClose}
            role="button"
            tabIndex={0}
        >
            <div className="max-h-full max-w-4xl space-y-3" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between text-white">
                    <h3 className="text-sm font-medium">{label}</h3>
                    <button type="button" className="rounded px-2 py-1 text-sm hover:bg-white/10" onClick={onClose}>
                        Close
                    </button>
                </div>
                <img src={url} alt={label} className="max-h-[80vh] w-auto rounded-lg" />
            </div>
        </div>
    );
}

function StarRow({ score, label }: { score: number; label: string }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={`h-3.5 w-3.5 ${n <= score ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
                ))}
                <span className="ml-1 font-medium">{score}</span>
            </span>
        </div>
    );
}

function BlacklistDialog({ customer }: { customer: CustomerDetail }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({ reason: '' });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(Routes.blacklist.url({ customer: customer.id }), {
            onSuccess: () => {
                setOpen(false);
                reset();
            },
        });
    }

    if (!open) {
        return (
            <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
                <ShieldAlert className="mr-2 h-4 w-4" /> Blacklist
            </Button>
        );
    }

    return (
        <form onSubmit={submit} className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Reason for blacklisting</Label>
            <Input value={data.reason} onChange={(e) => setData('reason', e.target.value)} placeholder="e.g. Non-payment, vehicle damage" />
            <InputError message={errors.reason} />
            <div className="flex gap-2">
                <Button type="submit" variant="destructive" size="sm" disabled={processing}>
                    Confirm Blacklist
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}

export default function CustomerShow({ customer }: { customer: CustomerDetail }) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Customers', href: Routes.index.url() },
            { title: customer.name, href: Routes.show.url({ customer: customer.id }) },
        ],
    });

    const [lightbox, setLightbox] = useState<{ url: string; label: string } | null>(null);

    function reinstate() {
        if (confirm('Reinstate this customer to Active status?')) {
            router.post(Routes.reinstate.url({ customer: customer.id }));
        }
    }

    const age = ageFromDob(customer.dob);

    // Licence eligibility — mirrors the 3-month rule we enforce on register.
    let licenceEligible: boolean | null = null;
    let issuedMonthsAgo: number | null = null;
    if (customer.licence_issued_date) {
        const issued = new Date(customer.licence_issued_date);
        const now = new Date();
        issuedMonthsAgo = Math.floor((now.getTime() - issued.getTime()) / (1000 * 60 * 60 * 24 * 30));
        licenceEligible = issuedMonthsAgo >= 3;
    }

    const licenceExpiryDate = customer.licence_expiry ? new Date(customer.licence_expiry) : null;
    const licenceExpired = licenceExpiryDate ? licenceExpiryDate.getTime() < Date.now() : false;
    const licenceExpiringSoon = licenceExpiryDate
        ? !licenceExpired && licenceExpiryDate.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000
        : false;

    const complianceDocs: { label: string; url: string | null }[] = [
        { label: 'National ID — Front', url: customer.national_id_front },
        { label: 'National ID — Back', url: customer.national_id_back },
        { label: 'Selfie holding ID', url: customer.selfie_holding_id },
        { label: 'Police Clearance', url: customer.police_clearance_cert },
        { label: 'Defensive Driving', url: customer.defensive_driving_cert },
    ];

    return (
        <>
            <Head title={customer.name} />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Hero header */}
                <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border bg-gradient-to-br from-primary/5 to-transparent p-5">
                    <div className="flex items-center gap-4">
                        {customer.profile_photo ? (
                            <img
                                src={customer.profile_photo}
                                alt={customer.name}
                                className="h-20 w-20 cursor-pointer rounded-full object-cover ring-2 ring-primary/20"
                                onClick={() => setLightbox({ url: customer.profile_photo!, label: customer.name })}
                            />
                        ) : (
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                                {initials(customer.name)}
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold">{customer.name}</h1>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                    <Phone className="h-3.5 w-3.5" />
                                    {customer.phone}
                                </span>
                                {customer.email ? (
                                    <span className="inline-flex items-center gap-1">
                                        <Mail className="h-3.5 w-3.5" />
                                        {customer.email}
                                    </span>
                                ) : null}
                                {customer.province ? (
                                    <span className="inline-flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {customer.province}
                                    </span>
                                ) : null}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[customer.status] ?? ''}`}>
                                    {customer.status}
                                </span>
                                {licenceEligible === false ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                                        <AlertTriangle className="h-3 w-3" /> Licence under 3 months
                                    </span>
                                ) : null}
                                {licenceExpired ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                        <AlertTriangle className="h-3 w-3" /> Licence expired
                                    </span>
                                ) : null}
                                {licenceExpiringSoon ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                                        Licence expiring soon
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                            <Link href={Routes.edit.url({ customer: customer.id })}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                        {customer.status !== 'blacklisted' && <BlacklistDialog customer={customer} />}
                        {(customer.status === 'blacklisted' || customer.status === 'greylisted') && (
                            <Button variant="outline" size="sm" onClick={reinstate}>
                                <ShieldCheck className="mr-2 h-4 w-4" /> Reinstate
                            </Button>
                        )}
                    </div>
                </div>

                {customer.blacklist_reason && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400">
                        <strong>Blacklist reason:</strong> {customer.blacklist_reason}
                    </div>
                )}

                {/* Personal + Wallet */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader className="border-b py-4">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <User className="h-4 w-4 text-muted-foreground" /> Personal Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-x-6 gap-y-4 p-5 sm:grid-cols-2">
                            <Field icon={IdCard} label="National ID" value={<span className="font-mono">{customer.id_number}</span>} />
                            <Field
                                icon={CalendarDays}
                                label="Date of Birth"
                                value={customer.dob ? `${fmtDate(customer.dob)}${age !== null ? ` · ${age} yrs` : ''}` : '—'}
                            />
                            <Field icon={User} label="Gender" value={customer.gender} />
                            <Field icon={MapPin} label="Address" value={customer.address} />
                            <Field icon={MapPin} label="Province" value={customer.province} />
                            <Field
                                icon={Languages}
                                label="Languages"
                                value={
                                    customer.languages && customer.languages.length ? (
                                        <div className="flex flex-wrap gap-1">
                                            {customer.languages.map((l) => (
                                                <span key={l} className="rounded-full border bg-muted/40 px-2 py-0.5 text-[11px]">
                                                    {l}
                                                </span>
                                            ))}
                                        </div>
                                    ) : null
                                }
                            />
                            <Field icon={CalendarDays} label="Member Since" value={fmtDate(customer.created_at)} />
                            {customer.notes ? (
                                <div className="sm:col-span-2">
                                    <Field label="Notes" value={<span className="whitespace-pre-line">{customer.notes}</span>} />
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>

                    {/* Rating + Wallet */}
                    <div className="flex flex-col gap-6">
                        <Card>
                            <CardHeader className="border-b py-4">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Wallet className="h-4 w-4 text-muted-foreground" /> Wallet
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5">
                                <div className="text-2xl font-bold">
                                    {customer.wallet_currency} {customer.wallet_balance.toFixed(2)}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">Pre-paid balance available against bookings.</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="border-b py-4">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Star className="h-4 w-4 text-muted-foreground" /> Customer Rating
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5">
                                {customer.ratings_count === 0 ? (
                                    <p className="text-sm text-muted-foreground">No ratings yet.</p>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 border-b pb-2">
                                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                            <span className="text-2xl font-bold">{customer.average_rating?.toFixed(2)}</span>
                                            <span className="text-sm text-muted-foreground">
                                                / 5 from {customer.ratings_count} rating{customer.ratings_count !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        {customer.ratings.slice(0, 1).map((r) => (
                                            <div key={r.id} className="space-y-2">
                                                <StarRow score={r.score_condition} label="Vehicle condition" />
                                                <StarRow score={r.score_timeliness} label="Timeliness" />
                                                <StarRow score={r.score_payment} label="Payment" />
                                                <StarRow score={r.score_communication} label="Communication" />
                                                <StarRow score={r.score_care} label="Care" />
                                                {r.comment && <p className="mt-2 text-xs italic text-muted-foreground">"{r.comment}"</p>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Driver's licence */}
                <Card>
                    <CardHeader className="border-b py-4">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <IdCard className="h-4 w-4 text-muted-foreground" /> Driver&rsquo;s Licence
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-x-6 gap-y-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
                        <Field label="Licence Number" value={<span className="font-mono">{customer.licence_number}</span>} />
                        <Field label="Class" value={customer.licence_class ? `Class ${customer.licence_class}` : null} />
                        <Field
                            label="Issued"
                            value={
                                customer.licence_issued_date ? (
                                    <span>
                                        {fmtDate(customer.licence_issued_date)}
                                        {issuedMonthsAgo !== null ? (
                                            <span className="ml-1 text-xs text-muted-foreground">({issuedMonthsAgo} mo ago)</span>
                                        ) : null}
                                    </span>
                                ) : null
                            }
                        />
                        <Field
                            label="Expires"
                            value={
                                customer.licence_expiry ? (
                                    <span className={licenceExpired ? 'text-red-600' : licenceExpiringSoon ? 'text-yellow-700' : ''}>
                                        {fmtDate(customer.licence_expiry)}
                                    </span>
                                ) : null
                            }
                        />
                        <div className="sm:col-span-2 lg:col-span-4">
                            <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Licence photos</div>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <DocCard label="Front" url={customer.licence_front} onOpen={(u, l) => setLightbox({ url: u, label: l })} />
                                <DocCard label="Back" url={customer.licence_back} onOpen={(u, l) => setLightbox({ url: u, label: l })} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Compliance documents */}
                <Card>
                    <CardHeader className="border-b py-4">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileBadge className="h-4 w-4 text-muted-foreground" /> Identity &amp; Compliance Documents
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                            {complianceDocs.map((d) => (
                                <DocCard key={d.label} label={d.label} url={d.url} onOpen={(u, l) => setLightbox({ url: u, label: l })} />
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Emergency contact */}
                <Card>
                    <CardHeader className="border-b py-4">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <LifeBuoy className="h-4 w-4 text-muted-foreground" /> Emergency Contact
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-x-6 gap-y-4 p-5 sm:grid-cols-3">
                        <Field label="Name" value={customer.emergency_contact_name} />
                        <Field label="Phone" value={customer.emergency_contact_phone} />
                        <Field label="Relationship" value={customer.emergency_contact_relationship} />
                    </CardContent>
                </Card>

                {/* Booking history */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between border-b py-4">
                        <CardTitle className="text-base">Booking History</CardTitle>
                        <span className="text-xs text-muted-foreground">
                            {customer.bookings.length} booking{customer.bookings.length === 1 ? '' : 's'}
                        </span>
                    </CardHeader>
                    <CardContent className="p-0">
                        {customer.bookings.length === 0 ? (
                            <p className="p-6 text-center text-sm text-muted-foreground">No bookings yet.</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        <th className="px-4 py-3">Reference</th>
                                        <th className="px-4 py-3">Vehicle</th>
                                        <th className="px-4 py-3">Pickup</th>
                                        <th className="px-4 py-3">Return</th>
                                        <th className="px-4 py-3">Amount</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {customer.bookings.map((b) => (
                                        <tr key={b.id} className="transition-colors hover:bg-muted/30">
                                            <td className="px-4 py-3 font-mono">
                                                <Link href={BookingRoutes.show.url({ booking: b.id })} className="text-primary hover:underline">
                                                    {b.reference}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">
                                                {b.vehicle} <span className="text-xs text-muted-foreground">({b.reg_plate})</span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">{fmtDate(b.pickup_datetime)}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{fmtDate(b.return_datetime)}</td>
                                            <td className="px-4 py-3 font-medium">${b.total_amount.toFixed(2)}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${BOOKING_STATUS_STYLES[b.status] ?? ''}`}>
                                                    {b.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>
            </div>

            {lightbox ? <ImageLightbox url={lightbox.url} label={lightbox.label} onClose={() => setLightbox(null)} /> : null}
        </>
    );
}
