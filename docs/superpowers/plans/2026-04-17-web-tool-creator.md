# 网页工具生成器 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在创作室新增「网页工具」Tab，用户描述需求后 AI 流式生成单文件 HTML，实时预览，一键部署到 GitHub Gist。

**Architecture:** 前端 WebToolTab 组件通过 SSE 流接收 HTML chunks 并实时写入 iframe `srcdoc`。后端 `/api/ai/web/generate` 复用现有 `streamChat`（扩展 system prompt 支持），`/api/github/gist/deploy` 读取管理员配置的 `GITHUB_TOKEN` 调用 Gist API。

**Tech Stack:** Next.js App Router, SSE ReadableStream, GitHub Gist REST API, 现有 AI SDK（OpenAI/Anthropic/Gemini/Grok）

---

## 文件清单

| 操作 | 文件 | 职责 |
|------|------|------|
| 修改 | `src/lib/ai/chat.ts` | 给 `streamChat` 增加可选 `system` 和 `maxTokens` 参数 |
| 新增 | `src/lib/ai/web.ts` | 模板系统提示词定义 + `streamWebHTML` 包装函数 |
| 新增 | `src/app/api/ai/web/generate/route.ts` | SSE 流式 HTML 生成接口 |
| 新增 | `src/app/api/github/gist/deploy/route.ts` | GitHub Gist 部署接口 |
| 新增 | `src/components/studio/WebToolTab.tsx` | 网页工具 Tab 完整 UI |
| 修改 | `src/app/(dashboard)/studio/page.tsx` | 顶部加 Tab 切换，渲染 WebToolTab |

---

## Task 1：扩展 streamChat 支持 system prompt

**Files:**
- Modify: `src/lib/ai/chat.ts`

- [ ] **Step 1：给 streamChat 签名加两个可选参数**

在 `src/lib/ai/chat.ts` 中，找到：
```ts
export async function* streamChat(
  model: ChatModel,
  messages: Message[]
): AsyncGenerator<string> {
```
替换为：
```ts
export async function* streamChat(
  model: ChatModel,
  messages: Message[],
  options?: { system?: string; maxTokens?: number }
): AsyncGenerator<string> {
  const system = options?.system;
  const maxTokens = options?.maxTokens ?? 4096;
```

- [ ] **Step 2：Gemini 分支加 systemInstruction**

找到 `const geminiModel = genAI.getGenerativeModel({ model: apiModelName });`，替换为：
```ts
const geminiModel = genAI.getGenerativeModel({
  model: apiModelName,
  ...(system ? { systemInstruction: system } : {}),
});
```

- [ ] **Step 3：Claude 分支加 system + maxTokens**

找到：
```ts
const stream = anthropic.messages.stream({
  model: 'claude-sonnet-4-6',
  max_tokens: 4096,
  messages: claudeMessages,
});
```
替换为：
```ts
const stream = anthropic.messages.stream({
  model: 'claude-sonnet-4-6',
  max_tokens: maxTokens,
  ...(system ? { system } : {}),
  messages: claudeMessages,
});
```

- [ ] **Step 4：OpenAI/Grok/DeepSeek 分支加 system message**

每个 `client.chat.completions.create` 调用中，找到 `messages: openaiMessages`（或 grokMessages / deepseek messages），在其前面加：
```ts
const systemMsg: OpenAI.ChatCompletionMessageParam[] =
  system ? [{ role: 'system', content: system }] : [];
```
然后把 `messages: openaiMessages` 改为 `messages: [...systemMsg, ...openaiMessages]`（Grok/DeepSeek 同理）。

- [ ] **Step 5：验证编译**
```bash
cd /Users/wulei/Develop/github/ai-creator && npx tsc --noEmit 2>&1 | head -20
```
期望：无 error。

- [ ] **Step 6：Commit**
```bash
git add src/lib/ai/chat.ts
git commit -m "feat(chat): streamChat 支持可选 system prompt 和 maxTokens"
```

---

## Task 2：创建 src/lib/ai/web.ts

**Files:**
- Create: `src/lib/ai/web.ts`

- [ ] **Step 1：创建文件**

