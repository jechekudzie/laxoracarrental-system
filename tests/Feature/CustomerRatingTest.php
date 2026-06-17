<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Enums\CustomerStatus;
use App\Models\Booking;
use App\Models\Customer;
use App\Models\CustomerRating;
use App\Models\User;
use App\Services\RatingService;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class CustomerRatingTest extends TestCase
{
    use LazilyRefreshDatabase;

    private RatingService $ratingService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->ratingService = app(RatingService::class);
    }

    // ---------------------------------------------------------------------------
    // rate
    // ---------------------------------------------------------------------------

    public function test_can_rate_a_customer_after_return(): void
    {
        $customer = Customer::factory()->create();
        $booking = Booking::factory()->status(BookingStatus::Completed)->create([
            'customer_id' => $customer->id,
        ]);

        $rating = $this->ratingService->rate($booking, [
            'score_condition' => 5,
            'score_timeliness' => 5,
            'score_payment' => 5,
            'score_communication' => 5,
            'score_care' => 5,
            'comment' => 'Excellent customer',
        ]);

        $this->assertInstanceOf(CustomerRating::class, $rating);
        $this->assertSame(5, $rating->score_condition);
        $this->assertEqualsWithDelta(5.0, (float) $rating->average, 0.01);
        $this->assertSame('Excellent customer', $rating->comment);
        $this->assertModelExists($rating);
    }

    public function test_average_is_calculated_across_all_five_criteria(): void
    {
        $customer = Customer::factory()->create();
        $booking = Booking::factory()->status(BookingStatus::Completed)->create([
            'customer_id' => $customer->id,
        ]);

        $rating = $this->ratingService->rate($booking, [
            'score_condition' => 4,
            'score_timeliness' => 3,
            'score_payment' => 5,
            'score_communication' => 2,
            'score_care' => 1,
        ]);

        // (4+3+5+2+1)/5 = 3.0
        $this->assertEqualsWithDelta(3.0, (float) $rating->average, 0.01);
    }

    public function test_rating_updates_customer_rolling_average(): void
    {
        $customer = Customer::factory()->create(['ratings_count' => 0, 'average_rating' => null]);
        $booking = Booking::factory()->status(BookingStatus::Completed)->create([
            'customer_id' => $customer->id,
        ]);

        $this->ratingService->rate($booking, [
            'score_condition' => 4,
            'score_timeliness' => 4,
            'score_payment' => 4,
            'score_communication' => 4,
            'score_care' => 4,
        ]);

        $customer->refresh();
        $this->assertSame(1, $customer->ratings_count);
        $this->assertEqualsWithDelta(4.0, (float) $customer->average_rating, 0.01);
    }

    public function test_rating_for_same_booking_is_updated_not_duplicated(): void
    {
        $customer = Customer::factory()->create();
        $booking = Booking::factory()->status(BookingStatus::Completed)->create([
            'customer_id' => $customer->id,
        ]);

        $this->ratingService->rate($booking, [
            'score_condition' => 5,
            'score_timeliness' => 5,
            'score_payment' => 5,
            'score_communication' => 5,
            'score_care' => 5,
        ]);

        $this->ratingService->rate($booking, [
            'score_condition' => 2,
            'score_timeliness' => 2,
            'score_payment' => 2,
            'score_communication' => 2,
            'score_care' => 2,
            'comment' => 'Updated score',
        ]);

        $this->assertSame(1, CustomerRating::where('booking_id', $booking->id)->count());
        $customer->refresh();
        $this->assertSame(1, $customer->ratings_count);
    }

    // ---------------------------------------------------------------------------
    // auto-status: greylist
    // ---------------------------------------------------------------------------

    public function test_customer_is_greylisted_when_average_drops_below_threshold(): void
    {
        // greylist_threshold = 2.5, greylist_min_ratings = 3
        $customer = Customer::factory()->create(['status' => CustomerStatus::Active]);

        $this->rateCustomer($customer, 2, 3); // 3 ratings at avg 2.0 → below 2.5

        $customer->refresh();
        $this->assertSame(CustomerStatus::Greylisted, $customer->status);
    }

    public function test_customer_is_not_greylisted_below_min_ratings(): void
    {
        // Need at least 3 ratings before auto-status kicks in
        $customer = Customer::factory()->create(['status' => CustomerStatus::Active]);

        $this->rateCustomer($customer, 2, 2); // only 2 ratings

        $customer->refresh();
        $this->assertSame(CustomerStatus::Active, $customer->status);
    }

    public function test_greylisted_customer_recovers_to_active_when_average_improves(): void
    {
        $customer = Customer::factory()->create(['status' => CustomerStatus::Active]);

        // First 3 ratings bring the average below 2.5
        $this->rateCustomer($customer, 2, 3);
        $customer->refresh();
        $this->assertSame(CustomerStatus::Greylisted, $customer->status);

        // Next 3 perfect ratings lift the average above 2.5
        $this->rateCustomer($customer, 5, 3);
        $customer->refresh();
        $this->assertSame(CustomerStatus::Active, $customer->status);
    }

    // ---------------------------------------------------------------------------
    // auto-status: blacklist
    // ---------------------------------------------------------------------------

    public function test_customer_is_auto_blacklisted_when_average_drops_below_blacklist_threshold(): void
    {
        // blacklist_threshold = 1.5
        $customer = Customer::factory()->create(['status' => CustomerStatus::Active]);

        $this->rateCustomer($customer, 1, 3); // avg 1.0 → below 1.5

        $customer->refresh();
        $this->assertSame(CustomerStatus::Blacklisted, $customer->status);
        $this->assertStringContainsString('Auto-blacklisted', (string) $customer->blacklist_reason);
    }

    public function test_manually_blacklisted_customer_is_not_affected_by_auto_status(): void
    {
        $customer = Customer::factory()->blacklisted()->create([
            'ratings_count' => 0,
            'average_rating' => null,
        ]);

        // Give them 3 perfect ratings — manual blacklist should persist
        $this->rateCustomer($customer, 5, 3);

        $customer->refresh();
        $this->assertSame(CustomerStatus::Blacklisted, $customer->status);
    }

    // ---------------------------------------------------------------------------
    // forCustomer endpoint (API)
    // ---------------------------------------------------------------------------

    public function test_ratings_are_listed_for_a_customer(): void
    {
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('booking-agent');
        $customer = Customer::factory()->create();

        CustomerRating::factory()->count(3)->create(['customer_id' => $customer->id]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson("/api/v1/customers/{$customer->id}/ratings");

        $response->assertOk()
            ->assertJsonCount(3, 'data');
    }

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    /**
     * Create $count completed bookings for $customer and rate each with all 5 scores at $score.
     */
    private function rateCustomer(Customer $customer, int $score, int $count): void
    {
        Booking::factory()->count($count)->status(BookingStatus::Completed)->create([
            'customer_id' => $customer->id,
        ])->each(function (Booking $booking) use ($score) {
            $this->ratingService->rate($booking, [
                'score_condition' => $score,
                'score_timeliness' => $score,
                'score_payment' => $score,
                'score_communication' => $score,
                'score_care' => $score,
            ]);
        });
    }
}
