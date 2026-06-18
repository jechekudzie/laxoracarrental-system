import { Head, router, setLayoutProps, useForm } from '@inertiajs/react';
import { ListChecks, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/input-error';
import * as Routes from '@/actions/App/Http/Controllers/Web/ExpenseTemplateController';
import { dashboard } from '@/routes';
import { index as financeIndex } from '@/routes/finance';

interface Category {
    value: string;
    label: string;
}

interface IdName {
    id: number;
    name: string;
}

interface ExpenseTemplate {
    id: number;
    category: string;
    description: string;
    default_cost_center_id: number | null;
    cost_center: IdName | null;
    default_service_provider_id: number | null;
    service_provider: IdName | null;
    typical_amount: number | null;
    is_active: boolean;
    sort_order: number;
}

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export default function ExpenseTemplatesIndex({
    templates,
    filters,
    categories,
    cost_centers,
    service_providers,
}: {
    templates: ExpenseTemplate[];
    filters: { category?: string };
    categories: Category[];
    cost_centers: IdName[];
    service_providers: IdName[];
}) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Finance', href: financeIndex.url() },
            { title: 'Settings', href: '#' },
            { title: 'Expense Templates', href: Routes.index.url() },
        ],
    });

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<ExpenseTemplate | null>(null);

    function openNew() {
        setEditing(null);
        setDialogOpen(true);
    }

    function openEdit(template: ExpenseTemplate) {
        setEditing(template);
        setDialogOpen(true);
    }

    function handleDelete(template: ExpenseTemplate) {
        if (confirm(`Remove template "${template.description}"?`)) {
            router.delete(Routes.destroy.url({ expenseTemplate: template.id }), { preserveScroll: true });
        }
    }

    function applyFilter(category: string) {
        router.get(Routes.index.url(), category ? { category } : {}, { preserveState: true, replace: true });
    }

    // Group templates by category value
    const grouped = templates.reduce<Record<string, ExpenseTemplate[]>>((acc, t) => {
        if (!acc[t.category]) {
            acc[t.category] = [];
        }
        acc[t.category].push(t);
        return acc;
    }, {});

    const categoryLabel = (value: string) =>
        categories.find((c) => c.value === value)?.label ?? value;

    return (
        <>
            <Head title="Expense Templates" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Page header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Expense Templates</h1>
                        <p className="text-sm text-muted-foreground">Define suggested line items per expense category.</p>
                    </div>
                    <Button onClick={openNew}>
                        <Plus className="mr-2 h-4 w-4" /> Add Template
                    </Button>
                </div>

                {/* Category filter */}
                <div className="flex flex-wrap items-center gap-3">
                    <Select
                        value={filters.category ?? 'all'}
                        onValueChange={(v) => applyFilter(v === 'all' ? '' : v)}
                    >
                        <SelectTrigger className="w-52">
                            <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All categories</SelectItem>
                            {categories.map((c) => (
                                <SelectItem key={c.value} value={c.value}>
                                    {c.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Empty state */}
                {templates.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                                <ListChecks className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-lg font-semibold">No expense templates yet</p>
                            <p className="max-w-md text-sm text-muted-foreground">
                                Create templates for common expenses to pre-fill cost centers and amounts.
                            </p>
                            <Button onClick={openNew} className="mt-2">
                                <Plus className="mr-2 h-4 w-4" /> Add your first template
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex flex-col gap-6">
                        {Object.entries(grouped).map(([category, items]) => (
                            <div key={category}>
                                {/* Category section header with count badge */}
                                <div className="mb-3 flex items-center gap-2">
                                    <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                        {categoryLabel(category)}
                                    </h2>
                                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                        {items.length}
                                    </span>
                                </div>

                                <div className="overflow-x-auto rounded-lg border">
                                    <table className="w-full text-sm">
                                        <thead className="border-b bg-muted/50">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cost Center</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Service Provider</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Typical Amount</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                                <th className="px-4 py-3" />
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {items.map((t) => (
                                                <tr
                                                    key={t.id}
                                                    className={`bg-background transition-colors hover:bg-muted/30 ${!t.is_active ? 'opacity-50' : ''}`}
                                                >
                                                    <td className="px-4 py-3 font-medium">{t.description}</td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {t.cost_center?.name ?? <span className="italic text-xs">—</span>}
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {t.service_provider?.name ?? <span className="italic text-xs">—</span>}
                                                    </td>
                                                    <td className="px-4 py-3 tabular-nums">
                                                        {t.typical_amount != null ? (
                                                            formatCurrency(t.typical_amount)
                                                        ) : (
                                                            <span className="italic text-xs text-muted-foreground">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {t.is_active ? (
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
                                                                onClick={() => openEdit(t)}
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                                onClick={() => handleDelete(t)}
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
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ExpenseTemplateDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                editing={editing}
                categories={categories}
                cost_centers={cost_centers}
                service_providers={service_providers}
            />
        </>
    );
}

function ExpenseTemplateDialog({
    open,
    onOpenChange,
    editing,
    categories,
    cost_centers,
    service_providers,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editing: ExpenseTemplate | null;
    categories: Category[];
    cost_centers: IdName[];
    service_providers: IdName[];
}) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        category: editing?.category ?? '',
        description: editing?.description ?? '',
        default_cost_center_id: editing?.default_cost_center_id ? String(editing.default_cost_center_id) : '',
        default_service_provider_id: editing?.default_service_provider_id ? String(editing.default_service_provider_id) : '',
        typical_amount: editing?.typical_amount != null ? String(editing.typical_amount) : '',
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
            put(Routes.update.url({ expenseTemplate: editing.id }), options);
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
                            <ListChecks className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle>{editing ? 'Edit Expense Template' : 'Add Expense Template'}</DialogTitle>
                            <DialogDescription>
                                Pre-configure common expense entries with default cost centers and amounts.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                        <Label>Category</Label>
                        <Select value={data.category} onValueChange={(v) => setData('category', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((c) => (
                                    <SelectItem key={c.value} value={c.value}>
                                        {c.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.category} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="et-sort">Sort Order</Label>
                        <Input
                            id="et-sort"
                            type="number"
                            min="0"
                            value={data.sort_order}
                            onChange={(e) => setData('sort_order', Number(e.target.value))}
                        />
                        <InputError message={errors.sort_order} />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="et-description">Description</Label>
                        <Input
                            id="et-description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="e.g. Engine Service"
                        />
                        <InputError message={errors.description} />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                        <Label>Default Cost Center (optional)</Label>
                        <Select
                            value={data.default_cost_center_id || 'none'}
                            onValueChange={(v) => setData('default_cost_center_id', v === 'none' ? '' : v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {cost_centers.map((cc) => (
                                    <SelectItem key={cc.id} value={String(cc.id)}>
                                        {cc.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.default_cost_center_id} />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                        <Label>Default Service Provider (optional)</Label>
                        <Select
                            value={data.default_service_provider_id || 'none'}
                            onValueChange={(v) => setData('default_service_provider_id', v === 'none' ? '' : v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {service_providers.map((sp) => (
                                    <SelectItem key={sp.id} value={String(sp.id)}>
                                        {sp.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.default_service_provider_id} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="et-amount">Typical Amount (optional)</Label>
                        <Input
                            id="et-amount"
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.typical_amount}
                            onChange={(e) => setData('typical_amount', e.target.value)}
                            placeholder="0.00"
                        />
                        <InputError message={errors.typical_amount} />
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
                            {processing ? 'Saving…' : editing ? 'Save Changes' : 'Add Template'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
