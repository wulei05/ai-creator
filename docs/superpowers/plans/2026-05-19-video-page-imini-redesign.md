# 视频生成页 imini 风格双栏重设计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把视频生成页从单列布局重设计为 imini 式双栏工作台（左栏固定控制面板 + 右栏可滚动发现区），并修复「生成按钮强制要求参考图」的现状矛盾。

**Architecture:** 把 975 行的 `src/app/(dashboard)/video/page.tsx` 拆分到 `src/components/video/`：数据常量进 `video-templates.ts`，UI 拆为 `VideoImageUploader` / `VideoControls`（左栏）/ `VideoDiscoveryPanel`（右栏），由 `VideoWorkspace` 顶层组件持有全部状态并组织双栏布局。与图片页 `src/components/image/` 的结构完全对齐。无后端改动。

**Tech Stack:** Next.js App Router、React client components、TypeScript、Tailwind v4、shadcn UI、lucide-react、sonner。

**验证说明:** 本仓库无单元测试框架（`package.json` 仅有 `dev/build/start/lint`）。每个任务的验证用 `npx tsc --noEmit`（忽略 `.next/dev` 里因已删除 `home/page` 残留的 `validator.ts` 报错）与 `npm run lint`（只关注 `src/components/video` 新文件是否干净，仓库其余文件有大量预存 lint 问题）；最后一个任务跑 `npm run build` 并做手动浏览器验证。

**参考源:** 现有页面 `src/app/(dashboard)/video/page.tsx`（下文按行号引用其中可原样复用的代码块）。设计文档：`docs/superpowers/specs/2026-05-19-video-page-imini-redesign-design.md`。已完成的图片页同款实现可作参照：`src/components/image/`。

---

### Task 1: 抽出数据常量到 `video-templates.ts`

**Files:**
- Create: `src/components/video/video-templates.ts`

把现有 `page.tsx` 中的纯数据常量与类型集中到一个 client-safe 的数据文件。

- [ ] **Step 1: 创建 `src/components/video/video-templates.ts`**

文件内容：

```ts
export type AspectRatio = '16:9' | '9:16' | '1:1';
export type Duration = 5 | 10;

export interface TaskRecord {
  id: string;
  prompt: string;
  status: string;
  output_url: string | null;
  created_at: string;
}

export interface Template {
  title: string;
  desc: string;
  prompt: string;
  gradient: string;
  emoji: string;
}

export interface TemplateCategory {
  id: string;
  label: string;
  emoji: string;
  templates: Template[];
}

export const ASPECT_RATIOS: { value: AspectRatio; label: string; icon: string }[] = [
  { value: '16:9', label: '16:9', icon: '▬' },
  { value: '9:16', label: '9:16', icon: '▮' },
  { value: '1:1', label: '1:1', icon: '■' },
];

export const DURATIONS: { value: Duration; label: string; desc: string }[] = [
  { value: 5, label: '5秒', desc: '快速预览' },
  { value: 10, label: '10秒', desc: '完整呈现' },
];

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  // 原样复制 page.tsx 第 42-435 行的 TEMPLATE_CATEGORIES 数组内容
];

export const TOTAL_TEMPLATE_COUNT = TEMPLATE_CATEGORIES.reduce(
  (s, c) => s + c.templates.length, 0,
);
```

`TEMPLATE_CATEGORIES` 的数组内容从现有 `page.tsx` 原样复制：复制 `page.tsx:42-435` 的数组字面量
（即 `const TEMPLATE_CATEGORIES: TemplateCategory[] = [ ... ];` 的 `[ ... ]` 部分），共 8 个分类
（cinematic / nature / character / animals / magic / urban / slowmo / abstract），48 个模版。

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit 2>&1 | grep -v validator.ts`
Expected: 无输出（通过）。

- [ ] **Step 3: Commit**

```bash
git add src/components/video/video-templates.ts
git commit -m "refactor(video): 抽出视频页数据常量到 video-templates.ts"
```

---

### Task 2: `VideoImageUploader` 组件

**Files:**
- Create: `src/components/video/VideoImageUploader.tsx`

单张参考图上传：点击选择、按当前画面比例变形预览、删除。受控组件，预览 URL 由父组件管理。

- [ ] **Step 1: 创建 `src/components/video/VideoImageUploader.tsx`**

```tsx
'use client';

import { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import type { AspectRatio } from './video-templates';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 10 * 1024 * 1024;

interface VideoImageUploaderProps {
  previewUrl: string | null;
  fileName: string | null;
  aspectRatio: AspectRatio;
  disabled?: boolean;
  onSelect: (file: File) => void;
  onRemove: () => void;
}

export function VideoImageUploader({
  previewUrl, fileName, aspectRatio, disabled, onSelect, onRemove,
}: VideoImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const ratioCss = aspectRatio === '9:16' ? '9 / 16' : aspectRatio === '1:1' ? '1 / 1' : '16 / 9';

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!ALLOWED.includes(file.type)) { toast.error('请上传 JPG、PNG、WebP 或 GIF 格式的图片'); return; }
    if (file.size > MAX_SIZE) { toast.error('图片大小不能超过 10MB'); return; }
    onSelect(file);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        参考图片 <span className="normal-case text-muted-foreground/60">（可选）</span>
      </label>
      <div
        className={`relative overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
        } ${previewUrl ? 'border-primary/50' : 'border-border hover:border-primary/50'}`}
        style={{ aspectRatio: ratioCss, maxHeight: '220px' }}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="参考图预览" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="absolute top-2 right-2 rounded-full bg-black/50 p-1 transition-colors hover:bg-red-600"
            >
              <X className="size-3 text-white" />
            </button>
            {fileName && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="truncate text-xs text-white">{fileName}</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 p-4 text-muted-foreground">
            <Upload className="h-7 w-7 opacity-50" />
            <p className="text-sm font-medium">点击上传参考图片</p>
            <p className="text-[11px] opacity-60">可选 · JPG/PNG/WebP/GIF · ≤ 10MB</p>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED.join(',')}
        hidden
        disabled={disabled}
        onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }}
      />
    </div>
  );
}
```

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit 2>&1 | grep -v validator.ts`
Expected: 无输出（通过）。

- [ ] **Step 3: Commit**

```bash
git add src/components/video/VideoImageUploader.tsx
git commit -m "feat(video): 参考图上传组件 VideoImageUploader"
```

---

### Task 3: `VideoControls` 左栏组件

**Files:**
- Create: `src/components/video/VideoControls.tsx`

左栏控制面板：模型选择、参考图上传、描述词、时长、画面比例、生成按钮。纯受控组件。

- [ ] **Step 1: 创建 `src/components/video/VideoControls.tsx`**

