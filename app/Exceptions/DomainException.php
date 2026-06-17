<?php

declare(strict_types=1);

namespace App\Exceptions;

use Illuminate\Http\Request;
use RuntimeException;
use Symfony\Component\HttpFoundation\Response;

/**
 * Base class for business-rule violations (booking conflicts, blacklisted customers, etc.).
 *
 * Rendered as HTTP 422 JSON for API/AJAX clients. For Inertia/web clients, falls back
 * to a redirect with a flash toast + validation error so the SPA can display it inline
 * without tripping Inertia's "expected Inertia response" guard.
 */
abstract class DomainException extends RuntimeException
{
    public function render(Request $request): Response
    {
        $payload = [
            'message' => $this->getMessage(),
            'code' => class_basename(static::class),
        ];

        // API / JSON clients: return 422 JSON as before.
        if ($request->expectsJson() && ! $request->header('X-Inertia')) {
            return response()->json($payload, 422);
        }

        // Inertia / classic web clients: flash a toast and redirect back with the message
        // attached as a top-level validation error so <InputError /> can surface it.
        return back()
            ->withInput()
            ->with('toast', ['type' => 'error', 'message' => $this->getMessage()])
            ->withErrors(['error' => $this->getMessage()]);
    }
}
