import { Head, Link, router, setLayoutProps, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/input-error';
import * as Routes from '@/actions/App/Http/Controllers/Web/RequisitionController';
import { dashboard } from '@/routes';
import { index as financeIndex } from '@/routes/finance';

interface LineItem {
    description: string;
    quantity: number;
    unit: string;
    unit_price_estimated: number;
    supplier_name: string;
}

function fmt(amount: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

const DEFAULT_LINE_ITEM: LineItem = {
    description: '',
    quantity: 1,
    unit: 'pcs',
    unit_price_estimated: 0,
    supplier_name: '',
};

export default function RequisitionsCreate({
    cost_centers,
    priorities,
    next_number,
}: {
    cost_centers: { id: number; name: string }[];
    priorities: { value: string; label: string }[];
    next_number: string;
}) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Finance', href: financeIndex.url() },
            { title: 'Requisitions', href: Routes.index.url() },
            { title: 'New Requisition', href: Routes.create.url() },
        ],
    });

    const { data, setData, processing, errors } = useForm({
        number: next_number,
        title: '',
        description: '',
        cost_center_id: '',
        priority: 'medium',
        required_by: '',
    });

    const [lineItems, setLineItems] = useState<LineItem[]>([{ ...DEFAULT_LINE_ITEM }]);

    function addRow() {
        setLineItems((prev) => [...prev, { ...DEFAULT_LINE_ITEM }]);
    }

    function removeRow(index: number) {
        setLineItems((prev) => prev.filter((_, i) => i !== index));
    }

    function updateRow<K extends keyof LineItem>(index: number, field: K, value: LineItem[K]) {
        setLineItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
    }

    const runningTotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price_estimated, 0);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        router.post(Routes.store.url(), { ...data, items: lineItems }, { preserveScroll: true });
    }

    return (
        <>
            <Head title="New Requisition" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href={Routes.index.url()}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">New Requisition</h1>
                        <p className="text-sm text-muted-foreground">Submit a purchase requisition for approval.</p>
                    </div>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-6">
                    {/* Header details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Requisition Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1">
                                <Label htmlFor="req-number">Requisition Number</Label>
                                <Input
                                    id="req-number"
                                    value={data.number}
                                    readOnly
                                    className="bg-muted text-muted-foreground"
                                />
                                <InputError message={errors.number} />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="req-priority">Priority</Label>
                                <Select value={data.priority} onValueChange={(v) => setData('priority', v)}>
                                    <SelectTrigger id="req-priority">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {priorities.map((p) => (
                                            <SelectItem key={p.value} value={p.value}>
                                                {p.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.priority} />
                            </div>

                            <div className="space-y-1 sm:col-span-2">
                                <Label htmlFor="req-title">Title</Label>
                                <Input
                                    id="req-title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="Brief description of what is needed"
                                />
                                <InputError message={errors.title} />
                            </div>

                            <div className="space-y-1 sm:col-span-2">
                                <Label htmlFor="req-description">Description</Label>
                                <textarea
                                    id="req-description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    placeholder="Provide additional context or justification…"
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="req-cost-center">Cost Center</Label>
                                <Select value={data.cost_center_id} onValueChange={(v) => setData('cost_center_id', v)}>
                                    <SelectTrigger id="req-cost-center">
                                        <SelectValue placeholder="Select cost center" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cost_centers.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.cost_center_id} />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="req-required-by">Required By</Label>
                                <DateInput
                                    id="req-required-by"
                                    value={data.required_by}
                                    onChange={(e) => setData('required_by', e.target.value)}
                                />
                                <InputError message={errors.required_by} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Line items */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base">Line Items</CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={addRow}>
                                <Plus className="mr-2 h-4 w-4" /> Add Row
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            <th className="px-4 py-3">Description</th>
                                            <th className="px-4 py-3 w-24">Qty</th>
                                            <th className="px-4 py-3 w-24">Unit</th>
                                            <th className="px-4 py-3 w-36">Unit Price (Est.)</th>
                                            <th className="px-4 py-3 w-32 text-right">Total</th>
                                            <th className="px-4 py-3">Supplier</th>
                                            <th className="px-4 py-3 w-12" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {lineItems.map((item, i) => (
                                            <tr key={i}>
                                                <td className="px-3 py-2">
                                                    <Input
                                                        value={item.description}
                                                        onChange={(e) => updateRow(i, 'description', e.target.value)}
                                                        placeholder="Item description"
                                                        className="h-8"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateRow(i, 'quantity', Number(e.target.value))}
                                                        className="h-8"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <Input
                                                        value={item.unit}
                                                        onChange={(e) => updateRow(i, 'unit', e.target.value)}
                                                        placeholder="pcs"
                                                        className="h-8"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.unit_price_estimated}
                                                        onChange={(e) => updateRow(i, 'unit_price_estimated', Number(e.target.value))}
                                                        className="h-8"
                                                    />
                                                </td>
                                                <td className="px-3 py-2 text-right font-medium">
                                                    {fmt(item.quantity * item.unit_price_estimated)}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <Input
                                                        value={item.supplier_name}
                                                        onChange={(e) => updateRow(i, 'supplier_name', e.target.value)}
                                                        placeholder="Supplier name"
                                                        className="h-8"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                                        onClick={() => removeRow(i)}
                                                        disabled={lineItems.length === 1}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex items-center justify-end gap-3 border-t px-4 py-3">
                                <span className="text-sm text-muted-foreground">Estimated Total</span>
                                <span className="text-lg font-bold">{fmt(runningTotal)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-3">
                        <Button type="button" variant="outline" asChild>
                            <Link href={Routes.index.url()}>Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Submitting…' : 'Submit Requisition'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
