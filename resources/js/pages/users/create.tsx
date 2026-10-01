import { Head } from '@inertiajs/react';
import { PageHeader } from '@/components/management';
import { UserForm } from '@/components/user-form';
import { create, index } from '@/routes/users';
export default function Create() {
    return (
        <>
            <Head title="Create User" />
            <PageHeader
                title="Create user"
                description="Give a team member access to your internal short links."
            />
            <UserForm />
        </>
    );
}
Create.layout = {
    breadcrumbs: [
        { title: 'Users', href: index() },
        { title: 'Create', href: create() },
    ],
};
