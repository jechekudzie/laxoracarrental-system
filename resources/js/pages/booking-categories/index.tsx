import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import { Eye, Layers, Pencil, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import * as Routes from '@/actions/App/Http/Controllers/Web/BookingCategoryController';
import { dashboard } from '@/routes';

interface Category {
    id: number;
    slug: string;
    name: string;
    description: string | null;
    security_deposit: number;
    km_per_day_limit: number;
    excess_km_rate: number;
    fuel_charge_per_level: number;
    currency: string;
    is_active: boolean;
    sort_order: number;
    vehicles_count: number;
}

interface PaginatedCategories {
    data: Category[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

interface Filters {
    search?: string;
}

function fmt(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export default function BookingCategoriesIndex({
    categories,
    filters,
}: {
    categories: PaginatedCategories;
    filters: Filters;
}) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Booking Categories', href: Routes.index.url() },
        ],
    });

    const [search, setSearch] = useState(filters.search ?? '');

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get(Routes.index.url(), { search }, { preserveState: true, replace: true });
    }

    return (
        <>
            <Head title="Booking Categories" />

            <div className="flex flex-1 flex-col gap-4 p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                            <Layers className="h-6 w-6 text-muted-foreground" />
                            Booking Categories
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Commercial tiers that govern each booking&apos;s deposit, km allowance, excess km rate and fuel top-up charge.
                            Assign a category to a vehicle to use it.
                        </p>
                    </div>

                    <Button asChild>
                        <Link href={Routes.create.url()}>
                            <Plus className="mr-2 h-4 w-4" /> New Category
                        </Link>
                    </Button>
                </div>

                <form onSubmit={handleSearch} className="flex max-w-sm gap-2">
                    <Input
                        placeholder="Search by name or slug…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <Button type="submit" variant="outline" size="icon">
                        <Search className="h-4 w-4" />
                    </Button>
                </form>

                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        <th className="px-4 py-3">Category</th>
                                        <th className="px-4 py-3">Deposit</th>
                                        <th className="px-4 py-3">KM / Day</th>
                                        <th className="px-4 py-3">Excess km</th>
                                        <th className="px-4 py-3">Fuel / level</th>
                                        <th className="px-4 py-3">Vehicles</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {categories.data.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                                                No booking categories yet.
                                                <Link href={Routes.create.url()} className="ml-1 text-primary hover:underline">
                                                    Create your first tier
                                                </Link>
                                                .
                                            </td>
                                        </tr>
                                    )}
                                    {categories.data.map((c) => (
                                        <tr key={c.id} className="group transition-colors hover:bg-muted/30">
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={Routes.show.url({ bookingCategory: c.id })}
                                                    className="font-medium transition-colors hover:text-primary hover:underline"
                                                >
                                                    {c.name}
                                                </Link>
                                                <div className="font-mono text-xs text-muted-foreground">{c.slug}</div>
                                            </td>
                                            <td className="px-4 py-3 font-medium">{fmt(c.security_deposit, c.currency)}</td>
                                            <td className="px-4 py-3">{c.km_per_day_limit.toLocaleString()} km</td>
                                            <td className="px-4 py-3">{fmt(c.excess_km_rate, c.currency)}/km</td>
                                            <td className="px-4 py-3">
                                                {c.fuel_charge_per_level > 0 ? fmt(c.fuel_charge_per_level, c.currency) : <span className="text-muted-foreground">—</span>}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">{c.vehicles_count}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                        c.is_active
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                    }`}
                                                >
                                                    {c.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button asChild size="icon" variant="ghost" className="h-8 w-8" title="View">
                                                        <Link href={Routes.show.url({ bookingCategory: c.id })}>
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button asChild size="icon" variant="ghost" className="h-8 w-8" title="Edit">
                                                        <Link href={Routes.edit.url({ bookingCategory: c.id })}>
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

                        {categories.last_page > 1 && (
                            <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
                                <span>
                                    {categories.from}–{categories.to} of {categories.total}
                                </span>
                                <div className="flex gap-1">
                                    {categories.links.map((link, i) => (
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
