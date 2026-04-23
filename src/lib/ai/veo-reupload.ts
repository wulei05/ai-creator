import { createClient } from '@supabase/supabase-js';
import { getConfig } from '@/lib/config';

/**
 * 将 Veo 返回的 Google 临时 videoUrl 下载并转存到 Supabase Storage。
 * 失败时回退到原始 URL（不抛出）。
 */
export async function reuploadVeoVideo(
  videoUrl: string,
  userId: string,
  taskId: string,
): Promise<string> {
  try {
    const apiKey = await getConfig('GOOGLE_API_KEY');
    const dlUrl = videoUrl.includes('?')
      ? `${videoUrl}&key=${apiKey}`
      : `${videoUrl}?key=${apiKey}`;

    const videoRes = await fetch(dlUrl, { signal: AbortSignal.timeout(30_000) });
    if (!videoRes.ok) return videoUrl;

    const buf = Buffer.from(await videoRes.arrayBuffer());
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const fileName = `videos/${userId}/${taskId}.mp4`;
    const { error: upErr } = await adminSupabase.storage
      .from('ai-creations')
      .upload(fileName, buf, { contentType: 'video/mp4', upsert: true });

    if (upErr) return videoUrl;

    const { data: { publicUrl } } = adminSupabase.storage
      .from('ai-creations')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (e) {
    console.error('Veo video re-upload error:', e);
    return videoUrl;
  }
}
