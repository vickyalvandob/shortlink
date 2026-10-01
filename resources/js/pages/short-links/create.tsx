import { Head } from '@inertiajs/react';
import { PageHeader } from '@/components/management';
import { ShortLinkForm } from '@/components/short-link-form';
import { create, index } from '@/routes/links';
import type { Settings } from '@/types/shortlink';
export default function Create({ settings }: { settings: Settings }) {
    return (
        <>
            <Head title="Create Short Link" />
            <PageHeader
                title="Create short link"
                description="A shorter path to the information that matters."
            />
            <ShortLinkForm settings={settings} />
        </>
    );
}
Create.layout = {
    breadcrumbs: [
        { title: 'Short Links', href: index() },
        { title: 'Create', href: create() },
    ],
};
