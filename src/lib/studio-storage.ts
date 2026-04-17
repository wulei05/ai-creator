// src/lib/studio-storage.ts

// ── 类型定义 ───────────────────────────────────────────────────

export type WebDraft = {
  prompt: string;
  template: string;
  model: string;
  html: string;
  deployed_url: string | null;
  updated_at: string;
};

export type ImageDraft = {
  original_b64: string | null;
  result_url: string | null;
  updated_at: string;
};

export type WebHistoryData = {
  prompt: string;
  template: string;
  model: string;
  html: string;
  deployed_url: string | null;
};

export type ImageHistoryData = {
  original_url: string | null;
  result_url: string | null;
};

export type StudioHistoryRecord = {
  id: string;
  type: 'web' | 'image';
  title: string | null;
  thumbnail: string | null;
  data: WebHistoryData | ImageHistoryData;
  created_at: string;
};

// ── localStorage 草稿 ─────────────────────────────────────────

const WEB_KEY   = 'studio_web_draft';
const IMAGE_KEY = 'studio_image_draft';

export function saveWebDraft(draft: Omit<WebDraft, 'updated_at'>): void {
  try {
    localStorage.setItem(WEB_KEY, JSON.stringify({
      ...draft,
      updated_at: new Date().toISOString(),
    }));
  } catch { /* localStorage unavailable */ }
}

export function loadWebDraft(): WebDraft | null {
  try {
    const raw = localStorage.getItem(WEB_KEY);
    return raw ? (JSON.parse(raw) as WebDraft) : null;
  } catch { return null; }
}

export function clearWebDraft(): void {
  try { localStorage.removeItem(WEB_KEY); } catch { /* silent */ }
}

export function saveImageDraft(draft: Omit<ImageDraft, 'updated_at'>): void {
  try {
    const payload = JSON.stringify({ ...draft, updated_at: new Date().toISOString() });
    if (payload.length > 4 * 1024 * 1024) return; // skip if > 4MB
    localStorage.setItem(IMAGE_KEY, payload);
  } catch { /* silent */ }
}

export function loadImageDraft(): ImageDraft | null {
  try {
    const raw = localStorage.getItem(IMAGE_KEY);
    return raw ? (JSON.parse(raw) as ImageDraft) : null;
  } catch { return null; }
}

export function clearImageDraft(): void {
  try { localStorage.removeItem(IMAGE_KEY); } catch { /* silent */ }
}

// ── Supabase Storage 上传 ─────────────────────────────────────

export async function uploadStudioImage(
  userId: string,
  dataUrl: string,
  label: 'original' | 'result',
): Promise<string | null> {
  try {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const blob = await fetch(dataUrl).then(r => r.blob());
    const ext  = blob.type.split('/')[1] ?? 'jpg';
    const path = `studio/${userId}/${label}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('ai-creations')
      .upload(path, blob, { contentType: blob.type, upsert: true });
    if (error) return null;
    const { data: { publicUrl } } = supabase.storage
      .from('ai-creations')
      .getPublicUrl(path);
    return publicUrl;
  } catch {
    return null;
  }
}

// ── 保存历史到 Supabase (fire-and-forget) ─────────────────────

export async function saveHistoryRecord(record: {
  type: 'web' | 'image';
  title: string;
  thumbnail?: string | null;
  data: WebHistoryData | ImageHistoryData;
}): Promise<void> {
  try {
    await fetch('/api/studio/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
  } catch { /* best-effort */ }
}
