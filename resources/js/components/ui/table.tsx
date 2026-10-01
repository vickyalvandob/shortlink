import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function Table({ className, ...props }: ComponentProps<'table'>) {
    return <div className="relative w-full overflow-x-auto"><table className={cn('w-full caption-bottom text-sm', className)} {...props} /></div>;
}
export function TableHeader(props: ComponentProps<'thead'>) { return <thead className="border-b bg-muted/40" {...props} />; }
export function TableBody(props: ComponentProps<'tbody'>) { return <tbody className="[&_tr:last-child]:border-0" {...props} />; }
export function TableRow({ className, ...props }: ComponentProps<'tr'>) { return <tr className={cn('border-b transition-colors hover:bg-muted/30', className)} {...props} />; }
export function TableHead({ className, ...props }: ComponentProps<'th'>) { return <th className={cn('h-11 px-5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground', className)} {...props} />; }
export function TableCell({ className, ...props }: ComponentProps<'td'>) { return <td className={cn('px-5 py-4 align-middle', className)} {...props} />; }
