import { Head, setLayoutProps, useForm } from '@inertiajs/react';
import { RichTextEditor } from '@/components/rich-text-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import * as TemplateRoutes from '@/actions/App/Http/Controllers/Web/AgreementTemplateController';

setLayoutProps({ breadcrumbs: [
    { title: 'Legal', href: '/legal/templates' },
    { title: 'Agreement Templates', href: '/legal/templates' },
    { title: 'New Template', href: '/legal/templates/create' },
]});

const DEFAULT_CONTENT = `<h3>3. DRIVER REQUIREMENTS</h3>
<ol>
<li>The Renter and any authorized driver must be at least 25 years old unless approved otherwise.</li>
<li>Hold a valid driver's licence recognized in Zimbabwe.</li>
<li>Have at least 2 years driving experience.</li>
<li>Provide valid identification.</li>
<li>Not drive under the influence of alcohol or drugs.</li>
<li>Foreign drivers must provide an International Driving Permit where required.</li>
</ol>

<h3>4. USE OF VEHICLE</h3>
<p>The vehicle may only be used lawfully. The Renter shall not:</p>
<ol>
<li>Allow unauthorized drivers.</li>
<li>Use the vehicle for racing, towing, or illegal activities.</li>
<li>Drive recklessly or overload the vehicle.</li>
<li>Smoke inside the vehicle.</li>
<li>Drive on unsuitable roads.</li>
<li>Take the vehicle outside Zimbabwe without written approval.</li>
<li>Unauthorized cross-border travel is strictly prohibited.</li>
</ol>

<h3>5. INSURANCE &amp; LIABILITY</h3>
<ol>
<li>The vehicle carries limited insurance subject to insurer terms.</li>
<li>The Renter remains liable for insurance excess, damage caused by negligence or misuse, tyre, windscreen, rim, undercarriage, and interior damage, theft due to negligence, mechanical damage from misuse, and damage arising from traffic violations or intoxicated driving.</li>
<li>Insurance becomes void if the vehicle is used unlawfully, driven by an unauthorized person, false information is provided, or this Agreement is breached.</li>
<li>The Renter indemnifies the Company against all claims, losses, damages, liabilities, and legal costs arising during the rental period.</li>
</ol>

<h3>6. ACCIDENTS, DAMAGE &amp; REPAIRS</h3>
<p>The Renter must immediately report any accident, theft, damage, or breakdown to both the Company and the Zimbabwe Republic Police. The Renter must:</p>
<ol>
<li>Report incidents within 24 hours.</li>
<li>Obtain a Police Report reference number.</li>
<li>Cooperate with insurers and the Company.</li>
<li>Not admit liability to third parties.</li>
<li>The Company alone shall determine repair procedures, service providers, and replacement parts.</li>
<li>Unauthorized repairs or interference with the vehicle shall make the Renter fully liable for all resulting losses and damages.</li>
</ol>

<h3>7. VEHICLE RETURN</h3>
<p>The Renter confirms receipt of the vehicle in good condition and agrees to return it:</p>
<ol>
<li>In the same condition received.</li>
<li>With the agreed fuel level.</li>
<li>With all keys, tools, and documents.</li>
<li>Additional cleaning or late return charges may apply.</li>
<li>Failure to return the vehicle on time may result in penalties, repossession, or reporting the vehicle as unlawfully retained.</li>
</ol>

<h3>8. MILEAGE &amp; GPS TRACKING</h3>
<p>The Company may verify mileage using the odometer and GPS tracking. Tampering with the odometer or GPS system is a material breach and may result in termination, repossession, and legal action.</p>

<h3>9. FINES &amp; REPOSSESSION</h3>
<p>The Renter is responsible for all traffic fines, toll fees, parking violations, clamping, storage fees, and court penalties incurred during the rental period. The Company may repossess the vehicle without notice if unlawfully retained, misused, or operated in breach of this Agreement, at the Renter's cost.</p>

<h3>10. TERMINATION &amp; LIABILITY LIMITATION</h3>
<p>The Company may terminate this Agreement immediately for breach, false information, unlawful conduct, or misuse of the vehicle. No refund shall be due after lawful termination. The Company shall not be liable for loss of income, delays, missed appointments, loss of personal property, or indirect damages. All personal belongings remain at the Renter's risk.</p>

<h3>11. GOVERNING LAW</h3>
<p>This Agreement shall be governed by the laws of Zimbabwe. Any disputes shall fall under the jurisdiction of the Courts of Zimbabwe.</p>

<h3>12. DECLARATION</h3>
<p>I confirm that I have read, understood, and accepted this Agreement and that all information provided is true and correct.</p>`;

export default function TemplateCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: 'Vehicle Rental Agreement',
        content: DEFAULT_CONTENT,
        version: '1.0',
        is_active: true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(TemplateRoutes.store.url());
    };

    return (
        <>
            <Head title="New Agreement Template" />
            <div className="mx-auto max-w-4xl space-y-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">New Agreement Template</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Define the legal clauses that will appear in rental agreements.</p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Template Details</CardTitle></CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="name">Template Name *</Label>
                                <Input id="name" value={data.name} onChange={e => setData('name', e.target.value)} />
                                <InputError message={errors.name} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="version">Version *</Label>
                                <Input id="version" value={data.version} onChange={e => setData('version', e.target.value)} placeholder="1.0" />
                                <InputError message={errors.version} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Legal Clauses</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Edit the legal text. Vehicle details, renter info, and rental fees are auto-filled from each booking.
                            </p>
                        </CardHeader>
                        <CardContent>
                            <RichTextEditor
                                value={data.content}
                                onChange={v => setData('content', v)}
                                placeholder="Enter the legal clauses for this agreement…"
                                minHeight="500px"
                            />
                            <InputError message={errors.content} />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => history.back()}>Cancel</Button>
                        <Button type="submit" disabled={processing}>Save Template</Button>
                    </div>
                </form>
            </div>
        </>
    );
}
