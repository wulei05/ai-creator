import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CREDIT_COSTS } from '@/lib/pricing';
import { submitFluxImage } from '@/lib/ai/fal';
import { imageRateLimit } from '@/lib/ratelimit';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit check
  const { success, limit, remaining, reset } = await imageRateLimit.limit(user.id);
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

  let body: { prompt?: string; aspect_ratio?: string; model?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { prompt, aspect_ratio = '1:1', model = 'flux-pro' } = body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }
  if (prompt.length > 1000) {
    return NextResponse.json(
      { error: 'Prompt must be 1000 characters or less' },
      { status: 400 }
    );
  }

  const credits_cost = CREDIT_COSTS['flux-pro'];

  // Insert task with status='pending'
  const { data: task, error: insertError } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      type: 'image',
      model: 'flux-pro',
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
  const { data: deducted, error: deductError } = await supabase.rpc(
    'deduct_credits',
    {
      p_user_id: user.id,
      p_amount: credits_cost,
      p_task_id: task_id,
      p_desc: '图像生成',
    }
  );

  if (deductError || !deducted) {
    // Mark task as failed
    await supabase.from('tasks').update({ status: 'failed' }).eq('id', task_id);
    return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
  }

  // Call fal.ai
  let request_id: string;
  try {
    request_id = await submitFluxImage({
      prompt: prompt.trim(),
      aspect_ratio,
    });
  } catch (err) {
    console.error('fal.ai submit error:', err);
    // Refund credits and mark task failed
    await supabase.from('tasks').update({ status: 'failed' }).eq('id', task_id);
    await supabase.rpc('refund_credits', {
      p_user_id: user.id,
      p_amount: credits_cost,
      p_task_id: task_id,
    });
    return NextResponse.json({ error: 'Failed to submit image generation' }, { status: 500 });
  }

  // Update task with upstream_id
  await supabase
    .from('tasks')
    .update({ upstream_id: request_id, status: 'processing' })
    .eq('id', task_id);

  return NextResponse.json({
    task_id,
    credits_cost,
    status: 'pending',
  });
}
