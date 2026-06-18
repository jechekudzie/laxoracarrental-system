<?php

use App\Http\Controllers\Api\V1\FileUploadController;
use App\Http\Controllers\Web\BookingCategoryController;
use App\Http\Controllers\Web\BookingController;
use App\Http\Controllers\Web\ComplianceController;
use App\Http\Controllers\Web\CostCenterController;
use App\Http\Controllers\Web\CustomerController;
use App\Http\Controllers\Web\DashboardController;
use App\Http\Controllers\Web\EmployeeController;
use App\Http\Controllers\Web\ExpenseTemplateController;
use App\Http\Controllers\Web\FinanceController;
use App\Http\Controllers\Web\InvoiceController;
use App\Http\Controllers\Web\MaintenanceController;
use App\Http\Controllers\Web\OperationalExpenseController;
use App\Http\Controllers\Web\PaymentController;
use App\Http\Controllers\Web\PaymentMethodController;
use App\Http\Controllers\Web\QuotationController;
use App\Http\Controllers\Web\ReportController;
use App\Http\Controllers\Web\RequisitionController;
use App\Http\Controllers\Web\SalaryController;
use App\Http\Controllers\Web\ServiceProviderController;
use App\Http\Controllers\Web\VehicleController;
use App\Http\Controllers\Web\WorkerTaskController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    // Reuses the API FileUploadController so admin forms can attach docs
    // without sanctum tokens; same disk + folder hints.
    Route::post('uploads', [FileUploadController::class, 'store'])->name('uploads.store');

    // Booking categories (commercial tiers: deposit, km rules, fuel charge)
    Route::resource('booking-categories', BookingCategoryController::class)
        ->parameters(['booking-categories' => 'bookingCategory']);

    // Vehicles
    Route::post('vehicles/{vehicle}/maintenance', [VehicleController::class, 'storeMaintenance'])->name('vehicles.maintenance.store');
    Route::delete('vehicles/{vehicle}/maintenance/{record}', [VehicleController::class, 'destroyMaintenance'])->name('vehicles.maintenance.destroy');
    Route::post('vehicles/{vehicle}/licences', [VehicleController::class, 'storeLicence'])->name('vehicles.licences.store');
    Route::delete('vehicles/{vehicle}/licences/{licence}', [VehicleController::class, 'destroyLicence'])->name('vehicles.licences.destroy');
    Route::post('vehicles/{vehicle}/costs', [VehicleController::class, 'storeCost'])->name('vehicles.costs.store');
    Route::delete('vehicles/{vehicle}/costs/{cost}', [VehicleController::class, 'destroyCost'])->name('vehicles.costs.destroy');
    Route::resource('vehicles', VehicleController::class);

    // Customers
    Route::post('customers/quick-store', [CustomerController::class, 'quickStore'])->name('customers.quick-store');
    Route::resource('customers', CustomerController::class);
    Route::post('customers/{customer}/blacklist', [CustomerController::class, 'blacklist'])->name('customers.blacklist');
    Route::post('customers/{customer}/reinstate', [CustomerController::class, 'reinstate'])->name('customers.reinstate');

    // Bookings
    Route::resource('bookings', BookingController::class)->except(['edit', 'update', 'destroy']);
    Route::post('bookings/{booking}/confirm', [BookingController::class, 'confirm'])->name('bookings.confirm');
    Route::post('bookings/{booking}/activate', [BookingController::class, 'activate'])->name('bookings.activate');
    Route::get('bookings/{booking}/complete', [BookingController::class, 'createCompletion'])->name('bookings.complete.form');
    Route::post('bookings/{booking}/complete', [BookingController::class, 'complete'])->name('bookings.complete');
    Route::post('bookings/{booking}/cancel', [BookingController::class, 'cancel'])->name('bookings.cancel');
    Route::post('bookings/{booking}/payments', [BookingController::class, 'storePayment'])->name('bookings.payments.store');
    Route::delete('bookings/{booking}/payments/{payment}', [BookingController::class, 'destroyPayment'])->name('bookings.payments.destroy');
    Route::post('bookings/{booking}/deposit-refund', [BookingController::class, 'refundDeposit'])->name('bookings.deposit-refund');
    Route::post('bookings/{booking}/invoice', [BookingController::class, 'generateInvoice'])->name('bookings.invoice.generate');

    // Inspection checklist (pickup / return) — matches mobile InspectionCaptureScreen
    Route::get('bookings/{booking}/inspections/create', [BookingController::class, 'createInspection'])->name('bookings.inspections.create');
    Route::post('bookings/{booking}/inspections', [BookingController::class, 'storeInspection'])->name('bookings.inspections.store');

    // Customer rating after return — matches mobile RateCustomerScreen
    Route::get('bookings/{booking}/rating/create', [BookingController::class, 'createRating'])->name('bookings.rating.create');
    Route::post('bookings/{booking}/rating', [BookingController::class, 'storeRating'])->name('bookings.rating.store');

    // Invoices
    Route::get('invoices/{invoice}/pdf', [InvoiceController::class, 'downloadPdf'])->name('invoices.pdf');
    Route::resource('invoices', InvoiceController::class)->only(['index', 'show']);

    // Payment receipts
    Route::get('payments/{payment}/receipt', [PaymentController::class, 'showReceipt'])->name('payments.receipt');
    Route::get('payments/{payment}/receipt.pdf', [PaymentController::class, 'downloadReceipt'])->name('payments.receipt-pdf');

    // Finance dashboard
    Route::get('finance', [FinanceController::class, 'index'])->name('finance.index');

    // Finance — Cost Centers
    Route::resource('finance/cost-centers', CostCenterController::class)
        ->parameters(['cost-centers' => 'costCenter'])
        ->names('finance.cost-centers')
        ->except(['create', 'show', 'edit']);

    // Finance — Employees / Workers
    Route::get('finance/employees/{employee}', [EmployeeController::class, 'show'])->name('finance.employees.show');
    Route::resource('finance/employees', EmployeeController::class)
        ->parameters(['employees' => 'employee'])
        ->names('finance.employees')
        ->except(['create', 'edit', 'show']);

    // Finance — Quotations
    Route::post('finance/quotations/{quotation}/status', [QuotationController::class, 'updateStatus'])->name('finance.quotations.status');
    Route::post('finance/quotations/{quotation}/to-requisition', [QuotationController::class, 'toRequisition'])->name('finance.quotations.to-requisition');
    Route::resource('finance/quotations', QuotationController::class)
        ->parameters(['quotations' => 'quotation'])
        ->names('finance.quotations')
        ->except(['edit', 'update']);

    // Finance — Requisitions
    Route::post('finance/requisitions/{requisition}/approve', [RequisitionController::class, 'approve'])->name('finance.requisitions.approve');
    Route::post('finance/requisitions/{requisition}/to-expense', [RequisitionController::class, 'toExpense'])->name('finance.requisitions.to-expense');
    Route::post('finance/requisitions/{requisition}/reject', [RequisitionController::class, 'reject'])->name('finance.requisitions.reject');
    Route::post('finance/requisitions/{requisition}/fulfill', [RequisitionController::class, 'fulfill'])->name('finance.requisitions.fulfill');
    Route::resource('finance/requisitions', RequisitionController::class)
        ->parameters(['requisitions' => 'requisition'])
        ->names('finance.requisitions')
        ->except(['edit', 'update']);

    // Finance — Operational Expenses
    Route::post('finance/expenses/{operationalExpense}/approve', [OperationalExpenseController::class, 'approve'])->name('finance.expenses.approve');
    Route::post('finance/expenses/{operationalExpense}/mark-paid', [OperationalExpenseController::class, 'markPaid'])->name('finance.expenses.mark-paid');
    Route::resource('finance/expenses', OperationalExpenseController::class)
        ->parameters(['expenses' => 'operationalExpense'])
        ->names('finance.expenses')
        ->except(['create', 'show', 'edit']);

    // Finance — Salaries / Payroll
    Route::post('finance/salaries/{salary}/mark-paid', [SalaryController::class, 'markPaid'])->name('finance.salaries.mark-paid');
    Route::resource('finance/salaries', SalaryController::class)
        ->parameters(['salaries' => 'salary'])
        ->names('finance.salaries')
        ->except(['create', 'show', 'edit']);

    // Finance — Worker Tasks
    Route::post('finance/tasks/{workerTask}/status', [WorkerTaskController::class, 'updateStatus'])->name('finance.tasks.status');
    Route::resource('finance/tasks', WorkerTaskController::class)
        ->parameters(['tasks' => 'workerTask'])
        ->names('finance.tasks')
        ->except(['create', 'show', 'edit']);

    // Compliance & Insurance (fleet-wide)
    Route::get('compliance', [ComplianceController::class, 'index'])->name('compliance.index');

    // Maintenance Log (fleet-wide)
    Route::get('maintenance', [MaintenanceController::class, 'index'])->name('maintenance.index');

    // Service Providers (mechanics, tow, car wash, etc.)
    Route::resource('service-providers', ServiceProviderController::class)->except(['create', 'show', 'edit']);

    // Finance settings — Payment Methods
    Route::resource('finance/settings/payment-methods', PaymentMethodController::class)
        ->parameters(['payment-methods' => 'paymentMethod'])
        ->names('finance.payment-methods')
        ->except(['create', 'show', 'edit']);

    // Finance settings — Expense Templates
    Route::get('finance/settings/expense-templates/by-category', [ExpenseTemplateController::class, 'byCategory'])
        ->name('finance.expense-templates.by-category');

    Route::resource('finance/settings/expense-templates', ExpenseTemplateController::class)
        ->parameters(['expense-templates' => 'expenseTemplate'])
        ->names('finance.expense-templates')
        ->except(['create', 'show', 'edit']);

    // Reports
    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('/', [ReportController::class, 'index'])->name('index');
        Route::get('/bookings', [ReportController::class, 'bookings'])->name('bookings');
        Route::get('/bookings/export', [ReportController::class, 'exportBookings'])->name('bookings.export');
        Route::get('/expenses', [ReportController::class, 'expenses'])->name('expenses');
        Route::get('/expenses/export', [ReportController::class, 'exportExpenses'])->name('expenses.export');
        Route::get('/hr', [ReportController::class, 'hr'])->name('hr');
        Route::get('/hr/export', [ReportController::class, 'exportHr'])->name('hr.export');
        Route::get('/tasks', [ReportController::class, 'tasks'])->name('tasks');
        Route::get('/tasks/export', [ReportController::class, 'exportTasks'])->name('tasks.export');
        Route::get('/statements/customers', [ReportController::class, 'customerStatements'])->name('statements.customers');
        Route::get('/statements/customers/{customer}', [ReportController::class, 'customerStatement'])->name('statements.customer');
        Route::get('/statements/customers/{customer}/pdf', [ReportController::class, 'customerStatementPdf'])->name('statements.customer.pdf');
        Route::get('/statements/organisation', [ReportController::class, 'organisationStatement'])->name('statements.organisation');
        Route::get('/statements/organisation/pdf', [ReportController::class, 'organisationStatementPdf'])->name('statements.organisation.pdf');
    });
});

require __DIR__.'/settings.php';
