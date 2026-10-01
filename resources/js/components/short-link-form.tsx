import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowUpRight, Link2, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { CopyButton, formatDate, StatusBadge } from '@/components/management';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { generateSlug, index, store, update } from '@/routes/links';
import type { Settings, ShortLink } from '@/types/shortlink';

function localInput(value: string | null) {
    if (!value) return '';
    const date = new Date(value);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function ShortLinkForm({
    link,
    settings,
}: {
    link?: ShortLink;
    settings: Settings;
}) {
    const form = useForm({
        title: link?.title ?? '',
        destination_url: link?.destination_url ?? '',
        slug: link?.slug ?? '',
        expires_at: localInput(link?.expires_at ?? null),
        is_active: link?.is_active ?? true,
    });
    const [generating, setGenerating] = useState(false);
    const preview =
        settings.short_domain + '/' + (form.data.slug || 'your-link');
    async function generate() {
        setGenerating(true);
        try {
            const response = await fetch(generateSlug.url(), {
                headers: { Accept: 'application/json' },
            });
            if (!response.ok) throw new Error('Unable to generate');
            const result: { slug: string } = await response.json();
            form.setData('slug', result.slug);
            form.clearErrors('slug');
            toast.success('New slug generated.');
        } catch {
            toast.error('Could not generate a slug. Please try again.');
        } finally {
            setGenerating(false);
        }
    }
    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                form.transform((data) => ({
                    ...data,
                    expires_at: data.expires_at
                        ? new Date(data.expires_at).toISOString()
                        : null,
                }));
                form.submit(link ? update(link.id) : store(), {
                    onError: () =>
                        toast.error('Please check the highlighted fields.'),
                });
            }}
            className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
        >
            <div className="rounded-xl border bg-card">
                <div className="border-b p-6">
                    <h2 className="font-semibold">Link details</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Choose a destination and a memorable short URL.
                    </p>
                </div>
                <div className="space-y-6 p-6">
                    <div className="grid gap-2">
                        <Label htmlFor="title">
                            Title{' '}
                            <span className="text-muted-foreground">*</span>
                        </Label>
                        <Input
                            id="title"
                            autoFocus
                            required
                            maxLength={255}
                            placeholder="e.g. Employee handbook"
                            value={form.data.title}
                            onChange={(e) =>
                                form.setData('title', e.target.value)
                            }
                            aria-invalid={!!form.errors.title}
                        />
                        <InputError message={form.errors.title} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="destination_url">
                            Destination URL{' '}
                            <span className="text-muted-foreground">*</span>
                        </Label>
                        <Input
                            id="destination_url"
                            type="url"
                            required
                            maxLength={4096}
                            placeholder="https://example.com/your-long-url"
                            value={form.data.destination_url}
                            onChange={(e) =>
                                form.setData('destination_url', e.target.value)
                            }
                            aria-invalid={!!form.errors.destination_url}
                        />
                        <p className="text-xs text-muted-foreground">
                            The page people will visit when they open your link.
                        </p>
                        <InputError message={form.errors.destination_url} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="slug">Slug</Label>
                        <div className="flex gap-2">
                            <Input
                                id="slug"
                                placeholder="employee-handbook"
                                maxLength={100}
                                autoComplete="off"
                                value={form.data.slug}
                                onChange={(e) =>
                                    form.setData('slug', e.target.value)
                                }
                                aria-invalid={!!form.errors.slug}
                            />
                            <Button
                                variant="outline"
                                type="button"
                                disabled={generating || form.processing}
                                onClick={() => {
                                    void generate();
                                }}
                            >
                                <RefreshCw
                                    className={generating ? 'animate-spin' : ''}
                                />
                                Generate
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Letters, numbers, - and _ only. Leave blank to
                            generate {settings.default_slug_length} characters
                            automatically.
                        </p>
                        <InputError message={form.errors.slug} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="expires_at">
                            Expiration date{' '}
                            <span className="font-normal text-muted-foreground">
                                (optional)
                            </span>
                        </Label>
                        <Input
                            id="expires_at"
                            type="datetime-local"
                            value={form.data.expires_at}
                            onChange={(e) =>
                                form.setData('expires_at', e.target.value)
                            }
                            aria-invalid={!!form.errors.expires_at}
                        />
                        <p className="text-xs text-muted-foreground">
                            Uses your browser's local time. Leave blank to keep
                            the link available indefinitely.
                        </p>
                        <InputError message={form.errors.expires_at} />
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-4">
                        <Checkbox
                            id="is_active"
                            checked={form.data.is_active}
                            onCheckedChange={(checked) =>
                                form.setData('is_active', checked === true)
                            }
                        />
                        <div className="space-y-1">
                            <Label htmlFor="is_active">Active link</Label>
                            <p className="text-xs text-muted-foreground">
                                Allow this link to redirect to its destination.
                            </p>
                            <InputError message={form.errors.is_active} />
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between gap-3 border-t p-6">
                    <Button variant="ghost" asChild>
                        <Link href={index()}>
                            <ArrowLeft />
                            Cancel
                        </Link>
                    </Button>
                    <Button
                        type="submit"
                        disabled={form.processing || generating}
                    >
                        {form.processing
                            ? 'Saving…'
                            : link
                              ? 'Save changes'
                              : 'Create short link'}
                    </Button>
                </div>
            </div>
            <aside className="space-y-5">
                <div className="rounded-xl border bg-card p-6">
                    <div className="mb-5 flex items-center gap-2 text-sm font-medium">
                        <Link2 className="size-4" />
                        Short link preview
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3">
                        <p className="min-w-0 flex-1 text-sm break-all">
                            {preview}
                        </p>
                        {form.data.slug && <CopyButton url={preview} />}
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                        <ArrowUpRight className="size-4 shrink-0" />
                        <span className="truncate">
                            {form.data.destination_url ||
                                'Your destination URL'}
                        </span>
                    </div>
                    <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
                        {link
                            ? link.redirect_type
                            : settings.default_redirect_type}{' '}
                        redirect.{' '}
                        {link
                            ? 'Changes take effect as soon as you save.'
                            : 'The link becomes available after you save it.'}
                    </p>
                </div>
                {link && (
                    <div className="rounded-xl border bg-card p-6">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-sm font-medium">
                                Link activity
                            </h2>
                            <StatusBadge status={link.status} />
                        </div>
                        <dl className="space-y-4 text-sm">
                            {[
                                [
                                    'Total clicks',
                                    link.total_clicks.toLocaleString(),
                                ],
                                [
                                    'Last clicked',
                                    formatDate(link.last_clicked_at, true),
                                ],
                                [
                                    'Created by',
                                    link.creator?.name ?? 'Deleted user',
                                ],
                                [
                                    'Created at',
                                    formatDate(link.created_at, true),
                                ],
                            ].map(([label, value]) => (
                                <div
                                    key={label}
                                    className="flex flex-col gap-1"
                                >
                                    <dt className="text-xs text-muted-foreground">
                                        {label}
                                    </dt>
                                    <dd>{value}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                )}
            </aside>
        </form>
    );
}
