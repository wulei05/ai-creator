import { createClient } from '@/lib/supabase/server';
import { streamWebHTML, type WebTemplate } from '@/lib/ai/web';
import { type ChatModel } from '@/lib/ai/chat';
import { CREDIT_COSTS } from '@/lib/pricing';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const VALID_MODELS: ChatModel[] = [
  'gpt-4o', 'claude-sonnet-4-6',
  'grok-4', 'grok-3', 'grok-3-fast', 'grok-3-mini', 'grok-3-mini-fast',
  'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite',
  'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-3-pro', 'gemini-3-flash',
  'deepseek-chat',
];

const VALID_TEMPLATES: WebTemplate[] = ['math', 'physics', 'chart', 'game', 'tool', 'free'];

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { prompt?: string; template?: string; model?: string; image_data?: string };
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } }); }

  const { prompt, template = 'free', model, image_data } = body;

  if (!prompt?.trim()) return new Response(JSON.stringify({ error: 'prompt required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  if (!model || !VALID_MODELS.includes(model as ChatModel)) return new Response(JSON.stringify({ error: 'Invalid model' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  if (!VALID_TEMPLATES.includes(template as WebTemplate)) return new Response(JSON.stringify({ error: 'Invalid template' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const encoder = new TextEncoder();
  let fullHtml = '';

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const delta of streamWebHTML(
          model as ChatModel,
          prompt,
          template as WebTemplate,
          image_data,
        )) {
          fullHtml += delta;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
        }
      } catch (err) {
        console.error('Web generate error:', err);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errBody = (err as any)?.body;
        const msg = errBody?.detail?.includes('Exhausted balance')
          ? 'AI 服务余额不足，请联系管理员充值后再试'
          : (err instanceof Error ? err.message : 'Generation failed');
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
        controller.close();
        return;
      }

      try {
        const chars = fullHtml.length;
        const tokenK = Math.max(1, Math.ceil(chars / 4 / 1000));
        const cost = (CREDIT_COSTS[model as keyof typeof CREDIT_COSTS] ?? 1) * tokenK;
        await adminSupabase.rpc('deduct_credits', {
          p_user_id: user.id,
          p_amount: cost,
          p_task_id: null,
          p_desc: `网页工具生成 (${model})`,
        });
      } catch (e) {
        console.error('Credit deduction error:', e);
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
