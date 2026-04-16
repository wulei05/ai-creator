import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// DELETE /api/tasks?id=xxx        — delete single task
// DELETE /api/tasks?type=all|image|video  — delete all matching
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const type = searchParams.get('type');

  if (id) {
    // Delete single task (must belong to user)
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deleted: 1 });
  }

  if (type !== null) {
    // Delete all (or filtered by type)
    let query = supabase.from('tasks').delete().eq('user_id', user.id);
    if (type === 'image' || type === 'video') {
      query = query.eq('type', type);
    } else {
      query = query.in('type', ['image', 'video']);
    }
    const { error, count } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deleted: count ?? 0 });
  }

  return NextResponse.json({ error: 'Provide id or type param' }, { status: 400 });
}

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
  const rawLimit = parseInt(searchParams.get('limit') ?? '20', 10);
  const rawOffset = parseInt(searchParams.get('offset') ?? '0', 10);
  const limit = Math.min(isNaN(rawLimit) || rawLimit < 1 ? 20 : rawLimit, 100);
  const offset = isNaN(rawOffset) || rawOffset < 0 ? 0 : rawOffset;

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
