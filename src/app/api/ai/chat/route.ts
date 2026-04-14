import { createClient } from '@supabase/supabase-js';
import { streamChat, type ChatModel, type Message } from '@/lib/ai/chat';
import { CREDIT_COSTS } from '@/lib/pricing';

export const runtime = 'edge';

const VALID_MODELS: ChatModel[] = ['gpt-4o', 'deepseek-chat', 'claude-sonnet-4-6'];

export async function POST(req: Request) {
  // Auth: extract JWT from Authorization header or cookie
  let jwt: string | null = null;
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    jwt = authHeader.slice(7);
  } else {
    // Try to extract from cookie header
    const cookieHeader = req.headers.get('cookie') ?? '';
    const match = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/);
    if (match) {
      try {
        const decoded = decodeURIComponent(match[1]);
        const parsed = JSON.parse(decoded);
        jwt = parsed.access_token ?? null;
      } catch {
        jwt = null;
      }
    }
  }

  if (!jwt) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create Supabase client for auth (anon key)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { model?: string; messages?: Message[]; conversation_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { model, messages, conversation_id } = body;

  if (!model || !VALID_MODELS.includes(model as ChatModel)) {
    return new Response(JSON.stringify({ error: 'Invalid model' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'Messages required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const chatModel = model as ChatModel;

  // Create service role client for DB operations
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const encoder = new TextEncoder();
  let fullResponse = '';

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const delta of streamChat(chatModel, messages)) {
          fullResponse += delta;
          const data = `data: ${JSON.stringify({ delta })}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (err) {
        console.error('Stream error:', err);
        const errorData = `data: ${JSON.stringify({ error: 'Stream error' })}\n\n`;
        controller.enqueue(encoder.encode(errorData));
        controller.close();
        return;
      }

      // Post-stream: deduct credits and save conversation
      try {
        const allMessages: Message[] = [
          ...messages,
          { role: 'assistant', content: fullResponse },
        ];
        const totalChars = allMessages.reduce(
          (sum, m) => sum + m.content.length,
          0
        );
        const tokenK = Math.max(1, Math.ceil(totalChars / 4 / 1000));
        const creditCost = CREDIT_COSTS[chatModel] * tokenK;

        // Deduct credits
        await adminSupabase.rpc('deduct_credits', {
          p_user_id: user.id,
          p_amount: creditCost,
          p_task_id: null,
          p_desc: `AI 对话 (${chatModel})`,
        });

        // Save/update conversation
        if (conversation_id) {
          await adminSupabase
            .from('conversations')
            .update({
              messages_json: allMessages,
              model: chatModel,
            })
            .eq('id', conversation_id)
            .eq('user_id', user.id);
        } else {
          await adminSupabase.from('conversations').insert({
            user_id: user.id,
            model: chatModel,
            messages_json: allMessages,
          });
        }
      } catch (postErr) {
        console.error('Post-stream error:', postErr);
      }
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
