import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import { FileText, Plus, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as TemplateRoutes from '@/actions/App/Http/Controllers/Web/AgreementTemplateController';

setLayoutProps({ breadcrumbs: [{ title: 'Legal', href: '/legal/templates' }, { title: 'Agreement Templates', href: '/legal/templates' }] });

interface Template {
    id: number;
    name: string;
    version: string;
    is_active: boolean;
    created_by_name: string | null;
    created_at: string;
    agreements_count: number;
}

export default function TemplatesIndex({ templates }: { templates: Template[] }) {
    const destroy = (id: number, name: string) => {
        if (!confirm(`Delete template "${name}"?`)) return;
        router.delete(TemplateRoutes.destroy.url(id));
    };

    return (
        <>
            <Head title="Agreement Templates" />
            <div className="mx-auto max-w-5xl space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Agreement Templates</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Manage the legal clause library for rental agreements.</p>
                    </div>
                    <Button asChild>
                        <Link href={TemplateRoutes.create.url()}>
                            <Plus className="mr-2 h-4 w-4" /> New Template
                        </Link>
                    </Button>
                </div>

                {templates.length === 0 ? (
                    <Card className="py-16 text-center">
                        <CardContent>
                            <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                            <p className="font-medium">No templates yet</p>
                            <p className="mt-1 text-sm text-muted-foreground">Create a template to start generating agreements.</p>
                            <Button asChild className="mt-4">
                                <Link href={TemplateRoutes.create.url()}>Create Template</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {templates.map((t) => (
                            <Card key={t.id}>
                                <CardContent className="flex items-center justify-between py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-900/20">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">{t.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                v{t.version} · {t.agreements_count} agreement{t.agreements_count !== 1 ? 's' : ''} · Created {t.created_at}
                                                {t.created_by_name && ` by ${t.created_by_name}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {t.is_active ? (
                                            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                                                <CheckCircle className="h-3.5 w-3.5" /> Active
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-xs font-medium text-stone-400">
                                                <XCircle className="h-3.5 w-3.5" /> Inactive
                                            </span>
                                        )}
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={TemplateRoutes.edit.url(t.id)}>
                                                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                                            </Link>
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => destroy(t.id, t.name)}>
                                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
