import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import { Plus, Banknote, CheckCircle, Eye, Download } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import * as CashRoutes from '@/actions/App/Http/Controllers/Web/CashDeclarationController';

setLayoutProps({ breadcrumbs: [{ title: 'Legal', href: '/legal/cash-declarations' }, { title: 'Cash Declarations', href: '/legal/cash-declarations' }] });

interface Declaration {
    id: number;
    declaration_number: string;
    amount: string;
    currency: string;
    source: string;
    source_label: string;
    reference: string | null;
    description: string;
    declared_by_name: string | null;
    customer_name: string | null;
    booking_number: string | null;
    has_signature: boolean;
    declared_at: string;
}

interface Props {
    declarations: { data: Declaration[]; links: { url: string | null; label: string; active: boolean }[] };
    filters: { search?: string; source?: string };
    totals: Record<string, string>;
    sources: { value: string; label: string }[];
}

const sourceColors: Record<string, string> = {
    customer_payment: 'bg-blue-50 text-blue-700',
    deposit: 'bg-amber-50 text-amber-700',
    petty_cash: 'bg-purple-50 text-purple-700',
    other: 'bg-stone-100 text-stone-600',
};

export default function CashDeclarationsIndex({ declarations, filters, totals, sources }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const doSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(CashRoutes.index.url(), { search }, { preserveState: true, replace: true });
    };

    return (
        <>
            <Head title="Cash Declarations" />
            <div className="mx-auto max-w-6xl space-y-6 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Cash Declarations</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Admin-signed records of cash received.</p>
                    </div>
                    <Button asChild>
                        <Link href={CashRoutes.create.url()}>
                            <Plus className="mr-2 h-4 w-4" /> Declare Cash
                        </Link>
                    </Button>
                </div>

                {/* Totals */}
                {Object.keys(totals).length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-3">
                        {Object.entries(totals).map(([currency, total]) => (
                            <Card key={currency}>
                                <CardContent className="flex items-center justify-between py-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Total Declared ({currency})</p>
                                        <p className="text-2xl font-bold">{Number(total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    <Banknote className="h-6 w-6 text-amber-600" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Search */}
                <form onSubmit={doSearch} className="flex gap-2">
                    <Input placeholder="Search by number or description…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
                    <Button type="submit" variant="outline">Search</Button>
                </form>

                {/* Table */}
                {declarations.data.length === 0 ? (
                    <Card className="py-16 text-center">
                        <CardContent>
                            <Banknote className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                            <p className="font-medium">No declarations yet</p>
                            <Button asChild className="mt-4"><Link href={CashRoutes.create.url()}>Declare Cash</Link></Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="overflow-hidden rounded-xl border">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-stone-50 dark:bg-stone-900">
                                <tr>
                                    {['Number', 'Amount', 'Source', 'Description', 'Customer', 'Signed', 'Date', ''].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {declarations.data.map(d => (
                                    <tr key={d.id} className="hover:bg-stone-50 dark:hover:bg-stone-900">
                                        <td className="px-4 py-3 font-mono text-xs font-medium">{d.declaration_number}</td>
                                        <td className="px-4 py-3 font-semibold">{d.currency} {Number(d.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${sourceColors[d.source] ?? 'bg-stone-100 text-stone-600'}`}>
                                                {d.source_label}
                                            </span>
                                        </td>
                                        <td className="max-w-[200px] truncate px-4 py-3 text-xs text-muted-foreground">{d.description}</td>
                                        <td className="px-4 py-3 text-xs">{d.customer_name ?? '—'}</td>
                                        <td className="px-4 py-3 text-center">
                                            {d.has_signature ? <CheckCircle className="mx-auto h-4 w-4 text-emerald-600" /> : <span className="text-muted-foreground">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">{d.declared_at}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={CashRoutes.show.url(d.id)}><Eye className="h-3.5 w-3.5" /></Link>
                                                </Button>
                                                <Button variant="ghost" size="sm" asChild>
                                                    <a href={CashRoutes.downloadPdf.url(d.id)} target="_blank"><Download className="h-3.5 w-3.5" /></a>
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
