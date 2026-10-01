import { Head } from '@inertiajs/react';
import { PageHeader } from '@/components/management';
import { ShortLinkForm } from '@/components/short-link-form';
import { index } from '@/routes/links';
import type { Settings, ShortLink } from '@/types/shortlink';
export default function Edit({
    link,
    settings,
}: {
    link: ShortLink;
    settings: Settings;
}) {
    return (
        <>
            <Head title="Edit Short Link" />
            <PageHeader
                title="Edit short link"
                description="Update the destination, availability, or short URL."
            />
            <ShortLinkForm key={link.id} link={link} settings={settings} />
        </>
    );
}
Edit.layout = {
    breadcrumbs: [
        { title: 'Short Links', href: index() },
        { title: 'Edit', href: '#' },
    ],
};
