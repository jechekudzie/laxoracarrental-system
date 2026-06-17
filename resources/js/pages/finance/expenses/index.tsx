import { Head, router, setLayoutProps, useForm } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateInput } from '@/components/ui/date-input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/input-error';
import * as Routes from '@/actions/App/Http/Controllers/Web/OperationalExpenseController';
import { dashboard } from '@/routes';
import { index as financeIndex } from '@/routes/finance';

interface OperationalExpense {
    id: number;
    description: string;
    reference_number: string | null;
    category_label: string;
    category: string;
    amount: number;
    currency: string;
    expense_date: string;
    status: string;
    status_label: string;
    cost_center: { id: number; name: string } | null;
    incurred_by: { id: number; full_name: string } | null;
    service_provider: { id: number; name: string } | null;
    payment_method: string | null;
    payment_method_label: string | null;
    receipt_number: string | null;
    is_recurring: boolean;
    recurrence_period: string | null;
    recurrence_period_label: string | null;
    next_due_date: string | null;
    paid_at: string | null;
}

interface UpcomingRecurring {
    id: number;
    description: string;
    amount: number;
    next_due_date: string;
    recurrence_period_label: string | null;
}

interface PaginatedData<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    last_page: number;
    total: number;
    from: number;
    to: number;
}

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const fmt = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export default function ExpensesIndex({
    expenses,
    filters,
    upcoming_recurring,
    categories,
    statuses,
    recurrence_periods,
    cost_centers,
    employees,
    service_providers,
    payment_methods,
}: {
    expenses: PaginatedData<OperationalExpense>;
    filters: { search?: string; status?: string; category?: string; cost_center_id?: string; recurring?: string };
    upcoming_recurring: UpcomingRecurring[];
    categories: { value: string; label: string }[];
    statuses: { value: string; label: string }[];
    recurrence_periods: { value: string; label: string }[];
    cost_centers: { id: number; name: string }[];
    employees: { id: number; full_name: string }[];
    service_providers: { id: number; name: string; category: string }[];
    payment_methods: { value: string; label: string }[];
}) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Finance', href: financeIndex.url() },
            { title: 'Expenses', href: Routes.index.url() },
        ],
    });

    const [search, setSearch] = useState(filters.search ?? '');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<OperationalExpense | null>(null);
    const [payingExpense, setPayingExpense] = useState<OperationalExpense | null>(null);

    function applyFilter(params: Record<string, string>) {
        router.get(Routes.index.url(), { ...filters, ...params }, { preserveState: true, replace: true });
    }

    function openNew() { setEditing(null); setDialogOpen(true); }
    function openEdit(e: OperationalExpense) { setEditing(e); setDialogOpen(true); }

    function handleDelete(e: OperationalExpense) {
        if (confirm(`Remove "${e.description}"?`)) {
            router.delete(Routes.destroy.url({ operationalExpense: e.id }), { preserveScroll: true });
        }
    }

    function handleApprove(e: OperationalExpense) {
        router.post(Routes.approve.url({ operationalExpense: e.id }), {}, { preserveScroll: true });
    }

    return (
        <>
            <Head title="Operational Expenses" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Operational Expenses</h1>
                        <p className="text-sm text-muted-foreground">Track and manage all operational costs, recurring bills, and payments.</p>
                    </div>
                    <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Add Expense</Button>
                </div>

                {/* Upcoming recurring alert */}
                {upcoming_recurring.length > 0 && (
                    <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20">
                        <CardHeader className="pb-2 pt-4 px-4">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-400">
                                <AlertCircle className="h-4 w-4" />
                                {upcoming_recurring.length} recurring expense{upcoming_recurring.length > 1 ? 's' : ''} due within 7 days
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <div className="flex flex-wrap gap-2">
                                {upcoming_recurring.map((r) => (
                                    <div key={r.id} className="flex items-center gap-2 rounded-md border border-amber-200 bg-white px-3 py-1.5 text-xs dark:border-amber-900/50 dark:bg-amber-950/40">
                                        <RefreshCw className="h-3 w-3 text-amber-600" />
                                        <span className="font-medium">{r.description}</span>
                                        <span className="text-muted-foreground">{fmt(r.amount)}</span>
                                        <span className="text-amber-700 dark:text-amber-400">due {r.next_due_date}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="flex flex-wrap items-center gap-3">
                    <form onSubmit={(e) => { e.preventDefault(); applyFilter({ search }); }} className="flex flex-1 gap-2">
                        <Input placeholder="Search expenses…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
                        <Button type="submit" variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
                    </form>

                    <Select value={filters.status ?? ''} onValueChange={(v) => applyFilter({ status: v === 'all' ? '' : v })}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            {statuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={filters.category ?? ''} onValueChange={(v) => applyFilter({ category: v === 'all' ? '' : v })}>
                        <SelectTrigger className="w-44"><SelectValue placeholder="All categories" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All categories</SelectItem>
                            {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={filters.cost_center_id ?? ''} onValueChange={(v) => applyFilter({ cost_center_id: v === 'all' ? '' : v })}>
                        <SelectTrigger className="w-44"><SelectValue placeholder="All cost centers" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All cost centers</SelectItem>
                            {cost_centers.map((cc) => <SelectItem key={cc.id} value={String(cc.id)}>{cc.name}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Button
                        variant={filters.recurring ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => applyFilter({ recurring: filters.recurring ? '' : '1' })}
                        className="gap-2"
                    >
                        <RefreshCw className="h-3.5 w-3.5" /> Recurring only
                    </Button>
                </div>

                {expenses.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                            <p className="text-lg font-semibold">No expenses found</p>
                            <p className="text-sm text-muted-foreground max-w-md">Record operational expenses to keep track of your costs.</p>
                            <Button onClick={openNew} className="mt-2"><Plus className="mr-2 h-4 w-4" /> Add your first expense</Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="px-4 py-3 text-left font-medium">Date</th>
                                            <th className="px-4 py-3 text-left font-medium">Description</th>
                                            <th className="px-4 py-3 text-left font-medium">Category</th>
                                            <th className="px-4 py-3 text-left font-medium">Cost Center</th>
                                            <th className="px-4 py-3 text-right font-medium">Amount</th>
                                            <th className="px-4 py-3 text-left font-medium">Status</th>
                                            <th className="px-4 py-3 text-right font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {expenses.data.map((e) => (
                                            <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{e.expense_date}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        {e.is_recurring && (
                                                            <span title={`Repeats ${e.recurrence_period_label?.toLowerCase()}`}>
                                                                <RefreshCw className="h-3 w-3 shrink-0 text-blue-500" />
                                                            </span>
                                                        )}
                                                        <span className="font-medium">{e.description}</span>
                                                    </div>
                                                    <div className="flex gap-2 text-xs text-muted-foreground">
                                                        {e.service_provider && <span>{e.service_provider.name}</span>}
                                                        {e.reference_number && <span>· Ref: {e.reference_number}</span>}
                                                        {e.paid_at && <span className="text-green-600">· Paid {e.paid_at}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">{e.category_label}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{e.cost_center?.name ?? '—'}</td>
                                                <td className="px-4 py-3 text-right font-medium whitespace-nowrap">{fmt(e.amount)}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[e.status] ?? ''}`}>
                                                        {e.status_label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {e.status === 'pending' && (
                                                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleApprove(e)}>
                                                                Approve
                                                            </Button>
                                                        )}
                                                        {(e.status === 'pending' || e.status === 'approved') && (
                                                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-green-700 border-green-300 hover:bg-green-50" onClick={() => setPayingExpense(e)}>
                                                                <CheckCircle2 className="h-3 w-3" /> Pay
                                                            </Button>
                                                        )}
                                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(e)}>
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(e)}>
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {expenses.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{expenses.from}–{expenses.to} of {expenses.total}</span>
                        <div className="flex gap-1">
                            {expenses.links.map((link, i) => (
                                <Button key={i} variant={link.active ? 'default' : 'outline'} size="sm" disabled={!link.url} onClick={() => link.url && router.get(link.url)} dangerouslySetInnerHTML={{ __html: link.label }} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <ExpenseDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                editing={editing}
                categories={categories}
                statuses={statuses}
                recurrence_periods={recurrence_periods}
                cost_centers={cost_centers}
                employees={employees}
                service_providers={service_providers}
            />

            <MarkPaidDialog
                expense={payingExpense}
                onClose={() => setPayingExpense(null)}
                payment_methods={payment_methods}
            />
        </>
    );
}

function ExpenseDialog({
    open,
    onOpenChange,
    editing,
    categories,
    statuses,
    recurrence_periods,
    cost_centers,
    employees,
    service_providers,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editing: OperationalExpense | null;
    categories: { value: string; label: string }[];
    statuses: { value: string; label: string }[];
    recurrence_periods: { value: string; label: string }[];
    cost_centers: { id: number; name: string }[];
    employees: { id: number; full_name: string }[];
    service_providers: { id: number; name: string; category: string }[];
}) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        description: editing?.description ?? '',
        reference_number: editing?.reference_number ?? '',
        category: editing?.category ?? '',
        amount: String(editing?.amount ?? ''),
        currency: editing?.currency ?? 'USD',
        expense_date: editing?.expense_date ?? '',
        status: editing?.status ?? 'pending',
        cost_center_id: editing?.cost_center?.id ? String(editing.cost_center.id) : '',
        incurred_by: editing?.incurred_by?.id ? String(editing.incurred_by.id) : '',
        service_provider_id: editing?.service_provider?.id ? String(editing.service_provider.id) : '',
        notes: '',
        is_recurring: editing?.is_recurring ?? false,
        recurrence_period: editing?.recurrence_period ?? '',
        next_due_date: editing?.next_due_date ?? '',
        recurrence_end_date: '',
    });

    function handleProviderChange(providerId: string) {
        setData('service_provider_id', providerId);
        // Auto-suggest category from provider's category field
        const provider = service_providers.find((p) => String(p.id) === providerId);
        if (provider && !data.category) {
            const categoryMap: Record<string, string> = {
                mechanic: 'repairs',
                it: 'it',
                security: 'security',
                cleaning: 'cleaning',
                internet: 'it',
                fuel: 'transport',
            };
            const suggested = categoryMap[provider.category.toLowerCase()];
            if (suggested) setData('category', suggested);
        }
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: () => { reset(); onOpenChange(false); } };
        if (editing) {
            put(Routes.update.url({ operationalExpense: editing.id }), opts);
        } else {
            post(Routes.store.url(), opts);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editing ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
                    <DialogDescription>Record an operational expense for tracking and approval.</DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="exp-description">Description</Label>
                        <Input id="exp-description" value={data.description} onChange={(e) => setData('description', e.target.value)} placeholder="Monthly internet bill" />
                        <InputError message={errors.description} />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                        <Label>Service Provider <span className="text-muted-foreground">(optional)</span></Label>
                        <Select value={data.service_provider_id} onValueChange={handleProviderChange}>
                            <SelectTrigger><SelectValue placeholder="None — or select a provider" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {service_providers.map((sp) => (
                                    <SelectItem key={sp.id} value={String(sp.id)}>{sp.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.service_provider_id} />
                    </div>

                    <div className="space-y-1">
                        <Label>Category</Label>
                        <Select value={data.category} onValueChange={(v) => setData('category', v)}>
                            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                            <SelectContent>
                                {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.category} />
                    </div>

                    <div className="space-y-1">
                        <Label>Cost Center</Label>
                        <Select value={data.cost_center_id} onValueChange={(v) => setData('cost_center_id', v)}>
                            <SelectTrigger><SelectValue placeholder="Select cost center" /></SelectTrigger>
                            <SelectContent>
                                {cost_centers.map((cc) => <SelectItem key={cc.id} value={String(cc.id)}>{cc.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.cost_center_id} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="exp-amount">Amount</Label>
                        <Input id="exp-amount" type="number" step="0.01" min="0" value={data.amount} onChange={(e) => setData('amount', e.target.value)} placeholder="0.00" />
                        <InputError message={errors.amount} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="exp-date">Expense Date</Label>
                        <DateInput id="exp-date" value={data.expense_date} onChange={(e) => setData('expense_date', e.target.value)} />
                        <InputError message={errors.expense_date} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="exp-ref">Reference / Invoice #</Label>
                        <Input id="exp-ref" value={data.reference_number} onChange={(e) => setData('reference_number', e.target.value)} placeholder="INV-001" />
                        <InputError message={errors.reference_number} />
                    </div>

                    <div className="space-y-1">
                        <Label>Incurred By <span className="text-muted-foreground">(optional)</span></Label>
                        <Select value={data.incurred_by} onValueChange={(v) => setData('incurred_by', v === 'none' ? '' : v)}>
                            <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {employees.map((emp) => <SelectItem key={emp.id} value={String(emp.id)}>{emp.full_name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.incurred_by} />
                    </div>

                    {editing && (
                        <div className="space-y-1">
                            <Label>Status</Label>
                            <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {statuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.status} />
                        </div>
                    )}

                    {/* Recurring section */}
                    <div className="sm:col-span-2 rounded-lg border p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">Recurring expense</p>
                                <p className="text-xs text-muted-foreground">Enable if this bill repeats on a schedule (rent, internet, subscriptions).</p>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={data.is_recurring}
                                onClick={() => setData('is_recurring', !data.is_recurring)}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${data.is_recurring ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                            >
                                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${data.is_recurring ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {data.is_recurring && (
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <Label>Repeats</Label>
                                    <Select value={data.recurrence_period} onValueChange={(v) => setData('recurrence_period', v)}>
                                        <SelectTrigger><SelectValue placeholder="Select period" /></SelectTrigger>
                                        <SelectContent>
                                            {recurrence_periods.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.recurrence_period} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Next due date</Label>
                                    <DateInput value={data.next_due_date} onChange={(e) => setData('next_due_date', e.target.value)} />
                                    <InputError message={errors.next_due_date} />
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <Label>End date <span className="text-muted-foreground">(optional)</span></Label>
                                    <DateInput value={data.recurrence_end_date} onChange={(e) => setData('recurrence_end_date', e.target.value)} />
                                    <p className="text-xs text-muted-foreground">Leave blank to recur indefinitely.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="sm:col-span-2 mt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing}>{processing ? 'Saving…' : editing ? 'Save Changes' : 'Add Expense'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function MarkPaidDialog({
    expense,
    onClose,
    payment_methods,
}: {
    expense: OperationalExpense | null;
    onClose: () => void;
    payment_methods: { value: string; label: string }[];
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        paid_at: new Date().toISOString().slice(0, 10),
        payment_method: '',
        receipt_number: expense?.receipt_number ?? '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!expense) return;
        post(Routes.markPaid.url({ operationalExpense: expense.id }), {
            preserveScroll: true,
            onSuccess: () => { reset(); onClose(); },
        });
    }

    return (
        <Dialog open={!!expense} onOpenChange={(open) => { if (!open) { reset(); onClose(); } }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                    <DialogDescription>
                        {expense && <>Mark <strong>{expense.description}</strong> ({fmt(expense.amount)}) as paid.</>}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-4">
                    <div className="space-y-1">
                        <Label>Payment Date</Label>
                        <DateInput value={data.paid_at} onChange={(e) => setData('paid_at', e.target.value)} />
                        <InputError message={errors.paid_at} />
                    </div>

                    <div className="space-y-1">
                        <Label>Payment Method</Label>
                        <Select value={data.payment_method} onValueChange={(v) => setData('payment_method', v)}>
                            <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                            <SelectContent>
                                {payment_methods.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.payment_method} />
                    </div>

                    <div className="space-y-1">
                        <Label>Receipt / Reference <span className="text-muted-foreground">(optional)</span></Label>
                        <Input value={data.receipt_number} onChange={(e) => setData('receipt_number', e.target.value)} placeholder="REC-001" />
                        <InputError message={errors.receipt_number} />
                    </div>

                    {expense?.is_recurring && (
                        <div className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                            This is a recurring expense. Recording payment will automatically create the next occurrence.
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
                        <Button type="submit" disabled={processing}>{processing ? 'Recording…' : 'Record Payment'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
