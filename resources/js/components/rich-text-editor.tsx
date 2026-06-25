import { useCallback, useEffect, useRef } from 'react';
import { Bold, Italic, List, ListOrdered, Underline } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    minHeight?: string;
}

export function RichTextEditor({ value, onChange, placeholder = 'Start typing…', minHeight = '400px' }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const isUpdatingRef = useRef(false);

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor || isUpdatingRef.current) return;
        if (editor.innerHTML !== value) {
            editor.innerHTML = value || '';
        }
    }, [value]);

    const handleInput = useCallback(() => {
        const editor = editorRef.current;
        if (!editor) return;
        isUpdatingRef.current = true;
        onChange(editor.innerHTML);
        isUpdatingRef.current = false;
    }, [onChange]);

    const exec = (command: string, val?: string) => {
        document.execCommand(command, false, val);
        editorRef.current?.focus();
        handleInput();
    };

    return (
        <div className="overflow-hidden rounded-xl border border-stone-200 dark:border-stone-700">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-1 border-b border-stone-200 bg-stone-50 px-3 py-2 dark:border-stone-700 dark:bg-stone-900">
                <Toggle size="sm" onPressedChange={() => exec('bold')} aria-label="Bold">
                    <Bold className="h-3.5 w-3.5" />
                </Toggle>
                <Toggle size="sm" onPressedChange={() => exec('italic')} aria-label="Italic">
                    <Italic className="h-3.5 w-3.5" />
                </Toggle>
                <Toggle size="sm" onPressedChange={() => exec('underline')} aria-label="Underline">
                    <Underline className="h-3.5 w-3.5" />
                </Toggle>
                <div className="mx-1 w-px bg-stone-200 dark:bg-stone-700" />
                <Toggle size="sm" onPressedChange={() => exec('formatBlock', '<h3>')} aria-label="Heading">
                    <span className="text-xs font-bold">H3</span>
                </Toggle>
                <Toggle size="sm" onPressedChange={() => exec('insertUnorderedList')} aria-label="Bullet list">
                    <List className="h-3.5 w-3.5" />
                </Toggle>
                <Toggle size="sm" onPressedChange={() => exec('insertOrderedList')} aria-label="Numbered list">
                    <ListOrdered className="h-3.5 w-3.5" />
                </Toggle>
            </div>

            {/* Editable area */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                data-placeholder={placeholder}
                className="prose prose-sm max-w-none p-4 focus:outline-none dark:prose-invert [&:empty]:before:text-stone-400 [&:empty]:before:content-[attr(data-placeholder)]"
                style={{ minHeight }}
            />
        </div>
    );
}
