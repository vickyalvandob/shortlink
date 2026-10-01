import { Head, useForm } from '@inertiajs/react';
import { Info, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/management';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { edit, update } from '@/routes/settings';
import type { Settings } from '@/types/shortlink';

export default function Edit({ settings }: { settings: Settings }) {
    const form = useForm({
        app_name: settings.app_name,
        default_slug_length: settings.default_slug_length,
        default_redirect_type: settings.default_redirect_type,
    });
    return (
        <>
            <Head title="Settings" />
            <PageHeader
                title="Settings"
                description="Simple defaults for your team's short links."
            />
            <form
                className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.submit(update(), {
                        onError: () =>
                            toast.error('Please check the highlighted fields.'),
                    });
                }}
            >
                <div className="rounded-xl border bg-card">
                    <div className="border-b p-6">
                        <h2 className="font-semibold">
                            Application preferences
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            These settings apply to everyone on the team.
                        </p>
                    </div>
                    <div className="space-y-6 p-6">
                        <div className="grid gap-2">
                            <Label htmlFor="app_name">Application name</Label>
                            <Input
                                id="app_name"
                                required
                                maxLength={80}
                                value={form.data.app_name}
                                onChange={(e) =>
                                    form.setData('app_name', e.target.value)
                                }
                            />
                            <InputError message={form.errors.app_name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="short_domain">Short domain</Label>
                            <Input
                                id="short_domain"
                                readOnly
                                value={settings.short_domain}
                                className="bg-muted/40 text-muted-foreground"
                            />
                            <p className="text-xs leading-relaxed text-muted-foreground">
                                Automatically follows the application URL and
                                cannot be changed here.
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="default_slug_length">
                                Default slug length
                            </Label>
                            <Input
                                id="default_slug_length"
                                required
                                type="number"
                                min={4}
                                max={32}
                                value={form.data.default_slug_length}
                                onChange={(e) =>
                                    form.setData(
                                        'default_slug_length',
                                        Number(e.target.value),
                                    )
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                Between 4 and 32 characters. Recommended: 7.
                            </p>
                            <InputError
                                message={form.errors.default_slug_length}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="default_redirect_type">
                                Default redirect type
                            </Label>
                            <Select
                                value={String(form.data.default_redirect_type)}
                                onValueChange={(value) =>
                                    form.setData(
                                        'default_redirect_type',
                                        Number(value),
                                    )
                                }
                            >
                                <SelectTrigger
                                    id="default_redirect_type"
                                    className="w-full"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="302">
                                        302 — Temporary (recommended)
                                    </SelectItem>
                                    <SelectItem value="301">
                                        301 — Permanent
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError
                                message={form.errors.default_redirect_type}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end border-t p-6">
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Saving…' : 'Save settings'}
                        </Button>
                    </div>
                </div>
                <aside className="space-y-5">
                    <div className="rounded-xl border bg-card p-6">
                        <h2 className="flex items-center gap-2 text-sm font-medium">
                            <Link2 className="size-4" />
                            URL preview
                        </h2>
                        <p className="mt-5 rounded-lg border bg-muted/30 p-3 text-sm break-all">
                            {settings.short_domain}
                            /your-link
                        </p>
                    </div>
                    <div className="flex items-start gap-3 rounded-xl border p-5 text-xs leading-relaxed text-muted-foreground">
                        <Info className="mt-0.5 size-4 shrink-0" />
                        <p>
                            Slug length and redirect type apply to new links.
                            Existing links keep their current values.
                        </p>
                    </div>
                </aside>
            </form>
        </>
    );
}
Edit.layout = { breadcrumbs: [{ title: 'Settings', href: edit() }] };
