import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    LayoutDashboard,
    Link2,
    Settings,
    Users,
} from 'lucide-react';
import { index as links } from '@/routes/links';
import { index as analytics } from '@/routes/analytics';
import { index as users } from '@/routes/users';
import { edit as settings } from '@/routes/settings';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';

export function AppSidebar() {
    const { auth } = usePage().props;
    const items = [
        { title: 'Dashboard', href: dashboard(), icon: LayoutDashboard },
        { title: 'Short Links', href: links(), icon: Link2 },
        { title: 'Analytics', href: analytics(), icon: BarChart3 },
        ...(auth.user.role === 'admin'
            ? [
                  { title: 'Users', href: users(), icon: Users },
                  { title: 'Settings', href: settings(), icon: Settings },
              ]
            : []),
    ];
    return (
        <Sidebar collapsible="icon" variant="sidebar">
            <SidebarHeader className="border-b px-3 py-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()}>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent className="pt-5">
                <NavMain items={items} />
            </SidebarContent>
            <SidebarFooter className="border-t p-3">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
