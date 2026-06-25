<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\AgreementTemplate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AgreementTemplateController extends Controller
{
    public function index(): Response
    {
        $templates = AgreementTemplate::with('creator:id,name')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (AgreementTemplate $t) => [
                'id' => $t->id,
                'name' => $t->name,
                'version' => $t->version,
                'is_active' => $t->is_active,
                'created_by_name' => $t->creator?->name,
                'created_at' => $t->created_at->format('d M Y'),
                'agreements_count' => $t->agreements()->count(),
            ]);

        return Inertia::render('legal/templates/index', [
            'templates' => $templates,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('legal/templates/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'content' => ['required', 'string'],
            'version' => ['required', 'string', 'max:20'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        AgreementTemplate::create(array_merge($data, [
            'created_by' => $request->user()->id,
        ]));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Agreement template created.']);

        return redirect()->route('legal.templates.index');
    }

    public function edit(AgreementTemplate $agreementTemplate): Response
    {
        return Inertia::render('legal/templates/edit', [
            'template' => [
                'id' => $agreementTemplate->id,
                'name' => $agreementTemplate->name,
                'content' => $agreementTemplate->content,
                'version' => $agreementTemplate->version,
                'is_active' => $agreementTemplate->is_active,
            ],
        ]);
    }

    public function update(Request $request, AgreementTemplate $agreementTemplate): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'content' => ['required', 'string'],
            'version' => ['required', 'string', 'max:20'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $agreementTemplate->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Template updated.']);

        return redirect()->route('legal.templates.index');
    }

    public function destroy(AgreementTemplate $agreementTemplate): RedirectResponse
    {
        $agreementTemplate->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Template deleted.']);

        return redirect()->route('legal.templates.index');
    }
}
