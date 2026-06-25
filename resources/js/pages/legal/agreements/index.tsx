import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import { FileText, Plus, CheckCircle, Clock, PenLine, Eye, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import * as AgreementRoutes from '@/actions/App/Http/Controllers/Web/RentalAgreementController';

setLayoutProps({ breadcrumbs: [{ title: 'Legal', href: '/legal/agreements' }, { title: 'Rental Agreements', href: '/legal/agreements' }] });

interface Agreement {
    id: number;
    agreement_number: string;
    renter_name: string;
    vehicle_registration: string | null;
    vehicle_make_model: string | null;
    rental_start: string | null;
    rental_end: string | null;
    total_amount: string | null;
    status: string;
    renter_signed_at: string | null;
    company_signed_at: string | null;
    created_at: string;
}

interface Props {
    agreements: { data: Agreement[]; links: { url: string | null; label: string; active: boolean }[] };
    filters: { search?: string; status?: string };
    summary: { total: number; draft: number; fully_signed: number };
}

const statusBadge: Record<string, string> = {
    draft: 'bg-stone-100 text-stone-600',
    sent: 'bg-blue-50 text-blue-700',
    renter_signed: 'bg-amber-50 text-amber-700',
    fully_signed: 'bg-emerald-50 text-emerald-700',
    expired: 'bg-red-50 text-red-600',
};

const statusLabel: Record<string, string> = {
    draft: 'Draft',
    sent: 'Sent',
    renter_signed: 'Renter Signed',
    fully_signed: 'Fully Signed',
    expired: 'Expired',
};

export default function AgreementsIndex({ agreements, filters, summary }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const doSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(AgreementRoutes.index.url(), { search, status: filters.status }, { preserveState: true, replace: true });
    };

    return (
        <>
            <Head title="Rental Agreements" />
            <div className="mx-auto max-w-6xl space-y-6 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Rental Agreements</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Digital vehicle rental agreements with e-signatures.</p>
                    </div>
                    <Button asChild>
                        <Link href={AgreementRoutes.create.url()}>
                            <Plus className="mr-2 h-4 w-4" /> New Agreement
                        </Link>
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Total', value: summary.total, icon: FileText, color: 'text-stone-600' },
                        { label: 'Draft', value: summary.draft, icon: Clock, color: 'text-amber-600' },
                        { label: 'Fully Signed', value: summary.fully_signed, icon: CheckCircle, color: 'text-emerald-600' },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <Card key={label}>
                            <CardContent className="flex items-center justify-between py-4">
                                <div>
                                    <p className="text-xs text-muted-foreground">{label}</p>
                                    <p className="text-2xl font-bold">{value}</p>
                                </div>
                                <Icon className={`h-6 w-6 ${color}`} />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Search */}
                <form onSubmit={doSearch} className="flex gap-2">
                    <Input placeholder="Search by agreement number, renter, or plate…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
                    <Button type="submit" variant="outline">Search</Button>
                </form>

                {/* Table */}
                {agreements.data.length === 0 ? (
                    <Card className="py-16 text-center">
                        <CardContent>
                            <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                            <p className="font-medium">No agreements found</p>
                            <Button asChild className="mt-4">
                                <Link href={AgreementRoutes.create.url()}>Create First Agreement</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="overflow-hidden rounded-xl border">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-stone-50 dark:bg-stone-900">
                                <tr>
                                    {['Number', 'Renter', 'Vehicle', 'Period', 'Status', 'Signatures', ''].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {agreements.data.map(a => (
                                    <tr key={a.id} className="hover:bg-stone-50 dark:hover:bg-stone-900">
                                        <td className="px-4 py-3 font-mono text-xs font-medium">{a.agreement_number}</td>
                                        <td className="px-4 py-3 font-medium">{a.renter_name}</td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            {a.vehicle_make_model && <span>{a.vehicle_make_model}<br /></span>}
                                            {a.vehicle_registration && <span className="font-mono">{a.vehicle_registration}</span>}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            {a.rental_start} {a.rental_end && `→ ${a.rental_end}`}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge[a.status] ?? 'bg-stone-100 text-stone-600'}`}>
                                                {statusLabel[a.status] ?? a.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            {a.renter_signed_at && <p className="text-emerald-600">✓ Renter</p>}
                                            {a.company_signed_at && <p className="text-emerald-600">✓ Company</p>}
                                            {!a.renter_signed_at && !a.company_signed_at && <span className="text-muted-foreground">—</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={AgreementRoutes.show.url(a.id)}><Eye className="h-3.5 w-3.5" /></Link>
                                                </Button>
                                                <Button variant="ghost" size="sm" asChild>
                                                    <a href={AgreementRoutes.downloadPdf.url(a.id)} target="_blank"><Download className="h-3.5 w-3.5" /></a>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
