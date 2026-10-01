import { Link2, LockKeyhole } from 'lucide-react';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-muted/30 px-6 py-12">
            <div className="w-full max-w-md rounded-xl border bg-card p-7 sm:p-9">
                <div className="mb-8 flex flex-col gap-6">
                    <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Link2 className="size-6" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {title}
                        </h1>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            {description}
                        </p>
                    </div>
                </div>
                {children}
            </div>
            <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                <LockKeyhole className="size-3.5" /> Internal access only.
                Contact your administrator for help.
            </p>
        </div>
    );
}
