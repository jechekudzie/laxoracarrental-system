import { Head, router, setLayoutProps, useForm } from '@inertiajs/react';
import { CreditCard, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/input-error';
import * as Routes from '@/actions/App/Http/Controllers/Web/PaymentMethodController';
import { dashboard } from '@/routes';
import { index as financeIndex } from '@/routes/finance';

interface PaymentMethod {
    id: number;
    name: string;
    code: string;
    description: string | null;
    is_active: boolean;
    sort_order: number;
}

interface PaginatedData<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    last_page: number;
    total: number;
    from: number;
    to: number;
}

export default function PaymentMethodsIndex({
    payment_methods,
    filters,
}: {
    payment_methods: PaginatedData<PaymentMethod>;
    filters: { search?: string };
}) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Finance', href: financeIndex.url() },
            { title: 'Settings', href: '#' },
            { title: 'Payment Methods', href: Routes.index.url() },
        ],
    });

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<PaymentMethod | null>(null);

    function openNew() {
        setEditing(null);
        setDialogOpen(true);
    }

    function openEdit(method: PaymentMethod) {
        setEditing(method);
        setDialogOpen(true);
    }

    function handleDelete(method: PaymentMethod) {
        if (confirm(`Remove payment method "${method.name}"?`)) {
            router.delete(Routes.destroy.url({ paymentMethod: method.id }), { preserveScroll: true });
        }
    }

    return (
        <>
            <Head title="Payment Methods" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Page header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Payment Methods</h1>
                        <p className="text-sm text-muted-foreground">Configure accepted payment methods for expenses and salaries.</p>
                    </div>
                    <Button onClick={openNew}>
                        <Plus className="mr-2 h-4 w-4" /> Add Method
                    </Button>
                </div>

                {/* Empty state */}
                {payment_methods.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                                <CreditCard className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-lg font-semibold">No payment methods yet</p>
                            <p className="max-w-md text-sm text-muted-foreground">
                                Add payment methods to use when recording expenses and transactions.
                            </p>
                            <Button onClick={openNew} className="mt-2">
                                <Plus className="mr-2 h-4 w-4" /> Add your first payment method
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sort</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Code</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {payment_methods.data.map((m) => (
                                    <tr
                                        key={m.id}
                                        className={`bg-background transition-colors hover:bg-muted/30 ${!m.is_active ? 'opacity-50' : ''}`}
                                    >
                                        <td className="px-4 py-3 tabular-nums text-muted-foreground">{m.sort_order}</td>
                                        <td className="px-4 py-3 font-medium">{m.name}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-mono text-xs">
                                                {m.code}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {m.description ?? <span className="italic text-xs">—</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            {m.is_active ? (
                                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8"
                                                    onClick={() => openEdit(m)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                    onClick={() => handleDelete(m)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {payment_methods.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            {payment_methods.from}–{payment_methods.to} of {payment_methods.total}
                        </span>
                        <div className="flex gap-1">
                            {payment_methods.links.map((link, i) => (
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

            <PaymentMethodDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />
        </>
    );
}

function PaymentMethodDialog({
    open,
    onOpenChange,
    editing,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editing: PaymentMethod | null;
}) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: editing?.name ?? '',
        code: editing?.code ?? '',
        description: editing?.description ?? '',
        is_active: editing?.is_active ?? true,
        sort_order: editing?.sort_order ?? 0,
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
            put(Routes.update.url({ paymentMethod: editing.id }), options);
        } else {
            post(Routes.store.url(), options);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle>{editing ? 'Edit Payment Method' : 'Add Payment Method'}</DialogTitle>
                            <DialogDescription>Configure a payment method accepted by the business.</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                        <Label htmlFor="pm-name">Name</Label>
                        <Input
                            id="pm-name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="EcoCash"
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="pm-code">Code</Label>
                        <Input
                            id="pm-code"
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value)}
                            placeholder="ecocash"
                            className="font-mono"
                        />
                        <InputError message={errors.code} />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="pm-description">Description (optional)</Label>
                        <textarea
                            id="pm-description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={2}
                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            placeholder="Brief description…"
                        />
                        <InputError message={errors.description} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="pm-sort">Sort Order</Label>
                        <Input
                            id="pm-sort"
                            type="number"
                            min="0"
                            value={data.sort_order}
                            onChange={(e) => setData('sort_order', Number(e.target.value))}
                        />
                        <InputError message={errors.sort_order} />
                    </div>

                    <div className="space-y-1">
                        <Label>Status</Label>
                        <Select
                            value={data.is_active ? 'active' : 'inactive'}
                            onValueChange={(v) => setData('is_active', v === 'active')}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.is_active} />
                    </div>

                    <DialogFooter className="sm:col-span-2 mt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving…' : editing ? 'Save Changes' : 'Add Payment Method'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
