<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ChecklistCondition;
use App\Enums\InspectionType;
use App\Models\Booking;
use App\Models\BookingInspection;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Handles pickup / return inspection checklists. Agents submit item conditions
 * against the canonical list from config/inspections.php; the service normalises
 * them and stores a JSON blob per inspection.
 *
 * Used by the admin vehicle return screen and (eventually) the customer-facing
 * digital signature flow on mobile.
 */
class InspectionService
{
    /**
     * @param  array{
     *   odometer?: int|null,
     *   fuel_level?: string|null,
     *   items?: array<int, array{key: string, condition: string, notes?: string|null}>|null,
     *   exterior_notes?: string|null,
     *   interior_notes?: string|null,
     *   damage_summary?: string|null,
     *   signed_by_customer?: bool,
     *   customer_signature_name?: string|null,
     *   photos?: array<int, string>|null,
     * }  $data
     */
    public function record(
        Booking $booking,
        InspectionType $type,
        array $data,
        ?User $actor = null,
    ): BookingInspection {
        $normalisedItems = $this->normaliseItems($data['items'] ?? null);

        return DB::transaction(
            fn () => BookingInspection::updateOrCreate(
                [
                    'booking_id' => $booking->id,
                    'type' => $type->value,
                ],
                [
                    'inspector_user_id' => $actor?->id,
                    'odometer' => $data['odometer'] ?? null,
                    'fuel_level' => $data['fuel_level'] ?? null,
                    'items' => $normalisedItems,
                    'photos' => $data['photos'] ?? null,
                    'exterior_notes' => $data['exterior_notes'] ?? null,
                    'interior_notes' => $data['interior_notes'] ?? null,
                    'damage_summary' => $data['damage_summary'] ?? null,
                    'signed_by_customer' => (bool) ($data['signed_by_customer'] ?? false),
                    'customer_signature_name' => $data['customer_signature_name'] ?? null,
                    'signed_at' => ! empty($data['signed_by_customer']) ? now() : null,
                ],
            ),
        );
    }

    /**
     * Compare pickup vs return inspections and return items that degraded.
     * Feeds into automated damage charge suggestions.
     *
     * @return array<int, array{key: string, pickup: string|null, return: string|null, notes: string|null}>
     */
    public function diff(Booking $booking): array
    {
        $pickup = $booking->pickupInspection?->items ?? [];
        $return = $booking->returnInspection?->items ?? [];

        if (empty($pickup) || empty($return)) {
            return [];
        }

        $rank = [
            ChecklistCondition::OK->value => 0,
            ChecklistCondition::Fair->value => 1,
            ChecklistCondition::Poor->value => 2,
            ChecklistCondition::Damaged->value => 3,
            ChecklistCondition::Missing->value => 4,
        ];

        $pickupMap = collect($pickup)->keyBy('key');
        $diffs = [];

        foreach ($return as $item) {
            $pickupItem = $pickupMap->get($item['key']);
            $pickupCondition = $pickupItem['condition'] ?? null;
            $returnCondition = $item['condition'] ?? null;

            if ($pickupCondition === null || $returnCondition === null) {
                continue;
            }

            $before = $rank[$pickupCondition] ?? 0;
            $after = $rank[$returnCondition] ?? 0;

            if ($after > $before) {
                $diffs[] = [
                    'key' => $item['key'],
                    'pickup' => $pickupCondition,
                    'return' => $returnCondition,
                    'notes' => $item['notes'] ?? null,
                ];
            }
        }

        return $diffs;
    }

    /**
     * Ensure every submitted item is tagged with a valid condition and label.
     * Unknown keys are kept (agents may add custom items), but blanks are dropped.
     *
     * @param  array<int, array<string, mixed>>|null  $items
     * @return array<int, array<string, mixed>>
     */
    private function normaliseItems(?array $items): array
    {
        if ($items === null) {
            return [];
        }

        $canonical = collect(config('inspections.items'))->keyBy('key');
        $normalised = [];

        foreach ($items as $item) {
            $key = $item['key'] ?? null;

            if (! $key) {
                continue;
            }

            $condition = $item['condition'] ?? ChecklistCondition::OK->value;
            if (! in_array($condition, array_column(ChecklistCondition::cases(), 'value'), true)) {
                $condition = ChecklistCondition::OK->value;
            }

            $normalised[] = [
                'key' => $key,
                'label' => $canonical->get($key)['label'] ?? ($item['label'] ?? $key),
                'condition' => $condition,
                'notes' => $item['notes'] ?? null,
            ];
        }

        return $normalised;
    }
}
