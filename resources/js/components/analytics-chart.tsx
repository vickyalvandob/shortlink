import { ChartColumn, ChartNoAxesCombined, Download } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DailyClicks } from '@/types/analytics';

const numberFormat = new Intl.NumberFormat('en-GB', {
    maximumFractionDigits: 1,
});
const dateFormat = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
});

export function analyticsDate(value: string) {
    return dateFormat.format(new Date(`${value}T00:00:00Z`));
}

export function AnalyticsChart({
    daily,
    timezone,
    exportName,
}: {
    daily: DailyClicks[];
    timezone: string;
    exportName: string;
}) {
    const gradientId = useId();
    const [mode, setMode] = useState<'area' | 'bar'>('area');
    const [active, setActive] = useState<number | null>(null);
    const peak = daily.reduce(
        (best, day) => (day.clicks > best.clicks ? day : best),
        daily[0],
    );
    const ceiling = Math.max(4, Math.ceil((peak?.clicks ?? 0) / 4) * 4);
    const width = 800;
    const height = 208;
    const step = width / daily.length;
    const points = daily.map((day, i) => ({
        x: step * (i + 0.5),
        y: height - (day.clicks / ceiling) * height,
    }));
    const line = points
        .map((point, i) => `${i ? 'L' : 'M'} ${point.x} ${point.y}`)
        .join(' ');
    const selected = active === null ? null : daily[active];
    const selectedPoint = active === null ? null : points[active];
    const labelIndices = [
        ...new Set([
            0,
            Math.round((daily.length - 1) / 3),
            Math.round(((daily.length - 1) * 2) / 3),
            daily.length - 1,
        ]),
    ];

    const exportCsv = () => {
        const rows = [
            'Date,Clicks,Timezone',
            ...daily.map((day) => `${day.date},${day.clicks},${timezone}`),
        ];
        const url = URL.createObjectURL(
            new Blob([rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' }),
        );
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${exportName}.csv`;
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    return (
        <section className="min-w-0 rounded-xl border bg-card">
            <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
                <div>
                    <h2 className="font-semibold">Click activity</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Daily clicks over the selected period.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div
                        className="flex gap-0.5 rounded-lg border p-0.5"
                        aria-label="Chart style"
                        role="group"
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                'size-7 rounded-md',
                                mode === 'area' && 'bg-muted',
                            )}
                            aria-label="Area chart"
                            aria-pressed={mode === 'area'}
                            onClick={() => setMode('area')}
                        >
                            <ChartNoAxesCombined className="size-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                'size-7 rounded-md',
                                mode === 'bar' && 'bg-muted',
                            )}
                            aria-label="Bar chart"
                            aria-pressed={mode === 'bar'}
                            onClick={() => setMode('bar')}
                        >
                            <ChartColumn className="size-3.5" />
                        </Button>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={exportCsv}
                        aria-label="Export daily clicks as CSV"
                    >
                        <Download className="size-3.5" />
                        <span className="hidden sm:inline">Export</span>
                    </Button>
                </div>
            </div>
            <div className="px-5 pb-5 sm:px-6">
                <div className="mb-5 flex min-h-6 items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-2 text-muted-foreground">
                        <span className="size-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                        Clicks
                    </span>
                    <span
                        className="tabular-nums"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {selected ? (
                            <>
                                <span className="text-muted-foreground">
                                    {analyticsDate(selected.date)}
                                </span>
                                <span className="mx-2 text-muted-foreground/50">
                                    /
                                </span>
                                <span className="font-medium">
                                    {numberFormat.format(selected.clicks)}{' '}
                                    clicks
                                </span>
                            </>
                        ) : (
                            <span className="text-muted-foreground">
                                Hover or select a day
                            </span>
                        )}
                    </span>
                </div>
                <div className="flex gap-3">
                    <div
                        className="flex h-52 w-9 shrink-0 flex-col justify-between text-right text-[11px] text-muted-foreground tabular-nums"
                        aria-hidden="true"
                    >
                        {[4, 3, 2, 1, 0].map((tick) => (
                            <span key={tick} className="-translate-y-1/2">
                                {new Intl.NumberFormat('en-GB', {
                                    notation: 'compact',
                                }).format((ceiling * tick) / 4)}
                            </span>
                        ))}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div
                            className="relative h-52 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-4 focus-visible:ring-offset-card"
                            role="slider"
                            tabIndex={0}
                            aria-label="Explore daily clicks using the left and right arrow keys"
                            aria-valuemin={0}
                            aria-valuemax={daily.length - 1}
                            aria-valuenow={active ?? daily.length - 1}
                            aria-valuetext={`${analyticsDate((selected ?? daily[daily.length - 1]).date)}: ${(selected ?? daily[daily.length - 1]).clicks} clicks`}
                            onFocus={() => setActive(daily.length - 1)}
                            onBlur={() => setActive(null)}
                            onPointerMove={(event) => {
                                const bounds =
                                    event.currentTarget.getBoundingClientRect();
                                setActive(
                                    Math.max(
                                        0,
                                        Math.min(
                                            daily.length - 1,
                                            Math.floor(
                                                ((event.clientX - bounds.left) /
                                                    bounds.width) *
                                                    daily.length,
                                            ),
                                        ),
                                    ),
                                );
                            }}
                            onPointerLeave={() => setActive(null)}
                            onKeyDown={(event) => {
                                const current = active ?? daily.length - 1;
                                const next = {
                                    ArrowLeft: current - 1,
                                    ArrowDown: current - 1,
                                    ArrowRight: current + 1,
                                    ArrowUp: current + 1,
                                    Home: 0,
                                    End: daily.length - 1,
                                }[event.key];
                                if (next !== undefined) {
                                    event.preventDefault();
                                    setActive(
                                        Math.max(
                                            0,
                                            Math.min(daily.length - 1, next),
                                        ),
                                    );
                                }
                            }}
                        >
                            <svg
                                viewBox={`0 -8 ${width} ${height + 8}`}
                                preserveAspectRatio="none"
                                className="h-full w-full overflow-visible text-emerald-600 dark:text-emerald-400"
                                aria-hidden="true"
                            >
                                <defs>
                                    <linearGradient
                                        id={gradientId}
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor="currentColor"
                                            stopOpacity="0.2"
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor="currentColor"
                                            stopOpacity="0.01"
                                        />
                                    </linearGradient>
                                </defs>
                                {[0, 1, 2, 3, 4].map((tick) => (
                                    <line
                                        key={tick}
                                        x1="0"
                                        x2={width}
                                        y1={(height * tick) / 4}
                                        y2={(height * tick) / 4}
                                        className="stroke-border"
                                        strokeDasharray={
                                            tick === 4 ? undefined : '3 5'
                                        }
                                        vectorEffect="non-scaling-stroke"
                                    />
                                ))}
                                {mode === 'area' ? (
                                    <>
                                        <path
                                            d={`${line} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`}
                                            fill={`url(#${gradientId})`}
                                        />
                                        <path
                                            d={line}
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeLinejoin="round"
                                            vectorEffect="non-scaling-stroke"
                                        />
                                    </>
                                ) : (
                                    points.map((point, i) => (
                                        <rect
                                            key={daily[i].date}
                                            x={point.x - step * 0.3}
                                            y={point.y}
                                            width={step * 0.6}
                                            height={height - point.y}
                                            rx="2"
                                            fill="currentColor"
                                            opacity={
                                                active === null || active === i
                                                    ? 0.85
                                                    : 0.35
                                            }
                                        />
                                    ))
                                )}
                                {selectedPoint && (
                                    <>
                                        <line
                                            x1={selectedPoint.x}
                                            x2={selectedPoint.x}
                                            y1="-8"
                                            y2={height}
                                            stroke="currentColor"
                                            strokeOpacity="0.35"
                                            strokeDasharray="4 4"
                                            vectorEffect="non-scaling-stroke"
                                        />
                                        <circle
                                            cx={selectedPoint.x}
                                            cy={selectedPoint.y}
                                            r="4"
                                            fill="currentColor"
                                            className="stroke-card"
                                            strokeWidth="2"
                                            vectorEffect="non-scaling-stroke"
                                        />
                                    </>
                                )}
                            </svg>
                            {!peak?.clicks && (
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                    <span className="rounded-lg border bg-card px-4 py-2 text-xs text-muted-foreground">
                                        No clicks in this period
                                    </span>
                                </div>
                            )}
                        </div>
                        <div
                            className="mt-3 flex justify-between gap-2 text-[10px] text-muted-foreground sm:text-[11px]"
                            aria-hidden="true"
                        >
                            {labelIndices.map((i) => (
                                <span key={i}>
                                    {analyticsDate(daily[i].date)}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3 text-xs text-muted-foreground sm:px-6">
                <span>
                    {peak?.clicks ? (
                        <>
                            Peak day:{' '}
                            <span className="font-medium text-foreground">
                                {analyticsDate(peak.date)}
                            </span>{' '}
                            · {numberFormat.format(peak.clicks)} clicks
                        </>
                    ) : (
                        'Share a link to start seeing activity.'
                    )}
                </span>
                <span>{timezone}</span>
            </div>
        </section>
    );
}
