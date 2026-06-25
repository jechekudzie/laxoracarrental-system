import { Link } from '@inertiajs/react';
import { Banknote, BarChart2, Building2, CalendarDays, Car, ChevronDown, CircleDollarSign, ClipboardList, CreditCard, FileSignature, FileText, Layers, LayoutGrid, LayoutTemplate, LineChart, ListChecks, Receipt, Scale, ShieldCheck, Users, Wallet, Wrench } from 'lucide-react';
import { useState } from 'react';
import AppLogo from '@/components/app-logo';
import { NavUser } from '@/components/nav-user';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import * as PaymentMethodRoutes from '@/actions/App/Http/Controllers/Web/PaymentMethodController';
import * as ExpenseTemplateRoutes from '@/actions/App/Http/Controllers/Web/ExpenseTemplateController';
import * as AgreementTemplateRoutes from '@/actions/App/Http/Controllers/Web/AgreementTemplateController';
import * as RentalAgreementRoutes from '@/actions/App/Http/Controllers/Web/RentalAgreementController';
import * as CashDeclarationRoutes from '@/actions/App/Http/Controllers/Web/CashDeclarationController';
import type { NavItem } from '@/types';

const operationsNav: NavItem[] = [
    { title: 'Dashboard', href: dashboard.url(), icon: LayoutGrid },
    { title: 'Bookings', href: BookingRoutes.index.url(), icon: CalendarDays },
    { title: 'Customers', href: CustomerRoutes.index.url(), icon: Users },
    { title: 'Service Providers', href: ServiceProviderRoutes.index.url(), icon: Building2 },
    { title: 'Invoices', href: InvoiceRoutes.index.url(), icon: Receipt },
];

const fleetNav: NavItem[] = [
    { title: 'Vehicles', href: VehicleRoutes.index.url(), icon: Car },
    { title: 'Booking Categories', href: BookingCategoryRoutes.index.url(), icon: Layers },
    { title: 'Compliance & Insurance', href: complianceIndex.url(), icon: ShieldCheck },
    { title: 'Service & Maintenance', href: maintenanceIndex.url(), icon: Wrench },
];

const peopleNav: NavItem[] = [
    { title: 'Employees', href: EmployeeRoutes.index.url(), icon: Users },
    { title: 'Salaries', href: SalaryRoutes.index.url(), icon: CircleDollarSign },
    { title: 'Worker Tasks', href: TaskRoutes.index.url(), icon: ClipboardList },
];

const reportsNav: NavItem[] = [
    { title: 'Overview', href: '/reports', icon: LayoutGrid },
    { title: 'Bookings', href: '/reports/bookings', icon: CalendarDays },
    { title: 'Expenses', href: '/reports/expenses', icon: Wallet },
    { title: 'HR & Payroll', href: '/reports/hr', icon: Users },
    { title: 'Tasks', href: '/reports/tasks', icon: ClipboardList },
    { title: 'Customer Statements', href: '/reports/statements/customers', icon: FileText },
    { title: 'Organisation Statement', href: '/reports/statements/organisation', icon: LineChart },
];

const legalNav: NavItem[] = [
    { title: 'Agreements', href: RentalAgreementRoutes.index.url(), icon: FileSignature },
    { title: 'Agreement Templates', href: AgreementTemplateRoutes.index.url(), icon: LayoutTemplate },
    { title: 'Cash Declarations', href: CashDeclarationRoutes.index.url(), icon: Banknote },
];

const financeNav: NavItem[] = [
    { title: 'Finance Overview', href: financeIndex.url(), icon: LineChart },
    { title: 'Cost Centers', href: CostCenterRoutes.index.url(), icon: Building2 },
    { title: 'Quotations', href: QuotationRoutes.index.url(), icon: FileText },
    { title: 'Requisitions', href: RequisitionRoutes.index.url(), icon: ClipboardList },
    { title: 'Expenses', href: ExpenseRoutes.index.url(), icon: Wallet },
    { title: 'Payment Methods', href: PaymentMethodRoutes.index.url(), icon: CreditCard },
    { title: 'Expense Templates', href: ExpenseTemplateRoutes.index.url(), icon: ListChecks },
];

function NavGroup({ label, items, defaultOpen = false }: { label: string; items: NavItem[]; defaultOpen?: boolean }) {
    const { isCurrentUrl } = useCurrentUrl();
    const [open, setOpen] = useState(defaultOpen);

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <SidebarGroup className="px-2 py-0">
                <CollapsibleTrigger asChild>
                    <SidebarGroupLabel className="flex w-full cursor-pointer select-none items-center justify-between rounded-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                        <span>{label}</span>
                        <ChevronDown
                            className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200"
                            style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                        />
                    </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
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
                </CollapsibleContent>
            </SidebarGroup>
        </Collapsible>
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
                <NavGroup label="Operations" items={operationsNav} defaultOpen />
                <NavGroup label="Fleet" items={fleetNav} />
                <NavGroup label="HR" items={peopleNav} />
                <NavGroup label="Finance" items={financeNav} />
                <NavGroup label="Legal" items={legalNav} />
                <NavGroup label="Reports" items={reportsNav} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
