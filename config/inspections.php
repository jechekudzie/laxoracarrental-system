<?php

declare(strict_types=1);

/**
 * Canonical vehicle inspection checklist. Agents fill this on pickup and again
 * on return so the two records can be diffed for damage charges.
 *
 * Each item has a stable `key` (store in DB) and a human `label` (displayed).
 * Add or remove items here without touching code — the service will store
 * whatever the agent submits as a JSON blob on the booking_inspections table.
 */
return [
    'items' => [
        ['key' => 'exterior_body', 'label' => 'Exterior body (scratches, dents)'],
        ['key' => 'interior_cleanliness', 'label' => 'Interior cleanliness'],
        ['key' => 'tyres', 'label' => 'Tyres (tread, pressure)'],
        ['key' => 'lights', 'label' => 'Lights (head / tail / indicators)'],
        ['key' => 'windscreen', 'label' => 'Windscreen & windows'],
        ['key' => 'dashboard', 'label' => 'Dashboard warning lights'],
        ['key' => 'accessories', 'label' => 'Spare wheel, jack, tools, service book'],
        ['key' => 'fluids', 'label' => 'Fluids (oil, coolant, washer)'],
    ],

    /*
     * Auto-greylist customers whose average rating drops below this threshold
     * once they have at least `greylist_min_ratings` total ratings.
     */
    'rating' => [
        'greylist_threshold' => 2.5,
        'greylist_min_ratings' => 3,
        'blacklist_threshold' => 1.5,
    ],
];
