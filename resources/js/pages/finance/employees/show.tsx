import { Head, Link, setLayoutProps, useForm } from '@inertiajs/react';
import { ArrowLeft, Pencil } from 'lucide-react';
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

interface EmployeeDetail {
    id: number;
    employee_number: string;
    full_name: string;
    first_name: string;
    last_name: string;
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

interface RecentTask {
    id: number;
    title: string;
    status: string;
    status_label: string;
    priority: string;
    priority_label: string;
    due_date: string | null;
    vehicle: string | null;
}

interface RecentSalary {
    id: number;
    period_start: string;
    period_end: string;
    net_salary: number;
    status: string;
    status_label: string;
}

const PRIORITY_STYLES: Record<string, string> = {
    low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const TASK_STATUS_STYLES: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const SALARY_STATUS_STYLES: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

function fmt(amount: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function EmployeeShow({
    employee,
    recent_tasks,
    recent_salaries,
    employment_types,
    salary_types,
    cost_centers,
}: {
    employee: EmployeeDetail;
    recent_tasks: RecentTask[];
    recent_salaries: RecentSalary[];
    employment_types: { value: string; label: string }[];
    salary_types: { value: string; label: string }[];
    cost_centers: { id: number; name: string; code: string }[];
}) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Finance', href: financeIndex.url() },
            { title: 'Employees', href: Routes.index.url() },
            { title: employee.full_name, href: Routes.show.url({ employee: employee.id }) },
        ],
    });

    const [editOpen, setEditOpen] = useState(false);

    return (
        <>
            <Head title={employee.full_name} />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 flex-wrap">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={Routes.index.url()}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-2xl font-bold tracking-tight">{employee.full_name}</h1>
                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium font-mono">
                                    {employee.employee_number}
                                </span>
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                    employee.is_active
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                }`}>
                                    {employee.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">{employee.position}</p>
                        </div>
                    </div>
                    <Button onClick={() => setEditOpen(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Employee
                    </Button>
                </div>

                {/* Details card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Employee Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                            <div>
                                <dt className="text-muted-foreground">Email</dt>
                                <dd className="mt-0.5 font-medium">{employee.email}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">Phone</dt>
                                <dd className="mt-0.5 font-medium">{employee.phone ?? '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">Position</dt>
                                <dd className="mt-0.5 font-medium">{employee.position}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">Employment Type</dt>
                                <dd className="mt-0.5 font-medium">{employee.employment_type_label}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">Salary Type</dt>
                                <dd className="mt-0.5 font-medium">{employee.salary_type_label}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">Base Salary</dt>
                                <dd className="mt-0.5 font-medium">{fmt(employee.base_salary)}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">Hire Date</dt>
                                <dd className="mt-0.5 font-medium">{fmtDate(employee.hire_date)}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">Cost Center</dt>
                                <dd className="mt-0.5 font-medium">
                                    {employee.cost_center
                                        ? `${employee.cost_center.name} (${employee.cost_center.code})`
                                        : '—'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">Status</dt>
                                <dd className="mt-0.5">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                        employee.is_active
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                    }`}>
                                        {employee.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                {/* Recent Tasks */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Recent Tasks</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    <th className="px-4 py-3">Title</th>
                                    <th className="px-4 py-3">Priority</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Due Date</th>
                                    <th className="px-4 py-3">Vehicle</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {recent_tasks.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                                            No tasks assigned to this employee.
                                        </td>
                                    </tr>
                                )}
                                {recent_tasks.map((task) => (
                                    <tr key={task.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-medium">{task.title}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[task.priority] ?? ''}`}>
                                                {task.priority_label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TASK_STATUS_STYLES[task.status] ?? ''}`}>
                                                {task.status_label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {task.due_date ? fmtDate(task.due_date) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{task.vehicle ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Recent Salaries */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Recent Salaries</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    <th className="px-4 py-3">Period</th>
                                    <th className="px-4 py-3 text-right">Net Salary</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {recent_salaries.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-12 text-center text-muted-foreground">
                                            No salary records for this employee.
                                        </td>
                                    </tr>
                                )}
                                {recent_salaries.map((salary) => (
                                    <tr key={salary.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {fmtDate(salary.period_start)} — {fmtDate(salary.period_end)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold">{fmt(salary.net_salary)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SALARY_STATUS_STYLES[salary.status] ?? ''}`}>
                                                {salary.status_label}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>

            <EditEmployeeDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                employee={employee}
                employment_types={employment_types}
                salary_types={salary_types}
                cost_centers={cost_centers}
            />
        </>
    );
}

function EditEmployeeDialog({
    open,
    onOpenChange,
    employee,
    employment_types,
    salary_types,
    cost_centers,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employee: EmployeeDetail;
    employment_types: { value: string; label: string }[];
    salary_types: { value: string; label: string }[];
    cost_centers: { id: number; name: string; code: string }[];
}) {
    const { data, setData, put, processing, errors, reset } = useForm({
        employee_number: employee.employee_number,
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        phone: employee.phone ?? '',
        position: employee.position,
        employment_type: employee.employment_type,
        salary_type: employee.salary_type,
        base_salary: String(employee.base_salary),
        hire_date: employee.hire_date,
        cost_center_id: employee.cost_center ? String(employee.cost_center.id) : '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(Routes.update.url({ employee: employee.id }), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit Employee</DialogTitle>
                    <DialogDescription>Update the details for {employee.full_name}.</DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                        <Label htmlFor="emp-number">Employee Number</Label>
                        <Input
                            id="emp-number"
                            value={data.employee_number}
                            onChange={(e) => setData('employee_number', e.target.value)}
                        />
                        <InputError message={errors.employee_number} />
                    </div>

                    <div className="space-y-1">
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
                        <Label htmlFor="emp-first-name">First Name</Label>
                        <Input
                            id="emp-first-name"
                            value={data.first_name}
                            onChange={(e) => setData('first_name', e.target.value)}
                        />
                        <InputError message={errors.first_name} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="emp-last-name">Last Name</Label>
                        <Input
                            id="emp-last-name"
                            value={data.last_name}
                            onChange={(e) => setData('last_name', e.target.value)}
                        />
                        <InputError message={errors.last_name} />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="emp-email">Email</Label>
                        <Input
                            id="emp-email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="emp-phone">Phone</Label>
                        <Input
                            id="emp-phone"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            placeholder="+263 77 …"
                        />
                        <InputError message={errors.phone} />
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
                        <Label>Employment Type</Label>
                        <Select value={data.employment_type} onValueChange={(v) => setData('employment_type', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {employment_types.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.employment_type} />
                    </div>

                    <div className="space-y-1">
                        <Label>Salary Type</Label>
                        <Select value={data.salary_type} onValueChange={(v) => setData('salary_type', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {salary_types.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.salary_type} />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="emp-base-salary">Base Salary</Label>
                        <Input
                            id="emp-base-salary"
                            type="number"
                            min="0"
                            step="0.01"
                            value={data.base_salary}
                            onChange={(e) => setData('base_salary', e.target.value)}
                        />
                        <InputError message={errors.base_salary} />
                    </div>

                    <div className="space-y-1">
                        <Label>Cost Center</Label>
                        <Select
                            value={data.cost_center_id}
                            onValueChange={(v) => setData('cost_center_id', v === 'none' ? '' : v)}
                        >
                            <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {cost_centers.map((cc) => (
                                    <SelectItem key={cc.id} value={String(cc.id)}>
                                        {cc.name} ({cc.code})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.cost_center_id} />
                    </div>

                    <DialogFooter className="sm:col-span-2 mt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving…' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
