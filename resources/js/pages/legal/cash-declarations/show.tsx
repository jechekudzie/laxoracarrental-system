import { Head, setLayoutProps } from '@inertiajs/react';
import { Download, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as CashRoutes from '@/actions/App/Http/Controllers/Web/CashDeclarationController';

setLayoutProps({ breadcrumbs: [
    { title: 'Legal', href: '/legal/cash-declarations' },
    { title: 'Cash Declarations', href: '/legal/cash-declarations' },
    { title: 'View Declaration', href: '#' },
]});

const GOLD = '#c2943f';

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
    signature: string | null;
    declared_at: string;
}

export default function CashDeclarationShow({ declaration }: { declaration: Declaration }) {
    return (
        <>
            <Head title={`Declaration ${declaration.declaration_number}`} />
            <div className="mx-auto max-w-2xl space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">{declaration.declaration_number}</h1>
                        <p className="text-sm text-muted-foreground">Cash Declaration</p>
                    </div>
                    <Button asChild>
                        <a href={CashRoutes.downloadPdf.url(declaration.id)} target="_blank">
                            <Download className="mr-2 h-4 w-4" /> Download PDF
                        </a>
                    </Button>
                </div>

                {/* Document card */}
                <div className="overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-stone-950">
                    <div className="h-1.5 w-full" style={{ background: GOLD }} />

                    {/* Header */}
                    <div className="flex items-start justify-between border-b p-8 pb-6">
                        <img src="/logo.jpg" alt="Laxora Car Rental" className="h-12 w-auto object-contain" />
                        <div className="text-right">
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Cash Declaration</p>
                            <p className="mt-1 font-mono text-lg font-bold" style={{ color: GOLD }}>{declaration.declaration_number}</p>
                            <p className="text-xs text-muted-foreground">{declaration.declared_at}</p>
                        </div>
                    </div>

                    <div className="space-y-6 p-8">
                        {/* Amount */}
                        <div className="rounded-xl p-6 text-center" style={{ background: 'rgba(194,148,63,0.06)', border: '1px solid rgba(194,148,63,0.2)' }}>
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Amount Received</p>
                            <p className="mt-2 text-4xl font-extrabold" style={{ color: GOLD }}>
                                {declaration.currency} {Number(declaration.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>

                        {/* Details */}
                        <div className="grid gap-4 sm:grid-cols-2 text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground">Source</p>
                                <p className="font-medium">{declaration.source_label}</p>
                            </div>
                            {declaration.reference && (
                                <div>
                                    <p className="text-xs text-muted-foreground">Reference</p>
                                    <p className="font-medium font-mono">{declaration.reference}</p>
                                </div>
                            )}
                            {declaration.customer_name && (
                                <div>
                                    <p className="text-xs text-muted-foreground">Customer</p>
                                    <p className="font-medium">{declaration.customer_name}</p>
                                </div>
                            )}
                            {declaration.booking_number && (
                                <div>
                                    <p className="text-xs text-muted-foreground">Booking</p>
                                    <p className="font-medium font-mono">{declaration.booking_number}</p>
                                </div>
                            )}
                            <div className="sm:col-span-2">
                                <p className="text-xs text-muted-foreground">Description</p>
                                <p className="font-medium">{declaration.description}</p>
                            </div>
                        </div>

                        {/* Signature */}
                        <div className="border-t pt-6">
                            <p className="mb-3 text-sm font-semibold">Declared & Signed By</p>
                            {declaration.signature ? (
                                <div className="space-y-2">
                                    <div className="overflow-hidden rounded-lg border bg-stone-50 p-3">
                                        <img src={declaration.signature} alt="Admin signature" className="mx-auto h-24 w-auto object-contain" />
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                                        <CheckCircle className="h-3.5 w-3.5" />
                                        {declaration.declared_by_name} · {declaration.declared_at}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No signature recorded.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
