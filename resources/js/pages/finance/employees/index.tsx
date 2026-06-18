import { Head, Link, router, setLayoutProps, useForm } from '@inertiajs/react';
import { Building2, DollarSign, Pencil, Plus, Search, Trash2, UserCheck, Users } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/input-error';
import * as Routes from '@/actions/App/Http/Controllers/Web/EmployeeController';
import { dashboard } from '@/routes';
import { index as financeIndex } from '@/routes/finance';

interface Employee {
    id: number;
    employee_number: string;
    full_name: string;
    email: string;
    phone: string | null;
    position: string;
    employment_type: string;
    employment_type_label: string;
    salary_type: string;
    salary_type_label: string;
    base_salary: number;
    hire_date: string;
    is_active: boolean;
    cost_center: { id: number; name: string; code: string } | null;
}

interface PaginatedData<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    last_page: number;
    total: number;
    from: number;
    to: number;
}

interface Summary {
    total: number;
    active: number;
    total_payroll: number;
    departments: number;
}

const fmt = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export default function EmployeesIndex({
    employees,
    filters,
    cost_centers,
    employment_types,
    salary_types,
    summary,
}: {
    employees: PaginatedData<Employee>;
    filters: { search?: string; cost_center_id?: string; status?: string };
    cost_centers: { id: number; name: string; code: string }[];
    employment_types: { value: string; label: string }[];
    salary_types: { value: string; label: string }[];
    summary: Summary;
}) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Finance', href: financeIndex.url() },
            { title: 'Employees', href: Routes.index.url() },
        ],
    });

    const [search, setSearch] = useState(filters.search ?? '');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Employee | null>(null);

    function applyFilter(params: Record<string, string>) {
        router.get(Routes.index.url(), { ...filters, ...params }, { preserveState: true, replace: true });
    }

    function openNew() {
        setEditing(null);
        setDialogOpen(true);
    }

    function openEdit(employee: Employee) {
        setEditing(employee);
        setDialogOpen(true);
    }

    function handleDelete(employee: Employee) {
        if (confirm(`Remove employee "${employee.full_name}"?`)) {
            router.delete(Routes.destroy.url({ employee: employee.id }), { preserveScroll: true });
        }
    }

    return (
        <>
            <Head title="Employees" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Summary stat cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                                Total Employees
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{summary.total}</p>
                            <p className="text-xs text-muted-foreground">All workforce records</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                                Active
                                <UserCheck className="h-4 w-4 text-emerald-500" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{summary.active}</p>
                            <p className="text-xs text-muted-foreground">Currently employed</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                                Monthly Payroll
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{fmt(summary.total_payroll)}</p>
                            <p className="text-xs text-muted-foreground">Active employees total</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                                Departments
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{summary.departments}</p>
                            <p className="text-xs text-muted-foreground">Distinct cost centers</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Page header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
                        <p className="text-sm text-muted-foreground">Manage your workforce and payroll information.</p>
                    </div>
                    <Button onClick={openNew}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Employee
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            applyFilter({ search });
                        }}
                        className="flex flex-1 gap-2"
                    >
                        <Input
                            placeholder="Search name, number, position…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-xs"
                        />
                        <Button type="submit" variant="outline" size="icon">
                            <Search className="h-4 w-4" />
                        </Button>
                    </form>

                    <Select
                        value={filters.cost_center_id ?? 'all'}
                        onValueChange={(v) => applyFilter({ cost_center_id: v === 'all' ? '' : v })}
                    >
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="All Departments" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            {cost_centers.map((cc) => (
                                <SelectItem key={cc.id} value={String(cc.id)}>
                                    {cc.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.status ?? 'all'}
                        onValueChange={(v) => applyFilter({ status: v === 'all' ? '' : v })}
                    >
                        <SelectTrigger className="w-36">
                            <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table / Empty state */}
                {employees.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                                <Users className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-lg font-semibold">No employees found</p>
                            <p className="max-w-md text-sm text-muted-foreground">
                                Add employees to manage payroll, assignments, and department budgets.
                            </p>
                            <Button onClick={openNew} className="mt-2">
                                <Plus className="mr-2 h-4 w-4" />
                                Add your first employee
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employee</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Position / Type</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Department</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Salary</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {employees.data.map((e) => (
                                    <tr key={e.id} className="bg-background transition-colors hover:bg-muted/30">
                                        <td className="px-4 py-3">
                                            <Link
                                                href={Routes.show.url({ employee: e.id })}
                                                className="font-semibold hover:underline"
                                            >
                                                {e.full_name}
                                            </Link>
                                            <div className="font-mono text-xs text-muted-foreground">{e.employee_number}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{e.position}</div>
                                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                {e.employment_type_label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {e.cost_center ? (
                                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                                    {e.cost_center.name}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium tabular-nums">{fmt(e.base_salary)}</td>
                                        <td className="px-4 py-3">
                                            {e.is_active ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button size="sm" variant="outline" asChild>
                                                    <Link href={Routes.show.url({ employee: e.id })}>View profile</Link>
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8"
                                                    onClick={() => openEdit(e)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                    onClick={() => handleDelete(e)}
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
                {employees.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            {employees.from}–{employees.to} of {employees.total}
                        </span>
                        <div className="flex gap-1">
                            {employees.links.map((link, i) => (
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

            <EmployeeDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                editing={editing}
                cost_centers={cost_centers}
                employment_types={employment_types}
                salary_types={salary_types}
            />
        </>
    );
}

function EmployeeDialog({
    open,
    onOpenChange,
    editing,
    cost_centers,
    employment_types,
    salary_types,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editing: Employee | null;
    cost_centers: { id: number; name: string; code: string }[];
    employment_types: { value: string; label: string }[];
    salary_types: { value: string; label: string }[];
}) {
    const nameParts = editing?.full_name?.split(' ') ?? [];
    const defaultFirstName = nameParts[0] ?? '';
    const defaultLastName = nameParts.slice(1).join(' ');

    const { data, setData, post, put, processing, errors, reset } = useForm({
        employee_number: editing?.employee_number ?? '',
        first_name: defaultFirstName,
        last_name: defaultLastName,
        email: editing?.email ?? '',
        phone: editing?.phone ?? '',
        position: editing?.position ?? '',
        employment_type: editing?.employment_type ?? (employment_types[0]?.value ?? ''),
        salary_type: editing?.salary_type ?? (salary_types[0]?.value ?? ''),
        base_salary: editing?.base_salary ?? '',
        hire_date: editing?.hire_date ?? '',
        cost_center_id: editing?.cost_center ? String(editing.cost_center.id) : '',
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
            put(Routes.update.url({ employee: editing.id }), options);
        } else {
            post(Routes.store.url(), options);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{editing ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
                    <DialogDescription>Fill in the employee details, salary, and department assignment.</DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                        <Label htmlFor="emp-number">Employee Number</Label>
                        <Input
                            id="emp-number"
                            value={data.employee_number}
                            onChange={(e) => setData('employee_number', e.target.value)}
                            placeholder="EMP-001"
                        />
                        <InputError message={errors.employee_number} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="emp-hire-date">Hire Date</Label>
                        <DateInput
                            id="emp-hire-date"
                            value={data.hire_date}
                            onChange={(e) => setData('hire_date', e.target.value)}
                        />
                        <InputError message={errors.hire_date} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="emp-first-name">First Name</Label>
                        <Input
                            id="emp-first-name"
                            value={data.first_name}
                            onChange={(e) => setData('first_name', e.target.value)}
                            placeholder="John"
                        />
                        <InputError message={errors.first_name} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="emp-last-name">Last Name</Label>
                        <Input
                            id="emp-last-name"
                            value={data.last_name}
                            onChange={(e) => setData('last_name', e.target.value)}
                            placeholder="Doe"
                        />
                        <InputError message={errors.last_name} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="emp-email">Email</Label>
                        <Input
                            id="emp-email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="john@example.com"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="emp-phone">Phone (optional)</Label>
                        <Input
                            id="emp-phone"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            placeholder="+1 555 …"
                        />
                        <InputError message={errors.phone} />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="emp-position">Position</Label>
                        <Input
                            id="emp-position"
                            value={data.position}
                            onChange={(e) => setData('position', e.target.value)}
                            placeholder="Fleet Manager"
                        />
                        <InputError message={errors.position} />
                    </div>

                    <div className="space-y-1">
                        <Label>Employment Type</Label>
                        <Select value={data.employment_type} onValueChange={(v) => setData('employment_type', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                {employment_types.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>
                                        {t.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.employment_type} />
                    </div>

                    <div className="space-y-1">
                        <Label>Salary Type</Label>
                        <Select value={data.salary_type} onValueChange={(v) => setData('salary_type', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select salary type" />
                            </SelectTrigger>
                            <SelectContent>
                                {salary_types.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>
                                        {t.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.salary_type} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="emp-salary">Base Salary</Label>
                        <Input
                            id="emp-salary"
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.base_salary}
                            onChange={(e) => setData('base_salary', e.target.value)}
                            placeholder="0.00"
                        />
                        <InputError message={errors.base_salary} />
                    </div>

                    <div className="space-y-1">
                        <Label>Department</Label>
                        <Select
                            value={data.cost_center_id || 'none'}
                            onValueChange={(v) => setData('cost_center_id', v === 'none' ? '' : v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="No department" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No department</SelectItem>
                                {cost_centers.map((cc) => (
                                    <SelectItem key={cc.id} value={String(cc.id)}>
                                        {cc.name} ({cc.code})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.cost_center_id} />
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

                    <DialogFooter className="mt-2 sm:col-span-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving…' : editing ? 'Save Changes' : 'Add Employee'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