```tsx
'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Video } from 'lucide-react';
import type { ModelInfo } from '@/lib/hooks/useModels';
import { VideoImageUploader } from './VideoImageUploader';
import { ASPECT_RATIOS, DURATIONS, type AspectRatio, type Duration } from './video-templates';

interface VideoControlsProps {
  models: ModelInfo[];
  videoModel: string;
  onModelChange: (id: string) => void;
  prompt: string;
  onPromptChange: (v: string) => void;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (r: AspectRatio) => void;
  duration: Duration;
  onDurationChange: (d: Duration) => void;
  imagePreview: string | null;
  imageFileName: string | null;
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
  loading: boolean;
  uploading: boolean;
  creditCost: number;
  error: string | null;
  onGenerate: () => void;
}

export function VideoControls({
  models, videoModel, onModelChange,
  prompt, onPromptChange,
  aspectRatio, onAspectRatioChange,
  duration, onDurationChange,
  imagePreview, imageFileName, onImageSelect, onImageRemove,
  loading, uploading, creditCost, error, onGenerate,
}: VideoControlsProps) {
  return (
    <div className="flex flex-col gap-4 p-4 md:h-full md:overflow-y-auto">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Video className="size-4 text-primary" />
        视频生成
      </h2>

      {/* 模型选择 */}
      {models.length > 1 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">模型</label>
          <div className="grid grid-cols-2 gap-2">
            {models.map((m) => (
              <button
                key={m.id}
                onClick={() => onModelChange(m.id)}
                disabled={loading}
                className={`rounded-lg border p-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  videoModel === m.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <div className="text-xs font-medium">{m.label}</div>
                <div className="text-xs text-muted-foreground">{m.credits} 积分</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 参考图上传 */}
      <VideoImageUploader
        previewUrl={imagePreview}
        fileName={imageFileName}
        aspectRatio={aspectRatio}
        disabled={loading}
        onSelect={onImageSelect}
        onRemove={onImageRemove}
      />

      {/* 描述词 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">运动描述词 Prompt</label>
          <span className="text-xs text-muted-foreground">{prompt.length}/1000</span>
        </div>
        <Textarea
          placeholder="描述视频的运动方式，例如：slow cinematic push-in shot, camera gently moves forward..."
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value.slice(0, 1000))}
          rows={4}
          disabled={loading}
          className="resize-none text-sm"
        />
      </div>

      {/* 视频时长 */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">视频时长</label>
        <div className="grid grid-cols-2 gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => onDurationChange(d.value)}
              disabled={loading}
              className={`rounded-lg border p-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                duration === d.value
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <div className="text-sm font-medium">{d.label}</div>
              <div className="text-xs text-muted-foreground">{d.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 画面比例 */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">画面比例</label>
        <div className="grid grid-cols-3 gap-2">
          {ASPECT_RATIOS.map((r) => (
            <button
              key={r.value}
              onClick={() => onAspectRatioChange(r.value)}
              disabled={loading}
              className={`rounded-lg border p-2 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                aspectRatio === r.value
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <div className="text-base">{r.icon}</div>
              <div className="mt-0.5 text-xs font-medium">{r.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 生成按钮 */}
      <div className="mt-auto space-y-2 pt-2">
        <Button onClick={onGenerate} disabled={loading || !prompt.trim()} className="w-full" size="lg">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {uploading ? '上传图片中...' : '正在生成视频，预计 1-3 分钟...'}
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              生成视频 · {creditCost} 积分
            </>
          )}
        </Button>
        {!imagePreview && !loading && (
          <p className="text-center text-xs text-muted-foreground">不上传图片则使用纯文字生成视频</p>
        )}
        {error && (
          <p className="rounded-lg bg-destructive/5 px-3 py-2 text-center text-sm text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit 2>&1 | grep -v validator.ts`
Expected: 无输出（通过）。

- [ ] **Step 3: Commit**

```bash
git add src/components/video/VideoControls.tsx
git commit -m "feat(video): 左栏控制面板 VideoControls"
```

---

### Task 4: `VideoDiscoveryPanel` 右栏组件

**Files:**
- Create: `src/components/video/VideoDiscoveryPanel.tsx`

右栏：`发现 / 创建` 标签。发现 = 运镜模版；创建 = 生成结果 + 最近生成。

- [ ] **Step 1: 创建 `src/components/video/VideoDiscoveryPanel.tsx`**

```tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, Compass, Download, Loader2, Play, Sparkles, Video, Wand2, X } from 'lucide-react';
import { toast } from 'sonner';
import { TEMPLATE_CATEGORIES, TOTAL_TEMPLATE_COUNT, type TaskRecord } from './video-templates';

interface VideoDiscoveryPanelProps {
  activeTab: 'discover' | 'create';
  onTabChange: (t: 'discover' | 'create') => void;
  activeCategory: string;
  onCategoryChange: (id: string) => void;
  onApplyTemplate: (prompt: string) => void;
  loading: boolean;
  generatedVideo: string | null;
  history: TaskRecord[];
  onSelectHistory: (url: string) => void;
  onDownload: (url: string) => void;
  onDeleteHistory: (id: string) => void;
  onClearHistory: () => void;
}

export function VideoDiscoveryPanel({
  activeTab, onTabChange,
  activeCategory, onCategoryChange,
  onApplyTemplate,
  loading, generatedVideo, history,
  onSelectHistory, onDownload, onDeleteHistory, onClearHistory,
}: VideoDiscoveryPanelProps) {
  const activeTemplates = TEMPLATE_CATEGORIES.find((c) => c.id === activeCategory)?.templates ?? [];

  return (
    <div className="flex flex-col md:h-full md:overflow-hidden">
      {/* 标签栏 */}
      <div className="flex items-center gap-1 border-b px-4 py-2">
        {([
          { id: 'discover', label: '发现', icon: Compass },
          { id: 'create',   label: '创建', icon: Sparkles },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'discover' ? (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Wand2 className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">运镜模版</h2>
              <Badge variant="secondary" className="text-xs">{TOTAL_TEMPLATE_COUNT} 个模版</Badge>
            </div>

            {/* 分类 tab */}
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onCategoryChange(cat.id)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                    activeCategory === cat.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* 模版卡片 */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {activeTemplates.map((template) => (
                <button
                  key={template.title}
                  onClick={() => {
                    onApplyTemplate(template.prompt);
                    toast.success(`已填入「${template.title}」模板`);
                  }}
                  className="group relative overflow-hidden rounded-xl text-left transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
                >
                  <div className={`relative flex aspect-video w-full items-center justify-center bg-gradient-to-br ${template.gradient}`}>
                    <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/10" />
                    <div className="relative z-10 rounded-full bg-white/20 p-2 backdrop-blur-sm transition-all group-hover:scale-110 group-hover:bg-white/30">
                      <Play className="size-4 fill-white text-white" />
                    </div>
                    <span className="absolute top-2 right-2 text-base">{template.emoji}</span>
                    <ChevronRight className="absolute bottom-2 right-2 size-3 text-white/60 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <div className="rounded-b-xl border border-t-0 bg-card p-2">
                    <p className="truncate text-xs font-medium">{template.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{template.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <div className="space-y-6">
            {/* 生成结果 */}
            {(loading || generatedVideo) && (
              <section className="space-y-3 rounded-xl border bg-card p-5">
                <h2 className="text-sm font-semibold">生成结果</h2>
                {loading && !generatedVideo && (
                  <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground">
                    <div className="relative">
                      <div className="size-16 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                      <Video className="absolute top-1/2 left-1/2 size-5 -translate-x-1/2 -translate-y-1/2 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">AI 正在创作视频</p>
                      <p className="mt-1 text-xs text-muted-foreground">预计需要 1-3 分钟，请耐心等待...</p>
                    </div>
                  </div>
                )}
                {generatedVideo && (
                  <div className="space-y-3">
                    <video src={generatedVideo} controls className="max-h-[600px] w-full rounded-xl bg-black" />
                    <Button variant="outline" size="sm" onClick={() => onDownload(generatedVideo)} className="w-full">
                      <Download className="mr-2 h-4 w-4" />下载视频
                    </Button>
                  </div>
                )}
              </section>
            )}

            {/* 最近生成 */}
            {history.length > 0 ? (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-muted-foreground">最近生成</h2>
                  <button
                    onClick={onClearHistory}
                    className="text-xs text-muted-foreground transition-colors hover:text-destructive"
                  >
                    清空
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="group relative cursor-pointer"
                      onClick={() => item.output_url && onSelectHistory(item.output_url)}
                    >
                      <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
                        {item.output_url ? (
                          <>
                            <video src={item.output_url} className="h-full w-full object-cover" muted />
                            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                              <div className="rounded-full bg-white/20 p-2">
                                <Play className="size-4 fill-white text-white" />
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); onDownload(item.output_url!); }}
                                className="rounded-full bg-white/20 p-2 transition-colors hover:bg-white/30"
                              >
                                <Download className="size-4 text-white" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            {item.status === 'failed'
                              ? <span className="text-xs text-destructive">失败</span>
                              : <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteHistory(item.id); }}
                          className="absolute top-1.5 right-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-all hover:bg-red-600 group-hover:opacity-100"
                          title="删除"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                      <p className="mt-1.5 line-clamp-1 px-0.5 text-xs text-muted-foreground">{item.prompt}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              !loading && !generatedVideo && (
                <div className="flex flex-col items-center justify-center gap-2 py-24 text-muted-foreground">
                  <Video className="size-8" />
                  <p className="text-sm">还没有作品，去左侧输入描述词生成第一个视频吧</p>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit 2>&1 | grep -v validator.ts`
Expected: 无输出（通过）。

- [ ] **Step 3: Commit**

```bash
git add src/components/video/VideoDiscoveryPanel.tsx
git commit -m "feat(video): 右栏发现/创建面板 VideoDiscoveryPanel"
```

---

### Task 5: `VideoWorkspace` 顶层组件 + 替换 `page.tsx`

**Files:**
- Create: `src/components/video/VideoWorkspace.tsx`
- Modify: `src/app/(dashboard)/video/page.tsx`

`VideoWorkspace` 持有全部状态与业务逻辑（图片上传、生成、轮询、历史、下载），组织双栏布局。

- [ ] **Step 1: 创建 `src/components/video/VideoWorkspace.tsx`**

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useModels } from '@/lib/hooks/useModels';
import { useAuthGate } from '@/lib/auth-gate';
import { VideoControls } from './VideoControls';
import { VideoDiscoveryPanel } from './VideoDiscoveryPanel';
import { TEMPLATE_CATEGORIES, type AspectRatio, type Duration, type TaskRecord } from './video-templates';

const POLL_INTERVAL = 5000;
const MAX_POLL_DURATION = 5 * 60 * 1000;

export function VideoWorkspace() {
  const { models, loading: modelsLoading } = useModels('video');
  const { require } = useAuthGate();

  const [videoModel, setVideoModel] = useState('');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [duration, setDuration] = useState<Duration>(5);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<TaskRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'discover' | 'create'>('discover');
  const [activeCategory, setActiveCategory] = useState(TEMPLATE_CATEGORIES[0].id);

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollStartRef = useRef<number>(0);

  // 默认选中第一个模型
  useEffect(() => {
    if (models.length > 0 && !models.find((m) => m.id === videoModel)) {
      setVideoModel(models[0].id);
    }
  }, [models, videoModel]);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/ai/video/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.tasks ?? []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchHistory();
    return () => { if (pollTimerRef.current) clearTimeout(pollTimerRef.current); };
  }, []);

  // 卸载时回收预览 URL
  useEffect(() => {
    return () => { if (imagePreview) URL.revokeObjectURL(imagePreview); };
  }, [imagePreview]);

  const handleImageSelect = (file: File) => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleImageRemove = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Upload failed');
    return json.url as string;
  };

  const pollStatus = async (taskId: string) => {
    // pollStatus 经 setTimeout 调用，非渲染期；Date.now 在此安全
    // eslint-disable-next-line react-hooks/purity
    if (Date.now() - pollStartRef.current > MAX_POLL_DURATION) {
      setLoading(false);
      setError('Generation timed out. Please try again.');
      return;
    }
    try {
      const res = await fetch(`/api/ai/video/status/${taskId}`);
      if (!res.ok) { setLoading(false); setError('Failed to check generation status.'); return; }
      const data = await res.json();
      if (data.status === 'completed') {
        setLoading(false);
        if (data.output_url) setGeneratedVideo(data.output_url);
        fetchHistory();
        return;
      }
      if (data.status === 'failed') {
        setLoading(false);
        setError(data.error ?? 'Video generation failed.');
        fetchHistory();
        return;
      }
      pollTimerRef.current = setTimeout(() => pollStatus(taskId), POLL_INTERVAL);
    } catch {
      setLoading(false);
      setError('Network error while checking status.');
    }
  };

  const handleGenerate = async () => {
    if (!require()) return;
    if (!prompt.trim()) { toast.error('请输入描述词'); return; }
    setLoading(true);
    setError(null);
    setGeneratedVideo(null);
    setActiveTab('create');

    let image_url: string | undefined;
    if (imageFile) {
      setUploading(true);
      try {
        image_url = await uploadImage(imageFile);
      } catch (err) {
        setLoading(false);
        setUploading(false);
        const msg = err instanceof Error ? err.message : 'Image upload failed';
        setError(msg);
        toast.error(msg);
        return;
      }
      setUploading(false);
    }

    try {
      const res = await fetch('/api/ai/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          image_url,
          duration,
          aspect_ratio: aspectRatio,
          model: videoModel || 'kling-v2',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoading(false);
        setError(data.error ?? 'Failed to start generation');
        toast.error(data.error === 'Insufficient credits' ? '积分不足，请购买积分' : (data.error ?? 'Failed to start generation'));
        return;
      }
      pollStartRef.current = Date.now();
      pollTimerRef.current = setTimeout(() => pollStatus(data.task_id), POLL_INTERVAL);
    } catch {
      setLoading(false);
      setError('Network error. Please try again.');
      toast.error('Network error. Please try again.');
    }
  };

  const handleDownload = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `ai-video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  const handleDeleteHistory = async (id: string) => {
    await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
    setHistory((prev) => prev.filter((h) => h.id !== id));
    toast.success('已删除');
  };

  const handleClearHistory = async () => {
    if (!confirm('确认清空全部视频记录？')) return;
    await fetch('/api/tasks?type=video', { method: 'DELETE' });
    setHistory([]);
    toast.success('已清空');
  };

  const creditCost = models.find((m) => m.id === videoModel)?.credits ?? 0;

  if (modelsLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        <span>加载模型列表...</span>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="p-6">
        <h1 className="mb-2 text-2xl font-semibold">AI 视频生成</h1>
        <p className="text-muted-foreground">暂无可用的视频模型，请在管理后台配置 KLING_API_KEY 或 GOOGLE_API_KEY。</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 md:flex-row">
      {/* 左栏：控制面板 */}
      <div className="shrink-0 overflow-hidden rounded-xl border bg-card md:w-[340px]">
        <VideoControls
          models={models}
          videoModel={videoModel}
          onModelChange={setVideoModel}
          prompt={prompt}
          onPromptChange={setPrompt}
          aspectRatio={aspectRatio}
          onAspectRatioChange={setAspectRatio}
          duration={duration}
          onDurationChange={setDuration}
          imagePreview={imagePreview}
          imageFileName={imageFile?.name ?? null}
          onImageSelect={handleImageSelect}
          onImageRemove={handleImageRemove}
          loading={loading}
          uploading={uploading}
          creditCost={creditCost}
          error={error}
          onGenerate={handleGenerate}
        />
      </div>

      {/* 右栏：发现 / 创建 */}
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border bg-card">
        <VideoDiscoveryPanel
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          onApplyTemplate={setPrompt}
          loading={loading}
          generatedVideo={generatedVideo}
          history={history}
          onSelectHistory={(url) => { setGeneratedVideo(url); setActiveTab('create'); }}
          onDownload={handleDownload}
          onDeleteHistory={handleDeleteHistory}
          onClearHistory={handleClearHistory}
        />
      </div>
    </div>
  );
}
```

