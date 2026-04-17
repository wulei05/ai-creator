# 创作室历史记录 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为创作室的图片编辑和网页工具两个 Tab 添加历史记录：localStorage 草稿恢复 + Supabase 云端历史列表。

**Architecture:** `studio-storage.ts` 封装 localStorage 读写和 Supabase Storage 上传；API 路由 `/api/studio/history` 负责云端 CRUD；`DraftBanner` 检测并恢复草稿；`HistoryPanel` 右侧抽屉展示历史列表；studio/page.tsx 和 WebToolTab.tsx 在关键时机触发保存。

**Tech Stack:** Next.js App Router, Supabase (DB + Storage), localStorage API

---

## 文件清单

| 操作 | 文件 | 职责 |
|------|------|------|
| 新增 | `supabase/migrations/011_studio_history.sql` | 建表 + Storage policy |
| 新增 | `src/lib/studio-storage.ts` | 类型定义、localStorage 工具、Supabase Storage 上传 |
| 新增 | `src/app/api/studio/history/route.ts` | GET（列表）+ POST（保存） |
| 新增 | `src/app/api/studio/history/[id]/route.ts` | DELETE（删除） |
| 新增 | `src/components/studio/DraftBanner.tsx` | 草稿恢复提示条 |
| 新增 | `src/components/studio/HistoryPanel.tsx` | 右侧历史抽屉 |
| 修改 | `src/app/(dashboard)/studio/page.tsx` | 图片草稿保存 + HistoryPanel 集成 |
| 修改 | `src/components/studio/WebToolTab.tsx` | 网页草稿保存 + 历史保存 + DraftBanner |

---

## Task 1：Supabase 数据库迁移

**Files:**
- Create: `supabase/migrations/011_studio_history.sql`

- [ ] **Step 1：创建迁移文件**

```sql
-- supabase/migrations/011_studio_history.sql

-- studio_history 表
CREATE TABLE IF NOT EXISTS studio_history (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('web', 'image')),
  title      TEXT,
  thumbnail  TEXT,
  data       JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE studio_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_history"
  ON studio_history FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS studio_history_user_type_idx
  ON studio_history(user_id, type, created_at DESC);

-- Storage policy: allow authenticated users to upload to studio/{user_id}/ path
-- (ai-creations bucket already exists from migration 010)
CREATE POLICY "Authenticated users can upload studio images" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'ai-creations' AND
    (storage.foldername(name))[1] = 'studio' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );
```

- [ ] **Step 2：在 Supabase Dashboard 执行 SQL**

登录 Supabase Dashboard → SQL Editor → 粘贴上述 SQL → Run。
期望：无报错，`studio_history` 表出现在 Table Editor 中。

- [ ] **Step 3：Commit**

```bash
git add supabase/migrations/011_studio_history.sql
git commit -m "feat(db): 添加 studio_history 表和 Storage 上传策略"
```

---

## Task 2：创建 src/lib/studio-storage.ts

**Files:**
- Create: `src/lib/studio-storage.ts`

- [ ] **Step 1：创建文件**

```ts
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
    // base64 can be large — skip if > 4MB to avoid QuotaExceededError
    const payload = JSON.stringify({ ...draft, updated_at: new Date().toISOString() });
    if (payload.length > 4 * 1024 * 1024) return;
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

/**
 * 将 base64 dataURL 上传到 ai-creations/studio/{userId}/ 并返回 publicUrl。
 * 只在浏览器端调用。
 */
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
```

- [ ] **Step 2：验证编译**

```bash
cd /Users/wulei/Develop/github/ai-creator && npx tsc --noEmit 2>&1 | head -20
```
期望：无 error。

- [ ] **Step 3：Commit**

```bash
git add src/lib/studio-storage.ts
git commit -m "feat(studio): 添加 studio-storage 工具库（localStorage + Storage 上传）"
```

---

## Task 3：创建 /api/studio/history API 路由

**Files:**
- Create: `src/app/api/studio/history/route.ts`
- Create: `src/app/api/studio/history/[id]/route.ts`

- [ ] **Step 1：创建目录**

```bash
mkdir -p src/app/api/studio/history/\[id\]
```

- [ ] **Step 2：创建 route.ts（GET + POST）**

