import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Settings, Users, ScrollText, LayoutDashboard, Palette } from 'lucide-react';

const NAV = [
  { href: '/admin',          label: '概览',     icon: LayoutDashboard },
  { href: '/admin/users',    label: '用户管理', icon: Users },
  { href: '/admin/logs',     label: '使用日志', icon: ScrollText },
  { href: '/admin/config',   label: 'API 配置', icon: Settings },
  { href: '/admin/branding', label: '站点品牌', icon: Palette },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  if (user.email !== process.env.ADMIN_EMAIL) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg font-medium text-destructive">Access denied</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 border-r bg-background flex flex-col">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <LayoutDashboard className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Admin Panel</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-3">
          <Link href="/" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
            ← 返回主页
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 overflow-auto">
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
