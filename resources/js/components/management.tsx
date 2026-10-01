import { Link } from '@inertiajs/react';
import { Check, ChevronLeft, ChevronRight, Copy, Link2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { CursorPaginated, Paginated } from '@/types/shortlink';

export function PageHeader({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children?: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
                <h1 className="text-2xl font-semibold tracking-tight">
                    {title}
                </h1>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {children && (
                <div className="flex shrink-0 items-center gap-2">
                    {children}
                </div>
            )}
        </div>
    );
}

export function EmptyState({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children?: ReactNode;
}) {
    return (
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="mb-2 flex size-12 items-center justify-center rounded-xl border bg-muted/40">
                <Link2 className="size-5 text-muted-foreground" />
            </div>
            <h3 className="font-medium">{title}</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
                {description}
            </p>
            {children && <div className="mt-3">{children}</div>}
        </div>
    );
}

export function StatCards({
    items,
}: {
    items: { label: string; value: number; icon: LucideIcon; note: string }[];
}) {
    return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {items.map(({ label, value, icon: Icon, note }) => (
                <Card className="gap-0 py-5 shadow-none" key={label}>
                    <CardContent className="space-y-4 px-5">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium text-muted-foreground sm:text-sm">
                                {label}
                            </p>
                            <Icon className="size-4 shrink-0 text-muted-foreground" />
                        </div>
                        <p className="text-3xl font-semibold tracking-tight tabular-nums">
                            {value.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">{note}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export function StatusBadge({
    status,
}: {
    status: 'active' | 'inactive' | 'expired';
}) {
    return (
        <Badge
            variant="outline"
            className={cn(
                'gap-1.5 rounded-full font-normal',
                status === 'active' &&
                    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400',
                status === 'expired' && 'text-muted-foreground',
            )}
        >
            <span
                className={cn(
                    'size-1.5 rounded-full',
                    status === 'active'
                        ? 'bg-emerald-500'
                        : 'bg-muted-foreground/60',
                )}
            />
            {
                { active: 'Active', inactive: 'Inactive', expired: 'Expired' }[
                    status
                ]
            }
        </Badge>
    );
}

export async function copyLink(url: string) {
    try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied.');
        return true;
    } catch {
        toast.error(
            'Could not copy the link. Select the URL and copy it manually.',
        );
        return false;
    }
}

export function CopyButton({ url }: { url: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-muted-foreground"
            aria-label={copied ? 'Link copied' : 'Copy link'}
            onClick={() => {
                void copyLink(url).then(setCopied);
            }}
            onBlur={() => setCopied(false)}
        >
            {copied ? (
                <Check className="size-3.5" />
            ) : (
                <Copy className="size-3.5" />
            )}
        </Button>
    );
}

export function Pagination<T>({
    data,
    only,
    itemLabel = 'links',
}: {
    data: Paginated<T> | CursorPaginated<T>;
    only?: string[];
    itemLabel?: string;
}) {
    const [pending, setPending] = useState(false);
    if (!data.data.length && !data.prev_page_url && !data.next_page_url)
        return null;
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 text-xs text-muted-foreground">
            <span>
                {'total' in data
                    ? `Showing ${data.from}–${data.to} of ${data.total.toLocaleString()}`
                    : `Showing ${data.data.length} ${itemLabel} · Newest first`}
            </span>
            <div className="flex items-center gap-2">
                {'current_page' in data && (
                    <span className="mr-2">
                        {data.current_page} / {data.last_page}
                    </span>
                )}
                {data.prev_page_url && !pending ? (
                    <Button
                        asChild
                        variant="outline"
                        size="icon"
                        className="size-8"
                    >
                        <Link
                            href={data.prev_page_url}
                            preserveScroll
                            only={only}
                            onStart={() => setPending(true)}
                            onFinish={() => setPending(false)}
                            aria-label="Previous page"
                        >
                            <ChevronLeft />
                        </Link>
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        disabled
                        aria-label="Previous page"
                    >
                        <ChevronLeft />
                    </Button>
                )}
                {data.next_page_url && !pending ? (
                    <Button
                        asChild
                        variant="outline"
                        size="icon"
                        className="size-8"
                    >
                        <Link
                            href={data.next_page_url}
                            preserveScroll
                            only={only}
                            onStart={() => setPending(true)}
                            onFinish={() => setPending(false)}
                            aria-label="Next page"
                        >
                            <ChevronRight />
                        </Link>
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        disabled
                        aria-label="Next page"
                    >
                        <ChevronRight />
                    </Button>
                )}
            </div>
        </div>
    );
}

export function ConfirmDeleteDialog({
    open,
    onOpenChange,
    title,
    description,
    processing,
    onConfirm,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    processing: boolean;
    onConfirm: () => void;
}) {
    const cancel = useRef<HTMLButtonElement>(null);
    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                if (!processing) onOpenChange(value);
            }}
        >
            <DialogContent
                role="alertdialog"
                onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    cancel.current?.focus();
                }}
                onPointerDownOutside={(event) => event.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription className="pt-2 leading-relaxed">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        ref={cancel}
                        variant="outline"
                        disabled={processing}
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        disabled={processing}
                        onClick={onConfirm}
                    >
                        {processing ? 'Deleting…' : 'Delete'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function formatDate(value: string | null, time = false) {
    if (!value) return '—';
    return new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        ...(time ? { timeStyle: 'short' as const } : {}),
        timeZone: 'Asia/Jakarta',
    }).format(new Date(value));
}
