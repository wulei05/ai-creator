import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { isAdmin } from '@/lib/is-admin';

async function getAuthenticatedAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return null;
  return user;
}

const adminClient = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = 20;
  const offset = (page - 1) * limit;
  const search = searchParams.get('search') ?? '';

  // Get all auth users via admin API
  const { data: authData, error: authError } = await adminClient.auth.admin.listUsers({
    page,
    perPage: limit,
  });
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

  const users = authData.users;
  const userIds = users.map(u => u.id);

  // Get credit balances
  const { data: credits } = await adminClient
    .from('user_credits')
    .select('user_id, balance')
    .in('user_id', userIds);

  // Get task counts per user
  const { data: taskCounts } = await adminClient
    .from('tasks')
    .select('user_id, type')
    .in('user_id', userIds);

  // Get total credits spent per user
  const { data: spentLogs } = await adminClient
    .from('credit_logs')
    .select('user_id, amount')
    .eq('action', 'consume')
    .in('user_id', userIds);

  const creditMap = Object.fromEntries((credits ?? []).map(c => [c.user_id, c.balance]));

  const taskCountMap: Record<string, { total: number; image: number; video: number; chat: number }> = {};
  for (const t of taskCounts ?? []) {
    if (!taskCountMap[t.user_id]) taskCountMap[t.user_id] = { total: 0, image: 0, video: 0, chat: 0 };
    taskCountMap[t.user_id].total++;
    if (t.type === 'image') taskCountMap[t.user_id].image++;
    if (t.type === 'video') taskCountMap[t.user_id].video++;
    if (t.type === 'chat') taskCountMap[t.user_id].chat++;
  }

  const spentMap: Record<string, number> = {};
  for (const l of spentLogs ?? []) {
    spentMap[l.user_id] = (spentMap[l.user_id] ?? 0) + Math.abs(l.amount);
  }

  const result = users
    .filter(u => !search || (u.email ?? '').includes(search))
    .map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      confirmed: !!u.email_confirmed_at,
      balance: creditMap[u.id] ?? 0,
      credits_spent: spentMap[u.id] ?? 0,
      tasks: taskCountMap[u.id] ?? { total: 0, image: 0, video: 0, chat: 0 },
    }));

  return NextResponse.json({
    users: result,
    total: authData.total ?? result.length,
    page,
  });
}