```ts
// src/app/api/studio/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const type  = req.nextUrl.searchParams.get('type');
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '20'), 50);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('studio_history')
    .select('id, type, title, thumbnail, data, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (type === 'web' || type === 'image') {
    query = query.eq('type', type);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ records: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { type?: string; title?: string; thumbnail?: string; data?: object };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { type, title, thumbnail, data } = body;
  if (!type || !['web', 'image'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }
  if (!data) return NextResponse.json({ error: 'data required' }, { status: 400 });

  const { data: record, error } = await supabase
    .from('studio_history')
    .insert({ user_id: user.id, type, title: title ?? '', thumbnail, data })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: record.id });
}
```

- [ ] **Step 3：创建 [id]/route.ts（DELETE）**

```ts
// src/app/api/studio/history/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('studio_history')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4：验证编译**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5：Commit**

```bash
git add src/app/api/studio/history/route.ts src/app/api/studio/history/\[id\]/route.ts
git commit -m "feat(api): 添加 studio history CRUD 接口"
```

---

## Task 4：创建 DraftBanner 组件

**Files:**
- Create: `src/components/studio/DraftBanner.tsx`

- [ ] **Step 1：创建文件**

```tsx
// src/components/studio/DraftBanner.tsx
'use client';

import { RotateCcw, X } from 'lucide-react';
import type { WebDraft, ImageDraft } from '@/lib/studio-storage';

type Props =
  | { type: 'web';   draft: WebDraft;   onRestore: (d: WebDraft) => void;   onDismiss: () => void }
  | { type: 'image'; draft: ImageDraft; onRestore: (d: ImageDraft) => void; onDismiss: () => void };

