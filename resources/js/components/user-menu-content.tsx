import { Link, router } from '@inertiajs/react';
import { LogOut } from 'lucide-react';
import {
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { logout } from '@/routes';
import type { User } from '@/types';

export function UserMenuContent({ user }: { user: User }) {
    return (
        <>
            <DropdownMenuLabel className="p-2 font-normal">
                <UserInfo user={user} showEmail />
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link
                    href={logout()}
                    as="button"
                    className="w-full"
                    onClick={() => router.flushAll()}
                    data-test="logout-button"
                >
                    <LogOut /> Log out
                </Link>
            </DropdownMenuItem>
        </>
    );
}
