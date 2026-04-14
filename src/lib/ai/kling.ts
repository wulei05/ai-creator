const KLING_KEY = process.env.KLING_API_KEY!;
const BASE_URL = 'https://api.klingai.com/v1';

export async function createKlingVideo(params: {
  prompt: string;
  image_url: string; // URL of reference image (must be publicly accessible)
  duration: 5 | 10;
  aspect_ratio: string;
}): Promise<string> {
  const res = await fetch(`${BASE_URL}/videos/image2video`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KLING_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model_name: 'kling-v2',
      image: params.image_url,
      prompt: params.prompt,
      duration: String(params.duration), // Kling expects string
      aspect_ratio: params.aspect_ratio,
      cfg_scale: 0.5,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Kling API error: ${error}`);
  }

  const data = await res.json();
  // Response: { data: { task_id: string, ... } }
  return data.data.task_id;
}

export async function getKlingStatus(klingTaskId: string): Promise<{
  status: 'submitted' | 'processing' | 'succeed' | 'failed';
  videoUrl?: string;
  duration?: number;
}> {
  const res = await fetch(`${BASE_URL}/videos/image2video/${klingTaskId}`, {
    headers: { Authorization: `Bearer ${KLING_KEY}` },
    signal: AbortSignal.timeout(10_000),
  });

  const data = await res.json();
  const taskData = data.data;

  return {
    status: taskData.task_status,
    videoUrl: taskData.task_result?.videos?.[0]?.url,
    duration: taskData.task_result?.videos?.[0]?.duration,
  };
}
