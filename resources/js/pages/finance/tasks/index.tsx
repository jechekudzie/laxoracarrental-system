import { Head, router, setLayoutProps, useForm } from '@inertiajs/react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/input-error';
import * as Routes from '@/actions/App/Http/Controllers/Web/WorkerTaskController';
import { dashboard } from '@/routes';
import { index as financeIndex } from '@/routes/finance';

interface WorkerTask {
    id: number;
    title: string;
    description: string | null;
    status: string;
    status_label: string;
    priority: string;
    priority_label: string;
    due_date: string | null;
    assigned_to: { id: number; full_name: string } | null;
    cost_center: { id: number; name: string } | null;
    vehicle: string | null;
}

interface PaginatedData<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    last_page: number;
    total: number;
    from: number;
    to: number;
}

const PRIORITY_STYLES: Record<string, string> = {
    low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

export default function TasksIndex({
    tasks,
    filters,
    statuses,
    priorities,
    employees,
    cost_centers,
    vehicles,
}: {
    tasks: PaginatedData<WorkerTask>;
    filters: { search?: string; status?: string; priority?: string; employee_id?: string; cost_center_id?: string };
    statuses: { value: string; label: string }[];
    priorities: { value: string; label: string }[];
    employees: { id: number; full_name: string }[];
    cost_centers: { id: number; name: string }[];
    vehicles: { id: number; label: string; reg_plate: string }[];
}) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Finance', href: financeIndex.url() },
            { title: 'Tasks', href: Routes.index.url() },
        ],
    });

    const [search, setSearch] = useState(filters.search ?? '');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<WorkerTask | null>(null);

    function applyFilter(params: Record<string, string>) {
        router.get(Routes.index.url(), { ...filters, ...params }, { preserveState: true, replace: true });
    }

    function openNew() {
        setEditing(null);
        setDialogOpen(true);
    }

    function openEdit(task: WorkerTask) {
        setEditing(task);
        setDialogOpen(true);
    }

    function handleDelete(task: WorkerTask) {
        if (confirm(`Remove task "${task.title}"?`)) {
            router.delete(Routes.destroy.url({ workerTask: task.id }), { preserveScroll: true });
        }
    }

    return (
        <>
            <Head title="Worker Tasks" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Worker Tasks</h1>
                        <p className="text-sm text-muted-foreground">Assign and track tasks for your workforce.</p>
                    </div>
                    <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Add Task</Button>
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
                            placeholder="Search tasks…"
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

                    <Select value={filters.priority ?? ''} onValueChange={(v) => applyFilter({ priority: v === 'all' ? '' : v })}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="All priorities" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All priorities</SelectItem>
                            {priorities.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={filters.employee_id ?? ''} onValueChange={(v) => applyFilter({ employee_id: v === 'all' ? '' : v })}>
                        <SelectTrigger className="w-44"><SelectValue placeholder="All employees" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All employees</SelectItem>
                            {employees.map((emp) => <SelectItem key={emp.id} value={String(emp.id)}>{emp.full_name}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={filters.cost_center_id ?? ''} onValueChange={(v) => applyFilter({ cost_center_id: v === 'all' ? '' : v })}>
                        <SelectTrigger className="w-44"><SelectValue placeholder="All cost centers" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All cost centers</SelectItem>
                            {cost_centers.map((cc) => <SelectItem key={cc.id} value={String(cc.id)}>{cc.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                {tasks.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                            <p className="text-lg font-semibold">No tasks found</p>
                            <p className="text-sm text-muted-foreground max-w-md">Create tasks to manage your workforce assignments.</p>
                            <Button onClick={openNew} className="mt-2"><Plus className="mr-2 h-4 w-4" /> Add first task</Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="px-4 py-3 text-left font-medium">Title</th>
                                            <th className="px-4 py-3 text-left font-medium">Assigned To</th>
                                            <th className="px-4 py-3 text-left font-medium">Priority</th>
                                            <th className="px-4 py-3 text-left font-medium">Due Date</th>
                                            <th className="px-4 py-3 text-left font-medium">Vehicle</th>
                                            <th className="px-4 py-3 text-left font-medium">Status</th>
                                            <th className="px-4 py-3 text-right font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {tasks.data.map((t) => (
                                            <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium">{t.title}</div>
                                                    {t.description && (
                                                        <div className="text-xs text-muted-foreground line-clamp-1">{t.description}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                                    {t.assigned_to?.full_name ?? '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[t.priority] ?? ''}`}>
                                                        {t.priority_label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{t.due_date ?? '—'}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{t.vehicle ?? '—'}</td>
                                                <td className="px-4 py-3">
                                                    <Select
                                                        value={t.status}
                                                        onValueChange={(v) =>
                                                            router.post(
                                                                Routes.updateStatus.url({ workerTask: t.id }),
                                                                { status: v },
                                                                { preserveScroll: true },
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="h-7 w-36 text-xs">
                                                            <SelectValue>
                                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[t.status] ?? ''}`}>
                                                                    {t.status_label}
                                                                </span>
                                                            </SelectValue>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {statuses.map((s) => (
                                                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(t)}>
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
                        </CardContent>
                    </Card>
                )}

                {tasks.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{tasks.from}–{tasks.to} of {tasks.total}</span>
                        <div className="flex gap-1">
                            {tasks.links.map((link, i) => (
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

            <TaskDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                editing={editing}
                employees={employees}
                cost_centers={cost_centers}
                vehicles={vehicles}
                priorities={priorities}
            />
        </>
    );
}

function TaskDialog({
    open,
    onOpenChange,
    editing,
    employees,
    cost_centers,
    vehicles,
    priorities,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editing: WorkerTask | null;
    employees: { id: number; full_name: string }[];
    cost_centers: { id: number; name: string }[];
    vehicles: { id: number; label: string; reg_plate: string }[];
    priorities: { value: string; label: string }[];
}) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        title: editing?.title ?? '',
        description: editing?.description ?? '',
        assigned_to_id: editing?.assigned_to?.id ? String(editing.assigned_to.id) : '',
        cost_center_id: editing?.cost_center?.id ? String(editing.cost_center.id) : '',
        vehicle_id: '',
        priority: editing?.priority ?? 'medium',
        due_date: editing?.due_date ?? '',
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
            put(Routes.update.url({ workerTask: editing.id }), options);
        } else {
            post(Routes.store.url(), options);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{editing ? 'Edit Task' : 'Add Task'}</DialogTitle>
                    <DialogDescription>Assign a task to a worker with priority and due date.</DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="task-title">Title</Label>
                        <Input
                            id="task-title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="Oil change for ABC 123"
                        />
                        <InputError message={errors.title} />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="task-description">Description</Label>
                        <textarea
                            id="task-description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={2}
                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            placeholder="Task details and instructions…"
                        />
                        <InputError message={errors.description} />
                    </div>

                    <div className="space-y-1">
                        <Label>Assigned To</Label>
                        <Select value={data.assigned_to_id} onValueChange={(v) => setData('assigned_to_id', v)}>
                            <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                            <SelectContent>
                                {employees.map((emp) => <SelectItem key={emp.id} value={String(emp.id)}>{emp.full_name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.assigned_to_id} />
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
                        <Label>Vehicle</Label>
                        <Select value={data.vehicle_id} onValueChange={(v) => setData('vehicle_id', v)}>
                            <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                            <SelectContent>
                                {vehicles.map((v) => (
                                    <SelectItem key={v.id} value={String(v.id)}>
                                        {v.label} ({v.reg_plate})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.vehicle_id} />
                    </div>

                    <div className="space-y-1">
                        <Label>Priority</Label>
                        <Select value={data.priority} onValueChange={(v) => setData('priority', v)}>
                            <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                            <SelectContent>
                                {priorities.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.priority} />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="task-due-date">Due Date</Label>
                        <DateInput
                            id="task-due-date"
                            value={data.due_date}
                            onChange={(e) => setData('due_date', e.target.value)}
                        />
                        <InputError message={errors.due_date} />
                    </div>

                    <DialogFooter className="sm:col-span-2 mt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing}>{processing ? 'Saving…' : editing ? 'Save Changes' : 'Add Task'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
