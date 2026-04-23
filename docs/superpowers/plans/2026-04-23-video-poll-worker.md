# 视频任务服务端轮询 Worker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 每 2 分钟服务端主动轮询所有 processing 视频任务，完成时写入结果，失败/过期时退还积分，彻底解决用户关闭页面后任务永久卡住的问题。

**Architecture:** 新增 `/api/cron/poll-videos` 路由，用 Bearer token 鉴权，service role 查询并更新 tasks 表；将 Veo 转存逻辑提取为共享函数复用；服务器 crontab 每 2 分钟调用一次。

**Tech Stack:** Next.js App Router API Route, Supabase service role client, `@supabase/supabase-js`, `getConfig()`, crontab

---

## File Map

| 操作 | 文件 | 职责 |
|------|------|------|
| Create | `src/lib/ai/veo-reupload.ts` | Veo 视频转存到 Supabase Storage 的共享函数 |
| Create | `src/app/api/cron/poll-videos/route.ts` | 轮询 API 路由 |
| Modify | `src/app/api/ai/video/status/[taskId]/route.ts` | 改用共享 Veo 转存函数，消除重复 |

---

## Task 1: 提取 Veo 转存共享函数

**Files:**
- Create: `src/lib/ai/veo-reupload.ts`

- [ ] **Step 1: 创建文件**

```ts
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
```

- [ ] **Step 2: 验证构建**

```bash
npm run build 2>&1 | grep -E "error TS|Error:" | head -10
```

Expected: 无报错。

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai/veo-reupload.ts
git commit -m "refactor(veo): extract Veo re-upload logic to shared function"
```

---

## Task 2: 更新现有 status 路由复用共享函数

**Files:**
- Modify: `src/app/api/ai/video/status/[taskId]/route.ts`

- [ ] **Step 1: 添加 import**

在文件顶部 import 区末尾添加：

```ts
import { reuploadVeoVideo } from '@/lib/ai/veo-reupload';
```

- [ ] **Step 2: 替换内联转存逻辑**

找到（约 89–119 行）：

```ts
        // Download from Google (temp URL) and re-upload to Supabase Storage
        let publicUrl = veoStatus.videoUrl;
        try {
          const apiKey = await getConfig('GOOGLE_API_KEY');
          const dlUrl = veoStatus.videoUrl.includes('?')
            ? `${veoStatus.videoUrl}&key=${apiKey}`
            : `${veoStatus.videoUrl}?key=${apiKey}`;
          const videoRes = await fetch(dlUrl, { signal: AbortSignal.timeout(30_000) });
          if (videoRes.ok) {
            const buf = Buffer.from(await videoRes.arrayBuffer());
            const adminSupabase = createAdminClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!,
            );
            const fileName = `videos/${user.id}/${task.id}.mp4`;
            const { error: upErr } = await adminSupabase.storage
              .from('ai-creations')
              .upload(fileName, buf, { contentType: 'video/mp4', upsert: true });
            if (!upErr) {
              const { data: { publicUrl: storedUrl } } = adminSupabase.storage
                .from('ai-creations').getPublicUrl(fileName);
              publicUrl = storedUrl;
            }
          }
        } catch (e) {
          console.error('Veo video re-upload error:', e);
          // Keep original Google URL as fallback
        }

        await supabase.from('tasks').update({ status: 'completed', output_url: publicUrl }).eq('id', task.id);
        return NextResponse.json({ status: 'completed', output_url: publicUrl });
```

替换为：

```ts
        const publicUrl = await reuploadVeoVideo(veoStatus.videoUrl, user.id, task.id);
        await supabase.from('tasks').update({ status: 'completed', output_url: publicUrl, completed_at: new Date().toISOString() }).eq('id', task.id);
        return NextResponse.json({ status: 'completed', output_url: publicUrl });
```

- [ ] **Step 3: 移除不再需要的 createAdminClient import**

检查文件顶部，若 `createAdminClient` 只被 Veo 转存使用（已替换），删除该 import 行：

```ts
import { createClient as createAdminClient } from '@supabase/supabase-js';
```

> 注意：若文件其他地方还用到 `createAdminClient`，保留该行。

- [ ] **Step 4: 验证构建**

```bash
npm run build 2>&1 | grep -E "error TS|Error:" | head -10
```

Expected: 无报错。

- [ ] **Step 5: Commit**

```bash
git add src/app/api/ai/video/status/'[taskId]'/route.ts
git commit -m "refactor(video): use shared reuploadVeoVideo in status route"
```

---

## Task 3: 创建轮询 API 路由

**Files:**
- Create: `src/app/api/cron/poll-videos/route.ts`

- [ ] **Step 1: 创建路由文件**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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
    await Promise.allSettled(batch.map(task => processTask(task, adminClient, { completed: () => completed++, failed: () => failed++ })));
  }

  return NextResponse.json({ processed: rows.length, completed, failed });
}

async function processTask(
  task: TaskRow,
  db: ReturnType<typeof createClient>,
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
```

