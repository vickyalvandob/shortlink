import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    CheckCircle2,
    Link2,
    MousePointer2,
    Plus,
    Power,
} from 'lucide-react';
import { EmptyState, PageHeader, StatCards } from '@/components/management';
import { ShortLinkTable } from '@/components/short-link-table';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import { create, index } from '@/routes/links';
import type { ShortLink } from '@/types/shortlink';

export default function Dashboard({
    stats,
    recentLinks,
}: {
    stats: {
        total_links: number;
        active_links: number;
        inactive_links: number;
        total_clicks: number;
    };
    recentLinks: ShortLink[];
}) {
    const isAdmin = usePage().props.auth.user.role === 'admin';
    return (
        <>
            <Head title="Dashboard" />
            <PageHeader
                title="Dashboard"
                description={
                    isAdmin
                        ? "A simple overview of your team's links."
                        : 'A simple overview of your own links.'
                }
            >
                <Button asChild>
                    <Link href={create()}>
                        <Plus />
                        Create short link
                    </Link>
                </Button>
            </PageHeader>
            <StatCards
                items={[
                    {
                        label: 'Total links',
                        value: stats.total_links,
                        icon: Link2,
                        note: isAdmin ? 'Across your team' : 'Created by you',
                    },
                    {
                        label: 'Active links',
                        value: stats.active_links,
                        icon: CheckCircle2,
                        note: 'Ready to redirect',
                    },
                    {
                        label: 'Inactive links',
                        value: stats.inactive_links,
                        icon: Power,
                        note: 'Disabled or expired',
                    },
                    {
                        label: 'Total clicks',
                        value: stats.total_clicks,
                        icon: MousePointer2,
                        note: 'All-time link visits',
                    },
                ]}
            />
            <section className="overflow-hidden rounded-xl border bg-card">
                <div className="flex items-center justify-between gap-4 border-b px-5 py-5">
                    <div>
                        <h2 className="font-semibold">Recent short links</h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Your latest links, all in one place.
                        </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={index()}>
                            View all
                            <ArrowRight />
                        </Link>
                    </Button>
                </div>
                {recentLinks.length ? (
                    <ShortLinkTable links={recentLinks} />
                ) : (
                    <EmptyState
                        title="No short links yet."
                        description="Create your first short link and make long URLs easier to share."
                    >
                        <Button asChild>
                            <Link href={create()}>
                                <Plus />
                                Create short link
                            </Link>
                        </Button>
                    </EmptyState>
                )}
            </section>
        </>
    );
}
Dashboard.layout = { breadcrumbs: [{ title: 'Dashboard', href: dashboard() }] };
