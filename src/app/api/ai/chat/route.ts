import { createClient } from '@supabase/supabase-js';
import { streamChat, type ChatModel, type Message } from '@/lib/ai/chat';
import { CREDIT_COSTS } from '@/lib/pricing';
import { chatRateLimit } from '@/lib/ratelimit';

// export const runtime = 'edge'; // Disabled locally — re-enable for Vercel production

const VALID_MODELS: ChatModel[] = [
  'gpt-4o', 'deepseek-chat', 'deepseek-reasoner', 'claude-sonnet-4-6',
  'grok-4', 'grok-3', 'grok-3-fast', 'grok-3-mini', 'grok-3-mini-fast',
  'gemini-3.1-pro', 'gemini-3-pro', 'gemini-3-flash', 'gemini-3.1-flash-lite',
  'gemini-2.5-pro', 'gemini-2.5-flash',
  'gemini-2.0-flash', 'gemini-2.0-flash-lite',
  'gemini-1.5-pro', 'gemini-1.5-flash',
];

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

  // Rate limit check (must happen before streaming starts)
  const { success, limit, remaining, reset } = await chatRateLimit.limit(user.id);
  if (!success) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please wait before trying again.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(reset),
        },
      }
    );
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

  // Per-message validation — max 100 messages, valid roles, string content, max 50k chars
  if (messages.length > 100) {
    return new Response(JSON.stringify({ error: 'Too many messages' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const validRoles = ['user', 'assistant'];
  for (const msg of messages) {
    if (
      !validRoles.includes(msg.role) ||
      typeof msg.content !== 'string' ||
      msg.content.length > 50_000
    ) {
      return new Response(JSON.stringify({ error: 'Invalid message format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // Validate image field if present: must be a base64 data URL, max ~5MB
    if (msg.image !== undefined) {
      if (
        typeof msg.image !== 'string' ||
        !msg.image.startsWith('data:image/') ||
        msg.image.length > 7_000_000
      ) {
        return new Response(JSON.stringify({ error: 'Invalid image format' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
  }

  const chatModel = model as ChatModel;

  // Create service role client for DB operations
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fix 1: Resolve conversation_id BEFORE streaming so we can emit it as the first SSE event.
  // If a conversation_id was provided by the client, use it; otherwise insert a new row now
  // with a placeholder and get its generated UUID.
  let resolvedConversationId: string;
  if (conversation_id) {
    resolvedConversationId = conversation_id;
  } else {
    const { data: newConv, error: insertErr } = await adminSupabase
      .from('conversations')
      .insert({
        user_id: user.id,
        model: chatModel,
        messages: messages,
      })
      .select('id')
      .single();

    if (insertErr || !newConv) {
      console.error('Failed to create conversation:', insertErr);
      return new Response(JSON.stringify({ error: 'Failed to create conversation' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    resolvedConversationId = newConv.id as string;
  }

  const encoder = new TextEncoder();
  let fullResponse = '';

  const stream = new ReadableStream({
    async start(controller) {
      // Fix 1: Emit conversation_id as the FIRST SSE event so the client can track it
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ conversation_id: resolvedConversationId })}\n\n`)
      );

      try {
        for await (const delta of streamChat(chatModel, messages)) {
          fullResponse += delta;
          const data = `data: ${JSON.stringify({ delta })}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
      } catch (err) {
        console.error('Stream error:', err);
        const errorData = `data: ${JSON.stringify({ error: 'Stream error' })}\n\n`;
        controller.enqueue(encoder.encode(errorData));
        controller.close();
        return;
      }

      // Fix 2: Start the DB work promise BEFORE closing the stream.
      // On Node.js adapter the async start() continues after close(), so the await below
      // ensures completion. On Vercel Edge, the isolate lifetime is extended briefly after
      // close() which is best-effort but sufficient for MVP.
      const dbPromise = (async () => {
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

          // Update the conversation with the full message history (including assistant reply)
          await adminSupabase
            .from('conversations')
            .update({
              messages: allMessages,
              model: chatModel,
            })
            .eq('id', resolvedConversationId)
            .eq('user_id', user.id);
        } catch (postErr) {
          console.error('Post-stream error:', postErr);
        }
      })();

      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();

      // Await after close to ensure completion on Node.js adapter
      await dbPromise;
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
