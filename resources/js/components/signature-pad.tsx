import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

interface SignaturePadProps {
    value?: string | null;
    onChange?: (signature: string | null) => void;
    readOnly?: boolean;
    label?: string;
}

export function SignaturePad({ value, onChange, readOnly = false, label = 'Signature' }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(!!value);
    const lastPos = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (value) {
            const img = new Image();
            img.onload = () => ctx.drawImage(img, 0, 0);
            img.src = value;
            setHasSignature(true);
        } else {
            setHasSignature(false);
        }
    }, [value]);

    const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        if ('touches' in e) {
            const touch = e.touches[0];
            return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
        }
        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    };

    const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
        if (readOnly) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        setIsDrawing(true);
        lastPos.current = getPos(e, canvas);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || readOnly) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx || !lastPos.current) return;

        const pos = getPos(e, canvas);
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        lastPos.current = pos;
        setHasSignature(true);
    };

    const endDraw = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        lastPos.current = null;
        const canvas = canvasRef.current;
        if (canvas && onChange) {
            onChange(canvas.toDataURL('image/png'));
        }
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
        onChange?.(null);
    };

    return (
        <div className="space-y-2">
            {label && <p className="text-sm font-medium">{label}</p>}
            <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-stone-900">
                <canvas
                    ref={canvasRef}
                    width={600}
                    height={160}
                    className="w-full touch-none"
                    style={{ cursor: readOnly ? 'default' : 'crosshair' }}
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={endDraw}
                />
                {!hasSignature && !readOnly && (
                    <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-stone-400">
                        Draw your signature here
                    </p>
                )}
            </div>
            {!readOnly && hasSignature && (
                <Button type="button" variant="outline" size="sm" onClick={clear}>
                    Clear
                </Button>
            )}
        </div>
    );
}