export function DraftBanner(props: Props) {
  const time = new Date(props.draft.updated_at).toLocaleString('zh-CN', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm">
      <RotateCcw className="h-4 w-4 text-primary shrink-0" />
      <span className="text-muted-foreground flex-1">
        检测到 <span className="text-foreground font-medium">{time}</span> 未完成的编辑，是否恢复？
      </span>
      <button
        onClick={() => {
          if (props.type === 'web') props.onRestore(props.draft as WebDraft);
          else props.onRestore(props.draft as ImageDraft);
        }}
        className="text-primary font-medium hover:underline shrink-0"
      >
        恢复
      </button>
      <button onClick={props.onDismiss} className="text-muted-foreground hover:text-foreground shrink-0">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 2：验证编译**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3：Commit**

```bash
git add src/components/studio/DraftBanner.tsx
git commit -m "feat(studio): 添加 DraftBanner 草稿恢复提示条组件"
```

---

## Task 5：创建 HistoryPanel 组件

**Files:**
- Create: `src/components/studio/HistoryPanel.tsx`

- [ ] **Step 1：创建文件**

```tsx
// src/components/studio/HistoryPanel.tsx
'use client';

import { useEffect, useState } from 'react';
import { X, Trash2, RotateCcw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  StudioHistoryRecord,
  WebHistoryData,
  ImageHistoryData,
} from '@/lib/studio-storage';

const TEMPLATE_ICONS: Record<string, string> = {
  math: '📐', physics: '🌊', chart: '📊', game: '🎮', tool: '🔧', free: '✨',
};

type Props = {
  open: boolean;
  onClose: () => void;
  onRestoreWeb: (data: WebHistoryData) => void;
  onRestoreImage: (data: ImageHistoryData) => void;
};

export function HistoryPanel({ open, onClose, onRestoreWeb, onRestoreImage }: Props) {
  const [tab, setTab]         = useState<'web' | 'image'>('web');
  const [records, setRecords] = useState<StudioHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/studio/history?type=${tab}&limit=20`)
      .then(r => r.json())
      .then((d: { records?: StudioHistoryRecord[] }) => setRecords(d.records ?? []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [open, tab]);

  const handleDelete = async (id: string) => {
    await fetch(`/api/studio/history/${id}`, { method: 'DELETE' });
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const handleRestore = (record: StudioHistoryRecord) => {
    if (record.type === 'web') {
      onRestoreWeb(record.data as WebHistoryData);
    } else {
      onRestoreImage(record.data as ImageHistoryData);
    }
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-80 flex-col border-l bg-background shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-semibold text-sm">历史记录</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {(['web', 'image'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-2 text-xs font-medium transition-colors',
                tab === t
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t === 'web' ? '🌐 网页工具' : '🖼️ 图片编辑'}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && records.length === 0 && (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              暂无历史记录
            </div>
          )}
          {!loading && records.map(record => (
            <div key={record.id} className="flex gap-3 border-b p-3 hover:bg-muted/30">
              {/* Thumbnail */}
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-muted flex items-center justify-center text-2xl">
                {record.type === 'web' ? (
                  <span>
                    {TEMPLATE_ICONS[(record.data as WebHistoryData).template ?? 'free'] ?? '✨'}
                  </span>
                ) : (
                  (record.data as ImageHistoryData).original_url
                    ? <img
                        src={(record.data as ImageHistoryData).original_url!}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    : <span className="text-xs text-muted-foreground">无图</span>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col justify-between min-w-0">
                <p className="truncate text-xs font-medium">{record.title ?? '未命名'}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(record.created_at).toLocaleString('zh-CN', {
                    month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => handleRestore(record)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <RotateCcw className="h-3 w-3" /> 恢复
                  </button>
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" /> 删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2：验证编译**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3：Commit**

```bash
git add src/components/studio/HistoryPanel.tsx
git commit -m "feat(studio): 添加 HistoryPanel 历史记录抽屉组件"
```

---

## Task 6：修改 studio/page.tsx

**Files:**
- Modify: `src/app/(dashboard)/studio/page.tsx`

读取当前文件后进行以下修改：

- [ ] **Step 1：新增 imports**

在现有 imports 末尾加：
```ts
import { History } from 'lucide-react';
import { DraftBanner } from '@/components/studio/DraftBanner';
import { HistoryPanel } from '@/components/studio/HistoryPanel';
import {
  saveImageDraft, loadImageDraft, clearImageDraft,
  uploadStudioImage, saveHistoryRecord,
  type ImageDraft, type ImageHistoryData, type WebHistoryData,
} from '@/lib/studio-storage';
```

- [ ] **Step 2：新增 state**

在 `export default function StudioPage()` 函数内，现有 state 之后加：
```ts
const [showHistory, setShowHistory]   = useState(false);
const [imageDraft, setImageDraft]     = useState<ImageDraft | null>(null);
```

- [ ] **Step 3：在 useEffect（paste 监听）之前加 draft 加载**

```ts
// 加载图片草稿（仅在 upload 模式且 image tab）
useEffect(() => {
  if (mode === 'upload' && activeTab === 'image') {
    setImageDraft(loadImageDraft());
  }
}, [mode, activeTab]);
```

- [ ] **Step 4：在 loadImage 回调中保存原始图片到 localStorage**

找到 `loadImage` 的 `useCallback`，在 `setPendingImage(img)` 之后加：
```ts
// 保存原始图到草稿
const canvas = document.createElement('canvas');
canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
canvas.getContext('2d')!.drawImage(img, 0, 0);
const b64 = canvas.toDataURL('image/jpeg', 0.7);
saveImageDraft({ original_b64: b64, result_url: null });
setImageDraft(null); // 清除草稿提示（用户已上传新图）
```

- [ ] **Step 5：在 callEdit 成功后保存结果 + 异步同步到 Supabase**

找到 `callEdit` 里 `setResultUrl(data.output_url); setMode('result');` 之后加：
```ts
// 更新草稿中的 result_url
const draft = loadImageDraft();
if (draft) saveImageDraft({ ...draft, result_url: data.output_url });

// 异步保存到 Supabase（fire-and-forget）
void (async () => {
  try {
    const { data: { user } } = await (await import('@/lib/supabase/client')).createClient().auth.getUser();
    if (!user) return;
    const currentDraft = loadImageDraft();
    let originalUrl: string | null = null;
    if (currentDraft?.original_b64) {
      originalUrl = await uploadStudioImage(user.id, currentDraft.original_b64, 'original');
    }
    await saveHistoryRecord({
      type: 'image',
      title: '图片编辑',
      thumbnail: originalUrl,
      data: { original_url: originalUrl, result_url: data.output_url } satisfies ImageHistoryData,
    });
  } catch { /* best-effort */ }
})();
```

- [ ] **Step 6：在 upload 视图中加 DraftBanner + 历史按钮**

在 upload 视图最外层 div（`<div className={cn("mx-auto space-y-6"...`）内，Tab 切换栏和 `{activeTab === 'web' && <WebToolTab />}` 之间，加：

```tsx
{/* 历史按钮 */}
<div className="flex justify-end">
  <button
    onClick={() => setShowHistory(true)}
    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
  >
    <History className="h-4 w-4" /> 历史记录
  </button>
</div>

{/* 图片草稿恢复提示 */}
{activeTab === 'image' && imageDraft && (
  <DraftBanner
    type="image"
    draft={imageDraft}
    onRestore={(draft) => {
      if (draft.original_b64) {
        fetch(draft.original_b64).then(r => r.blob()).then(blob => loadImage(blob));
      }
      setImageDraft(null);
      clearImageDraft();
    }}
    onDismiss={() => {
      clearImageDraft();
      setImageDraft(null);
    }}
  />
)}
```

- [ ] **Step 7：在 editing/result 视图顶部也加历史按钮**

在 editing 视图和 result 视图最外层 div 的最前面各加：
```tsx
<div className="flex justify-end mb-2">
  <button
    onClick={() => setShowHistory(true)}
    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
  >
    <History className="h-4 w-4" /> 历史记录
  </button>
</div>
```

- [ ] **Step 8：在最后一个 return 之前（editing 视图 return 之前）挂载 HistoryPanel**

在 `// ── Editing view` 注释之前加：
```tsx
{/* History panel — rendered outside mode views so it's always accessible */}
const historyPanel = (
  <HistoryPanel
    open={showHistory}
    onClose={() => setShowHistory(false)}
    onRestoreWeb={(data: WebHistoryData) => {
      setActiveTab('web');
      // WebToolTab 会通过 pendingWebRestore 接收
      setPendingWebRestore(data);
    }}
    onRestoreImage={(data: ImageHistoryData) => {
      setActiveTab('image');
      setMode('upload');
      if (data.original_url) {
        fetch(data.original_url).then(r => r.blob()).then(blob => loadImage(blob));
      }
    }}
  />
);
```

**注意：** 需要额外在组件顶部加：
```ts
const [pendingWebRestore, setPendingWebRestore] = useState<WebHistoryData | null>(null);
```

并修改 `{activeTab === 'web' && <WebToolTab />}` 为：
```tsx
{activeTab === 'web' && (
  <WebToolTab
    pendingRestore={pendingWebRestore}
    onRestoreConsumed={() => setPendingWebRestore(null)}
  />
)}
```

在 upload 视图、editing 视图、result 视图各自的 return 语句中，把最外层 `<div>` 改为 fragment 并加入 `{historyPanel}`：

```tsx
return (
  <>
    {historyPanel}
    <div className={...}>
      ...原有内容...
    </div>
  </>
);
```

- [ ] **Step 9：验证编译**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 10：Commit**

```bash
git add src/app/(dashboard)/studio/page.tsx
git commit -m "feat(studio): 图片编辑草稿保存、HistoryPanel 集成"
```

---

## Task 7：修改 WebToolTab.tsx

**Files:**
- Modify: `src/components/studio/WebToolTab.tsx`

- [ ] **Step 1：新增 imports**

```ts
import { DraftBanner } from '@/components/studio/DraftBanner';
import {
  saveWebDraft, loadWebDraft, clearWebDraft, saveHistoryRecord,
  type WebDraft, type WebHistoryData,
} from '@/lib/studio-storage';
```

- [ ] **Step 2：新增 props**

```ts
type WebToolTabProps = {
  pendingRestore?: WebHistoryData | null;
  onRestoreConsumed?: () => void;
};

export function WebToolTab({ pendingRestore, onRestoreConsumed }: WebToolTabProps) {
```

- [ ] **Step 3：新增 draft state**

在现有 state 列表后加：
```ts
const [webDraft, setWebDraft] = useState<WebDraft | null>(null);
```

- [ ] **Step 4：加载草稿（mount 时）**

在现有 `useEffect`（加载模型）之后加：
```ts
useEffect(() => {
  setWebDraft(loadWebDraft());
}, []);
```

- [ ] **Step 5：处理来自 HistoryPanel 的恢复**

```ts
useEffect(() => {
  if (!pendingRestore) return;
  setPrompt(pendingRestore.prompt ?? '');
  setTemplate((pendingRestore.template as WebTemplate) ?? 'free');
  setModel(pendingRestore.model ?? '');
  setHtml(pendingRestore.html ?? '');
  setDeployedUrl(pendingRestore.deployed_url ?? null);
  if (pendingRestore.html) {
    setMode('done');
    setTimeout(() => updatePreview(pendingRestore.html), 100);
  }
  onRestoreConsumed?.();
}, [pendingRestore, onRestoreConsumed, updatePreview]);
```

- [ ] **Step 6：在生成完成后保存草稿和历史**

在 `handleGenerate` 内，`setMode('done');` 之后加：
```ts
// 保存草稿到 localStorage
saveWebDraft({ prompt, template, model, html: finalHtml, deployed_url: null });
setWebDraft(null); // 清除草稿提示

// 异步保存到 Supabase（fire-and-forget）
void saveHistoryRecord({
  type: 'web',
  title: prompt.slice(0, 60),
  thumbnail: null,
  data: {
    prompt, template, model,
    html: finalHtml,
    deployed_url: null,
  } satisfies WebHistoryData,
});
```

- [ ] **Step 7：部署成功后更新草稿和历史的 deployed_url**

在 `handleDeploy` 内，`setDeployedUrl(data.preview_url ?? null);` 之后加：
```ts
const currentDraft = loadWebDraft();
if (currentDraft) {
  saveWebDraft({ ...currentDraft, deployed_url: data.preview_url ?? null });
}
```

- [ ] **Step 8：在 JSX 中加 DraftBanner**

在 `return (` 里，模板 grid 之前加：
```tsx
{webDraft && (
  <DraftBanner
    type="web"
    draft={webDraft}
    onRestore={(draft) => {
      setPrompt(draft.prompt);
      setTemplate(draft.template as WebTemplate);
      setModel(draft.model);
      setHtml(draft.html);
      setDeployedUrl(draft.deployed_url);
      if (draft.html) {
        setMode('done');
        setTimeout(() => updatePreview(draft.html), 100);
      }
      setWebDraft(null);
      clearWebDraft();
    }}
    onDismiss={() => {
      clearWebDraft();
      setWebDraft(null);
    }}
  />
)}
```

- [ ] **Step 9：验证编译**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 10：Commit**

```bash
git add src/components/studio/WebToolTab.tsx
git commit -m "feat(studio): WebToolTab 草稿保存、历史同步、恢复功能"
```

---

## Task 8：部署到服务器并验证

- [ ] **Step 1：同步代码、构建、重启**

```bash
sshpass -p 'BP5wqKoczwxJTWC3' rsync -avz --progress \
  --exclude='.env*' --exclude='node_modules' --exclude='.next' \
  --exclude='.git' --exclude='*.log' \
  . root@38.47.113.78:/app/ai-creator/

sshpass -p 'BP5wqKoczwxJTWC3' ssh -o StrictHostKeyChecking=no root@38.47.113.78 \
  'cd /app/ai-creator && npm install && npm run build 2>&1 | tail -10 && pm2 restart ai-creator'
```

期望：构建成功，路由表里出现 `/api/studio/history` 和 `/api/studio/history/[id]`。

- [ ] **Step 2：手动验证草稿恢复**

1. 进入创作室网页工具 Tab，生成一段 HTML
2. 关闭/刷新页面
3. 重新打开创作室 → 期望：出现 DraftBanner「检测到未完成的编辑」
4. 点「恢复」→ 期望：HTML 和 prompt 还原，iframe 显示上次生成结果

- [ ] **Step 3：手动验证历史记录**

1. 生成 2-3 个不同的网页工具
2. 点右上角「历史记录」→ 期望：抽屉展开，显示刚才的记录
3. 点某条记录的「恢复」→ 期望：还原该条记录的状态
4. 点「删除」→ 期望：该条记录从列表中消失
