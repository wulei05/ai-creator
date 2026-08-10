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
  const limit = 50;
  const offset = (page - 1) * limit;
  const type = searchParams.get('type') ?? '';   // image | video | chat | ''
  const status = searchParams.get('status') ?? ''; // completed | failed | ''
  const userId = searchParams.get('user_id') ?? '';

  let query = adminClient
    .from('tasks')
    .select('id, user_id, type, model, status, prompt, credits_cost, created_at, completed_at, error_message', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (type) query = query.eq('type', type);
  if (status) query = query.eq('status', status);
  if (userId) query = query.eq('user_id', userId);

  const { data: tasks, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch emails for users in this page
  const userIds = [...new Set((tasks ?? []).map(t => t.user_id))];
  const emailMap: Record<string, string> = {};
  if (userIds.length > 0) {
    for (const uid of userIds) {
      const { data: u } = await adminClient.auth.admin.getUserById(uid);
      if (u?.user) emailMap[uid] = u.user.email ?? uid;
    }
  }

  const result = (tasks ?? []).map(t => ({
    ...t,
    user_email: emailMap[t.user_id] ?? t.user_id,
    prompt_preview: t.prompt ? t.prompt.slice(0, 80) : '',
  }));

  return NextResponse.json({ tasks: result, total: count ?? 0, page });
}

// DELETE /api/admin/logs?id=xxx  — admin delete single task
export async function DELETE(req: NextRequest) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error } = await adminClient.from('tasks').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deleted: true });
}
