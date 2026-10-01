export type ShortLink = {
    id: number;
    title: string;
    slug: string;
    short_url: string;
    destination_url: string;
    redirect_type: number;
    is_active: boolean;
    expires_at: string | null;
    total_clicks: number;
    last_clicked_at: string | null;
    created_at: string;
    status: 'active' | 'inactive' | 'expired';
    creator?: { id: number; name: string } | null;
};

export type Settings = {
    app_name: string;
    short_domain: string;
    default_slug_length: number;
    default_redirect_type: number;
};

export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
};

export type CursorPaginated<T> = {
    data: T[];
    per_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};
