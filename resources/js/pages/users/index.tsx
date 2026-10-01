import { Head, Link, router, usePage } from '@inertiajs/react';
import { MoreHorizontal, Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
    ConfirmDeleteDialog,
    EmptyState,
    formatDate,
    PageHeader,
    Pagination,
    StatusBadge,
} from '@/components/management';
import { Badge } from '@/components/ui/badge';
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
import { create, destroy, edit, index, status } from '@/routes/users';
import type { User } from '@/types';
import type { Paginated } from '@/types/shortlink';

export default function Users({ users }: { users: Paginated<User> }) {
    const { auth } = usePage().props;
    const [deleting, setDeleting] = useState<User | null>(null);
    const [pending, setPending] = useState<number | null>(null);
    return (
        <>
            <Head title="Users" />
            <PageHeader
                title="Users"
                description="Manage the people who can access your internal links."
            >
                <Button asChild>
                    <Link href={create()}>
                        <Plus />
                        Create user
                    </Link>
                </Button>
            </PageHeader>
            <section className="overflow-hidden rounded-xl border bg-card">
                {users.data.length ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last login</TableHead>
                                <TableHead>Created at</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.data.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={edit(user.id)}
                                                className="font-medium hover:underline"
                                            >
                                                {user.name}
                                            </Link>
                                            {user.id === auth.user.id && (
                                                <span className="text-xs text-muted-foreground">
                                                    (you)
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {user.email}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                user.role === 'admin'
                                                    ? 'secondary'
                                                    : 'outline'
                                            }
                                            className="font-normal"
                                        >
                                            {user.role === 'admin'
                                                ? 'Admin'
                                                : 'User'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge
                                            status={
                                                user.is_active
                                                    ? 'active'
                                                    : 'inactive'
                                            }
                                        />
                                    </TableCell>
                                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                                        {user.last_login_at
                                            ? formatDate(
                                                  user.last_login_at,
                                                  true,
                                              )
                                            : 'Never'}
                                    </TableCell>
                                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                                        {formatDate(user.created_at)}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={
                                                        pending === user.id
                                                    }
                                                    aria-label={
                                                        'Actions for ' +
                                                        user.name
                                                    }
                                                >
                                                    <MoreHorizontal />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={edit(user.id)}>
                                                        <Pencil />
                                                        Edit
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onSelect={() => {
                                                        setPending(user.id);
                                                        router.patch(
                                                            status.url(user.id),
                                                            {
                                                                is_active:
                                                                    !user.is_active,
                                                            },
                                                            {
                                                                preserveScroll: true,
                                                                onFinish: () =>
                                                                    setPending(
                                                                        null,
                                                                    ),
                                                                onError: (
                                                                    errors,
                                                                ) =>
                                                                    toast.error(
                                                                        Object.values(
                                                                            errors,
                                                                        )[0] ||
                                                                            'Could not update user.',
                                                                    ),
                                                            },
                                                        );
                                                    }}
                                                >
                                                    <Power />
                                                    {user.is_active
                                                        ? 'Disable'
                                                        : 'Enable'}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onSelect={() =>
                                                        setDeleting(user)
                                                    }
                                                >
                                                    <Trash2 />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <EmptyState
                        title="No users found."
                        description="Create a user to give someone access."
                    />
                )}
                <Pagination data={users} />
            </section>
            <p className="text-xs text-muted-foreground">
                Disabled users cannot sign in. Their existing short links remain
                available.
            </p>
            <ConfirmDeleteDialog
                open={!!deleting}
                onOpenChange={(open) => {
                    if (!open) setDeleting(null);
                }}
                title="Delete user?"
                description={
                    '“' +
                    (deleting?.name ?? '') +
                    '” will permanently lose access. Their short links and click history will be kept.'
                }
                processing={pending !== null}
                onConfirm={() => {
                    if (!deleting) return;
                    setPending(deleting.id);
                    router.delete(destroy.url(deleting.id), {
                        preserveScroll: true,
                        onSuccess: () => setDeleting(null),
                        onFinish: () => setPending(null),
                        onError: (errors) =>
                            toast.error(
                                Object.values(errors)[0] ||
                                    'Could not delete user.',
                            ),
                    });
                }}
            />
        </>
    );
}
Users.layout = { breadcrumbs: [{ title: 'Users', href: index() }] };
