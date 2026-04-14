import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  if (user.email !== process.env.ADMIN_EMAIL) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg font-medium text-destructive">Access denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4">
        <h1 className="text-xl font-semibold">Admin Panel</h1>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
