import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { CREDIT_COSTS } from '@/lib/pricing';
import { submitFluxImage } from '@/lib/ai/fal';
import { generateGeminiImage, isGeminiImageModel } from '@/lib/ai/gemini-image';
import { imageRateLimit } from '@/lib/ratelimit';

const VALID_MODELS = [
  'flux-pro',
  'imagen-4', 'imagen-4-ultra', 'imagen-4-fast',
  'gemini-2.5-flash-image', 'gemini-3-pro-image', 'gemini-3.1-flash-image',
] as const;
type ImageModel = typeof VALID_MODELS[number];

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
  if (!VALID_MODELS.includes(model as ImageModel)) {
    return NextResponse.json({ error: 'Invalid model' }, { status: 400 });
  }

  const imageModel = model as ImageModel;
  const credits_cost = CREDIT_COSTS[imageModel];

  // Insert task with status='pending'
  const { data: task, error: insertError } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      type: 'image',
      model: imageModel,
      prompt: prompt.trim(),
      status: 'pending',
      credits_cost,
    })
    .select('id')
    .single();

  if (insertError || !task) {
    console.error('Task insert error:', JSON.stringify(insertError));
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
    await supabase.from('tasks').update({ status: 'failed' }).eq('id', task_id);
    return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
  }

  // ── Gemini: synchronous generation ──────────────────────────────────────
  if (isGeminiImageModel(imageModel)) {
    try {
      const base64Data = await generateGeminiImage(prompt.trim(), imageModel);

      // Upload to Supabase Storage using service role
      const adminSupabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );

      const fileName = `images/${user.id}/${task_id}.png`;
      const imageBytes = Buffer.from(base64Data, 'base64');

      const { error: uploadError } = await adminSupabase.storage
        .from('ai-creations')
        .upload(fileName, imageBytes, { contentType: 'image/png', upsert: true });

      if (uploadError) {
        console.error('Storage upload error:', JSON.stringify(uploadError));
        throw new Error(`Failed to upload generated image: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = adminSupabase.storage
        .from('ai-creations')
        .getPublicUrl(fileName);

      await supabase
        .from('tasks')
        .update({ status: 'completed', output_url: publicUrl })
        .eq('id', task_id);

      return NextResponse.json({
        task_id,
        credits_cost,
        status: 'completed',
        output_url: publicUrl,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Gemini image generation error:', msg);
      await supabase.from('tasks').update({ status: 'failed' }).eq('id', task_id);
      await supabase.rpc('refund_credits', {
        p_user_id: user.id,
        p_amount: credits_cost,
        p_task_id: task_id,
      });
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  // ── Flux Pro: async queue ────────────────────────────────────────────────
  let request_id: string;
  try {
    request_id = await submitFluxImage({
      prompt: prompt.trim(),
      aspect_ratio,
    });
  } catch (err) {
    console.error('fal.ai submit error:', err);
    await supabase.from('tasks').update({ status: 'failed' }).eq('id', task_id);
    await supabase.rpc('refund_credits', {
      p_user_id: user.id,
      p_amount: credits_cost,
      p_task_id: task_id,
    });
    return NextResponse.json({ error: 'Failed to submit image generation' }, { status: 500 });
  }

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