```ts
// src/lib/ai/web.ts
import { streamChat, type ChatModel, type Message } from '@/lib/ai/chat';

export type WebTemplate = 'math' | 'physics' | 'chart' | 'game' | 'tool' | 'free';

const BASE_SYSTEM = `你是顶级前端工程师。生成一个完整的单文件 HTML，内嵌所有 CSS 和 JavaScript。
要求：
- 不依赖本地文件，可以使用 CDN（如 cdnjs、unpkg、jsdelivr）
- 视觉精美，有交互性，界面设计现代
- 代码简洁，注释清晰
- 只输出 HTML 代码，不要任何解释文字，不要 markdown 代码块包裹`;

const TEMPLATE_SYSTEM: Record<WebTemplate, string> = {
  math: `${BASE_SYSTEM}
专注于数学可视化：用 Canvas 或 SVG 绘制图形；提供参数调节滑块（range input）；如需渲染公式可引入 MathJax CDN。`,
  physics: `${BASE_SYSTEM}
专注于物理模拟：使用 requestAnimationFrame 实现流畅动画；支持鼠标/触摸交互改变物理状态；有重置按钮。`,
  chart: `${BASE_SYSTEM}
专注于数据图表：引入 Chart.js CDN（https://cdn.jsdelivr.net/npm/chart.js）；图表支持点击/悬停交互；配色美观，有图例。`,
  game: `${BASE_SYSTEM}
专注于浏览器小游戏：键盘（WASD/方向键）或鼠标控制；有开始、重置按钮；显示分数或游戏状态。`,
  tool: `${BASE_SYSTEM}
专注于实用工具：输入即时反馈；界面清晰直观；有输入校验和友好的错误提示。`,
  free: BASE_SYSTEM,
};

/** 去除 AI 可能输出的 markdown 代码块包裹 */
export function stripCodeBlock(text: string): string {
  return text.replace(/^```(?:html)?\n?/i, '').replace(/\n?```\s*$/i, '').trim();
}

export async function* streamWebHTML(
  model: ChatModel,
  prompt: string,
  template: WebTemplate,
  imageData?: string | null,
): AsyncGenerator<string> {
  const message: Message = {
    role: 'user',
    content: prompt,
    ...(imageData ? { image: imageData } : {}),
  };
  yield* streamChat(model, [message], {
    system: TEMPLATE_SYSTEM[template],
    maxTokens: 8192,
  });
}
```

- [ ] **Step 2：验证编译**
```bash
npx tsc --noEmit 2>&1 | head -20
```
期望：无 error。

- [ ] **Step 3：Commit**
```bash
git add src/lib/ai/web.ts
git commit -m "feat(web): 添加网页 HTML 生成 lib，支持 6 种模板"
```

---

## Task 3：创建 /api/ai/web/generate 路由

**Files:**
- Create: `src/app/api/ai/web/generate/route.ts`

- [ ] **Step 1：创建目录和文件**
```bash
mkdir -p src/app/api/ai/web/generate
```

```ts
// src/app/api/ai/web/generate/route.ts
import { createClient } from '@/lib/supabase/server';
import { streamWebHTML, type WebTemplate } from '@/lib/ai/web';
import { type ChatModel } from '@/lib/ai/chat';
import { CREDIT_COSTS } from '@/lib/pricing';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const VALID_MODELS: ChatModel[] = [
  'gpt-4o', 'claude-sonnet-4-6',
  'grok-4', 'grok-3', 'grok-3-fast', 'grok-3-mini', 'grok-3-mini-fast',
  'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite',
  'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-3-pro', 'gemini-3-flash',
  'deepseek-chat',
];

