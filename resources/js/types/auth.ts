export type User = {
    id: number;
    name: string;
    role: 'admin' | 'user';
    is_active: boolean;
    last_login_at: string | null;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};
