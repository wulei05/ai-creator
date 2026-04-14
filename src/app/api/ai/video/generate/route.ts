import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CREDIT_COSTS } from '@/lib/pricing';
import { createKlingVideo } from '@/lib/ai/kling';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    prompt?: string;
    image_url?: string;
    duration?: 5 | 10;
    aspect_ratio?: '16:9' | '9:16' | '1:1';
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { prompt, image_url, duration = 5, aspect_ratio = '16:9' } = body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }
  if (prompt.length > 1000) {
    return NextResponse.json(
      { error: 'Prompt must be 1000 characters or less' },
      { status: 400 }
    );
  }

  if (!image_url || typeof image_url !== 'string') {
    return NextResponse.json({ error: 'image_url is required' }, { status: 400 });
  }
  try {
    new URL(image_url);
  } catch {
    return NextResponse.json({ error: 'image_url must be a valid URL' }, { status: 400 });
  }

  const credits_cost = CREDIT_COSTS['kling-v2'];

  // Insert task with status='pending'
  const { data: task, error: insertError } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      type: 'video',
      model: 'kling-v2',
      prompt: prompt.trim(),
      status: 'pending',
      credits_cost,
    })
    .select('id')
    .single();

  if (insertError || !task) {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }

  const task_id = task.id;

  // Deduct credits atomically
  const { data: deducted, error: deductError } = await supabase.rpc('deduct_credits', {
    p_user_id: user.id,
    p_amount: credits_cost,
    p_task_id: task_id,
    p_desc: '视频生成',
  });

  if (deductError || !deducted) {
    await supabase.from('tasks').update({ status: 'failed' }).eq('id', task_id);
    return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
  }

  // Call Kling API
  let kling_task_id: string;
  try {
    kling_task_id = await createKlingVideo({
      prompt: prompt.trim(),
      image_url,
      duration: duration ?? 5,
      aspect_ratio: aspect_ratio ?? '16:9',
    });
  } catch (err) {
    console.error('Kling submit error:', err);
    await supabase.from('tasks').update({ status: 'failed' }).eq('id', task_id);
    await supabase.rpc('refund_credits', {
      p_user_id: user.id,
      p_amount: credits_cost,
      p_task_id: task_id,
    });
    return NextResponse.json({ error: 'Failed to submit video generation' }, { status: 500 });
  }

  // Update task with upstream_id
  await supabase
    .from('tasks')
    .update({ upstream_id: kling_task_id })
    .eq('id', task_id);

  return NextResponse.json({
    task_id,
    credits_cost,
    status: 'pending',
  });
}
