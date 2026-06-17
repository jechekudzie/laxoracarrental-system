import { Head, Link, setLayoutProps, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, CircleDashed, Fuel, Gauge, Info, Layers, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/input-error';
import * as Routes from '@/actions/App/Http/Controllers/Web/BookingCategoryController';
import { dashboard } from '@/routes';

function slugifyPreview(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

interface Option { value: string; label: string }

interface Category {
    id?: number;
    slug?: string;
    name?: string;
    description?: string | null;
    security_deposit?: number;
    km_per_day_limit?: number;
    excess_km_rate?: number;
    fuel_charge_per_level?: number;
    currency?: string;
    is_active?: boolean;
    sort_order?: number;
}

function fmt(amount: number | string, currency: string) {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (!Number.isFinite(num)) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num);
}

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
            <CardContent className="grid gap-4 p-6">{children}</CardContent>
        </Card>
    );
}

export default function BookingCategoryForm({
    category,
    currencies,
}: {
    category: Category | null;
    currencies: Option[];
}) {
    const isEdit = category?.id != null;

    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Booking Categories', href: Routes.index.url() },
            { title: isEdit ? `Edit ${category?.name ?? ''}` : 'New Category', href: '#' },
        ],
    });

    const { data, setData, post, put, processing, errors } = useForm({
        name: category?.name ?? '',
        description: category?.description ?? '',
        security_deposit: category?.security_deposit ?? '',
        km_per_day_limit: category?.km_per_day_limit ?? 200,
        excess_km_rate: category?.excess_km_rate ?? '',
        fuel_charge_per_level: category?.fuel_charge_per_level ?? '',
        currency: category?.currency ?? 'USD',
        is_active: category?.is_active ?? true,
        sort_order: category?.sort_order ?? 0,
    });

    const displaySlug = isEdit ? category?.slug ?? '' : slugifyPreview(data.name);

    const requiredChecks: { label: string; done: boolean }[] = [
        { label: 'Name', done: Boolean(data.name) },
        { label: 'Security deposit', done: Number(data.security_deposit) >= 0 && data.security_deposit !== '' },
        { label: 'KM allowance', done: Number(data.km_per_day_limit) > 0 },
        { label: 'Excess km rate', done: Number(data.excess_km_rate) >= 0 && data.excess_km_rate !== '' },
    ];
    const completed = requiredChecks.filter((c) => c.done).length;
    const progressPct = Math.round((completed / requiredChecks.length) * 100);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (isEdit) {
            put(Routes.update.url({ bookingCategory: category!.id! }));
        } else {
            post(Routes.store.url());
        }
    }

    return (
        <>
            <Head title={isEdit ? 'Edit Booking Category' : 'New Booking Category'} />

            <form onSubmit={submit} className="flex flex-1 flex-col gap-6 p-6">
                {/* Page header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <Link
                            href={isEdit ? Routes.show.url({ bookingCategory: category!.id! }) : Routes.index.url()}
                            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {isEdit ? 'Back to category' : 'Back to categories'}
                        </Link>
                        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                            {isEdit ? `Edit ${data.name || 'Category'}` : 'New Booking Category'}
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                            Commercial tiers define the deposit, mileage allowance, excess km rate and fuel top-up charge
                            that apply to every booking on a vehicle in this tier.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" asChild>
                            <Link href={isEdit ? Routes.show.url({ bookingCategory: category!.id! }) : Routes.index.url()}>
                                Cancel
                            </Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Category'}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                    {/* Sections */}
                    <div className="flex flex-col gap-6">
                        <FormSection
                            icon={Info}
                            title="Identity"
                            description="What this tier is called and how it appears in dropdowns."
                        >
                            <div className="space-y-1">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Small Car"
                                />
                                {!isEdit && data.name && (
                                    <p className="text-xs text-muted-foreground">
                                        Slug will be auto-generated as{' '}
                                        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">{displaySlug}</code>
                                    </p>
                                )}
                                <InputError message={errors.name} />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    value={data.description ?? ''}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={2}
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    placeholder="Honda Fit, Toyota Vitz and similar city runabouts."
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <Label>Currency</Label>
                                    <Select value={data.currency} onValueChange={(v) => setData('currency', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select currency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {currencies.map((c) => (
                                                <SelectItem key={c.value} value={c.value}>
                                                    {c.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.currency} />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="sort_order">Display order</Label>
                                    <Input
                                        id="sort_order"
                                        type="number"
                                        min={0}
                                        value={data.sort_order}
                                        onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                                    />
                                    <p className="text-xs text-muted-foreground">Lower numbers appear first.</p>
                                    <InputError message={errors.sort_order} />
                                </div>
                            </div>

                            <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed p-3 transition-colors hover:bg-muted/30">
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="h-4 w-4 rounded border-input accent-primary"
                                />
                                <div className="flex-1">
                                    <span className="text-sm font-medium">Active</span>
                                    <p className="text-xs text-muted-foreground">
                                        Inactive tiers stay on existing vehicles but can&apos;t be picked for new ones.
                                    </p>
                                </div>
                            </label>
                        </FormSection>

                        <FormSection
                            icon={ShieldCheck}
                            title="Security Deposit"
                            description="Charged at booking time and refundable on return — less any deductions."
                        >
                            <div className="space-y-1 max-w-sm">
                                <Label htmlFor="security_deposit">Refundable deposit ({data.currency})</Label>
                                <Input
                                    id="security_deposit"
                                    type="number"
                                    step="0.01"
                                    value={data.security_deposit}
                                    onChange={(e) => setData('security_deposit', e.target.value)}
                                    placeholder="150.00"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Mileage overage, fuel shortfall and damage charges are deducted before the refund is issued.
                                </p>
                                <InputError message={errors.security_deposit} />
                            </div>
                        </FormSection>

                        <FormSection
                            icon={Gauge}
                            title="Mileage"
                            description="How many kilometres the customer gets per rental day, and what we charge beyond that."
                        >
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <Label htmlFor="km_per_day_limit">KM allowance / day</Label>
                                    <Input
                                        id="km_per_day_limit"
                                        type="number"
                                        min={0}
                                        value={data.km_per_day_limit}
                                        onChange={(e) => setData('km_per_day_limit', parseInt(e.target.value) || 0)}
                                        placeholder="200"
                                    />
                                    <InputError message={errors.km_per_day_limit} />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="excess_km_rate">Excess km rate ({data.currency}/km)</Label>
                                    <Input
                                        id="excess_km_rate"
                                        type="number"
                                        step="0.01"
                                        value={data.excess_km_rate}
                                        onChange={(e) => setData('excess_km_rate', e.target.value)}
                                        placeholder="0.50"
                                    />
                                    <InputError message={errors.excess_km_rate} />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Total allowance = days × km/day. Anything over is billed at the excess rate and deducted
                                from the deposit on return.
                            </p>
                        </FormSection>

                        <FormSection
                            icon={Fuel}
                            title="Fuel"
                            description="How much we charge per quarter-tank short on return. Surplus fuel is never credited back."
                        >
                            <div className="space-y-1 max-w-sm">
                                <Label htmlFor="fuel_charge_per_level">Charge per quarter-tank short ({data.currency})</Label>
                                <Input
                                    id="fuel_charge_per_level"
                                    type="number"
                                    step="0.01"
                                    value={data.fuel_charge_per_level}
                                    onChange={(e) => setData('fuel_charge_per_level', e.target.value)}
                                    placeholder="15.00"
                                />
                                <p className="text-xs text-muted-foreground">
                                    If pickup is <em>full</em> and return is <em>half</em>, that&apos;s 2 quarter-tank levels
                                    short. Set to 0 to disable fuel top-up charges.
                                </p>
                                <InputError message={errors.fuel_charge_per_level} />
                            </div>
                        </FormSection>

                        {/* Bottom action bar */}
                        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
                            <p className="text-xs text-muted-foreground">
                                {isEdit
                                    ? 'Changes apply to all new bookings on vehicles in this tier.'
                                    : 'Category will be created and available to assign to vehicles immediately.'}
                            </p>
                            <div className="flex gap-2">
                                <Button variant="outline" asChild>
                                    <Link
                                        href={
                                            isEdit
                                                ? Routes.show.url({ bookingCategory: category!.id! })
                                                : Routes.index.url()
                                        }
                                    >
                                        Cancel
                                    </Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Category'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Right column — live preview */}
                    <aside className="flex flex-col gap-4 xl:sticky xl:top-6 xl:self-start">
                        <Card className="overflow-hidden">
                            <CardHeader className="border-b bg-gradient-to-br from-primary/5 to-transparent py-4">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Layers className="h-4 w-4 text-primary" /> Tier preview
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">How this tier will appear on vehicles.</p>
                            </CardHeader>
                            <CardContent className="space-y-4 p-5">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-base font-semibold">
                                            {data.name || 'Tier name'}
                                        </div>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                                data.is_active
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                            }`}
                                        >
                                            {data.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                                        {displaySlug || 'auto-slug'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <PreviewStat
                                        icon={ShieldCheck}
                                        label="Deposit"
                                        value={fmt(data.security_deposit || 0, data.currency)}
                                    />
                                    <PreviewStat
                                        icon={Gauge}
                                        label="KM / day"
                                        value={`${Number(data.km_per_day_limit || 0).toLocaleString()} km`}
                                    />
                                    <PreviewStat
                                        icon={Info}
                                        label="Excess"
                                        value={`${fmt(data.excess_km_rate || 0, data.currency)}/km`}
                                    />
                                    <PreviewStat
                                        icon={Fuel}
                                        label="Fuel / level"
                                        value={
                                            Number(data.fuel_charge_per_level) > 0
                                                ? fmt(data.fuel_charge_per_level, data.currency)
                                                : '—'
                                        }
                                    />
                                </div>

                                <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                                    <div className="font-medium text-foreground">Example</div>
                                    <p className="mt-1">
                                        3-day rental: allowance{' '}
                                        <span className="font-medium text-foreground">
                                            {(3 * Number(data.km_per_day_limit || 0)).toLocaleString()} km
                                        </span>
                                        , deposit{' '}
                                        <span className="font-medium text-foreground">
                                            {fmt(data.security_deposit || 0, data.currency)}
                                        </span>
                                        .
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="py-4">
                                <CardTitle className="text-sm">Ready to save</CardTitle>
                                <div className="mt-2 space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">
                                            {completed} of {requiredChecks.length} complete
                                        </span>
                                        <span className="font-medium">{progressPct}%</span>
                                    </div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="h-full rounded-full bg-primary transition-all"
                                            style={{ width: `${progressPct}%` }}
                                        />
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

function PreviewStat({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-md border bg-muted/40 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon className="h-3 w-3" /> {label}
            </div>
            <div className="mt-0.5 text-sm font-semibold">{value}</div>
        </div>
    );
}
