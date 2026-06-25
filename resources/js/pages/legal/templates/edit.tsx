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
    { title: 'Edit Template', href: '#' },
]});

interface Template {
    id: number;
    name: string;
    content: string;
    version: string;
    is_active: boolean;
}

export default function TemplateEdit({ template }: { template: Template }) {
    const { data, setData, put, processing, errors } = useForm({
        name: template.name,
        content: template.content,
        version: template.version,
        is_active: template.is_active,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(TemplateRoutes.update.url(template.id));
    };

    return (
        <>
            <Head title={`Edit — ${template.name}`} />
            <div className="mx-auto max-w-4xl space-y-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Edit Template</h1>
                    <p className="mt-1 text-sm text-muted-foreground">{template.name} · v{template.version}</p>
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
                                <Input id="version" value={data.version} onChange={e => setData('version', e.target.value)} />
                                <InputError message={errors.version} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Legal Clauses</CardTitle></CardHeader>
                        <CardContent>
                            <RichTextEditor
                                value={data.content}
                                onChange={v => setData('content', v)}
                                minHeight="500px"
                            />
                            <InputError message={errors.content} />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => history.back()}>Cancel</Button>
                        <Button type="submit" disabled={processing}>Save Changes</Button>
                    </div>
                </form>
            </div>
        </>
    );
}
