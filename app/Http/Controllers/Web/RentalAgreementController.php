<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\AgreementTemplate;
use App\Models\Booking;
use App\Models\Customer;
use App\Models\RentalAgreement;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class RentalAgreementController extends Controller
{
    public function index(Request $request): Response
    {
        $agreements = RentalAgreement::with(['customer:id,name', 'booking:id,booking_number'])
            ->when($request->search, fn ($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('agreement_number', 'like', "%{$s}%")
                    ->orWhere('renter_name', 'like', "%{$s}%")
                    ->orWhere('vehicle_registration', 'like', "%{$s}%");
            }))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (RentalAgreement $a) => [
                'id' => $a->id,
                'agreement_number' => $a->agreement_number,
                'renter_name' => $a->renter_name,
                'vehicle_registration' => $a->vehicle_registration,
                'vehicle_make_model' => $a->vehicle_make_model,
                'rental_start' => $a->rental_start?->format('d M Y'),
                'rental_end' => $a->rental_end?->format('d M Y'),
                'total_amount' => $a->total_amount,
                'status' => $a->status,
                'renter_signed_at' => $a->renter_signed_at?->format('d M Y H:i'),
                'company_signed_at' => $a->company_signed_at?->format('d M Y H:i'),
                'created_at' => $a->created_at->format('d M Y'),
            ]);

        return Inertia::render('legal/agreements/index', [
            'agreements' => $agreements,
            'filters' => $request->only('search', 'status'),
            'summary' => [
                'total' => RentalAgreement::count(),
                'draft' => RentalAgreement::where('status', 'draft')->count(),
                'fully_signed' => RentalAgreement::where('status', 'fully_signed')->count(),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('legal/agreements/create', [
            'templates' => AgreementTemplate::where('is_active', true)->orderBy('name')->get(['id', 'name', 'version']),
            'customers' => Customer::orderBy('name')->get(['id', 'name', 'phone', 'email', 'address', 'id_number']),
            'bookings' => Booking::with('vehicle:id,make,model,reg_plate')
                ->whereNotNull('vehicle_id')
                ->orderByDesc('created_at')
                ->get(['id', 'booking_number', 'vehicle_id', 'customer_id', 'pickup_at', 'return_at', 'daily_rate', 'total_amount', 'deposit_amount'])
                ->map(fn (Booking $b) => [
                    'id' => $b->id,
                    'booking_number' => $b->booking_number,
                    'vehicle_label' => $b->vehicle ? "{$b->vehicle->make} {$b->vehicle->model} — {$b->vehicle->reg_plate}" : null,
                    'vehicle_registration' => $b->vehicle?->reg_plate,
                    'vehicle_make_model' => $b->vehicle ? "{$b->vehicle->make} {$b->vehicle->model}" : null,
                    'customer_id' => $b->customer_id,
                    'pickup_at' => $b->pickup_at,
                    'return_at' => $b->return_at,
                    'daily_rate' => $b->daily_rate,
                    'total_amount' => $b->total_amount,
                    'deposit_amount' => $b->deposit_amount,
                ]),
            'prefill_booking_id' => $request->booking_id,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'template_id' => ['nullable', 'exists:agreement_templates,id'],
            'booking_id' => ['nullable', 'exists:bookings,id'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'renter_name' => ['required', 'string', 'max:160'],
            'renter_id_number' => ['nullable', 'string', 'max:60'],
            'renter_address' => ['nullable', 'string'],
            'renter_phone' => ['nullable', 'string', 'max:30'],
            'renter_email' => ['nullable', 'email', 'max:120'],
            'vehicle_make_model' => ['nullable', 'string', 'max:100'],
            'vehicle_registration' => ['nullable', 'string', 'max:30'],
            'mileage_out' => ['nullable', 'string', 'max:20'],
            'fuel_level_out' => ['nullable', 'string', 'max:20'],
            'rental_start' => ['nullable', 'date'],
            'rental_end' => ['nullable', 'date'],
            'collection_location' => ['nullable', 'string', 'max:100'],
            'return_location' => ['nullable', 'string', 'max:100'],
            'rental_rate' => ['nullable', 'numeric', 'min:0'],
            'rental_days' => ['nullable', 'integer', 'min:1'],
            'total_amount' => ['nullable', 'numeric', 'min:0'],
            'deposit_amount' => ['nullable', 'numeric', 'min:0'],
            'mileage_allowance' => ['nullable', 'integer', 'min:0'],
            'excess_mileage_fee' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        // Snapshot template content
        if (! empty($data['template_id'])) {
            $template = AgreementTemplate::find($data['template_id']);
            $data['template_content'] = $template?->content;
        }

        $agreement = RentalAgreement::create(array_merge($data, [
            'agreement_number' => 'AGR-'.strtoupper(Str::random(8)),
            'status' => 'draft',
        ]));

        Inertia::flash('toast', ['type' => 'success', 'message' => "Agreement {$agreement->agreement_number} created."]);

        return redirect()->route('legal.agreements.show', $agreement);
    }

    public function show(RentalAgreement $rentalAgreement): Response
    {
        return Inertia::render('legal/agreements/show', [
            'agreement' => $this->formatAgreement($rentalAgreement),
        ]);
    }

    public function sign(Request $request, RentalAgreement $rentalAgreement): RedirectResponse
    {
        $data = $request->validate([
            'signer' => ['required', 'in:renter,company'],
            'signature' => ['required', 'string'], // base64 PNG
            'representative_name' => ['nullable', 'string', 'max:120'],
        ]);

        if ($data['signer'] === 'renter') {
            $rentalAgreement->update([
                'renter_signature' => $data['signature'],
                'renter_representative_name' => $data['representative_name'],
                'renter_signed_at' => now(),
                'status' => $rentalAgreement->company_signed_at ? 'fully_signed' : 'renter_signed',
            ]);
        } else {
            $rentalAgreement->update([
                'company_signature' => $data['signature'],
                'company_representative_name' => $data['representative_name'],
                'company_signed_at' => now(),
                'status' => $rentalAgreement->renter_signed_at ? 'fully_signed' : 'sent',
            ]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Signature saved.']);

        return back();
    }

    public function downloadPdf(RentalAgreement $rentalAgreement): HttpResponse
    {
        $pdf = Pdf::loadView('pdf.rental-agreement', [
            'agreement' => $rentalAgreement,
        ])->setPaper('a4', 'portrait');

        return $pdf->download("agreement-{$rentalAgreement->agreement_number}.pdf");
    }

    public function destroy(RentalAgreement $rentalAgreement): RedirectResponse
    {
        $rentalAgreement->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Agreement deleted.']);

        return redirect()->route('legal.agreements.index');
    }

    /** @return array<string, mixed> */
    private function formatAgreement(RentalAgreement $a): array
    {
        return [
            'id' => $a->id,
            'agreement_number' => $a->agreement_number,
            'status' => $a->status,
            'renter_name' => $a->renter_name,
            'renter_id_number' => $a->renter_id_number,
            'renter_address' => $a->renter_address,
            'renter_phone' => $a->renter_phone,
            'renter_email' => $a->renter_email,
            'vehicle_make_model' => $a->vehicle_make_model,
            'vehicle_registration' => $a->vehicle_registration,
            'mileage_out' => $a->mileage_out,
            'fuel_level_out' => $a->fuel_level_out,
            'rental_start' => $a->rental_start?->format('d M Y H:i'),
            'rental_end' => $a->rental_end?->format('d M Y H:i'),
            'collection_location' => $a->collection_location,
            'return_location' => $a->return_location,
            'rental_rate' => $a->rental_rate,
            'rental_days' => $a->rental_days,
            'total_amount' => $a->total_amount,
            'deposit_amount' => $a->deposit_amount,
            'mileage_allowance' => $a->mileage_allowance,
            'excess_mileage_fee' => $a->excess_mileage_fee,
            'template_content' => $a->template_content,
            'renter_signature' => $a->renter_signature,
            'renter_representative_name' => $a->renter_representative_name,
            'renter_signed_at' => $a->renter_signed_at?->format('d M Y H:i'),
            'company_signature' => $a->company_signature,
            'company_representative_name' => $a->company_representative_name,
            'company_signed_at' => $a->company_signed_at?->format('d M Y H:i'),
            'notes' => $a->notes,
            'created_at' => $a->created_at->format('d M Y'),
        ];
    }
}
