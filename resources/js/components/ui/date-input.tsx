import * as React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

const baseClass = [
    'border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground',
    'flex h-9 w-full min-w-0 rounded-md border bg-transparent py-1 text-base shadow-xs',
    'transition-[color,box-shadow] outline-none',
    'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
    'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
    'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
    // Hide the native browser calendar icon and make the indicator span the full input
    // so clicking anywhere on the input opens the picker.
    '[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0',
    '[&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full',
    '[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer',
].join(' ');

function DateInput({ className, ...props }: Omit<React.ComponentProps<'input'>, 'type'>) {
    return (
        <div className="relative">
            <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
                type="date"
                className={cn(baseClass, 'pl-9 pr-3', className)}
                {...props}
            />
        </div>
    );
}

function DateTimeInput({ className, ...props }: Omit<React.ComponentProps<'input'>, 'type'>) {
    return (
        <div className="relative">
            <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
                type="datetime-local"
                className={cn(baseClass, 'pl-9 pr-3', className)}
                {...props}
            />
        </div>
    );
}

export { DateInput, DateTimeInput };
