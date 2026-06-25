import { Head, router, setLayoutProps } from '@inertiajs/react';
import { useState } from 'react';
import { Download, PenLine, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SignaturePad } from '@/components/signature-pad';
import * as AgreementRoutes from '@/actions/App/Http/Controllers/Web/RentalAgreementController';

setLayoutProps({ breadcrumbs: [
    { title: 'Legal', href: '/legal/agreements' },
    { title: 'Agreements', href: '/legal/agreements' },
    { title: 'View Agreement', href: '#' },
]});

interface Agreement {
    id: number;
    agreement_number: string;
    status: string;
    renter_name: string;
    renter_id_number: string | null;
    renter_address: string | null;
    renter_phone: string | null;
    renter_email: string | null;
    vehicle_make_model: string | null;
    vehicle_registration: string | null;
    mileage_out: string | null;
    fuel_level_out: string | null;
    rental_start: string | null;
    rental_end: string | null;
    collection_location: string | null;
    return_location: string | null;
    rental_rate: string | null;
    rental_days: number | null;
    total_amount: string | null;
    deposit_amount: string | null;
    mileage_allowance: number | null;
    excess_mileage_fee: string | null;
    template_content: string | null;
    renter_signature: string | null;
    renter_representative_name: string | null;
    renter_signed_at: string | null;
    company_signature: string | null;
    company_representative_name: string | null;
    company_signed_at: string | null;
    notes: string | null;
    created_at: string;
}

const GOLD = '#c2943f';

const statusBadge: Record<string, string> = {
    draft: 'bg-stone-100 text-stone-600',
    sent: 'bg-blue-50 text-blue-700',
    renter_signed: 'bg-amber-50 text-amber-700',
    fully_signed: 'bg-emerald-50 text-emerald-700',
    expired: 'bg-red-50 text-red-600',
};

function Field({ label, value }: { label: string; value?: string | number | null }) {
    if (!value) return null;
    return (
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-medium">{value}</p>
        </div>
    );
}

