import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { index, store, update } from '@/routes/users';
import type { User } from '@/types';

export function UserForm({ user }: { user?: User }) {
    const form = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
        password: '',
        role: user?.role ?? 'user',
        is_active: user?.is_active ?? true,
    });
    return (
        <form
            className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]"
            onSubmit={(event) => {
                event.preventDefault();
                form.submit(user ? update(user.id) : store(), {
                    onSuccess: () => form.reset('password'),
                    onError: () =>
                        toast.error('Please check the highlighted fields.'),
                });
            }}
        >
            <div className="rounded-xl border bg-card">
                <div className="border-b p-6">
                    <h2 className="font-semibold">Account details</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Only active accounts can sign in.
                    </p>
                </div>
                <div className="space-y-6 p-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            required
                            autoFocus
                            maxLength={255}
                            autoComplete="name"
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                        />
                        <InputError message={form.errors.name} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            maxLength={255}
                            autoComplete="email"
                            value={form.data.email}
                            onChange={(e) =>
                                form.setData('email', e.target.value)
                            }
                        />
                        <InputError message={form.errors.email} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">
                            Password{' '}
                            {user && (
                                <span className="font-normal text-muted-foreground">
                                    (optional)
                                </span>
                            )}
                        </Label>
                        <PasswordInput
                            id="password"
                            required={!user}
                            minLength={12}
                            maxLength={128}
                            autoComplete="new-password"
                            value={form.data.password}
                            onChange={(e) =>
                                form.setData('password', e.target.value)
                            }
                        />
                        <p className="text-xs text-muted-foreground">
                            {user
                                ? 'Leave blank to keep the current password. '
                                : ''}
                            Use at least 12 characters.
                        </p>
                        <InputError message={form.errors.password} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                            value={form.data.role}
                            onValueChange={(value: 'admin' | 'user') =>
                                form.setData('role', value)
                            }
                        >
                            <SelectTrigger id="role" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={form.errors.role} />
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-4">
                        <Checkbox
                            id="is_active"
                            checked={form.data.is_active}
                            onCheckedChange={(value) =>
                                form.setData('is_active', value === true)
                            }
                        />
                        <div className="space-y-1">
                            <Label htmlFor="is_active">Active account</Label>
                            <p className="text-xs text-muted-foreground">
                                Allow this person to access the application.
                            </p>
                        </div>
                    </div>
                    <InputError message={form.errors.is_active} />
                </div>
                <div className="flex justify-between gap-3 border-t p-6">
                    <Button variant="ghost" asChild>
                        <Link href={index()}>
                            <ArrowLeft />
                            Cancel
                        </Link>
                    </Button>
                    <Button type="submit" disabled={form.processing}>
                        {form.processing
                            ? 'Saving…'
                            : user
                              ? 'Save changes'
                              : 'Create user'}
                    </Button>
                </div>
            </div>
            <aside className="rounded-xl border bg-card p-6">
                <div className="mb-5 flex items-center gap-2 font-medium">
                    <ShieldCheck className="size-4" />
                    Access roles
                </div>
                <dl className="space-y-5 text-sm">
                    <div>
                        <dt className="font-medium">User</dt>
                        <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            Manage all team short links and view the dashboard
                            and analytics.
                        </dd>
                    </div>
                    <div>
                        <dt className="font-medium">Admin</dt>
                        <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            Everything a user can do, plus manage accounts and
                            application settings.
                        </dd>
                    </div>
                </dl>
                <p className="mt-6 border-t pt-4 text-xs leading-relaxed text-muted-foreground">
                    At least one active admin must remain. Share initial
                    credentials with the user through your team's secure
                    channel.
                </p>
            </aside>
        </form>
    );
}