> 布局说明：与图片页 `ImageWorkspace` 一致。双栏卡片式（`rounded-xl border bg-card`），位于 dashboard `<main>` 内边距之内。桌面 `md:h-full md:flex-row`，左右栏因 stretch 各自满高、内部独立滚动；移动端无高度约束、`flex-col` 堆叠、整页随 `<main>` 滚动。

- [ ] **Step 2: 替换 `src/app/(dashboard)/video/page.tsx`**

把整个文件内容替换为：

```tsx
import { VideoWorkspace } from '@/components/video/VideoWorkspace';

export default function VideoPage() {
  return <VideoWorkspace />;
}
```

- [ ] **Step 3: 类型检查与 lint**

Run: `npx tsc --noEmit 2>&1 | grep -v validator.ts && npm run lint 2>&1 | grep -A6 "components/video"`
Expected: tsc 无输出；lint 在 `components/video` 处无输出（新文件干净）。

- [ ] **Step 4: Commit**

```bash
git add src/components/video/VideoWorkspace.tsx "src/app/(dashboard)/video/page.tsx"
git commit -m "feat(video): 双栏工作台 VideoWorkspace 并接入 page"
```

---

### Task 6: 构建与手动验证

**Files:** 无（验证任务）

- [ ] **Step 1: 生产构建**

