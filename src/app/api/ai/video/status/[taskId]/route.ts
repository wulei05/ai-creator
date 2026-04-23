import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getKlingStatus } from '@/lib/ai/kling';
import { getVeoStatus, isVeoModel } from '@/lib/ai/veo';
import { getGrokVideoStatus } from '@/lib/ai/grok-video';
import { getFalVideoStatus, isFalVideoModel } from '@/lib/ai/fal-video';
import { reuploadVeoVideo } from '@/lib/ai/veo-reupload';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { taskId } = await params;

  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id, status, upstream_id, output_url, user_id, credits_cost, model')
    .eq('id', taskId)
    .eq('user_id', user.id)
    .single();

  if (taskError || !task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  if (task.status === 'completed') return NextResponse.json({ status: 'completed', output_url: task.output_url });
  if (task.status === 'failed') return NextResponse.json({ status: 'failed', error: 'Task failed' });
  if (!task.upstream_id) return NextResponse.json({ status: task.status });

  const refund = async () => supabase.rpc('refund_credits', {
    p_user_id: user.id, p_amount: task.credits_cost, p_task_id: task.id,
  });

  try {
    if (isFalVideoModel(task.model ?? '')) {
      // ── fal.ai video polling ─────────────────────────
      const falStatus = await getFalVideoStatus(task.upstream_id);
      if (falStatus.status === 'completed') {
        if (!falStatus.videoUrl) {
          await supabase.from('tasks').update({ status: 'failed' }).eq('id', task.id);
          await refund();
          return NextResponse.json({ status: 'failed', error: 'No video URL returned' });
        }
        await supabase.from('tasks').update({ status: 'completed', output_url: falStatus.videoUrl }).eq('id', task.id);
        return NextResponse.json({ status: 'completed', output_url: falStatus.videoUrl });
      }
      if (falStatus.status === 'failed') {
        await supabase.from('tasks').update({ status: 'failed' }).eq('id', task.id);
        await refund();
        return NextResponse.json({ status: 'failed', error: 'Video generation failed' });
      }
      await supabase.from('tasks').update({ status: 'processing' }).eq('id', task.id);
      return NextResponse.json({ status: falStatus.status });

    } else if (task.model === 'grok-video') {
      // ── Grok Video polling ──────────────────────────
      const grokStatus = await getGrokVideoStatus(task.upstream_id);
      if (grokStatus.status === 'completed') {
        if (!grokStatus.videoUrl) {
          await supabase.from('tasks').update({ status: 'failed' }).eq('id', task.id);
          await refund();
          return NextResponse.json({ status: 'failed', error: 'No video URL returned' });
        }
        await supabase.from('tasks').update({ status: 'completed', output_url: grokStatus.videoUrl }).eq('id', task.id);
        return NextResponse.json({ status: 'completed', output_url: grokStatus.videoUrl });
      }
      if (grokStatus.status === 'failed') {
        await supabase.from('tasks').update({ status: 'failed' }).eq('id', task.id);
        await refund();
        return NextResponse.json({ status: 'failed', error: 'Grok video generation failed' });
      }
      await supabase.from('tasks').update({ status: 'processing' }).eq('id', task.id);
      return NextResponse.json({ status: 'processing' });

    } else if (isVeoModel(task.model ?? '')) {
      // ── Veo operation polling ───────────────────────
      const veoStatus = await getVeoStatus(task.upstream_id);

      if (veoStatus.status === 'completed') {
        if (!veoStatus.videoUrl) {
          await supabase.from('tasks').update({ status: 'failed' }).eq('id', task.id);
          await refund();
          return NextResponse.json({ status: 'failed', error: 'No video URL returned' });
        }

        const publicUrl = await reuploadVeoVideo(veoStatus.videoUrl, user.id, task.id);
        await supabase.from('tasks').update({ status: 'completed', output_url: publicUrl, completed_at: new Date().toISOString() }).eq('id', task.id);
        return NextResponse.json({ status: 'completed', output_url: publicUrl });
      }

      if (veoStatus.status === 'failed') {
        await supabase.from('tasks').update({ status: 'failed' }).eq('id', task.id);
        await refund();
        return NextResponse.json({ status: 'failed', error: 'Veo generation failed' });
      }

      await supabase.from('tasks').update({ status: 'processing' }).eq('id', task.id);
      return NextResponse.json({ status: 'processing' });
    }

    // ── Kling polling ───────────────────────────────
    const klingStatus = await getKlingStatus(task.upstream_id);

    if (klingStatus.status === 'succeed') {
      if (!klingStatus.videoUrl) {
        await supabase.from('tasks').update({ status: 'failed' }).eq('id', task.id);
        await refund();
        return NextResponse.json({ status: 'failed', error: 'Video generation returned no result' });
      }
      await supabase.from('tasks').update({ status: 'completed', output_url: klingStatus.videoUrl }).eq('id', task.id);
      return NextResponse.json({ status: 'completed', output_url: klingStatus.videoUrl, duration: klingStatus.duration });
    }

    if (klingStatus.status === 'failed') {
      await supabase.from('tasks').update({ status: 'failed' }).eq('id', task.id);
      await refund();
      return NextResponse.json({ status: 'failed', error: 'Video generation failed' });
    }

    await supabase.from('tasks').update({ status: 'processing' }).eq('id', task.id);
    return NextResponse.json({ status: klingStatus.status === 'processing' ? 'processing' : 'pending' });
  } catch (err) {
    console.error('Video status check error:', err);
    await supabase.from('tasks').update({ status: 'failed' }).eq('id', task.id);
    await refund();
    return NextResponse.json({ status: 'failed', error: err instanceof Error ? err.message : 'Status check failed' });
  }
}
