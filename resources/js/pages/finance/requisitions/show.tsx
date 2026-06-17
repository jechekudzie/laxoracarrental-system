import { Head, Link, router, setLayoutProps, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, XCircle, Package } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import * as Routes from '@/actions/App/Http/Controllers/Web/RequisitionController';
import { dashboard } from '@/routes';
import { index as financeIndex } from '@/routes/finance';

interface RequisitionDetail {
    id: number;
    number: string;
    title: string;
    description: string | null;
    status: string;
    status_label: string;
    priority: string;
    priority_label: string;
    required_by: string;
    total_estimated: number;
    rejection_reason: string | null;
    cost_center: { id: number; name: string } | null;
    requested_by: { id: number; full_name: string } | null;
    created_at: string;
    items: Array<{
        id: number;
        description: string;
        quantity: number;
        unit: string;
        unit_price_estimated: number;
        total_estimated: number;
        supplier_name: string | null;
    }>;
}

const PRIORITY_STYLES: Record<string, string> = {
    low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    fulfilled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

function fmt(amount: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
            <dd className="text-sm">{children}</dd>
        </div>
    );
}

export default function RequisitionShow({ requisition }: { requisition: RequisitionDetail }) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Finance', href: financeIndex.url() },
            { title: 'Requisitions', href: Routes.index.url() },
            { title: requisition.number, href: Routes.show.url({ requisition: requisition.id }) },
        ],
    });

    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

    const { data, setData, processing, errors, reset } = useForm({
        rejection_reason: '',
    });

    function handleApprove() {
        router.post(Routes.approve.url({ requisition: requisition.id }), {}, { preserveScroll: true });
    }

    function handleFulfill() {
        router.post(Routes.fulfill.url({ requisition: requisition.id }), {}, { preserveScroll: true });
    }

    function handleReject(e: React.FormEvent) {
        e.preventDefault();
        router.post(
            Routes.reject.url({ requisition: requisition.id }),
            { rejection_reason: data.rejection_reason },
            {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    setRejectDialogOpen(false);
                },
            },
        );
    }

    return (
        <>
            <Head title={`Requisition ${requisition.number}`} />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href={Routes.index.url()}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-2xl font-bold tracking-tight font-mono">{requisition.number}</h1>
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[requisition.status] ?? ''}`}
                                >
                                    {requisition.status_label}
                                </span>
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_STYLES[requisition.priority] ?? ''}`}
                                >
                                    {requisition.priority_label}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">{requisition.title}</p>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                        {requisition.status === 'pending' && (
                            <>
                                <Button
                                    variant="outline"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => setRejectDialogOpen(true)}
                                >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                </Button>
                                <Button onClick={handleApprove}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                </Button>
                            </>
                        )}
                        {requisition.status === 'approved' && (
                            <Button onClick={handleFulfill}>
                                <Package className="mr-2 h-4 w-4" />
                                Mark Fulfilled
                            </Button>
                        )}
                    </div>
                </div>

                {/* Rejection reason banner */}
                {requisition.rejection_reason && (
                    <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3">
                        <p className="text-sm font-medium text-destructive">Rejection Reason</p>
                        <p className="mt-1 text-sm">{requisition.rejection_reason}</p>
                    </div>
                )}

                {/* Details card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <DetailRow label="Title">{requisition.title}</DetailRow>
                            <DetailRow label="Cost Center">
                                {requisition.cost_center?.name ?? <span className="italic text-muted-foreground">None</span>}
                            </DetailRow>
                            <DetailRow label="Requested By">
                                {requisition.requested_by?.full_name ?? <span className="italic text-muted-foreground">Unknown</span>}
                            </DetailRow>
                            <DetailRow label="Required By">{fmtDate(requisition.required_by)}</DetailRow>
                            <DetailRow label="Created">{fmtDate(requisition.created_at)}</DetailRow>
                            {requisition.description && (
                                <div className="sm:col-span-2 lg:col-span-3 flex flex-col gap-0.5">
                                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</dt>
                                    <dd className="text-sm whitespace-pre-wrap">{requisition.description}</dd>
                                </div>
                            )}
                        </dl>
                    </CardContent>
                </Card>

                {/* Items table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Line Items</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        <th className="px-4 py-3">Description</th>
                                        <th className="px-4 py-3 w-20">Qty</th>
                                        <th className="px-4 py-3 w-20">Unit</th>
                                        <th className="px-4 py-3 w-36 text-right">Est. Unit Price</th>
                                        <th className="px-4 py-3">Supplier</th>
                                        <th className="px-4 py-3 w-32 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {requisition.items.map((item) => (
                                        <tr key={item.id} className="transition-colors hover:bg-muted/30">
                                            <td className="px-4 py-3 font-medium">{item.description}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{item.quantity}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{item.unit}</td>
                                            <td className="px-4 py-3 text-right">{fmt(item.unit_price_estimated)}</td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {item.supplier_name ?? <span className="italic">—</span>}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold">{fmt(item.total_estimated)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t px-4 py-3">
                            <span className="text-sm text-muted-foreground">Estimated Total</span>
                            <span className="text-lg font-bold">{fmt(requisition.total_estimated)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Reject dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Reject Requisition</DialogTitle>
                        <DialogDescription>
                            Provide a reason for rejecting{' '}
                            <span className="font-semibold">{requisition.number}</span>. This will be visible to the requester.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleReject} className="space-y-4">
                        <div className="space-y-1">
                            <Label htmlFor="rejection-reason">Rejection Reason</Label>
                            <textarea
                                id="rejection-reason"
                                value={data.rejection_reason}
                                onChange={(e) => setData('rejection_reason', e.target.value)}
                                rows={3}
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                placeholder="Explain why this requisition is being rejected…"
                            />
                            <InputError message={errors.rejection_reason} />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    reset();
                                    setRejectDialogOpen(false);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" variant="destructive" disabled={processing}>
                                {processing ? 'Rejecting…' : 'Reject Requisition'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
