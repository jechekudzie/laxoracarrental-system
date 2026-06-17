<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\ServiceProvider;
use App\Models\ServiceProviderPayment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinanceVendorPaymentTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_guests_are_redirected_from_vendor_payments(): void
    {
        $this->get(route('finance.vendor-payments.index'))->assertRedirect(route('login'));
    }

    public function test_can_view_vendor_payments_index(): void
    {
        $this->actingAs($this->user)
            ->get(route('finance.vendor-payments.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('finance/vendor-payments/index'));
    }

    public function test_can_create_vendor_payment(): void
    {
        $provider = ServiceProvider::factory()->create();

        $this->actingAs($this->user)
            ->post(route('finance.vendor-payments.store'), [
                'service_provider_id' => $provider->id,
                'description' => 'Engine repair - Toyota Hilux',
                'amount' => 350.00,
                'currency' => 'USD',
                'invoice_date' => now()->toDateString(),
                'due_date' => now()->addDays(14)->toDateString(),
                'status' => 'pending',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('service_provider_payments', [
            'service_provider_id' => $provider->id,
            'description' => 'Engine repair - Toyota Hilux',
        ]);
    }

    public function test_service_provider_is_required(): void
    {
        $this->actingAs($this->user)
            ->post(route('finance.vendor-payments.store'), [
                'description' => 'Test',
                'amount' => 100,
            ])
            ->assertSessionHasErrors('service_provider_id');
    }

    public function test_can_mark_vendor_payment_as_paid(): void
    {
        $payment = ServiceProviderPayment::factory()->create(['status' => 'pending']);

        $this->actingAs($this->user)
            ->post(route('finance.vendor-payments.mark-paid', $payment), [
                'payment_date' => now()->toDateString(),
                'payment_method' => 'bank_transfer',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('service_provider_payments', ['id' => $payment->id, 'status' => 'paid']);
    }

    public function test_mark_paid_requires_payment_date(): void
    {
        $payment = ServiceProviderPayment::factory()->create(['status' => 'pending']);

        $this->actingAs($this->user)
            ->post(route('finance.vendor-payments.mark-paid', $payment), [])
            ->assertSessionHasErrors('payment_date');
    }

    public function test_can_delete_vendor_payment(): void
    {
        $payment = ServiceProviderPayment::factory()->create();

        $this->actingAs($this->user)
            ->delete(route('finance.vendor-payments.destroy', $payment))
            ->assertRedirect();

        $this->assertSoftDeleted('service_provider_payments', ['id' => $payment->id]);
    }
}
