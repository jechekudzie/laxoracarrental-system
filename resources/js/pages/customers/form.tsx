import { Head, Link, setLayoutProps, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    CircleDashed,
    FileBadge,
    IdCard,
    LifeBuoy,
    StickyNote,
    User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import InputError from '@/components/input-error';
import { ImageUploadField } from '@/components/image-upload-field';
import * as Routes from '@/actions/App/Http/Controllers/Web/CustomerController';
import { dashboard } from '@/routes';

interface Customer {
    id?: number;
    name?: string;
    id_number?: string;
    dob?: string | null;
    gender?: string | null;
    phone?: string;
    email?: string;
    address?: string;
    province?: string | null;
    languages?: string[] | null;
    profile_photo?: string | null;
    licence_number?: string;
    licence_class?: string;
    licence_issued_date?: string | null;
    licence_expiry?: string;
    licence_front?: string | null;
    licence_back?: string | null;
    defensive_driving_cert?: string | null;
    police_clearance_cert?: string | null;
    national_id_front?: string | null;
    national_id_back?: string | null;
    selfie_holding_id?: string | null;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relationship?: string | null;
    notes?: string;
}

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const PROVINCES = [
    'Harare',
    'Bulawayo',
    'Manicaland',
    'Mashonaland Central',
    'Mashonaland East',
    'Mashonaland West',
    'Masvingo',
    'Matabeleland North',
    'Matabeleland South',
    'Midlands',
];
const LANGUAGES = ['English', 'Shona', 'Ndebele', 'Kalanga', 'Tonga', 'Venda', 'Nambya'];
const LICENCE_CLASSES = ['1', '2', '3', '4', '5'];

function FormSection({
    icon: Icon,
    title,
    description,
    children,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="space-y-1 border-b bg-muted/30 py-4">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {title}
                </CardTitle>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </CardHeader>
            <CardContent className="grid gap-4 p-6 sm:grid-cols-2">{children}</CardContent>
        </Card>
    );
}

function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
    return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
}

function daysUntil(date: string | null | undefined): number | null {
    if (!date) return null;
    const diff = new Date(date).getTime() - Date.now();
    return Math.ceil(diff / 86_400_000);
}

