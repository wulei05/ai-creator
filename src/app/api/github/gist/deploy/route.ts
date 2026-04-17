import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getConfig } from '@/lib/config';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { html?: string; description?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { html, description = 'AI 生成的网页工具' } = body;
  if (!html?.trim()) return NextResponse.json({ error: 'html required' }, { status: 400 });

  const token = await getConfig('GITHUB_TOKEN');
  if (!token) {
    return NextResponse.json(
      { error: '管理员尚未配置 GitHub Token，无法部署' },
      { status: 503 },
    );
  }

  try {
    const res = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description,
        public: true,
        files: { 'index.html': { content: html } },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message ?? `GitHub API error ${res.status}`);
    }

    const gist = await res.json() as {
      html_url: string;
      files: Record<string, { raw_url: string }>;
    };
    const rawUrl = gist.files['index.html']?.raw_url;
    const previewUrl = `https://htmlpreview.github.io/?${rawUrl}`;

    return NextResponse.json({
      gist_url: gist.html_url,
      preview_url: previewUrl,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Gist deploy error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
