import { Head } from '@inertiajs/react';
import { PageHeader } from '@/components/management';
import { UserForm } from '@/components/user-form';
import { index } from '@/routes/users';
import type { User } from '@/types';
export default function Edit({ user }: { user: User }) {
    return (
        <>
            <Head title="Edit User" />
            <PageHeader
                title="Edit user"
                description="Update account details, access, and sign-in credentials."
            />
            <UserForm key={user.id} user={user} />
        </>
    );
}
Edit.layout = {
    breadcrumbs: [
        { title: 'Users', href: index() },
        { title: 'Edit', href: '#' },
    ],
};
