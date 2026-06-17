<?php

/**
 * Brand identity — drives logo, colors, tagline across the entire app.
 *
 * Switch between brands by changing APP_BRAND in .env:
 *   APP_BRAND=chamhembe   → Chamhembe Car Rental (client deployment)
 *   APP_BRAND=zuura       → ZUURA Miles (SaaS platform)
 *
 * Every component reads from Inertia's shared `branding` prop, which is
 * populated from this config. The CSS theme (primary/sidebar colors) is
 * applied via a `data-brand` attribute on <html> in app.blade.php.
 */
$brand = env('APP_BRAND', 'laxora');

$brands = [
    'laxora' => [
        'theme' => 'laxora',
        'name' => 'Laxora',
        'subtitle' => 'Car Rental',
        'tagline' => 'Premium vehicle rental services',
        'logo_initial' => 'L',
        'logo_gradient_from' => '#c2943f',
        'logo_gradient_to' => '#010101',
        'logo_icon' => null,
        'logo_wordmark' => null,
    ],
    'chamhembe' => [
        'theme' => 'chamhembe',
        'name' => 'Chamhembe',
        'subtitle' => 'Car Rental',
        'tagline' => 'Premium fleet rental services',
        'logo_initial' => 'C',
        'logo_gradient_from' => '#4f46e5',
        'logo_gradient_to' => '#7c3aed',
        'logo_icon' => null,
        'logo_wordmark' => null,
    ],
    'zuura' => [
        'theme' => 'zuura',
        'name' => 'ZUURA Miles',
        'subtitle' => 'Every kilometre, covered.',
        'tagline' => 'Fleet rental management for modern operators',
        'logo_initial' => 'Z',
        'logo_gradient_from' => '#113C5D',
        'logo_gradient_to' => '#4CCC71',
        'logo_icon' => '/brand_assets/Icon.svg',
        'logo_wordmark' => '/brand_assets/zuura-miles-wordmark-white.svg',
    ],
];

return $brands[$brand] ?? $brands['laxora'];
