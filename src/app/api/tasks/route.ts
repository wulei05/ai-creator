import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') ?? 'all';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  let query = supabase
    .from('tasks')
    .select('id, type, model, prompt, status, output_url, credits_cost, created_at', {
      count: 'exact',
    })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (type === 'image') {
    query = query.eq('type', 'image');
  } else if (type === 'video') {
    query = query.eq('type', 'video');
  } else {
    // 'all' — filter to only image and video tasks
    query = query.in('type', ['image', 'video']);
  }

  const { data: tasks, error, count } = await query;

  if (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }

  return NextResponse.json({
    tasks: tasks ?? [],
    total: count ?? 0,
  });
}
