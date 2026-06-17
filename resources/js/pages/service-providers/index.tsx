import { Head, router, setLayoutProps, useForm } from '@inertiajs/react';
import { Building2, Pencil, Phone, Plus, Search, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/input-error';
import * as Routes from '@/actions/App/Http/Controllers/Web/ServiceProviderController';
import { dashboard } from '@/routes';

interface Provider {
    id: number;
    name: string;
    category: string;
    category_label: string;
    phone: string;
    email: string | null;
    contact_person: string | null;
    services_offered: string | null;
    rating: number | null;
    is_active: boolean;
}

interface PaginatedProviders {
    data: Provider[];
    links: { url: string | null; label: string; active: boolean }[];
    last_page: number;
    total: number;
    from: number;
    to: number;
}

const CATEGORY_STYLES: Record<string, string> = {
    mechanic: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    tow: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    car_wash: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
    parts: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    insurance: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    tyres: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    panelbeater: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
    other: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

export default function ServiceProvidersIndex({
    providers,
    filters,
    categories,
}: {
    providers: PaginatedProviders;
    filters: { search?: string; category?: string };
    categories: { value: string; label: string }[];
}) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Service Providers', href: Routes.index.url() },
        ],
    });

    const [search, setSearch] = useState(filters.search ?? '');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Provider | null>(null);

    function applyFilter(params: Record<string, string>) {
        router.get(Routes.index.url(), { ...filters, ...params }, { preserveState: true, replace: true });
    }

    function openNew() {
        setEditing(null);
        setDialogOpen(true);
    }

    function openEdit(provider: Provider) {
        setEditing(provider);
        setDialogOpen(true);
    }

    function handleDelete(provider: Provider) {
        if (confirm(`Remove ${provider.name}?`)) {
            router.delete(Routes.destroy.url({ service_provider: provider.id }), { preserveScroll: true });
        }
    }

    return (
        <>
            <Head title="Service Providers" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Service Providers</h1>
                        <p className="text-sm text-muted-foreground">Directory of mechanics, tow companies, parts suppliers and more.</p>
                    </div>
                    <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Add Provider</Button>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            applyFilter({ search });
                        }}
                        className="flex flex-1 gap-2"
                    >
                        <Input placeholder="Search name, phone, contact…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
                        <Button type="submit" variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
                    </form>

                    <Select value={filters.category ?? ''} onValueChange={(v) => applyFilter({ category: v === 'all' ? '' : v })}>
                        <SelectTrigger className="w-48"><SelectValue placeholder="All categories" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All categories</SelectItem>
                            {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                {providers.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                                <Building2 className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-lg font-semibold">No service providers yet</p>
                            <p className="text-sm text-muted-foreground max-w-md">Add the mechanics, tow operators, and suppliers you work with so they're ready when logging costs.</p>
                            <Button onClick={openNew} className="mt-2"><Plus className="mr-2 h-4 w-4" /> Add your first provider</Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {providers.data.map((p) => (
                            <Card key={p.id} className="group transition-shadow hover:shadow-md">
                                <CardContent className="p-5 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold truncate">{p.name}</h3>
                                            <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_STYLES[p.category] ?? ''}`}>
                                                {p.category_label}
                                            </span>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(p)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Phone className="h-3.5 w-3.5" />
                                            <span>{p.phone}</span>
                                        </div>
                                        {p.contact_person && (
                                            <p className="text-xs text-muted-foreground">Contact: <span className="font-medium text-foreground">{p.contact_person}</span></p>
                                        )}
                                        {p.services_offered && (
                                            <p className="text-xs text-muted-foreground line-clamp-2">{p.services_offered}</p>
                                        )}
                                    </div>

                                    {p.rating != null && (
                                        <div className="flex items-center gap-1 pt-1 border-t">
                                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                            <span className="text-sm font-medium">{p.rating.toFixed(1)}</span>
                                            <span className="text-xs text-muted-foreground">/ 5</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {providers.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{providers.from}–{providers.to} of {providers.total}</span>
                        <div className="flex gap-1">
                            {providers.links.map((link, i) => (
                                <Button
                                    key={i}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <ProviderDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} categories={categories} />
        </>
    );
}

function ProviderDialog({
    open,
    onOpenChange,
    editing,
    categories,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editing: Provider | null;
    categories: { value: string; label: string }[];
}) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: editing?.name ?? '',
        category: editing?.category ?? 'mechanic',
        phone: editing?.phone ?? '',
        email: editing?.email ?? '',
        contact_person: editing?.contact_person ?? '',
        services_offered: editing?.services_offered ?? '',
        rating: editing?.rating ?? '',
        is_active: editing?.is_active ?? true,
        notes: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        };
        if (editing) {
            put(Routes.update.url({ service_provider: editing.id }), options);
        } else {
            post(Routes.store.url(), options);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{editing ? 'Edit Provider' : 'Add Service Provider'}</DialogTitle>
                    <DialogDescription>Mechanics, tow operators, parts suppliers — anyone you pay to service vehicles.</DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="sp-name">Name</Label>
                        <Input id="sp-name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Kudzai Auto Works" />
                        <InputError message={errors.name} />
                    </div>

                    <div className="space-y-1">
                        <Label>Category</Label>
                        <Select value={data.category} onValueChange={(v) => setData('category', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.category} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="sp-phone">Phone</Label>
                        <Input id="sp-phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} placeholder="+263 77 …" />
                        <InputError message={errors.phone} />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="sp-email">Email (optional)</Label>
                        <Input id="sp-email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                        <InputError message={errors.email} />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="sp-contact">Contact Person</Label>
                        <Input id="sp-contact" value={data.contact_person} onChange={(e) => setData('contact_person', e.target.value)} placeholder="Tendai Moyo" />
                        <InputError message={errors.contact_person} />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="sp-services">Services offered</Label>
                        <textarea
                            id="sp-services"
                            value={data.services_offered}
                            onChange={(e) => setData('services_offered', e.target.value)}
                            rows={2}
                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            placeholder="Brakes, suspension, diagnostic, body repairs…"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="sp-rating">Rating (0–5)</Label>
                        <Input id="sp-rating" type="number" step="0.1" min="0" max="5" value={data.rating} onChange={(e) => setData('rating', e.target.value)} />
                    </div>

                    <DialogFooter className="sm:col-span-2 mt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing}>{processing ? 'Saving…' : editing ? 'Save Changes' : 'Add Provider'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