export default function CustomerForm({ customer }: { customer: Customer | null }) {
    const isEdit = customer?.id != null;

    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Customers', href: Routes.index.url() },
            { title: isEdit ? 'Edit' : 'New Customer', href: '#' },
        ],
    });

    const { data, setData, post, put, processing, errors } = useForm({
        // Basics
        name: customer?.name ?? '',
        id_number: customer?.id_number ?? '',
        dob: customer?.dob ? customer.dob.slice(0, 10) : '',
        gender: customer?.gender ?? '',
        phone: customer?.phone ?? '',
        email: customer?.email ?? '',
        address: customer?.address ?? '',
        province: customer?.province ?? '',
        languages: customer?.languages ?? ([] as string[]),
        profile_photo: customer?.profile_photo ?? '',

        // Licence
        licence_number: customer?.licence_number ?? '',
        licence_class: customer?.licence_class ?? '',
        licence_issued_date: customer?.licence_issued_date ? customer.licence_issued_date.slice(0, 10) : '',
        licence_expiry: customer?.licence_expiry ? new Date(customer.licence_expiry).toISOString().split('T')[0] : '',
        licence_front: customer?.licence_front ?? '',
        licence_back: customer?.licence_back ?? '',
        defensive_driving_cert: customer?.defensive_driving_cert ?? '',
        police_clearance_cert: customer?.police_clearance_cert ?? '',

        // Identity docs
        national_id_front: customer?.national_id_front ?? '',
        national_id_back: customer?.national_id_back ?? '',
        selfie_holding_id: customer?.selfie_holding_id ?? '',

        // Emergency contact
        emergency_contact_name: customer?.emergency_contact_name ?? '',
        emergency_contact_phone: customer?.emergency_contact_phone ?? '',
        emergency_contact_relationship: customer?.emergency_contact_relationship ?? '',

        notes: customer?.notes ?? '',
    });

    const toggleLang = (lang: string) => {
        const next = data.languages.includes(lang)
            ? data.languages.filter((l) => l !== lang)
            : [...data.languages, lang];
        setData('languages', next);
    };

    const requiredChecks: { label: string; done: boolean }[] = [
        { label: 'Full name', done: Boolean(data.name) },
        { label: 'Phone number', done: Boolean(data.phone) },
        { label: 'National ID', done: Boolean(data.id_number) },
        { label: 'Driver’s licence', done: Boolean(data.licence_number && data.licence_expiry) },
        { label: 'Licence photos', done: Boolean(data.licence_front && data.licence_back) },
        { label: 'National ID photos', done: Boolean(data.national_id_front && data.national_id_back) },
        { label: 'Selfie with ID', done: Boolean(data.selfie_holding_id) },
        { label: 'Police clearance', done: Boolean(data.police_clearance_cert) },
        { label: 'Emergency contact', done: Boolean(data.emergency_contact_name && data.emergency_contact_phone) },
    ];
    const completed = requiredChecks.filter((c) => c.done).length;
    const progressPct = Math.round((completed / requiredChecks.length) * 100);

    const licenceDaysLeft = daysUntil(data.licence_expiry);
    const licenceExpired = licenceDaysLeft !== null && licenceDaysLeft < 0;
    const licenceExpiringSoon = licenceDaysLeft !== null && licenceDaysLeft >= 0 && licenceDaysLeft <= 30;

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (isEdit) {
            put(Routes.update.url({ customer: customer!.id! }));
        } else {
            post(Routes.store.url());
        }
    }

    return (
        <>
            <Head title={isEdit ? 'Edit Customer' : 'New Customer'} />

            <form onSubmit={submit} className="flex flex-1 flex-col gap-6 p-6">
                {/* Page header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <Link
                            href={isEdit ? Routes.show.url({ customer: customer!.id! }) : Routes.index.url()}
                            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {isEdit ? 'Back to customer' : 'Back to customers'}
                        </Link>
                        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                            {isEdit ? `Edit ${data.name || 'customer'}` : 'New Customer'}
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                            {isEdit
                                ? 'Update personal details, licence information and compliance docs.'
                                : 'Register a walk-in or phone-in customer. They can be assigned to bookings once saved.'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" asChild>
                            <Link href={isEdit ? Routes.show.url({ customer: customer!.id! }) : Routes.index.url()}>
                                Cancel
                            </Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Customer'}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                    {/* Sections */}
                    <div className="flex flex-col gap-6">
                        <FormSection
                            icon={User}
                            title="Personal Information"
                            description="Who the customer is and how to reach them."
                        >
                            <div className="space-y-1 sm:col-span-2">
                                <Label htmlFor="name">Full name</Label>
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Telmore Banda" />
                                <InputError message={errors.name} />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="id_number">National ID</Label>
                                <Input
                                    id="id_number"
                                    value={data.id_number}
                                    onChange={(e) => setData('id_number', e.target.value)}
                                    placeholder="63-123456-A-78"
                                    className="font-mono"
                                />
                                <InputError message={errors.id_number} />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="dob">Date of birth</Label>
                                <DateInput id="dob" value={data.dob} onChange={(e) => setData('dob', e.target.value)} />
                                <InputError message={errors.dob} />
                            </div>

                            <div className="space-y-1">
                                <Label>Gender</Label>
                                <Select value={data.gender} onValueChange={(v) => setData('gender', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {GENDERS.map((g) => (
                                            <SelectItem key={g} value={g}>
                                                {g}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.gender} />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} placeholder="+263 77 123 4567" />
                                <InputError message={errors.phone} />
                            </div>

                            <div className="space-y-1 sm:col-span-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} placeholder="john@example.com" />
                                <InputError message={errors.email} />
                            </div>

                            <div className="space-y-1 sm:col-span-2">
                                <Label htmlFor="address">Address</Label>
                                <Input id="address" value={data.address} onChange={(e) => setData('address', e.target.value)} placeholder="12 Samora Machel Ave, Harare" />
                                <InputError message={errors.address} />
                            </div>

                            <div className="space-y-1">
                                <Label>Province</Label>
                                <Select value={data.province} onValueChange={(v) => setData('province', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PROVINCES.map((p) => (
                                            <SelectItem key={p} value={p}>
                                                {p}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.province} />
                            </div>

                            <div className="space-y-1">
                                <ImageUploadField
                                    label="Profile photo"
                                    value={data.profile_photo}
                                    onChange={(url) => setData('profile_photo', url)}
                                    error={errors.profile_photo}
                                />
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                                <Label>Languages spoken</Label>
                                <div className="flex flex-wrap gap-1.5">
                                    {LANGUAGES.map((lang) => {
                                        const active = data.languages.includes(lang);
                                        return (
                                            <button
                                                type="button"
                                                key={lang}
                                                onClick={() => toggleLang(lang)}
                                                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                                                    active
                                                        ? 'border-primary bg-primary/10 text-primary'
                                                        : 'border-input bg-background text-muted-foreground hover:bg-muted'
                                                }`}
                                            >
                                                {lang}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </FormSection>

                        <FormSection
                            icon={IdCard}
                            title="Driver’s Licence"
                            description="Required to rent a vehicle. Expired licences block new bookings."
                        >
                            <div className="space-y-1">
                                <Label htmlFor="licence_number">Licence number</Label>
                                <Input
                                    id="licence_number"
                                    value={data.licence_number}
                                    onChange={(e) => setData('licence_number', e.target.value)}
                                    className="font-mono"
                                />
                                <InputError message={errors.licence_number} />
                            </div>

                            <div className="space-y-1">
                                <Label>Licence class</Label>
                                <Select value={data.licence_class} onValueChange={(v) => setData('licence_class', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {LICENCE_CLASSES.map((c) => (
                                            <SelectItem key={c} value={c}>
                                                Class {c}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.licence_class} />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="licence_issued_date">Issued date</Label>
                                <DateInput
                                    id="licence_issued_date"
                                    value={data.licence_issued_date}
                                    onChange={(e) => setData('licence_issued_date', e.target.value)}
                                />
                                {(() => {
                                    if (!data.licence_issued_date) return null;
                                    const issued = new Date(data.licence_issued_date);
                                    const cutoff = new Date();
                                    cutoff.setMonth(cutoff.getMonth() - 3);
                                    if (issued.getTime() > cutoff.getTime()) {
                                        return (
                                            <p className="text-xs font-medium text-yellow-700 dark:text-yellow-500">
                                                Issued under 3 months ago — customer is not yet eligible to rent.
                                            </p>
                                        );
                                    }
                                    return null;
                                })()}
                                <InputError message={errors.licence_issued_date} />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="licence_expiry">Expiry date</Label>
                                <DateInput id="licence_expiry" value={data.licence_expiry} onChange={(e) => setData('licence_expiry', e.target.value)} />
                                {licenceExpired && (
                                    <p className="text-xs font-medium text-red-600 dark:text-red-400">
                                        Licence has expired — customer cannot rent until renewed.
                                    </p>
                                )}
                                {licenceExpiringSoon && (
                                    <p className="text-xs font-medium text-yellow-700 dark:text-yellow-500">
                                        Expires in {licenceDaysLeft} day{licenceDaysLeft === 1 ? '' : 's'}.
                                    </p>
                                )}
                                <InputError message={errors.licence_expiry} />
                            </div>

                            <ImageUploadField
                                label="Licence — Front"
                                value={data.licence_front}
                                onChange={(url) => setData('licence_front', url)}
                                error={errors.licence_front}
                            />
                            <ImageUploadField
                                label="Licence — Back"
                                value={data.licence_back}
                                onChange={(url) => setData('licence_back', url)}
                                error={errors.licence_back}
                            />
                        </FormSection>

                        <FormSection
                            icon={FileBadge}
                            title="Compliance Documents"
                            description="Required certs and identity verification before first hire."
                        >
                            <ImageUploadField
                                label="Police Clearance Certificate"
                                value={data.police_clearance_cert}
                                onChange={(url) => setData('police_clearance_cert', url)}
                                error={errors.police_clearance_cert}
                            />
                            <ImageUploadField
                                label="Defensive Driving Certificate"
                                value={data.defensive_driving_cert}
                                onChange={(url) => setData('defensive_driving_cert', url)}
                                hint="Optional. Speeds up booking approval."
                                error={errors.defensive_driving_cert}
                            />
                            <ImageUploadField
                                label="National ID — Front"
                                value={data.national_id_front}
                                onChange={(url) => setData('national_id_front', url)}
                                error={errors.national_id_front}
                            />
                            <ImageUploadField
                                label="National ID — Back"
                                value={data.national_id_back}
                                onChange={(url) => setData('national_id_back', url)}
                                error={errors.national_id_back}
                            />
                            <div className="sm:col-span-2">
                                <ImageUploadField
                                    label="Selfie holding ID"
                                    value={data.selfie_holding_id}
                                    onChange={(url) => setData('selfie_holding_id', url)}
                                    hint="Customer holding their National ID next to their face."
                                    error={errors.selfie_holding_id}
                                />
                            </div>
                        </FormSection>

                        <FormSection
                            icon={LifeBuoy}
                            title="Emergency Contact"
                            description="Who to call if something goes wrong mid-rental."
                        >
                            <div className="space-y-1">
                                <Label htmlFor="emergency_contact_name">Name</Label>
                                <Input
                                    id="emergency_contact_name"
                                    value={data.emergency_contact_name}
                                    onChange={(e) => setData('emergency_contact_name', e.target.value)}
                                    placeholder="Jane Doe"
                                />
                                <InputError message={errors.emergency_contact_name} />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="emergency_contact_phone">Phone</Label>
                                <Input
                                    id="emergency_contact_phone"
                                    value={data.emergency_contact_phone}
                                    onChange={(e) => setData('emergency_contact_phone', e.target.value)}
                                    placeholder="+263 77 …"
                                />
                                <InputError message={errors.emergency_contact_phone} />
                            </div>

                            <div className="space-y-1 sm:col-span-2">
                                <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                                <Input
                                    id="emergency_contact_relationship"
                                    value={data.emergency_contact_relationship}
                                    onChange={(e) => setData('emergency_contact_relationship', e.target.value)}
                                    placeholder="Spouse, sibling, parent, friend…"
                                />
                                <InputError message={errors.emergency_contact_relationship} />
                            </div>
                        </FormSection>

                        <FormSection
                            icon={StickyNote}
                            title="Notes"
                            description="Internal notes — not shown to the customer."
                        >
                            <div className="space-y-1 sm:col-span-2">
                                <Label htmlFor="notes">Notes</Label>
                                <textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={3}
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    placeholder="Anything the team should know — preferred vehicle, quirks, past behaviour, etc."
                                />
                                <InputError message={errors.notes} />
                            </div>
                        </FormSection>

                        {/* Bottom action bar */}
                        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
                            <p className="text-xs text-muted-foreground">
                                {isEdit ? 'Changes take effect immediately.' : 'Customer will be created as Active and eligible to book.'}
                            </p>
                            <div className="flex gap-2">
                                <Button variant="outline" asChild>
                                    <Link href={isEdit ? Routes.show.url({ customer: customer!.id! }) : Routes.index.url()}>
                                        Cancel
                                    </Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Customer'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Right column */}
                    <aside className="flex flex-col gap-4 xl:sticky xl:top-6 xl:self-start">
                        <Card className="overflow-hidden">
                            <CardHeader className="border-b bg-gradient-to-br from-primary/5 to-transparent py-4">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <User className="h-4 w-4 text-primary" /> Customer preview
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">How this customer will appear in the directory.</p>
                            </CardHeader>
                            <CardContent className="space-y-4 p-5">
                                <div className="flex items-center gap-3">
                                    {data.profile_photo ? (
                                        <img
                                            src={data.profile_photo}
                                            alt={data.name}
                                            className="h-12 w-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                            {initials(data.name)}
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-base font-semibold leading-tight">
                                            {data.name || 'New Customer'}
                                        </div>
                                        <div className="truncate text-xs text-muted-foreground">{data.phone || 'No phone'}</div>
                                    </div>
                                </div>

                                {(data.email || data.id_number) && (
                                    <div className="space-y-2 text-xs">
                                        {data.id_number && (
                                            <div className="flex justify-between gap-3">
                                                <span className="text-muted-foreground">ID</span>
                                                <span className="truncate font-mono font-medium">{data.id_number}</span>
                                            </div>
                                        )}
                                        {data.email && (
                                            <div className="flex justify-between gap-3">
                                                <span className="text-muted-foreground">Email</span>
                                                <span className="truncate font-medium">{data.email}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="rounded-md border bg-muted/40 p-3">
                                    <div className="text-xs text-muted-foreground">Licence</div>
                                    <div className="mt-0.5 font-mono text-sm font-semibold">{data.licence_number || '—'}</div>
                                    {data.licence_expiry && (
                                        <div className="mt-1 text-xs">
                                            {licenceExpired ? (
                                                <span className="font-medium text-red-600 dark:text-red-400">Expired</span>
                                            ) : licenceExpiringSoon ? (
                                                <span className="font-medium text-yellow-700 dark:text-yellow-500">
                                                    Expires in {licenceDaysLeft} day{licenceDaysLeft === 1 ? '' : 's'}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    Expires {new Date(data.licence_expiry).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="py-4">
                                <CardTitle className="text-sm">Profile completeness</CardTitle>
                                <div className="mt-2 space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">
                                            {completed} of {requiredChecks.length} fields
                                        </span>
                                        <span className="font-medium">{progressPct}%</span>
                                    </div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2 pt-0 pb-5 text-xs">
                                {requiredChecks.map((check) => (
                                    <div key={check.label} className="flex items-center gap-2">
                                        {check.done ? (
                                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                        ) : (
                                            <CircleDashed className="h-3.5 w-3.5 text-muted-foreground" />
                                        )}
                                        <span className={check.done ? '' : 'text-muted-foreground'}>{check.label}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </form>
        </>
    );
}
