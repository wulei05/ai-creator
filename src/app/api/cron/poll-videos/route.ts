import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getConfig } from '@/lib/config';
import { getGrokVideoStatus } from '@/lib/ai/grok-video';
import { getKlingStatus } from '@/lib/ai/kling';
import { getVeoStatus, isVeoModel } from '@/lib/ai/veo';
import { getFalVideoStatus, isFalVideoModel } from '@/lib/ai/fal-video';
import { reuploadVeoVideo } from '@/lib/ai/veo-reupload';

const BATCH_SIZE = 5;
const TIMEOUT_MS = 72 * 60 * 60 * 1000; // 72 hours

type TaskRow = {
  id: string;
  user_id: string;
  model: string;
  upstream_id: string;
  credits_cost: number;
  created_at: string;
};

export async function GET(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────
  const cronSecret = await getConfig('CRON_SECRET').catch(() => '');
  const authHeader = request.headers.get('authorization') ?? '';
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Query processing tasks ─────────────────────────
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: tasks, error } = await adminClient
    .from('tasks')
    .select('id, user_id, model, upstream_id, credits_cost, created_at')
    .eq('status', 'processing')
    .eq('type', 'video')
    .not('upstream_id', 'is', null)
    .order('created_at', { ascending: true })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (tasks ?? []) as TaskRow[];
  let completed = 0;
  let failed = 0;

  // ── Process in batches of BATCH_SIZE ──────────────
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(
      batch.map(task =>
        processTask(task, adminClient, {
          completed: () => { completed++; },
          failed: () => { failed++; },
        }),
      ),
    );
  }

  return NextResponse.json({ processed: rows.length, completed, failed });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processTask(
  task: TaskRow,
  db: SupabaseClient<any>,
  counters: { completed: () => void; failed: () => void },
) {
  const markFailed = async (reason: string) => {
    await db.from('tasks').update({
      status: 'failed',
      error_message: reason,
      completed_at: new Date().toISOString(),
    }).eq('id', task.id);
    await db.rpc('refund_credits', {
      p_user_id: task.user_id,
      p_amount: task.credits_cost,
      p_task_id: task.id,
    });
    counters.failed();
  };

  // 72-hour timeout
  const age = Date.now() - new Date(task.created_at).getTime();
  if (age > TIMEOUT_MS) {
    await markFailed('任务超时（超过 72 小时）');
    return;
  }

  try {
    if (isFalVideoModel(task.model)) {
      const s = await getFalVideoStatus(task.upstream_id);
      if (s.status === 'completed') {
        if (!s.videoUrl) { await markFailed('No video URL returned'); return; }
        await db.from('tasks').update({ status: 'completed', output_url: s.videoUrl, completed_at: new Date().toISOString() }).eq('id', task.id);
        counters.completed();
      } else if (s.status === 'failed') {
        await markFailed('fal video generation failed');
      }

    } else if (task.model === 'grok-video') {
      const s = await getGrokVideoStatus(task.upstream_id);
      if (s.status === 'completed') {
        if (!s.videoUrl) { await markFailed('No video URL returned'); return; }
        await db.from('tasks').update({ status: 'completed', output_url: s.videoUrl, completed_at: new Date().toISOString() }).eq('id', task.id);
        counters.completed();
      } else if (s.status === 'failed') {
        await markFailed('Grok video generation failed');
      }

    } else if (isVeoModel(task.model)) {
      const s = await getVeoStatus(task.upstream_id);
      if (s.status === 'completed') {
        if (!s.videoUrl) { await markFailed('No video URL returned'); return; }
        const publicUrl = await reuploadVeoVideo(s.videoUrl, task.user_id, task.id);
        await db.from('tasks').update({ status: 'completed', output_url: publicUrl, completed_at: new Date().toISOString() }).eq('id', task.id);
        counters.completed();
      } else if (s.status === 'failed') {
        await markFailed('Veo video generation failed');
      }

    } else {
      // Kling
      const s = await getKlingStatus(task.upstream_id);
      if (s.status === 'succeed') {
        if (!s.videoUrl) { await markFailed('No video URL returned'); return; }
        await db.from('tasks').update({ status: 'completed', output_url: s.videoUrl, completed_at: new Date().toISOString() }).eq('id', task.id);
        counters.completed();
      } else if (s.status === 'failed') {
        await markFailed('Kling video generation failed');
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    await markFailed(msg);
  }
}
