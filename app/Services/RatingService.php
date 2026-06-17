<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\CustomerStatus;
use App\Models\Booking;
use App\Models\Customer;
use App\Models\CustomerRating;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * After each return, the booking agent rates the customer on 5 criteria (1-5 each).
 * The service recalculates the customer's rolling average and auto-applies
 * greylist / blacklist flags based on thresholds in config/inspections.php.
 *
 * This is the objective signal the business uses to decide whether a repeat
 * customer is trustworthy enough to keep renting to.
 */
class RatingService
{
    /**
     * @param  array{
     *   score_condition: int,
     *   score_timeliness: int,
     *   score_payment: int,
     *   score_communication: int,
     *   score_care: int,
     *   comment?: string|null,
     * }  $data
     */
    public function rate(Booking $booking, array $data, ?User $actor = null): CustomerRating
    {
        return DB::transaction(function () use ($booking, $data, $actor) {
            $average = CustomerRating::computeAverage(
                $data['score_condition'],
                $data['score_timeliness'],
                $data['score_payment'],
                $data['score_communication'],
                $data['score_care'],
            );

            $rating = CustomerRating::updateOrCreate(
                ['booking_id' => $booking->id],
                [
                    'customer_id' => $booking->customer_id,
                    'rated_by_user_id' => $actor?->id,
                    'score_condition' => $data['score_condition'],
                    'score_timeliness' => $data['score_timeliness'],
                    'score_payment' => $data['score_payment'],
                    'score_communication' => $data['score_communication'],
                    'score_care' => $data['score_care'],
                    'average' => $average,
                    'comment' => $data['comment'] ?? null,
                ],
            );

            $this->recalculateForCustomer($booking->customer);

            return $rating->refresh();
        });
    }

    /**
     * Recomputes the rolling average + ratings_count for a customer and
     * promotes/demotes their status per the config thresholds.
     */
    public function recalculateForCustomer(Customer $customer): Customer
    {
        $aggregate = $customer->ratings()
            ->selectRaw('COUNT(*) AS total, AVG(average) AS avg_rating')
            ->first();

        $count = (int) ($aggregate->total ?? 0);
        $avg = $count > 0 ? round((float) $aggregate->avg_rating, 2) : null;

        $customer->update([
            'ratings_count' => $count,
            'average_rating' => $avg,
        ]);

        $this->autoStatus($customer->refresh());

        return $customer->refresh();
    }

    /**
     * Do NOT override manual blacklists — only auto-transition Active ↔ Greylisted.
     * A manually blacklisted customer stays blacklisted until an admin reinstates.
     */
    private function autoStatus(Customer $customer): void
    {
        if ($customer->status === CustomerStatus::Blacklisted
            || $customer->status === CustomerStatus::Suspended) {
            return;
        }

        $minRatings = (int) config('inspections.rating.greylist_min_ratings', 3);
        $greylistAt = (float) config('inspections.rating.greylist_threshold', 2.5);
        $blacklistAt = (float) config('inspections.rating.blacklist_threshold', 1.5);

        if ($customer->ratings_count < $minRatings || $customer->average_rating === null) {
            return;
        }

        $avg = (float) $customer->average_rating;

        if ($avg < $blacklistAt) {
            $customer->update([
                'status' => CustomerStatus::Blacklisted,
                'blacklist_reason' => sprintf(
                    'Auto-blacklisted: rolling average %.2f over %d ratings.',
                    $avg,
                    $customer->ratings_count,
                ),
            ]);

            return;
        }

        if ($avg < $greylistAt) {
            if ($customer->status !== CustomerStatus::Greylisted) {
                $customer->update(['status' => CustomerStatus::Greylisted]);
            }

            return;
        }

        if ($customer->status === CustomerStatus::Greylisted) {
            $customer->update(['status' => CustomerStatus::Active]);
        }
    }
}
