import { Head, Link, setLayoutProps, useForm } from '@inertiajs/react';
import { ArrowLeft, Star, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import * as Routes from '@/actions/App/Http/Controllers/Web/BookingController';
import { dashboard } from '@/routes';

interface Props {
    booking: {
        id: number;
        reference: string;
        customer: {
            id: number;
            name: string;
            average_rating: number | null;
            ratings_count: number;
        };
        vehicle: { label: string; reg_plate: string };
    };
    existing: {
        score_condition: number;
        score_timeliness: number;
        score_payment: number;
        score_communication: number;
        score_care: number;
        comment: string | null;
    } | null;
}

interface Criterion {
    key:
        | 'score_condition'
        | 'score_timeliness'
        | 'score_payment'
        | 'score_communication'
        | 'score_care';
    label: string;
    hint: string;
}

const CRITERIA: Criterion[] = [
    {
        key: 'score_condition',
        label: 'Vehicle condition',
        hint: 'How was the car treated while in the customer’s care?',
    },
    {
        key: 'score_timeliness',
        label: 'Timeliness',
        hint: 'Pickup + return on the agreed schedule?',
    },
    {
        key: 'score_payment',
        label: 'Payment',
        hint: 'Settled the invoice without chasing?',
    },
    {
        key: 'score_communication',
        label: 'Communication',
        hint: 'Reachable + responsive through the trip?',
    },
    {
        key: 'score_care',
        label: 'Overall care',
        hint: 'General impression of the customer.',
    },
];

export default function RateCustomer({ booking, existing }: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard.url() },
            { title: 'Bookings', href: Routes.index.url() },
            {
                title: booking.reference,
                href: Routes.show.url({ booking: booking.id }),
            },
            { title: 'Rate customer', href: '#' },
        ],
    });

    const { data, setData, post, processing, errors } = useForm({
        score_condition: existing?.score_condition ?? 5,
        score_timeliness: existing?.score_timeliness ?? 5,
        score_payment: existing?.score_payment ?? 5,
        score_communication: existing?.score_communication ?? 5,
        score_care: existing?.score_care ?? 5,
        comment: existing?.comment ?? '',
    });

    const avg =
        (data.score_condition +
            data.score_timeliness +
            data.score_payment +
            data.score_communication +
            data.score_care) /
        5;

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(Routes.storeRating.url({ booking: booking.id }), {
            preserveScroll: true,
        });
    };

    return (
        <div className="mx-auto max-w-3xl p-6">
            <Head title={`Rate customer · ${booking.reference}`} />

            <div className="mb-4 flex items-center gap-3">
                <Link href={Routes.show.url({ booking: booking.id })}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">Rate customer</h1>
                    <p className="text-sm text-muted-foreground">
                        {booking.customer.name} · {booking.reference} ·{' '}
                        {booking.vehicle.label}
                    </p>
                </div>
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1 text-sm font-bold">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        {avg.toFixed(1)}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        this booking
                    </div>
                </div>
            </div>

            {booking.customer.ratings_count > 0 ? (
                <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                    Customer currently averages{' '}
                    <strong>
                        {booking.customer.average_rating?.toFixed(1) ?? '—'}
                    </strong>{' '}
                    across {booking.customer.ratings_count} previous rating
                    {booking.customer.ratings_count === 1 ? '' : 's'}.
                </div>
            ) : null}

            <form onSubmit={onSubmit} className="space-y-4">
                {CRITERIA.map((c) => (
                    <Card key={c.key}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">{c.label}</CardTitle>
                            <p className="text-xs text-muted-foreground">{c.hint}</p>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((n) => {
                                    const active = data[c.key] >= n;
                                    return (
                                        <button
                                            key={n}
                                            type="button"
                                            onClick={() => setData(c.key, n)}
                                            className="rounded-md p-1 transition hover:scale-110"
                                            aria-label={`${n} stars`}
                                        >
                                            <Star
                                                className={`h-7 w-7 ${
                                                    active
                                                        ? 'fill-yellow-400 text-yellow-400'
                                                        : 'text-muted-foreground/40'
                                                }`}
                                            />
                                        </button>
                                    );
                                })}
                                <span className="ml-2 text-sm font-semibold text-muted-foreground">
                                    {data[c.key]}/5
                                </span>
                            </div>
                            <InputError message={errors[c.key]} />
                        </CardContent>
                    </Card>
                ))}

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">
                            Comment (optional)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Label htmlFor="comment" className="sr-only">
                            Comment
                        </Label>
                        <textarea
                            id="comment"
                            rows={4}
                            value={data.comment}
                            onChange={(e) => setData('comment', e.target.value)}
                            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="Anything worth noting for the next booking…"
                        />
                        <InputError message={errors.comment} />
                    </CardContent>
                </Card>

                <div className="flex items-center justify-end gap-3">
                    <Link href={Routes.show.url({ booking: booking.id })}>
                        <Button type="button" variant="outline">
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                    </Link>
                    <Button type="submit" disabled={processing}>
                        <Star className="mr-2 h-4 w-4" />
                        {existing ? 'Update rating' : 'Save rating'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
