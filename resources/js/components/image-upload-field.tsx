import { useRef, useState } from 'react';
import { CheckCircle2, Camera, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface Props {
    label: string;
    value: string;
    onChange: (url: string) => void;
    /** Hint passed to /uploads so files are organised. */
    folder?: 'customers' | 'vehicles' | 'inspections' | 'misc';
    required?: boolean;
    error?: string;
    hint?: string;
}

/**
 * Single-image upload tile for Inertia forms. POSTs to /uploads (web route
 * wired in routes/web.php that reuses FileUploadController) and writes the
 * returned URL back via onChange. Renders a preview thumbnail once uploaded.
 */
export function ImageUploadField({ label, value, onChange, folder = 'customers', required, error, hint }: Props) {
    const ref = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const pick = () => ref.current?.click();
    const clear = () => onChange('');

    const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setBusy(true);
        setLocalError(null);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('folder', folder);
            // Laravel + Inertia use the XSRF-TOKEN cookie. The value is URL-encoded
            // so it has to be decoded before sending back as X-XSRF-TOKEN.
            const xsrf = document.cookie
                .split('; ')
                .find((c) => c.startsWith('XSRF-TOKEN='))
                ?.split('=')[1];
            const res = await fetch('/uploads', {
                method: 'POST',
                body: fd,
                credentials: 'same-origin',
                headers: {
                    ...(xsrf ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrf) } : {}),
                    Accept: 'application/json',
                },
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.message ?? `Upload failed (${res.status})`);
            }
            const data = (await res.json()) as { url: string };
            onChange(data.url);
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setBusy(false);
            // Reset the input so re-uploading the same file fires onChange.
            if (ref.current) ref.current.value = '';
        }
    };

    const shownError = error ?? localError ?? undefined;

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <Label>
                    {label}
                    {required ? <span className="ml-0.5 text-red-500">*</span> : null}
                </Label>
                {value ? (
                    <button
                        type="button"
                        onClick={clear}
                        className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                    >
                        <Trash2 className="h-3 w-3" /> Remove
                    </button>
                ) : null}
            </div>

            <input ref={ref} type="file" accept="image/*" className="hidden" onChange={onFile} />

            {value ? (
                <button
                    type="button"
                    onClick={pick}
                    className="group relative block w-full overflow-hidden rounded-lg border bg-muted/30 hover:bg-muted/50"
                >
                    <img src={value} alt={label} className="block h-32 w-full object-cover" />
                    <div className="flex items-center gap-2 border-t bg-muted/40 px-3 py-1.5 text-left">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                        <span className="text-xs font-medium text-foreground">Uploaded · click to replace</span>
                    </div>
                </button>
            ) : (
                <Button
                    type="button"
                    variant="outline"
                    onClick={pick}
                    disabled={busy}
                    className={`h-24 w-full flex-col gap-1.5 border-dashed ${shownError ? 'border-red-500 text-red-600' : ''}`}
                >
                    {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            <Camera className="h-4 w-4" />
                            <span className="text-xs">Upload</span>
                        </>
                    )}
                </Button>
            )}

            {hint && !shownError ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
            {shownError ? <p className="text-xs font-medium text-red-600">{shownError}</p> : null}
        </div>
    );
}
