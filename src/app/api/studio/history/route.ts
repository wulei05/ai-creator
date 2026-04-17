import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const type  = req.nextUrl.searchParams.get('type');
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '20'), 50);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('studio_history')
    .select('id, type, title, thumbnail, data, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (type === 'web' || type === 'image') {
    query = query.eq('type', type);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ records: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { type?: string; title?: string; thumbnail?: string; data?: object };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { type, title, thumbnail, data } = body;
  if (!type || !['web', 'image'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }
  if (!data) return NextResponse.json({ error: 'data required' }, { status: 400 });

  const { data: record, error } = await supabase
    .from('studio_history')
    .insert({ user_id: user.id, type, title: title ?? '', thumbnail, data })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: record.id });
}
