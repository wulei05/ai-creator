import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getKlingStatus } from '@/lib/ai/kling';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { taskId } = await params;

  // Get task and verify ownership
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id, status, upstream_id, output_url, user_id, credits_cost')
    .eq('id', taskId)
    .eq('user_id', user.id)
    .single();

  if (taskError || !task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // If already terminal, return immediately
  if (task.status === 'completed') {
    return NextResponse.json({
      status: 'completed',
      output_url: task.output_url,
    });
  }

  if (task.status === 'failed') {
    return NextResponse.json({ status: 'failed', error: 'Task failed' });
  }

  // For pending/processing, check Kling
  if (!task.upstream_id) {
    return NextResponse.json({ status: task.status });
  }

  try {
    const klingStatus = await getKlingStatus(task.upstream_id);

    if (klingStatus.status === 'succeed') {
      if (!klingStatus.videoUrl) {
        // Kling returned success but no video URL - treat as failure
        await supabase.from('tasks').update({ status: 'failed' }).eq('id', task.id);
        await supabase.rpc('refund_credits', {
          p_user_id: user.id,
          p_amount: task.credits_cost,
          p_task_id: task.id,
        });
        return NextResponse.json({ status: 'failed', error: 'Video generation returned no result' });
      }

      const outputUrl = klingStatus.videoUrl;

      await supabase
        .from('tasks')
        .update({ status: 'completed', output_url: outputUrl })
        .eq('id', task.id);

      return NextResponse.json({
        status: 'completed',
        output_url: outputUrl,
        duration: klingStatus.duration,
      });
    }

    if (klingStatus.status === 'failed') {
      await supabase.from('tasks').update({ status: 'failed' }).eq('id', task.id);
      await supabase.rpc('refund_credits', {
        p_user_id: user.id,
        p_amount: task.credits_cost,
        p_task_id: task.id,
      });
      return NextResponse.json({ status: 'failed', error: 'Video generation failed' });
    }

    if (klingStatus.status === 'processing') {
      await supabase.from('tasks').update({ status: 'processing' }).eq('id', task.id);
      return NextResponse.json({ status: 'processing' });
    }

    // 'submitted' — still waiting
    return NextResponse.json({ status: 'pending' });
  } catch (err) {
    console.error('Kling status check error:', err);
    const errorMessage = err instanceof Error ? err.message : String(err);

    await supabase.from('tasks').update({ status: 'failed' }).eq('id', task.id);
    await supabase.rpc('refund_credits', {
      p_user_id: user.id,
      p_amount: task.credits_cost,
      p_task_id: task.id,
    });

    return NextResponse.json({ status: 'failed', error: errorMessage || 'Generation failed' });
  }
}