const VALID_TEMPLATES: WebTemplate[] = ['math', 'physics', 'chart', 'game', 'tool', 'free'];

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { prompt?: string; template?: string; model?: string; image_data?: string };
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } }); }

  const { prompt, template = 'free', model, image_data } = body;

  if (!prompt?.trim()) return new Response(JSON.stringify({ error: 'prompt required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  if (!model || !VALID_MODELS.includes(model as ChatModel)) return new Response(JSON.stringify({ error: 'Invalid model' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  if (!VALID_TEMPLATES.includes(template as WebTemplate)) return new Response(JSON.stringify({ error: 'Invalid template' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const encoder = new TextEncoder();
  let fullHtml = '';

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const delta of streamWebHTML(
          model as ChatModel,
          prompt,
          template as WebTemplate,
          image_data,
        )) {
          fullHtml += delta;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
        }
      } catch (err) {
        console.error('Web generate error:', err);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body = (err as any)?.body;
        const msg = body?.detail?.includes('Exhausted balance')
          ? 'AI 服务余额不足，请联系管理员充值后再试'
          : (err instanceof Error ? err.message : 'Generation failed');
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
        controller.close();
        return;
      }

      // Deduct credits (best-effort, after stream)
      try {
        const chars = fullHtml.length;
        const tokenK = Math.max(1, Math.ceil(chars / 4 / 1000));
        const cost = (CREDIT_COSTS[model as keyof typeof CREDIT_COSTS] ?? 1) * tokenK;
        await adminSupabase.rpc('deduct_credits', {
          p_user_id: user.id,
          p_amount: cost,
          p_task_id: null,
          p_desc: `网页工具生成 (${model})`,
        });
      } catch (e) {
        console.error('Credit deduction error:', e);
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
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
```

- [ ] **Step 2：验证编译**
```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3：Commit**
```bash
git add src/app/api/ai/web/generate/route.ts
git commit -m "feat(api): 添加网页 HTML 流式生成接口"
```

---

## Task 4：创建 /api/github/gist/deploy 路由

**Files:**
- Create: `src/app/api/github/gist/deploy/route.ts`

- [ ] **Step 1：创建目录和文件**
```bash
mkdir -p src/app/api/github/gist/deploy
```

```ts
// src/app/api/github/gist/deploy/route.ts
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
      throw new Error(err.message ?? `GitHub API error ${res.status}`);
    }

    const gist = await res.json();
    const rawUrl = gist.files['index.html']?.raw_url as string;
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
```

- [ ] **Step 2：验证编译**
```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3：Commit**
```bash
git add src/app/api/github/gist/deploy/route.ts
git commit -m "feat(api): 添加 GitHub Gist 部署接口"
```

---

## Task 5：创建 WebToolTab 组件

**Files:**
- Create: `src/components/studio/WebToolTab.tsx`

- [ ] **Step 1：创建目录和文件**
```bash
mkdir -p src/components/studio
```

```tsx
// src/components/studio/WebToolTab.tsx
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Sparkles, Square, Upload, ExternalLink, ChevronDown, ChevronUp, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { stripCodeBlock, type WebTemplate } from '@/lib/ai/web';
import type { ModelInfo } from '@/app/api/models/route';

const TEMPLATES: { id: WebTemplate; icon: string; name: string; desc: string }[] = [
  { id: 'math',    icon: '📐', name: '数学可视化', desc: '函数图像、几何动画' },
  { id: 'physics', icon: '🌊', name: '物理模拟',   desc: '粒子、重力、流体' },
  { id: 'chart',   icon: '📊', name: '数据图表',   desc: '交互式图表' },
  { id: 'game',    icon: '🎮', name: '小游戏',     desc: '浏览器小游戏' },
  { id: 'tool',    icon: '🔧', name: '实用工具',   desc: '计算器、转换器' },
  { id: 'free',    icon: '✨', name: '自由发挥',   desc: '不限类型' },
];

type GenMode = 'idle' | 'generating' | 'done';

export function WebToolTab() {
  const [template, setTemplate]     = useState<WebTemplate>('free');
  const [prompt, setPrompt]         = useState('');
  const [model, setModel]           = useState('');
  const [models, setModels]         = useState<ModelInfo[]>([]);
  const [imageData, setImageData]   = useState<string | null>(null);
  const [mode, setMode]             = useState<GenMode>('idle');
  const [html, setHtml]             = useState('');
  const [showCode, setShowCode]     = useState(false);
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  const iframeRef     = useRef<HTMLIFrameElement>(null);
  const abortRef      = useRef<AbortController | null>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accHtmlRef    = useRef('');

  // Load chat models on mount
  useEffect(() => {
    fetch('/api/models')
      .then(r => r.json())
      .then(data => {
        const chatModels: ModelInfo[] = data.chat ?? [];
        setModels(chatModels);
        if (chatModels.length > 0) setModel(chatModels[0].id);
      })
      .catch(() => {});
  }, []);

  const updatePreview = useCallback((content: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        if (iframeRef.current) iframeRef.current.srcdoc = content;
      } catch { /* silent */ }
    }, 300);
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error('请输入描述'); return; }
    if (!model) { toast.error('请选择模型'); return; }

    abortRef.current = new AbortController();
    setMode('generating');
    setHtml('');
    setDeployedUrl(null);
    accHtmlRef.current = '';

    try {
      const res = await fetch('/api/ai/web/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, template, model, image_data: imageData }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? '生成失败');
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') break outer;
          try {
            const obj = JSON.parse(payload);
            if (obj.error) throw new Error(obj.error);
            if (obj.delta) {
              accHtmlRef.current += obj.delta;
              updatePreview(accHtmlRef.current);
            }
          } catch (e) {
            if (e instanceof Error && e.message !== 'Unexpected end of JSON input') throw e;
          }
        }
      }

      const finalHtml = stripCodeBlock(accHtmlRef.current);
      setHtml(finalHtml);
      updatePreview(finalHtml);
      setMode('done');
    } catch (err) {
      if ((err as Error).name === 'AbortError') { setMode('idle'); return; }
      toast.error(err instanceof Error ? err.message : '生成失败');
      setMode('idle');
    }
  };

  const handleStop = () => { abortRef.current?.abort(); setMode('idle'); };

  const handleDeploy = async () => {
    if (!html) return;
    setIsDeploying(true);
    try {
      const res = await fetch('/api/github/gist/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, description: `AI 网页工具 - ${prompt.slice(0, 50)}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '部署失败');
      setDeployedUrl(data.preview_url);
      toast.success('部署成功！');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '部署失败');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageData(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const isGenerating = mode === 'generating';
  const hasDone = mode === 'done' && html;

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full min-h-[600px]">
      {/* Left: Input */}
      <div className="lg:w-2/5 space-y-4 flex flex-col">
        {/* Template grid */}
        <div className="grid grid-cols-3 gap-2">
          {TEMPLATES.map(t => (
            <button key={t.id} onClick={() => setTemplate(t.id)}
              className={cn(
                'rounded-xl border p-3 text-left transition-colors',
                template === t.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40',
              )}>
              <div className="text-xl mb-1">{t.icon}</div>
              <div className="text-xs font-medium">{t.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5 hidden sm:block">{t.desc}</div>
            </button>
          ))}
        </div>

        {/* Prompt */}
        <Textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="描述你想要的工具，例如：生成一个可以调节 a、b、c 参数的二次函数抛物线动画..."
          rows={4}
          className="resize-none flex-1"
          disabled={isGenerating}
        />

        {/* Image upload */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isGenerating}>
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            {imageData ? '已上传参考图' : '上传参考图（可选）'}
          </Button>
          {imageData && (
            <button onClick={() => setImageData(null)} className="text-xs text-muted-foreground hover:text-foreground">
              移除
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </div>

        {/* Model selector */}
        <select
          value={model}
          onChange={e => setModel(e.target.value)}
          disabled={isGenerating}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {models.length === 0 && <option value="">加载模型中...</option>}
          {models.map(m => (
            <option key={m.id} value={m.id}>{m.label} ({m.credits} 积分/K)</option>
          ))}
        </select>

        {/* Generate / Stop */}
        {isGenerating ? (
          <Button variant="outline" onClick={handleStop} className="w-full">
            <Square className="mr-2 h-4 w-4" /> 停止生成
          </Button>
        ) : (
          <Button onClick={handleGenerate} className="w-full" disabled={!prompt.trim() || !model}>
            <Sparkles className="mr-2 h-4 w-4" /> 生成网页
          </Button>
        )}
      </div>

      {/* Right: Preview */}
      <div className="lg:w-3/5 flex flex-col gap-3">
        {/* iframe */}
        <div className="flex-1 rounded-2xl border overflow-hidden bg-muted/20 min-h-[400px] relative">
          {!html && !isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              生成结果将在此实时预览
            </div>
          )}
          {isGenerating && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-full border">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              AI 正在生成...
            </div>
          )}
          <iframe
            ref={iframeRef}
            sandbox="allow-scripts"
            className="w-full h-full border-0"
            title="web tool preview"
          />
        </div>

        {/* Action bar */}
        {hasDone && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={handleDeploy} disabled={isDeploying}>
              <Rocket className="mr-2 h-4 w-4" />
              {isDeploying ? '部署中...' : '部署到 Gist'}
            </Button>
            {deployedUrl && (
              <a href={deployedUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> 在新标签打开
                </Button>
              </a>
            )}
            <button
              onClick={() => setShowCode(v => !v)}
              className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {showCode ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {showCode ? '收起代码' : '查看代码'}
            </button>
          </div>
        )}

        {/* Code panel */}
        {showCode && html && (
          <div className="rounded-xl border bg-muted/30 p-3 max-h-64 overflow-auto">
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all">{html}</pre>
          </div>
        )}
      </div>
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
git add src/components/studio/WebToolTab.tsx
git commit -m "feat(studio): 添加 WebToolTab 网页工具组件"
```

---

## Task 6：修改 studio/page.tsx 加 Tab 切换

**Files:**
- Modify: `src/app/(dashboard)/studio/page.tsx`

- [ ] **Step 1：在文件顶部加 import**

在 `src/app/(dashboard)/studio/page.tsx` 的 import 区域末尾加：
```ts
import { WebToolTab } from '@/components/studio/WebToolTab';
```

- [ ] **Step 2：在组件顶部加 tab state**

在 `export default function StudioPage()` 函数内，所有 useState 的最开始加：
```ts
const [activeTab, setActiveTab] = useState<'image' | 'web'>('image');
```

- [ ] **Step 3：在 upload 视图（mode === 'upload' 时的 return）最外层 div 的最前面加 Tab 切换栏**

找到 upload 视图的：
```tsx
<div className="max-w-2xl mx-auto space-y-6">
  <div>
    <h1 className="text-2xl font-bold ...
```

在 `<div className="max-w-2xl mx-auto space-y-6">` 内的最开始插入：
```tsx
{/* Tab switcher */}
<div className="flex rounded-xl border overflow-hidden w-fit">
  {(['image', 'web'] as const).map(tab => (
    <button key={tab} onClick={() => setActiveTab(tab)}
      className={cn(
        'px-4 py-2 text-sm font-medium transition-colors',
        activeTab === tab
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground',
      )}>
      {tab === 'image' ? '🖼️ 图片编辑' : '🌐 网页工具'}
    </button>
  ))}
</div>
{activeTab === 'web' && <WebToolTab />}
{activeTab === 'image' && (
```

然后把 upload 视图原来的内容（从 `<div>` `<h1>创作间</h1>` 开始到底部的 `</div>`）用 `{activeTab === 'image' && (...)}` 包裹起来。

- [ ] **Step 4：在 editing/result 视图顶部也加 Tab 切换栏**

editing 视图（底部的 `return`）和 result 视图各自在最外层 div 里最前面加同样的 Tab 切换栏。

- [ ] **Step 5：验证编译**
```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 6：Commit**
```bash
git add src/app/(dashboard)/studio/page.tsx
git commit -m "feat(studio): 添加网页工具 Tab，接入 WebToolTab 组件"
```

---

## Task 7：部署到服务器并验证

- [ ] **Step 1：同步代码、构建、重启**
```bash
sshpass -p 'BP5wqKoczwxJTWC3' rsync -avz --progress \
  --exclude='.env*' --exclude='node_modules' --exclude='.next' \
  --exclude='.git' --exclude='*.log' \
  . root@38.47.113.78:/app/ai-creator/

sshpass -p 'BP5wqKoczwxJTWC3' ssh -o StrictHostKeyChecking=no root@38.47.113.78 \
  'cd /app/ai-creator && npm install && npm run build && pm2 restart ai-creator'
```

期望：构建成功，路由表里出现 `/api/ai/web/generate` 和 `/api/github/gist/deploy`。

- [ ] **Step 2：在管理后台配置 GITHUB_TOKEN**

访问 `http://38.47.113.78:3000/admin/config`，添加配置项：
- Key: `GITHUB_TOKEN`
- Value: 你的 GitHub Personal Access Token（需要 `gist` 权限）

- [ ] **Step 3：手动验证**

1. 进入创作室，点「🌐 网页工具」Tab
2. 选择「📐 数学可视化」模板
3. 输入：`生成一个可以调节 a、b、c 参数的抛物线 y=ax²+bx+c 的动画`
4. 选择模型，点「生成网页」
5. 预期：右侧 iframe 实时渲染 HTML，生成完成后出现「部署到 Gist」按钮
6. 点「部署到 Gist」，预期：出现「在新标签打开」按钮，链接可访问