Run: `npm run build`
Expected: 构建成功，路由表含 `/video`，无 TypeScript / ESLint 报错。

- [ ] **Step 2: 启动开发服务器手动验证**

Run: `npm run dev`，浏览器打开 `/video`，逐项核对：

- 桌面（宽屏）：左栏固定约 340px、右栏独立滚动；两栏为卡片式，互不影响。
- 移动端（窄屏 / DevTools 模拟）：上下堆叠，控制面板在上、发现区在下。
- 右栏 `发现 / 创建` 标签可切换；初始在「发现」。
- 「发现」标签：运镜模版 8 分类 tab 切换、卡片网格正常显示。
- 点击模版卡片 → 左栏描述词被填充、停留在「发现」、出现 toast「已填入「…」模板」。
- 文生视频（不传参考图）：仅输入描述词 → 生成按钮可点（**验证不再被 `!imageFile` 锁死**）→ 自动切到「创建」标签 → 显示生成中 Loading。
- 图生视频：上传参考图 → 预览按当前画面比例变形显示 → 可删除 → 生成成功后「创建」标签显示 `<video>` 与下载按钮。
- 时长（5s/10s）、画面比例（16:9/9:16/1:1）切换正常。
- 「创建」标签：最近生成网格、hover 播放/下载/删除、清空、点击历史项回填结果。
- 历史为空且无结果时「创建」标签显示空状态提示。

- [ ] **Step 3: 收尾 commit（如有手动修复）**

若手动验证中发现并修复了问题：

```bash
git add -A
git commit -m "fix(video): 修复双栏布局手动验证发现的问题"
```

若无问题则跳过此步。

---

## 完成标准

- `npm run build` 通过。
- `/video` 桌面双栏、移动端堆叠，交互对齐图片页与 imini 参考。
- 文生视频与图生视频均可用；生成按钮仅要求描述词（图片可选）。
- 模版填充、时长/比例、生成、轮询、历史、下载、删除、清空全部正常。
