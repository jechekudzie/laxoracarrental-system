import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import { AlertTriangle, Eye, Pencil, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as Routes from '@/actions/App/Http/Controllers/Web/VehicleController';
import { dashboard } from '@/routes';

interface Vehicle {
    id: number;
    make: string;
    model: string;
    year: number;
    reg_plate: string;
    category: string;
    booking_category: { id: number; name: string } | null;
    status: string;
    ownership_type: string;
    daily_rate: number;
    currency: string;
    current_odometer: number | null;
}

interface PaginatedVehicles {
    data: Vehicle[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

interface Filters {
    search?: string;
    status?: string;
    ownership?: string;
}

const STATUS_STYLES: Record<string, string> = {
    available: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    rented: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    reserved: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    decommissioned: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export default function VehiclesIndex({
    vehicles,
    filters,
    statuses,
    ownershipTypes,
}: {
    vehicles: PaginatedVehicles;
    filters: Filters;
    statuses: { value: string; label: string }[];
    ownershipTypes: { value: string; label: string }[];
}) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Vehicles', href: Routes.index.url() },
        ],
    });

    const [search, setSearch] = useState(filters.search ?? '');

    function applyFilter(params: Record<string, string>) {
        router.get(Routes.index.url(), { ...filters, ...params }, { preserveState: true, replace: true });
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        applyFilter({ search });
    }

    return (
        <>
            <Head title="Vehicles" />

            <div className="flex flex-1 flex-col gap-4 p-6">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-3">
                    <form onSubmit={handleSearch} className="flex flex-1 gap-2">
                        <Input
                            placeholder="Search make, model, plate…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-xs"
                        />
                        <Button type="submit" variant="outline" size="icon">
                            <Search className="h-4 w-4" />
                        </Button>
                    </form>

                    <Select value={filters.status ?? ''} onValueChange={(v) => applyFilter({ status: v === 'all' ? '' : v, search })}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            {statuses.map((s) => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filters.ownership ?? ''} onValueChange={(v) => applyFilter({ ownership: v === 'all' ? '' : v, search })}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Any ownership" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Any ownership</SelectItem>
                            {ownershipTypes.map((o) => (
                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button asChild>
                        <Link href={Routes.create.url()}>
                            <Plus className="mr-2 h-4 w-4" /> Add Vehicle
                        </Link>
                    </Button>
                </div>

                {/* Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        <th className="px-4 py-3">Vehicle</th>
                                        <th className="px-4 py-3">Reg Plate</th>
                                        <th className="px-4 py-3">Body</th>
                                        <th className="px-4 py-3">Booking Tier</th>
                                        <th className="px-4 py-3">Ownership</th>
                                        <th className="px-4 py-3">Daily Rate</th>
                                        <th className="px-4 py-3">Odometer</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {vehicles.data.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                                                No vehicles found.
                                            </td>
                                        </tr>
                                    )}
                                    {vehicles.data.map((v) => (
                                        <tr key={v.id} className="group hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 font-medium">
                                                <Link
                                                    href={Routes.show.url({ vehicle: v.id })}
                                                    className="hover:text-primary hover:underline transition-colors"
                                                >
                                                    {v.make} {v.model}
                                                    <span className="ml-1 text-xs text-muted-foreground">({v.year})</span>
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 font-mono">{v.reg_plate}</td>
                                            <td className="px-4 py-3 capitalize text-muted-foreground">{v.category}</td>
                                            <td className="px-4 py-3">
                                                {v.booking_category ? (
                                                    v.booking_category.name
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs text-yellow-700 dark:text-yellow-500">
                                                        <AlertTriangle className="h-3 w-3" /> Unassigned
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${v.ownership_type === 'owned' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                                                    {v.ownership_type === 'owned' ? 'In-house' : 'Outsourced'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: v.currency }).format(v.daily_rate)}/day
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {v.current_odometer != null ? `${v.current_odometer.toLocaleString()} km` : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[v.status] ?? ''}`}>
                                                    {v.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button asChild size="icon" variant="ghost" className="h-8 w-8" title="View">
                                                        <Link href={Routes.show.url({ vehicle: v.id })}>
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button asChild size="icon" variant="ghost" className="h-8 w-8" title="Edit">
                                                        <Link href={Routes.edit.url({ vehicle: v.id })}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {vehicles.last_page > 1 && (
                            <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
                                <span>
                                    {vehicles.from}–{vehicles.to} of {vehicles.total}
                                </span>
                                <div className="flex gap-1">
                                    {vehicles.links.map((link, i) => (
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
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

