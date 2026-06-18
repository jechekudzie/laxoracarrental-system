import { Head, router, setLayoutProps, useForm } from '@inertiajs/react';
import { Building2, ClipboardList, Pencil, Plus, Receipt, Search, Trash2, TrendingDown, TrendingUp, Users, Wallet } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/input-error';
import * as Routes from '@/actions/App/Http/Controllers/Web/CostCenterController';
import { dashboard } from '@/routes';
import { index as financeIndex } from '@/routes/finance';

interface CostCenter {
    id: number;
    code: string;
    name: string;
    description: string | null;
    budget_amount: number;
    is_active: boolean;
    employees_count: number;
    operational_expenses_count: number;
    requisitions_count: number;
    total_spent: number;
}

interface PaginatedData<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    last_page: number;
    total: number;
    from: number;
    to: number;
}

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export default function CostCentersIndex({
    centers,
    filters,
}: {
    centers: PaginatedData<CostCenter>;
    filters: { search?: string };
}) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Finance', href: financeIndex.url() },
            { title: 'Cost Centers', href: Routes.index.url() },
        ],
    });

    const [search, setSearch] = useState(filters.search ?? '');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<CostCenter | null>(null);
    const [viewing, setViewing] = useState<CostCenter | null>(null);

    const totalBudget = centers.data.reduce((sum, c) => sum + c.budget_amount, 0);
    const totalSpent = centers.data.reduce((sum, c) => sum + c.total_spent, 0);
    const overallPct = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0;

    function applyFilter(params: Record<string, string>) {
        router.get(Routes.index.url(), { ...filters, ...params }, { preserveState: true, replace: true });
    }

    function openNew() {
        setEditing(null);
        setDialogOpen(true);
    }

    function openEdit(center: CostCenter) {
        setEditing(center);
        setDialogOpen(true);
    }

    function handleDelete(center: CostCenter) {
        if (confirm(`Remove cost center "${center.name}"?`)) {
            router.delete(Routes.destroy.url({ costCenter: center.id }), { preserveScroll: true });
        }
    }

    return (
        <>
            <Head title="Cost Centers" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Cost Centers</h1>
                        <p className="text-sm text-muted-foreground">Manage budget allocation and spending across departments.</p>
                    </div>
                    <Button onClick={openNew}>
                        <Plus className="mr-2 h-4 w-4" /> Add Cost Center
                    </Button>
                </div>

                {/* Summary banner */}
                {centers.data.length > 0 && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <Card>
                            <CardContent className="flex items-center gap-4 p-5">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Wallet className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Total Budget</p>
                                    <p className="text-xl font-bold">{formatCurrency(totalBudget)}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="flex items-center gap-4 p-5">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                                    <TrendingUp className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Total Spent</p>
                                    <p className="text-xl font-bold">{formatCurrency(totalSpent)}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-5">
                                <p className="text-xs text-muted-foreground">Overall Utilization</p>
                                <p className="mt-0.5 text-xl font-bold">{overallPct.toFixed(1)}%</p>
                                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        className={`h-full rounded-full transition-all ${overallPct >= 100 ? 'bg-destructive' : overallPct >= 80 ? 'bg-orange-500' : 'bg-primary'}`}
                                        style={{ width: `${overallPct}%` }}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Search bar */}
                <div className="flex flex-wrap items-center gap-3">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            applyFilter({ search });
                        }}
                        className="flex flex-1 gap-2"
                    >
                        <Input
                            placeholder="Search code or name…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-xs"
                        />
                        <Button type="submit" variant="outline" size="icon">
                            <Search className="h-4 w-4" />
                        </Button>
                    </form>
                </div>

                {/* Empty state */}
                {centers.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                <Building2 className="h-7 w-7 text-muted-foreground" />
                            </div>
                            <p className="text-lg font-semibold">No cost centers yet</p>
                            <p className="max-w-md text-sm text-muted-foreground">
                                Create cost centers to track budgets and expenses across departments.
                            </p>
                            <Button onClick={openNew} className="mt-2">
                                <Plus className="mr-2 h-4 w-4" /> Add your first cost center
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    /* Card grid */
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {centers.data.map((c) => {
                            const spentPct = c.budget_amount > 0 ? Math.min(100, (c.total_spent / c.budget_amount) * 100) : 0;
                            const isOverBudget = c.total_spent > c.budget_amount;

                            return (
                                <Card
                                    key={c.id}
                                    className="group relative flex cursor-pointer flex-col overflow-hidden transition-shadow hover:shadow-md"
                                    onClick={() => setViewing(c)}
                                >
                                    {/* Active badge */}
                                    <div className="absolute right-3 top-3">
                                        {c.is_active ? (
                                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                                Inactive
                                            </span>
                                        )}
                                    </div>

                                    <CardContent className="flex flex-1 flex-col gap-4 p-5">
                                        {/* Identity */}
                                        <div className="pr-16">
                                            <div className="flex items-center gap-2">
                                                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
                                                    {c.code}
                                                </span>
                                            </div>
                                            <p className="mt-1.5 font-semibold leading-tight">{c.name}</p>
                                            {c.description && (
                                                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{c.description}</p>
                                            )}
                                        </div>

                                        {/* Budget progress */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">Budget usage</span>
                                                <span className={`font-semibold tabular-nums ${isOverBudget ? 'text-destructive' : 'text-foreground'}`}>
                                                    {spentPct.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className={`h-full rounded-full transition-all ${isOverBudget ? 'bg-destructive' : spentPct >= 80 ? 'bg-orange-500' : 'bg-primary'}`}
                                                    style={{ width: `${spentPct}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between text-xs tabular-nums">
                                                <span className={isOverBudget ? 'font-medium text-destructive' : 'text-muted-foreground'}>
                                                    {formatCurrency(c.total_spent)} spent
                                                </span>
                                                <span className="text-muted-foreground">{formatCurrency(c.budget_amount)}</span>
                                            </div>
                                        </div>

                                        {/* Stats row */}
                                        <div className="grid grid-cols-3 divide-x rounded-lg border text-center text-xs">
                                            <div className="flex flex-col items-center gap-0.5 py-2.5">
                                                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="font-bold">{c.employees_count}</span>
                                                <span className="text-muted-foreground">Employees</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-0.5 py-2.5">
                                                <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="font-bold">{c.operational_expenses_count}</span>
                                                <span className="text-muted-foreground">Expenses</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-0.5 py-2.5">
                                                <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="font-bold">{c.requisitions_count}</span>
                                                <span className="text-muted-foreground">Requisitions</span>
                                            </div>
                                        </div>

                                        {/* Card actions */}
                                        <div
                                            className="flex items-center justify-end gap-1 border-t pt-3"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 gap-1.5 text-xs"
                                                onClick={() => openEdit(c)}
                                            >
                                                <Pencil className="h-3.5 w-3.5" /> Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive"
                                                onClick={() => handleDelete(c)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" /> Delete
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {centers.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            {centers.from}–{centers.to} of {centers.total}
                        </span>
                        <div className="flex gap-1">
                            {centers.links.map((link, i) => (
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

            <CostCenterDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />
            <CostCenterViewModal
                center={viewing}
                onClose={() => setViewing(null)}
                onEdit={(c) => {
                    setViewing(null);
                    openEdit(c);
                }}
            />
        </>
    );
}

function CostCenterViewModal({
    center,
    onClose,
    onEdit,
}: {
    center: CostCenter | null;
    onClose: () => void;
    onEdit: (c: CostCenter) => void;
}) {
    if (!center) return null;

    const spent = center.total_spent;
    const budget = center.budget_amount;
    const remaining = budget - spent;
    const spentPct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
    const isOverBudget = spent > budget;

    return (
        <Dialog open={!!center} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-left">{center.name}</DialogTitle>
                                <p className="font-mono text-xs text-muted-foreground">{center.code}</p>
                            </div>
                        </div>
                        <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${center.is_active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                            {center.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    {center.description && (
                        <DialogDescription className="text-left pt-1">{center.description}</DialogDescription>
                    )}
                </DialogHeader>

                {/* Budget bar */}
                <div className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Budget Usage</span>
                        <span className={`font-semibold ${isOverBudget ? 'text-destructive' : 'text-foreground'}`}>
                            {spentPct.toFixed(1)}%
                        </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${isOverBudget ? 'bg-destructive' : 'bg-primary'}`}
                            style={{ width: `${spentPct}%` }}
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center text-sm">
                        <div>
                            <p className="text-xs text-muted-foreground">Budget</p>
                            <p className="font-semibold">{formatCurrency(budget)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Spent</p>
                            <p className={`font-semibold ${isOverBudget ? 'text-destructive' : ''}`}>{formatCurrency(spent)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Remaining</p>
                            <p className={`font-semibold flex items-center justify-center gap-1 ${remaining < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                                {remaining < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
                                {formatCurrency(Math.abs(remaining))}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Counts */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border p-3 text-center">
                        <Users className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                        <p className="text-xl font-bold">{center.employees_count}</p>
                        <p className="text-xs text-muted-foreground">Employees</p>
                    </div>
                    <div className="rounded-lg border p-3 text-center">
                        <Receipt className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                        <p className="text-xl font-bold">{center.operational_expenses_count}</p>
                        <p className="text-xs text-muted-foreground">Expenses</p>
                    </div>
                    <div className="rounded-lg border p-3 text-center">
                        <ClipboardList className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                        <p className="text-xl font-bold">{center.requisitions_count}</p>
                        <p className="text-xs text-muted-foreground">Requisitions</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                    <Button onClick={() => onEdit(center)}>
                        <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function CostCenterDialog({
    open,
    onOpenChange,
    editing,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editing: CostCenter | null;
}) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        code: editing?.code ?? '',
        name: editing?.name ?? '',
        description: editing?.description ?? '',
        budget_amount: editing?.budget_amount ?? '',
        is_active: editing?.is_active ?? true,
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
            put(Routes.update.url({ costCenter: editing.id }), options);
        } else {
            post(Routes.store.url(), options);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{editing ? 'Edit Cost Center' : 'Add Cost Center'}</DialogTitle>
                    <DialogDescription>Track budget allocation and spending for a department or project.</DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                        <Label htmlFor="cc-code">Code</Label>
                        <Input
                            id="cc-code"
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value)}
                            placeholder="OPS-001"
                        />
                        <InputError message={errors.code} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="cc-name">Name</Label>
                        <Input
                            id="cc-name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Operations"
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="cc-description">Description (optional)</Label>
                        <textarea
                            id="cc-description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={2}
                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            placeholder="Brief description of this cost center…"
                        />
                        <InputError message={errors.description} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="cc-budget">Budget Amount</Label>
                        <Input
                            id="cc-budget"
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.budget_amount}
                            onChange={(e) => setData('budget_amount', e.target.value)}
                            placeholder="0.00"
                        />
                        <InputError message={errors.budget_amount} />
                    </div>

                    <div className="space-y-1">
                        <Label>Status</Label>
                        <Select
                            value={data.is_active ? 'active' : 'inactive'}
                            onValueChange={(v) => setData('is_active', v === 'active')}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.is_active} />
                    </div>

                    <DialogFooter className="sm:col-span-2 mt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving…' : editing ? 'Save Changes' : 'Add Cost Center'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
