import { Link, router, usePage } from '@inertiajs/react';
import { Copy, MoreHorizontal, Pencil, Power, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
    ConfirmDeleteDialog,
    CopyButton,
    copyLink,
    formatDate,
    StatusBadge,
} from '@/components/management';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { destroy, edit, status } from '@/routes/links';
import type { ShortLink } from '@/types/shortlink';

export function ShortLinkTable({
    links,
    actions = false,
}: {
    links: ShortLink[];
    actions?: boolean;
}) {
    const showCreator = usePage().props.auth.user.role === 'admin';
    const [deleting, setDeleting] = useState<ShortLink | null>(null);
    const [pending, setPending] = useState<number | null>(null);
    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Link</TableHead>
                        <TableHead>Short URL</TableHead>
                        <TableHead className="text-right">Clicks</TableHead>
                        <TableHead>Status</TableHead>
                        {showCreator && <TableHead>Created by</TableHead>}
                        <TableHead>Created at</TableHead>
                        {actions && (
                            <TableHead>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        )}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {links.map((link) => (
                        <TableRow key={link.id}>
                            <TableCell>
                                <Link
                                    className="block max-w-48 truncate font-medium hover:underline"
                                    href={edit(link.id)}
                                    title={link.title}
                                >
                                    {link.title}
                                </Link>
                                <a
                                    className="mt-1 block max-w-48 truncate text-xs text-muted-foreground hover:text-foreground"
                                    href={link.destination_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    title={link.destination_url}
                                >
                                    {link.destination_url}
                                </a>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1">
                                    <a
                                        className="max-w-52 truncate font-mono text-xs"
                                        href={link.short_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        title={link.short_url}
                                    >
                                        {link.short_url.replace(
                                            /^https?:\/\//,
                                            '',
                                        )}
                                    </a>
                                    <CopyButton url={link.short_url} />
                                </div>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                                {link.total_clicks.toLocaleString()}
                            </TableCell>
                            <TableCell>
                                <StatusBadge status={link.status} />
                            </TableCell>
                            {showCreator && (
                                <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                                    <span
                                        className="block max-w-36 truncate"
                                        title={
                                            link.creator?.name ?? 'Deleted user'
                                        }
                                    >
                                        {link.creator?.name ?? 'Deleted user'}
                                    </span>
                                </TableCell>
                            )}
                            <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                                {formatDate(link.created_at)}
                            </TableCell>
                            {actions && (
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8"
                                                disabled={pending === link.id}
                                                aria-label={
                                                    'Actions for ' + link.title
                                                }
                                            >
                                                <MoreHorizontal />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onSelect={() => {
                                                    void copyLink(
                                                        link.short_url,
                                                    );
                                                }}
                                            >
                                                <Copy />
                                                Copy link
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href={edit(link.id)}>
                                                    <Pencil />
                                                    Edit
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onSelect={() => {
                                                    setPending(link.id);
                                                    router.patch(
                                                        status.url(link.id),
                                                        {
                                                            is_active:
                                                                !link.is_active,
                                                        },
                                                        {
                                                            preserveScroll: true,
                                                            onFinish: () =>
                                                                setPending(
                                                                    null,
                                                                ),
                                                            onError: () =>
                                                                toast.error(
                                                                    'Could not update this link.',
                                                                ),
                                                        },
                                                    );
                                                }}
                                            >
                                                <Power />
                                                {link.is_active
                                                    ? 'Disable'
                                                    : 'Enable'}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onSelect={() =>
                                                    setDeleting(link)
                                                }
                                            >
                                                <Trash2 />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <ConfirmDeleteDialog
                open={!!deleting}
                onOpenChange={(open) => {
                    if (!open) setDeleting(null);
                }}
                title="Delete short link?"
                description={
                    '“' +
                    (deleting?.title ?? '') +
                    '” and its click history will be permanently deleted. The short URL will stop working.'
                }
                processing={pending !== null}
                onConfirm={() => {
                    if (!deleting) return;
                    setPending(deleting.id);
                    router.delete(destroy.url(deleting.id), {
                        preserveScroll: true,
                        onSuccess: () => setDeleting(null),
                        onFinish: () => setPending(null),
                        onError: () =>
                            toast.error('Could not delete this link.'),
                    });
                }}
            />
        </>
    );
}