- [ ] **Step 2: 验证构建**

```bash
npm run build 2>&1 | grep -E "error TS|Error:" | head -10
```

Expected: 无报错，路由表里出现 `/api/cron/poll-videos`。

- [ ] **Step 3: Commit**

```bash
git add src/app/api/cron/poll-videos/route.ts
git commit -m "feat(cron): add server-side video task poll worker"
```

---

## Task 4: 部署 + 配置 Crontab

**Files:** 无代码文件，服务器操作。

- [ ] **Step 1: 同步代码到服务器**

```bash
sshpass -p 'BP5wqKoczwxJTWC3' rsync -avz \
  --exclude='.env*' --exclude='node_modules' --exclude='.next' \
  --exclude='.git' --exclude='*.log' \
  -e "ssh -o StrictHostKeyChecking=no" \
  . root@38.47.113.78:/app/ai-creator/
```

- [ ] **Step 2: 服务器构建**

```bash
sshpass -p 'BP5wqKoczwxJTWC3' ssh -o StrictHostKeyChecking=no root@38.47.113.78 \
  'cd /app/ai-creator && npm run build 2>&1 | tail -20'
```

Expected: 路由表出现 `/api/cron/poll-videos`，无错误。

- [ ] **Step 3: 生成 CRON_SECRET 并写入 app_config**

在本地生成一个随机 secret（例如 32 位十六进制）：

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

记录输出值（例如 `a1b2c3d4e5f6...`），然后写入服务器 Supabase：

```bash
sshpass -p 'BP5wqKoczwxJTWC3' ssh -o StrictHostKeyChecking=no root@38.47.113.78 \
  'cd /app/ai-creator && node -e "
const { createClient } = require(\"@supabase/supabase-js\");
require(\"dotenv\").config({ path: \".env.local\" });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
sb.from(\"app_config\").upsert({ key: \"CRON_SECRET\", value: \"YOUR_SECRET_HERE\" }, { onConflict: \"key\" })
  .then(({error}) => console.log(error ?? \"OK\"));
"'
```

将 `YOUR_SECRET_HERE` 替换为上一步生成的值。

- [ ] **Step 4: 重启 PM2**

```bash
sshpass -p 'BP5wqKoczwxJTWC3' ssh -o StrictHostKeyChecking=no root@38.47.113.78 \
  'pm2 restart ai-creator && sleep 3 && pm2 list'
```

Expected: `status = online`，uptime > 3s。

- [ ] **Step 5: 手动测试 API 路由**

```bash
sshpass -p 'BP5wqKoczwxJTWC3' ssh -o StrictHostKeyChecking=no root@38.47.113.78 \
  'curl -s -H "Authorization: Bearer YOUR_SECRET_HERE" http://localhost:3000/api/cron/poll-videos'
```

Expected: `{"processed":N,"completed":N,"failed":N}`（不报 401/500）。

- [ ] **Step 6: 配置 crontab**

```bash
sshpass -p 'BP5wqKoczwxJTWC3' ssh -o StrictHostKeyChecking=no root@38.47.113.78 \
  '(crontab -l 2>/dev/null; echo "*/2 * * * * curl -s -H \"Authorization: Bearer YOUR_SECRET_HERE\" http://localhost:3000/api/cron/poll-videos >> /var/log/poll-videos.log 2>&1") | crontab -'
```

将 `YOUR_SECRET_HERE` 替换为实际 secret 值。

- [ ] **Step 7: 验证 crontab**

```bash
sshpass -p 'BP5wqKoczwxJTWC3' ssh -o StrictHostKeyChecking=no root@38.47.113.78 \
  'crontab -l'
```

Expected: 列表中出现 `*/2 * * * * curl -s -H "Authorization: Bearer ...` 这一行。

- [ ] **Step 8: 等待 2 分钟后检查日志**

```bash
sshpass -p 'BP5wqKoczwxJTWC3' ssh -o StrictHostKeyChecking=no root@38.47.113.78 \
  'cat /var/log/poll-videos.log'
```

Expected: 出现 `{"processed":...}` 的 JSON 输出，无错误行。

- [ ] **Step 9: Final commit**

```bash
git add -A
git commit -m "feat(cron): video poll worker complete - crontab configured on server"
```
