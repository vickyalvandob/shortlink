import type { CursorPaginated } from '@/types/shortlink';

export type DailyClicks = { date: string; clicks: number };

export type AnalyticsLink = {
    id: number;
    title: string;
    short_url: string;
};

export type AnalyticsProps = {
    stats: {
        total_clicks: number;
        today: number;
        period_clicks: number;
        previous_clicks: number;
        change_percent: number | null;
        average_daily: number;
        visited_links: number;
        direct_clicks: number;
        referred_clicks: number;
    };
    daily: DailyClicks[];
    topLinks: (AnalyticsLink & { clicks: number; last_clicked_at: string })[];
    clicks: CursorPaginated<{
        id: number;
        link_id: number;
        title: string;
        short_url: string;
        referrer: string | null;
        clicked_at: string;
    }>;
    filters: {
        days: number;
        link: AnalyticsLink | null;
        start: string;
        end: string;
    };
    timezone: string;
    generatedAt: string;
};
