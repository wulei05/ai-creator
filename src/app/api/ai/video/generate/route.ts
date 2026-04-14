import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CREDIT_COSTS } from '@/lib/pricing';
import { createKlingVideo } from '@/lib/ai/kling';
import { videoRateLimit } from '@/lib/ratelimit';

function isSafeImageUrl(rawUrl: string): boolean {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  // Only allow https
  if (url.protocol !== 'https:') return false;

  const hostname = url.hostname.toLowerCase();

  // Block localhost and loopback
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return false;

  // Block link-local (169.254.x.x)
  if (/^169\.254\./.test(hostname)) return false;

  // Block private RFC-1918 ranges
  if (/^10\./.test(hostname)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return false;
  if (/^192\.168\./.test(hostname)) return false;

  return true;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit check
  const { success, limit, remaining, reset } = await videoRateLimit.limit(user.id);
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before trying again.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(reset),
        },
      }
    );
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
  if (!isSafeImageUrl(image_url)) {
    return NextResponse.json({ error: 'image_url must be a valid https URL' }, { status: 400 });
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
  const { error: updateError } = await supabase
    .from('tasks')
    .update({ upstream_id: kling_task_id, status: 'processing' })
    .eq('id', task_id);

  if (updateError) {
    console.error('Failed to update task upstream_id:', updateError);
    // Refund credits since task can't be tracked
    await supabase.rpc('refund_credits', {
      p_user_id: user.id,
      p_amount: CREDIT_COSTS['kling-v2'],
      p_task_id: task_id,
    });
    await supabase.from('tasks').update({ status: 'failed' }).eq('id', task_id);
    return NextResponse.json({ error: 'Failed to record task' }, { status: 500 });
  }

  return NextResponse.json({
    task_id,
    credits_cost,
    status: 'pending',
  });
}
