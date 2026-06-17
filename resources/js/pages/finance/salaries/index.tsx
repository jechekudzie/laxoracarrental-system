import { Head, router, setLayoutProps, useForm } from '@inertiajs/react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/input-error';
import * as Routes from '@/actions/App/Http/Controllers/Web/SalaryController';
import { dashboard } from '@/routes';
import { index as financeIndex } from '@/routes/finance';

interface Salary {
    id: number;
    employee: {
        id: number;
        full_name: string;
        employee_number: string;
        position: string;
        cost_center: { name: string } | null;
    };
    period_start: string;
    period_end: string;
    pay_date: string | null;
    basic_salary: number;
    gross_salary: number;
    net_salary: number;
    status: string;
    status_label: string;
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
    processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

const fmt = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

interface AllowanceDeduction {
    label: string;
    amount: string;
}

export default function SalariesIndex({
    salaries,
    filters,
    statuses,
    employees,
    summary,
}: {
    salaries: PaginatedData<Salary>;
    filters: { search?: string; status?: string; employee_id?: string };
    statuses: { value: string; label: string }[];
    employees: { id: number; full_name: string; employee_number: string }[];
    summary: { total_pending: number; paid_this_month: number };
}) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Finance', href: financeIndex.url() },
            { title: 'Salaries', href: Routes.index.url() },
        ],
    });

    const [search, setSearch] = useState(filters.search ?? '');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Salary | null>(null);
    const [markPaidOpen, setMarkPaidOpen] = useState(false);
    const [selectedSalary, setSelectedSalary] = useState<Salary | null>(null);

    function applyFilter(params: Record<string, string>) {
        router.get(Routes.index.url(), { ...filters, ...params }, { preserveState: true, replace: true });
    }

    function openNew() {
        setEditing(null);
        setDialogOpen(true);
    }

    function openEdit(salary: Salary) {
        setEditing(salary);
        setDialogOpen(true);
    }

    function handleDelete(salary: Salary) {
        if (confirm(`Remove salary for ${salary.employee.full_name}?`)) {
            router.delete(Routes.destroy.url({ salary: salary.id }), { preserveScroll: true });
        }
    }

    function openMarkPaid(salary: Salary) {
        setSelectedSalary(salary);
        setMarkPaidOpen(true);
    }

    return (
        <>
            <Head title="Salaries" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pending</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{fmt(summary.total_pending)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Paid This Month</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{fmt(summary.paid_this_month)}</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Salaries</h1>
                        <p className="text-sm text-muted-foreground">Manage employee salary records and payments.</p>
                    </div>
                    <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Add Salary</Button>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            applyFilter({ search });
                        }}
                        className="flex flex-1 gap-2"
                    >
                        <Input
                            placeholder="Search employee…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-xs"
                        />
                        <Button type="submit" variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
                    </form>

                    <Select value={filters.status ?? ''} onValueChange={(v) => applyFilter({ status: v === 'all' ? '' : v })}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            {statuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={filters.employee_id ?? ''} onValueChange={(v) => applyFilter({ employee_id: v === 'all' ? '' : v })}>
                        <SelectTrigger className="w-48"><SelectValue placeholder="All employees" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All employees</SelectItem>
                            {employees.map((emp) => <SelectItem key={emp.id} value={String(emp.id)}>{emp.full_name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                {salaries.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                            <p className="text-lg font-semibold">No salary records found</p>
                            <p className="text-sm text-muted-foreground max-w-md">Add salary records to manage employee pay.</p>
                            <Button onClick={openNew} className="mt-2"><Plus className="mr-2 h-4 w-4" /> Add first salary</Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="px-4 py-3 text-left font-medium">Employee</th>
                                            <th className="px-4 py-3 text-left font-medium">Period</th>
                                            <th className="px-4 py-3 text-right font-medium">Basic</th>
                                            <th className="px-4 py-3 text-right font-medium">Gross</th>
                                            <th className="px-4 py-3 text-right font-medium">Net</th>
                                            <th className="px-4 py-3 text-left font-medium">Status</th>
                                            <th className="px-4 py-3 text-left font-medium">Pay Date</th>
                                            <th className="px-4 py-3 text-right font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {salaries.data.map((s) => (
                                            <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium">{s.employee.full_name}</div>
                                                    <div className="text-xs text-muted-foreground">{s.employee.employee_number}</div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                                    {s.period_start} – {s.period_end}
                                                </td>
                                                <td className="px-4 py-3 text-right whitespace-nowrap">{fmt(s.basic_salary)}</td>
                                                <td className="px-4 py-3 text-right whitespace-nowrap">{fmt(s.gross_salary)}</td>
                                                <td className="px-4 py-3 text-right font-medium whitespace-nowrap">{fmt(s.net_salary)}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[s.status] ?? ''}`}>
                                                        {s.status_label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{s.pay_date ?? '—'}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {(s.status === 'pending' || s.status === 'processing') && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 text-xs"
                                                                onClick={() => openMarkPaid(s)}
                                                            >
                                                                Mark Paid
                                                            </Button>
                                                        )}
                                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(s)}>
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                                            onClick={() => handleDelete(s)}
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
                        </CardContent>
                    </Card>
                )}

                {salaries.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{salaries.from}–{salaries.to} of {salaries.total}</span>
                        <div className="flex gap-1">
                            {salaries.links.map((link, i) => (
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

            <SalaryDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                editing={editing}
                employees={employees}
            />

            <MarkPaidDialog
                open={markPaidOpen}
                onOpenChange={setMarkPaidOpen}
                salary={selectedSalary}
            />
        </>
    );
}

function SalaryDialog({
    open,
    onOpenChange,
    editing,
    employees,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editing: Salary | null;
    employees: { id: number; full_name: string; employee_number: string }[];
}) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        employee_id: editing?.employee?.id ? String(editing.employee.id) : '',
        period_start: editing?.period_start ?? '',
        period_end: editing?.period_end ?? '',
        basic_salary: editing?.basic_salary ?? '',
    });

    const [allowances, setAllowances] = useState<AllowanceDeduction[]>([]);
    const [deductions, setDeductions] = useState<AllowanceDeduction[]>([]);

    function addAllowance() {
        setAllowances((prev) => [...prev, { label: '', amount: '' }]);
    }

    function removeAllowance(index: number) {
        setAllowances((prev) => prev.filter((_, i) => i !== index));
    }

    function updateAllowance(index: number, field: keyof AllowanceDeduction, value: string) {
        setAllowances((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
    }

    function addDeduction() {
        setDeductions((prev) => [...prev, { label: '', amount: '' }]);
    }

    function removeDeduction(index: number) {
        setDeductions((prev) => prev.filter((_, i) => i !== index));
    }

    function updateDeduction(index: number, field: keyof AllowanceDeduction, value: string) {
        setDeductions((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setAllowances([]);
                setDeductions([]);
                onOpenChange(false);
            },
        };
        if (editing) {
            put(Routes.update.url({ salary: editing.id }), options);
        } else {
            router.post(Routes.store.url(), { ...data, allowances, deductions }, {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    setAllowances([]);
                    setDeductions([]);
                    onOpenChange(false);
                },
            });
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editing ? 'Edit Salary' : 'Add Salary'}</DialogTitle>
                    <DialogDescription>Set salary details including allowances and deductions.</DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1 sm:col-span-2">
                        <Label>Employee</Label>
                        <Select value={data.employee_id} onValueChange={(v) => setData('employee_id', v)}>
                            <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                            <SelectContent>
                                {employees.map((emp) => (
                                    <SelectItem key={emp.id} value={String(emp.id)}>
                                        {emp.full_name} ({emp.employee_number})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.employee_id} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="sal-period-start">Period Start</Label>
                        <DateInput
                            id="sal-period-start"
                            value={data.period_start}
                            onChange={(e) => setData('period_start', e.target.value)}
                        />
                        <InputError message={errors.period_start} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="sal-period-end">Period End</Label>
                        <DateInput
                            id="sal-period-end"
                            value={data.period_end}
                            onChange={(e) => setData('period_end', e.target.value)}
                        />
                        <InputError message={errors.period_end} />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="sal-basic">Basic Salary</Label>
                        <Input
                            id="sal-basic"
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.basic_salary}
                            onChange={(e) => setData('basic_salary', e.target.value)}
                            placeholder="0.00"
                        />
                        <InputError message={errors.basic_salary} />
                    </div>

                    {/* Allowances */}
                    <div className="space-y-3 sm:col-span-2">
                        <div className="flex items-center justify-between">
                            <Label>Allowances</Label>
                            <Button type="button" size="sm" variant="outline" onClick={addAllowance}>
                                <Plus className="mr-1 h-3.5 w-3.5" /> Add Allowance
                            </Button>
                        </div>
                        {allowances.map((allowance, index) => (
                            <div key={index} className="flex gap-2 items-start">
                                <div className="flex-1 space-y-1">
                                    <Input
                                        placeholder="Label (e.g. Transport)"
                                        value={allowance.label}
                                        onChange={(e) => updateAllowance(index, 'label', e.target.value)}
                                    />
                                </div>
                                <div className="w-32 space-y-1">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={allowance.amount}
                                        onChange={(e) => updateAllowance(index, 'amount', e.target.value)}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-9 w-9 text-destructive hover:text-destructive"
                                    onClick={() => removeAllowance(index)}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    {/* Deductions */}
                    <div className="space-y-3 sm:col-span-2">
                        <div className="flex items-center justify-between">
                            <Label>Deductions</Label>
                            <Button type="button" size="sm" variant="outline" onClick={addDeduction}>
                                <Plus className="mr-1 h-3.5 w-3.5" /> Add Deduction
                            </Button>
                        </div>
                        {deductions.map((deduction, index) => (
                            <div key={index} className="flex gap-2 items-start">
                                <div className="flex-1 space-y-1">
                                    <Input
                                        placeholder="Label (e.g. Tax)"
                                        value={deduction.label}
                                        onChange={(e) => updateDeduction(index, 'label', e.target.value)}
                                    />
                                </div>
                                <div className="w-32 space-y-1">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={deduction.amount}
                                        onChange={(e) => updateDeduction(index, 'amount', e.target.value)}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-9 w-9 text-destructive hover:text-destructive"
                                    onClick={() => removeDeduction(index)}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    <DialogFooter className="sm:col-span-2 mt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing}>{processing ? 'Saving…' : editing ? 'Save Changes' : 'Add Salary'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function MarkPaidDialog({
    open,
    onOpenChange,
    salary,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    salary: Salary | null;
}) {
    const [payDate, setPayDate] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [paymentReference, setPaymentReference] = useState('');
    const [processing, setProcessing] = useState(false);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!salary) { return; }
        setProcessing(true);
        router.post(
            Routes.markPaid.url({ salary: salary.id }),
            { pay_date: payDate, payment_method: paymentMethod, payment_reference: paymentReference },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setPayDate('');
                    setPaymentMethod('');
                    setPaymentReference('');
                    onOpenChange(false);
                },
                onFinish: () => setProcessing(false),
            },
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Mark Salary as Paid</DialogTitle>
                    <DialogDescription>
                        {salary ? `Record payment for ${salary.employee.full_name}` : 'Record payment details.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="mp-pay-date">Pay Date</Label>
                        <DateInput
                            id="mp-pay-date"
                            value={payDate}
                            onChange={(e) => setPayDate(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="mp-method">Payment Method</Label>
                        <Input
                            id="mp-method"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            placeholder="Bank transfer, cash…"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="mp-ref">Payment Reference</Label>
                        <Input
                            id="mp-ref"
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value)}
                            placeholder="Transaction ID or reference"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing}>{processing ? 'Saving…' : 'Mark as Paid'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
