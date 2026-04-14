import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('id, prompt, status, output_url, created_at')
    .eq('user_id', user.id)
    .eq('type', 'image')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    return NextResponse.json({ tasks: [] });
  }

  return NextResponse.json({ tasks: tasks ?? [] });
}
