import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import { Mail, Phone, Plus, Search, Star, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as Routes from '@/actions/App/Http/Controllers/Web/CustomerController';
import { dashboard } from '@/routes';

interface Customer {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    status: string;
    ratings_count: number;
    average_rating: number | null;
}

interface PaginatedCustomers {
    data: Customer[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

const STATUS_STYLES: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    greylisted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    blacklisted: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    suspended: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export default function CustomersIndex({
    customers,
    filters,
    statuses,
}: {
    customers: PaginatedCustomers;
    filters: { search?: string; status?: string };
    statuses: { value: string; label: string }[];
}) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Customers', href: Routes.index.url() },
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
            <Head title="Customers" />

            <div className="flex flex-1 flex-col gap-4 p-6">
                <div className="flex flex-wrap items-center gap-3">
                    <form onSubmit={handleSearch} className="flex flex-1 gap-2">
                        <Input
                            placeholder="Search name, phone, email, ID…"
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

                    <Button asChild>
                        <Link href={Routes.create.url()}>
                            <Plus className="mr-2 h-4 w-4" /> Add Customer
                        </Link>
                    </Button>
                </div>

                {customers.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                                <UserRound className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-lg font-semibold">No customers found</p>
                            <p className="text-sm text-muted-foreground max-w-md">Try adjusting your filters, or add your first customer.</p>
                            <Button asChild className="mt-2">
                                <Link href={Routes.create.url()}><Plus className="mr-2 h-4 w-4" /> Add Customer</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {customers.data.map((c) => {
                            const initials = c.name
                                .split(' ')
                                .map((p) => p[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase();
                            return (
                                <Link key={c.id} href={Routes.show.url({ customer: c.id })} className="group">
                                    <Card className="h-full transition-all group-hover:shadow-md group-hover:-translate-y-0.5">
                                        <CardContent className="p-5 flex flex-col gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-sm font-bold text-primary">
                                                    {initials}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-semibold truncate group-hover:text-primary transition-colors">{c.name}</p>
                                                    <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[c.status] ?? ''}`}>
                                                        {c.status}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5 text-xs">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Phone className="h-3 w-3 shrink-0" />
                                                    <span className="truncate">{c.phone}</span>
                                                </div>
                                                {c.email && (
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Mail className="h-3 w-3 shrink-0" />
                                                        <span className="truncate">{c.email}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-auto flex items-center justify-between border-t pt-3 text-xs">
                                                {c.ratings_count > 0 ? (
                                                    <span className="flex items-center gap-1">
                                                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                                        <span className="font-semibold">{c.average_rating?.toFixed(1)}</span>
                                                        <span className="text-muted-foreground">({c.ratings_count})</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">No ratings</span>
                                                )}
                                                <span className="text-primary font-medium">View →</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {customers.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{customers.from}–{customers.to} of {customers.total}</span>
                        <div className="flex gap-1">
                            {customers.links.map((link, i) => (
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
        </>
    );
}

