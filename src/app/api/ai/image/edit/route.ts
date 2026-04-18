import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { submitInpaint, pollInpaintResult, submitOutpaint, pollOutpaintResult } from '@/lib/ai/fal';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: {
    mode?: 'inpaint' | 'outpaint';
    image_data: string;   // base64 data URI
    mask_data?: string;   // base64 data URI (inpaint only)
    prompt?: string;
    expand_left?: number;
    expand_right?: number;
    expand_top?: number;
    expand_bottom?: number;
  };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { mode = 'inpaint', image_data, mask_data, prompt = '' } = body;

  if (!image_data) return NextResponse.json({ error: 'image_data required' }, { status: 400 });

  try {
    if (mode === 'outpaint') {
      const requestId = await submitOutpaint({
        image_url: image_data,
        prompt,
        expand_left:   body.expand_left,
        expand_right:  body.expand_right,
        expand_top:    body.expand_top,
        expand_bottom: body.expand_bottom,
      });
      const outputUrl = await pollOutpaintResult(requestId);
      if (!outputUrl) return NextResponse.json({ error: 'Outpaint failed or timed out' }, { status: 500 });
      return NextResponse.json({ output_url: outputUrl });
    }

    // inpaint
    if (!mask_data) return NextResponse.json({ error: 'mask_data required for inpaint' }, { status: 400 });
    const requestId = await submitInpaint({ image_url: image_data, mask_url: mask_data, prompt });
    const outputUrl = await pollInpaintResult(requestId);
    if (!outputUrl) return NextResponse.json({ error: 'Inpaint failed or timed out' }, { status: 500 });
    return NextResponse.json({ output_url: outputUrl });

  } catch (err) {
    console.error('Image edit error:', err instanceof Error ? err.message : err, err);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = (err as any)?.body;
    if (body?.detail?.includes('Exhausted balance')) {
      return NextResponse.json({ error: 'AI 服务余额不足，请联系管理员充值后再试' }, { status: 503 });
    }
    if (body?.detail?.includes('locked')) {
      return NextResponse.json({ error: `AI 服务暂时不可用：${body.detail}` }, { status: 503 });
    }
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
