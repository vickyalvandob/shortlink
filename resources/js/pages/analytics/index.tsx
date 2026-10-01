import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowDownRight,
    ArrowUpRight,
    CalendarDays,
    ChevronRight,
    Globe2,
    Link2,
    MousePointer2,
    RefreshCw,
    Sunrise,
    TrendingUp,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AnalyticsChart, analyticsDate } from '@/components/analytics-chart';
import {
    CopyButton,
    EmptyState,
    PageHeader,
    Pagination,
} from '@/components/management';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { index } from '@/routes/analytics';
import { index as linksIndex } from '@/routes/links';
import type { AnalyticsProps } from '@/types/analytics';

const numberFormat = new Intl.NumberFormat('en-GB', {
    maximumFractionDigits: 1,
});
const reportProps = [
    'stats',
    'daily',
    'topLinks',
    'clicks',
    'filters',
    'generatedAt',
];

function referrerLabel(referrer: string | null) {
    if (!referrer?.trim()) return 'Direct / not provided';
    try {
        return new URL(referrer).hostname || 'Other referrer';
    } catch {
        return 'Other referrer';
    }
}

export default function Analytics({
    stats,
    daily,
    topLinks,
    clicks,
    filters,
    timezone,
    generatedAt,
}: AnalyticsProps) {
    const isAdmin = usePage().props.auth.user.role === 'admin';
    const [pending, setPending] = useState(false);
    const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: timezone,
    });
    const timeFormat = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone,
    });
    const visit = (
        days: number,
        link: number | null = filters.link?.id ?? null,
    ) => {
        router.get(
            index.url({ query: { days, link: link ?? undefined } }),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: reportProps,
                onStart: () => setPending(true),
                onFinish: () => setPending(false),
                onError: () =>
                    toast.error(
                        'Could not update analytics. Please try again.',
                    ),
            },
        );
    };
    const directPercent = stats.period_clicks
        ? (stats.direct_clicks / stats.period_clicks) * 100
        : 0;
    const sources = [
        {
            label: 'Direct / not provided',
            description: 'No referrer was shared',
            clicks: stats.direct_clicks,
            color: 'bg-emerald-600 dark:bg-emerald-400',
        },
        {
            label: 'Referred traffic',
            description: 'A referrer was shared',
            clicks: stats.referred_clicks,
            color: 'bg-slate-300 dark:bg-slate-600',
        },
    ];
    const change = stats.change_percent;
    const metrics = [
        {
            label: 'Clicks in period',
            value: stats.period_clicks,
            icon: MousePointer2,
            note: `Across the last ${filters.days} days`,
        },
        {
            label: 'Clicks today',
            value: stats.today,
            icon: Sunrise,
            note: 'Since midnight in reporting timezone',
        },
        {
            label: 'Daily average',
            value: stats.average_daily,
            icon: TrendingUp,
            note: 'Includes days without clicks',
        },
        {
            label: 'Links visited',
            value: stats.visited_links,
            icon: Link2,
            note: 'Links with at least one click',
        },
    ];

    return (
        <>
            <Head title="Analytics" />
            <PageHeader
                title="Analytics"
                description={
                    isAdmin
                        ? "A clear view of your team's link performance."
                        : 'A clear view of your link performance.'
                }
            >
                <Button
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => visit(filters.days)}
                >
                    <RefreshCw
                        className={cn(
                            'size-3.5',
                            pending && 'motion-safe:animate-spin',
                        )}
                    />
                    {pending ? 'Updating…' : 'Refresh'}
                </Button>
            </PageHeader>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    <div
                        role="group"
                        aria-label="Reporting period"
                        className="flex gap-1 rounded-lg border bg-muted/40 p-1"
                    >
                        {[7, 30, 90].map((days) => (
                            <Button
                                key={days}
                                variant="ghost"
                                size="sm"
                                disabled={pending}
                                aria-pressed={filters.days === days}
                                className={cn(
                                    'h-8 px-3 text-xs',
                                    filters.days === days &&
                                        'bg-card text-foreground ring-1 ring-border hover:bg-card',
                                )}
                                onClick={() => visit(days)}
                            >
                                {days} days
                            </Button>
                        ))}
                    </div>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="size-3.5" />
                        {analyticsDate(filters.start)} –{' '}
                        {analyticsDate(filters.end)}
                    </span>
                </div>
                <span className="text-xs text-muted-foreground" role="status">
                    {pending
                        ? 'Updating report…'
                        : `Updated ${timeFormat.format(new Date(generatedAt))} · ${timezone}`}
                </span>
            </div>

            {filters.link && (
                <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-emerald-600/20 bg-emerald-600/5 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <Link2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                                {filters.link.title}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                                {filters.link.short_url}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() => visit(filters.days, null)}
                    >
                        <X className="size-3.5" />
                        <span className="hidden sm:inline">All links</span>
                        <span className="sr-only sm:hidden">
                            Clear link filter
                        </span>
                    </Button>
                </div>
            )}

            <div
                aria-busy={pending}
                className={cn(
                    'flex min-w-0 flex-col gap-6 transition-opacity motion-reduce:transition-none',
                    pending && 'pointer-events-none opacity-60',
                )}
            >
                <section
                    className="grid grid-cols-2 overflow-hidden rounded-xl border bg-card lg:grid-cols-4"
                    aria-label="Click summary"
                >
                    {metrics.map(({ label, value, icon: Icon, note }, i) => (
                        <div
                            key={label}
                            className={cn(
                                'flex flex-col gap-4 p-4 sm:p-5 lg:p-6',
                                i % 2 === 1 && 'border-l',
                                i > 1 && 'border-t lg:border-t-0',
                                i === 2 && 'lg:border-l',
                            )}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-medium text-muted-foreground">
                                    {label}
                                </p>
                                <Icon className="size-4 shrink-0 text-muted-foreground/70" />
                            </div>
                            <p className="text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
                                {numberFormat.format(value)}
                            </p>
                            {i === 0 && change !== null ? (
                                <div
                                    className="flex flex-wrap items-center gap-1.5 text-[11px]"
                                    title={`${numberFormat.format(stats.previous_clicks)} clicks in the previous period, compared through the same time of day.`}
                                >
                                    <span
                                        className={cn(
                                            'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-medium',
                                            change > 0
                                                ? 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-400'
                                                : change < 0
                                                  ? 'bg-amber-600/10 text-amber-700 dark:text-amber-400'
                                                  : 'bg-muted text-muted-foreground',
                                        )}
                                    >
                                        {change > 0 ? (
                                            <ArrowUpRight className="size-3" />
                                        ) : change < 0 ? (
                                            <ArrowDownRight className="size-3" />
                                        ) : null}
                                        {Math.abs(change)}%
                                    </span>
                                    <span className="text-muted-foreground">
                                        vs. previous {filters.days} days
                                    </span>
                                </div>
                            ) : (
                                <p className="text-[11px] leading-relaxed text-muted-foreground">
                                    {i === 0
                                        ? 'No clicks in the previous period'
                                        : note}
                                </p>
                            )}
                        </div>
                    ))}
                </section>

                <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,2.2fr)_minmax(260px,1fr)]">
                    <AnalyticsChart
                        key={`${filters.days}-${filters.link?.id ?? 'all'}`}
                        daily={daily}
                        timezone={timezone}
                        exportName={`analytics-${filters.link?.id ?? 'all'}-${filters.start}-${filters.end}`}
                    />
                    <section className="flex h-full min-w-0 flex-col rounded-xl border bg-card p-5 sm:p-6">
                        <h2 className="font-semibold">Traffic sources</h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                            How visitors reached your links.
                        </p>
                        <div className="relative mx-auto my-6 size-36 shrink-0">
                            <svg
                                viewBox="0 0 160 160"
                                className="size-full -rotate-90"
                                role="img"
                                aria-label={`${stats.direct_clicks} direct or unattributed clicks and ${stats.referred_clicks} referred clicks`}
                            >
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="66"
                                    fill="none"
                                    strokeWidth="13"
                                    className={
                                        stats.period_clicks
                                            ? 'stroke-slate-300 dark:stroke-slate-600'
                                            : 'stroke-muted'
                                    }
                                />
                                {stats.period_clicks > 0 && (
                                    <circle
                                        cx="80"
                                        cy="80"
                                        r="66"
                                        fill="none"
                                        strokeWidth="13"
                                        pathLength="100"
                                        strokeDasharray={`${directPercent} ${100 - directPercent}`}
                                        className="stroke-emerald-600 dark:stroke-emerald-400"
                                    />
                                )}
                            </svg>
                            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                                <span className="text-2xl font-semibold tracking-tight tabular-nums">
                                    {numberFormat.format(stats.period_clicks)}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                    total clicks
                                </span>
                            </div>
                        </div>
                        <div className="mt-auto space-y-4">
                            {sources.map((source) => (
                                <div
                                    key={source.label}
                                    className="flex items-start justify-between gap-3 text-xs"
                                >
                                    <div className="flex items-start gap-2">
                                        <span
                                            className={cn(
                                                'mt-1 size-2 shrink-0 rounded-full',
                                                source.color,
                                            )}
                                        />
                                        <div>
                                            <p className="font-medium">
                                                {source.label}
                                            </p>
                                            <p className="mt-1 text-[11px] text-muted-foreground">
                                                {source.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="shrink-0 text-right tabular-nums">
                                        <p className="font-medium">
                                            {numberFormat.format(source.clicks)}
                                        </p>
                                        <p className="mt-1 text-[11px] text-muted-foreground">
                                            {stats.period_clicks
                                                ? numberFormat.format(
                                                      (source.clicks /
                                                          stats.period_clicks) *
                                                          100,
                                                  )
                                                : '0'}
                                            %
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="mt-5 border-t pt-3 text-[11px] leading-relaxed text-muted-foreground">
                            Apps and privacy settings may hide referrers. Clicks
                            are visits, not unique people.
                        </p>
                    </section>
                </div>

                <section className="min-w-0 overflow-hidden rounded-xl border bg-card">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5 sm:px-6">
                        <div>
                            <h2 className="font-semibold">
                                Top performing links
                            </h2>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Ranked by clicks in this period. Select a link
                                to explore.
                            </p>
                        </div>
                        <Button asChild variant="ghost" size="sm">
                            <Link href={linksIndex()}>
                                Manage links
                                <ChevronRight className="size-3.5" />
                            </Link>
                        </Button>
                    </div>
                    {topLinks.length ? (
                        <div className="divide-y">
                            {topLinks.map((link, rank) => (
                                <div
                                    key={link.id}
                                    className="flex items-center gap-3 px-5 py-4 sm:gap-4 sm:px-6"
                                >
                                    <span className="w-4 shrink-0 text-xs text-muted-foreground tabular-nums">
                                        {String(rank + 1).padStart(2, '0')}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <button
                                            className="block max-w-full truncate rounded text-left text-sm font-medium underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                            disabled={pending}
                                            onClick={() =>
                                                visit(filters.days, link.id)
                                            }
                                            title={`View analytics for ${link.title}`}
                                        >
                                            {link.title}
                                        </button>
                                        <div className="mt-0.5 flex min-w-0 items-center gap-1">
                                            <span className="truncate font-mono text-[11px] text-muted-foreground">
                                                {link.short_url.replace(
                                                    /^https?:\/\//,
                                                    '',
                                                )}
                                            </span>
                                            <CopyButton url={link.short_url} />
                                        </div>
                                    </div>
                                    <div
                                        className="hidden w-36 shrink-0 sm:block"
                                        aria-hidden="true"
                                    >
                                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className="h-full rounded-full bg-emerald-600/75 dark:bg-emerald-400/75"
                                                style={{
                                                    width: `${(link.clicks / topLinks[0].clicks) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="w-16 shrink-0 text-right tabular-nums">
                                        <p className="text-sm font-semibold">
                                            {numberFormat.format(link.clicks)}
                                        </p>
                                        <p className="mt-1 text-[11px] text-muted-foreground">
                                            {numberFormat.format(
                                                (link.clicks /
                                                    stats.period_clicks) *
                                                    100,
                                            )}
                                            %
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="hidden size-8 shrink-0 sm:inline-flex"
                                        disabled={pending}
                                        onClick={() =>
                                            visit(filters.days, link.id)
                                        }
                                        aria-label={`View analytics for ${link.title}`}
                                    >
                                        <ChevronRight className="size-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="No clicks in this period"
                            description="Try a longer period or share a short link to start seeing activity."
                        />
                    )}
                </section>

                <section className="min-w-0 overflow-hidden rounded-xl border bg-card">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5 sm:px-6">
                        <div>
                            <h2 className="font-semibold">Recent activity</h2>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Individual clicks in this period, newest first.
                            </p>
                        </div>
                        <span className="rounded-md border px-2 py-1 text-[11px] text-muted-foreground">
                            {numberFormat.format(stats.period_clicks)} clicks in
                            period
                        </span>
                    </div>
                    {clicks.data.length ? (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="pl-5 sm:pl-6">
                                        Short link
                                    </TableHead>
                                    <TableHead className="hidden md:table-cell">
                                        Source
                                    </TableHead>
                                    <TableHead className="pr-5 text-right sm:pr-6">
                                        Time · {timezone}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clicks.data.map((click) => (
                                    <TableRow key={click.id}>
                                        <TableCell className="max-w-0 py-4 pl-5 sm:pl-6">
                                            <button
                                                className="block max-w-full truncate rounded text-sm font-medium underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                                disabled={pending}
                                                onClick={() =>
                                                    visit(
                                                        filters.days,
                                                        click.link_id,
                                                    )
                                                }
                                            >
                                                {click.title}
                                            </button>
                                            <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                                                {click.short_url.replace(
                                                    /^https?:\/\//,
                                                    '',
                                                )}
                                            </p>
                                            <p className="mt-1 truncate text-[11px] text-muted-foreground md:hidden">
                                                {referrerLabel(click.referrer)}
                                            </p>
                                        </TableCell>
                                        <TableCell className="hidden max-w-0 md:table-cell">
                                            <span
                                                className="flex items-center gap-2 text-xs text-muted-foreground"
                                                title={
                                                    click.referrer ??
                                                    'Direct / not provided'
                                                }
                                            >
                                                <Globe2 className="size-3.5 shrink-0" />
                                                <span className="truncate">
                                                    {referrerLabel(
                                                        click.referrer,
                                                    )}
                                                </span>
                                            </span>
                                        </TableCell>
                                        <TableCell className="w-40 pr-5 text-right text-[11px] text-muted-foreground tabular-nums sm:w-48 sm:pr-6">
                                            <time dateTime={click.clicked_at}>
                                                {dateTimeFormat.format(
                                                    new Date(click.clicked_at),
                                                )}
                                            </time>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <EmptyState
                            title="No activity to show"
                            description="Clicks will appear here when someone opens a link in this period."
                        />
                    )}
                    <Pagination
                        data={clicks}
                        only={['clicks']}
                        itemLabel="clicks"
                    />
                </section>

                <footer className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                    <span>
                        {numberFormat.format(stats.total_clicks)} lifetime
                        clicks ·{' '}
                        {filters.link
                            ? 'Selected link'
                            : isAdmin
                              ? 'All team links'
                              : 'Your links'}
                    </span>
                    <span>No visitor IP addresses are recorded.</span>
                </footer>
            </div>
        </>
    );
}
Analytics.layout = { breadcrumbs: [{ title: 'Analytics', href: index() }] };