export default function AgreementShow({ agreement }: { agreement: Agreement }) {
    const [signDialog, setSignDialog] = useState<'renter' | 'company' | null>(null);
    const [sig, setSig] = useState<string | null>(null);
    const [repName, setRepName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const submitSign = () => {
        if (!sig || !signDialog) return;
        setSubmitting(true);
        router.post(AgreementRoutes.sign.url(agreement.id), {
            signer: signDialog,
            signature: sig,
            representative_name: repName,
        }, {
            onFinish: () => {
                setSubmitting(false);
                setSignDialog(null);
                setSig(null);
                setRepName('');
            },
        });
    };

    return (
        <>
            <Head title={`Agreement ${agreement.agreement_number}`} />
            <div className="mx-auto max-w-4xl space-y-6 p-6 print:p-0">
                {/* Header bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">{agreement.agreement_number}</h1>
                        <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge[agreement.status] ?? ''}`}>
                            {agreement.status.replace('_', ' ').toUpperCase()}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        {!agreement.renter_signed_at && (
                            <Button variant="outline" onClick={() => setSignDialog('renter')}>
                                <PenLine className="mr-2 h-4 w-4" /> Renter Signs
                            </Button>
                        )}
                        {!agreement.company_signed_at && (
                            <Button variant="outline" onClick={() => setSignDialog('company')}>
                                <PenLine className="mr-2 h-4 w-4" /> Company Signs
                            </Button>
                        )}
                        <Button asChild>
                            <a href={AgreementRoutes.downloadPdf.url(agreement.id)} target="_blank">
                                <Download className="mr-2 h-4 w-4" /> Download PDF
                            </a>
                        </Button>
                    </div>
                </div>

                {/* Document */}
                <div className="overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-stone-950">
                    {/* Gold top border */}
                    <div className="h-1.5 w-full" style={{ background: GOLD }} />

                    {/* Doc header */}
                    <div className="flex items-start justify-between border-b p-8 pb-6">
                        <div>
                            <img src="/logo.jpg" alt="Laxora Car Rental" className="h-14 w-auto object-contain" />
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Vehicle Rental Agreement</p>
                            <p className="mt-1 font-mono text-lg font-bold" style={{ color: GOLD }}>{agreement.agreement_number}</p>
                            <p className="text-xs text-muted-foreground">Created {agreement.created_at}</p>
                        </div>
                    </div>

                    <div className="space-y-8 p-8">
                        {/* Intro */}
                        <p className="text-sm text-muted-foreground">
                            This Vehicle Rental Agreement ("Agreement") is entered into between:
                        </p>

                        {/* Company */}
                        <div className="rounded-xl border p-5" style={{ borderColor: 'rgba(194,148,63,0.2)', background: 'rgba(194,148,63,0.03)' }}>
                            <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>Company</p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Field label="Company Name" value="Laxora Car Rental" />
                                <Field label="Address" value="Harare Office, Zimbabwe" />
                                <Field label="Phone" value="+263 77 000 0000" />
                                <Field label="Email" value="hello@laxora.co.zw" />
                            </div>
                        </div>

                        {/* Renter */}
                        <div className="rounded-xl border p-5">
                            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">AND — Renter</p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Field label="Full Name" value={agreement.renter_name} />
                                <Field label="ID / Passport Number" value={agreement.renter_id_number} />
                                <Field label="Physical Address" value={agreement.renter_address} />
                                <Field label="Phone Number" value={agreement.renter_phone} />
                                <Field label="Email Address" value={agreement.renter_email} />
                            </div>
                        </div>

                        {/* Section 1: Vehicle Details */}
                        <div>
                            <h3 className="mb-4 font-bold">1. VEHICLE DETAILS</h3>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                <Field label="Make & Model" value={agreement.vehicle_make_model} />
                                <Field label="Registration No." value={agreement.vehicle_registration} />
                                <Field label="Mileage (Out)" value={agreement.mileage_out} />
                                <Field label="Fuel Level" value={agreement.fuel_level_out} />
                                <Field label="Rental Start" value={agreement.rental_start} />
                                <Field label="Rental End" value={agreement.rental_end} />
                                <Field label="Collection Location" value={agreement.collection_location} />
                                <Field label="Return Location" value={agreement.return_location} />
                            </div>
                        </div>

                        {/* Section 2: Fees */}
                        <div>
                            <h3 className="mb-4 font-bold">2. RENTAL FEES & DEPOSIT</h3>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                <Field label="Daily Rate" value={agreement.rental_rate ? `USD ${agreement.rental_rate}` : null} />
                                <Field label="Rental Days" value={agreement.rental_days} />
                                <Field label="Total Amount" value={agreement.total_amount ? `USD ${agreement.total_amount}` : null} />
                                <Field label="Refundable Deposit" value={agreement.deposit_amount ? `USD ${agreement.deposit_amount}` : null} />
                                <Field label="Mileage Allowance" value={agreement.mileage_allowance ? `${agreement.mileage_allowance} km/day` : null} />
                                <Field label="Excess Mileage Fee" value={agreement.excess_mileage_fee ? `USD ${agreement.excess_mileage_fee}/km` : null} />
                            </div>
                            <p className="mt-3 text-xs text-muted-foreground">All charges are payable in advance unless agreed otherwise in writing.</p>
                        </div>

                        {/* Legal clauses */}
                        {agreement.template_content && (
                            <div
                                className="prose prose-sm max-w-none dark:prose-invert [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:uppercase [&_h3]:tracking-wide [&_ol]:text-sm [&_p]:text-sm"
                                dangerouslySetInnerHTML={{ __html: agreement.template_content }}
                            />
                        )}

                        {/* Signatures */}
                        <div className="border-t pt-6">
                            <h3 className="mb-6 font-bold">SIGNATURES</h3>
                            <div className="grid gap-8 sm:grid-cols-2">
                                {/* Renter signature */}
                                <div>
                                    <p className="mb-2 text-sm font-semibold">RENTER</p>
                                    {agreement.renter_signature ? (
                                        <div className="space-y-2">
                                            <div className="overflow-hidden rounded-lg border bg-stone-50 p-2">
                                                <img src={agreement.renter_signature} alt="Renter signature" className="h-20 w-full object-contain" />
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                                                <CheckCircle className="h-3.5 w-3.5" />
                                                {agreement.renter_representative_name && <span>{agreement.renter_representative_name} · </span>}
                                                <span>Signed {agreement.renter_signed_at}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed">
                                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Clock className="h-3.5 w-3.5" /> Awaiting signature
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Company signature */}
                                <div>
                                    <p className="mb-2 text-sm font-semibold">COMPANY REPRESENTATIVE</p>
                                    {agreement.company_signature ? (
                                        <div className="space-y-2">
                                            <div className="overflow-hidden rounded-lg border bg-stone-50 p-2">
                                                <img src={agreement.company_signature} alt="Company signature" className="h-20 w-full object-contain" />
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                                                <CheckCircle className="h-3.5 w-3.5" />
                                                {agreement.company_representative_name && <span>{agreement.company_representative_name} · </span>}
                                                <span>Signed {agreement.company_signed_at}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed">
                                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Clock className="h-3.5 w-3.5" /> Awaiting signature
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sign Dialog */}
            <Dialog open={!!signDialog} onOpenChange={() => setSignDialog(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {signDialog === 'renter' ? 'Renter Signature' : 'Company Representative Signature'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Name</Label>
                            <Input
                                placeholder={signDialog === 'renter' ? agreement.renter_name : 'Representative name'}
                                value={repName}
                                onChange={e => setRepName(e.target.value)}
                            />
                        </div>
                        <SignaturePad
                            label="Draw your signature"
                            value={sig}
                            onChange={setSig}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setSignDialog(null)}>Cancel</Button>
                            <Button onClick={submitSign} disabled={!sig || submitting}>
                                {submitting ? 'Saving…' : 'Confirm Signature'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
