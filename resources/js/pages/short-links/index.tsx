import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Search, X } from 'lucide-react';
import { useState } from 'react';
import { EmptyState, PageHeader, Pagination } from '@/components/management';
import { ShortLinkTable } from '@/components/short-link-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { create, index } from '@/routes/links';
import type { CursorPaginated, ShortLink } from '@/types/shortlink';

export default function ShortLinks({
    links,
    filters,
}: {
    links: CursorPaginated<ShortLink>;
    filters: { search: string; per_page: number };
}) {
    const isAdmin = usePage().props.auth.user.role === 'admin';
    const [search, setSearch] = useState(filters.search);
    const [searching, setSearching] = useState(false);
    const visit = (nextSearch: string, perPage: number) => {
        router.get(
            index.url(),
            { search: nextSearch, per_page: perPage },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['links', 'filters'],
                onStart: () => setSearching(true),
                onFinish: () => setSearching(false),
            },
        );
    };
    return (
        <>
            <Head title="Short Links" />
            <PageHeader
                title="Short Links"
                description={
                    isAdmin
                        ? 'All short links across your team, with their creators.'
                        : 'Create, organize, and share your own short links.'
                }
            >
                <Button asChild>
                    <Link href={create()}>
                        <Plus />
                        Create short link
                    </Link>
                </Button>
            </PageHeader>
            <section
                className="overflow-hidden rounded-xl border bg-card"
                aria-busy={searching}
            >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5">
                    <form
                        className="flex w-full max-w-lg items-center gap-2"
                        onSubmit={(event) => {
                            event.preventDefault();
                            visit(search, filters.per_page);
                        }}
                    >
                        <div className="relative flex-1">
                            <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                            <Input
                                className="pl-9"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search title, slug, or destination…"
                                aria-label="Search short links"
                                maxLength={200}
                            />
                        </div>
                        <Button
                            variant="outline"
                            type="submit"
                            disabled={searching}
                        >
                            {searching ? 'Searching…' : 'Search'}
                        </Button>
                        {filters.search && (
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Clear search"
                                type="button"
                                disabled={searching}
                                onClick={() => {
                                    setSearch('');
                                    visit('', filters.per_page);
                                }}
                            >
                                <X />
                            </Button>
                        )}
                    </form>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span id="rows-per-page-label">Rows per page</span>
                        <Select
                            value={String(filters.per_page)}
                            disabled={searching}
                            onValueChange={(value) =>
                                visit(search, Number(value))
                            }
                        >
                            <SelectTrigger
                                className="w-20"
                                aria-labelledby="rows-per-page-label"
                            >
                                <SelectValue>{filters.per_page}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {[20, 50, 100].map((size) => (
                                    <SelectItem key={size} value={String(size)}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                {links.data.length ? (
                    <ShortLinkTable links={links.data} actions />
                ) : (
                    <EmptyState
                        title={
                            filters.search
                                ? 'No matching links.'
                                : 'No short links yet.'
                        }
                        description={
                            filters.search
                                ? 'Try a different title, slug, or destination URL.'
                                : 'Create your first short link to get started.'
                        }
                    >
                        {!filters.search && (
                            <Button asChild>
                                <Link href={create()}>
                                    <Plus />
                                    Create short link
                                </Link>
                            </Button>
                        )}
                    </EmptyState>
                )}
                <Pagination data={links} only={['links', 'filters']} />
            </section>
        </>
    );
}
ShortLinks.layout = { breadcrumbs: [{ title: 'Short Links', href: index() }] };
