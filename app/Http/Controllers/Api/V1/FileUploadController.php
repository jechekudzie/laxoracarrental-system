<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Generic media upload endpoint. The mobile app posts one file at a time;
 * we store it under the `public` disk and return the canonical URL that the
 * client can then stash on the owning resource (e.g. vehicle.photos array).
 *
 * Uploads are scoped by a `folder` hint so we don't co-mingle vehicle shots
 * with inspection photos. Allowed folders are whitelisted here; anything
 * else drops into `misc`.
 */
class FileUploadController extends Controller
{
    private const ALLOWED_FOLDERS = [
        'vehicles',
        'inspections',
        'customers',
        'misc',
    ];

    public function store(Request $request): JsonResponse
    {
        // Intentionally open: mobile register wizard uploads docs before
        // the account exists. Rate-limited at the route level (api throttle)
        // and validated below; folder is whitelisted so files can't escape.
        $validated = $request->validate([
            'file' => [
                'required',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp,heic,heif',
                'max:10240', // 10 MB
            ],
            'folder' => ['nullable', 'string', 'max:40'],
        ]);

        $folder = in_array($validated['folder'] ?? 'misc', self::ALLOWED_FOLDERS, true)
            ? $validated['folder']
            : 'misc';

        $file = $request->file('file');
        $extension = $file->getClientOriginalExtension() ?: $file->extension();
        $filename = Str::random(32).'.'.strtolower($extension);
        $path = $file->storeAs($folder, $filename, 'public');

        return response()->json([
            'url' => Storage::disk('public')->url($path),
            'path' => $path,
            'folder' => $folder,
            'filename' => $filename,
            'size' => $file->getSize(),
            'mime' => $file->getMimeType(),
        ], 201);
    }
}
