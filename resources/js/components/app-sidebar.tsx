import { Link } from '@inertiajs/react';
import { Building2, CalendarDays, Car, CircleDollarSign, ClipboardList, FileText, Layers, LayoutGrid, LineChart, Receipt, ShieldCheck, Users, Wallet, Wrench } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { dashboard } from '@/routes';
import { index as complianceIndex } from '@/routes/compliance';
import { index as maintenanceIndex } from '@/routes/maintenance';
import { index as financeIndex } from '@/routes/finance';
import * as VehicleRoutes from '@/actions/App/Http/Controllers/Web/VehicleController';
import * as BookingCategoryRoutes from '@/actions/App/Http/Controllers/Web/BookingCategoryController';
import * as CustomerRoutes from '@/actions/App/Http/Controllers/Web/CustomerController';
import * as BookingRoutes from '@/actions/App/Http/Controllers/Web/BookingController';
import * as InvoiceRoutes from '@/actions/App/Http/Controllers/Web/InvoiceController';
import * as ServiceProviderRoutes from '@/actions/App/Http/Controllers/Web/ServiceProviderController';
import * as CostCenterRoutes from '@/actions/App/Http/Controllers/Web/CostCenterController';
import * as EmployeeRoutes from '@/actions/App/Http/Controllers/Web/EmployeeController';
import * as QuotationRoutes from '@/actions/App/Http/Controllers/Web/QuotationController';
import * as RequisitionRoutes from '@/actions/App/Http/Controllers/Web/RequisitionController';
import * as ExpenseRoutes from '@/actions/App/Http/Controllers/Web/OperationalExpenseController';
import * as SalaryRoutes from '@/actions/App/Http/Controllers/Web/SalaryController';
import * as TaskRoutes from '@/actions/App/Http/Controllers/Web/WorkerTaskController';
import * as VendorRoutes from '@/actions/App/Http/Controllers/Web/VendorPaymentController';
import type { NavItem } from '@/types';

const operationsNav: NavItem[] = [
    { title: 'Dashboard', href: dashboard.url(), icon: LayoutGrid },
    { title: 'Bookings', href: BookingRoutes.index.url(), icon: CalendarDays },
    { title: 'Customers', href: CustomerRoutes.index.url(), icon: Users },
    { title: 'Invoices', href: InvoiceRoutes.index.url(), icon: Receipt },
];

const fleetNav: NavItem[] = [
    { title: 'Vehicles', href: VehicleRoutes.index.url(), icon: Car },
    { title: 'Booking Categories', href: BookingCategoryRoutes.index.url(), icon: Layers },
    { title: 'Compliance & Insurance', href: complianceIndex.url(), icon: ShieldCheck },
    { title: 'Service & Maintenance', href: maintenanceIndex.url(), icon: Wrench },
    { title: 'Service Providers', href: ServiceProviderRoutes.index.url(), icon: Building2 },
];

const financeNav: NavItem[] = [
    { title: 'Finance Overview', href: financeIndex.url(), icon: LineChart },
    { title: 'Cost Centers', href: CostCenterRoutes.index.url(), icon: Building2 },
    { title: 'Employees', href: EmployeeRoutes.index.url(), icon: Users },
    { title: 'Quotations', href: QuotationRoutes.index.url(), icon: FileText },
    { title: 'Requisitions', href: RequisitionRoutes.index.url(), icon: ClipboardList },
    { title: 'Expenses', href: ExpenseRoutes.index.url(), icon: Wallet },
    { title: 'Salaries', href: SalaryRoutes.index.url(), icon: CircleDollarSign },
    { title: 'Worker Tasks', href: TaskRoutes.index.url(), icon: Wrench },
    { title: 'Vendor Payments', href: VendorRoutes.index.url(), icon: Receipt },
];

function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();
    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>{label}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isCurrentUrl(item.href)} tooltip={{ children: item.title }}>
                            <Link href={item.href} prefetch>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard.url()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavGroup label="Operations" items={operationsNav} />
                <NavGroup label="Fleet" items={fleetNav} />
                <NavGroup label="Finance" items={financeNav} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
