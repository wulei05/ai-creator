# 图片生成页 imini 风格双栏重设计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把图片生成页从单列布局重设计为 imini.ai 式双栏工作台（左栏固定控制面板 + 右栏可滚动发现区），并新增参考图上传（图生图）。

**Architecture:** 把 1004 行的 `src/app/(dashboard)/image/page.tsx` 拆分到 `src/components/image/`：数据常量进 `templates.ts`，UI 拆为 `ReferenceUploader` / `GenerationControls`（左栏）/ `DiscoveryPanel`（右栏），由 `ImageWorkspace` 顶层组件持有全部状态并组织双栏布局。后端 `generate` 路由与 `gemini-image` 库新增可选参考图输入，仅 Gemini image 类模型支持。

**Tech Stack:** Next.js App Router、React client components、TypeScript、Tailwind v4、shadcn UI、lucide-react、sonner、`@google/genai`。

**验证说明:** 本仓库无单元测试框架（`package.json` 仅有 `dev/build/start/lint`）。每个任务的验证用 `npx tsc --noEmit`（类型检查）与 `npm run lint`；最后一个任务跑 `npm run build` 并做手动浏览器验证。

**参考源:** 现有页面 `src/app/(dashboard)/image/page.tsx`（下文按行号引用其中可原样复用的代码块）。设计文档：`docs/superpowers/specs/2026-05-19-image-page-imini-redesign-design.md`。

---

### Task 1: 抽出数据常量到 `templates.ts`

**Files:**
- Create: `src/components/image/templates.ts`

把现有 `page.tsx` 中的纯数据常量与类型集中到一个 client-safe 的数据文件（无服务端依赖）。

- [ ] **Step 1: 创建 `src/components/image/templates.ts`**

文件内容：

```ts
import type { LucideIcon } from 'lucide-react';
import { Expand, Eraser, Scissors, ZoomIn } from 'lucide-react';

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3';

export interface TaskRecord {
  id: string;
  prompt: string;
  status: string;
  output_url: string | null;
  created_at: string;
}

export interface Template {
  title: string;
  prompt: string;
  gradient: string;
  emoji: string;
  imageUrl?: string;
}

export interface TemplateCategory {
  id: string;
  label: string;
  emoji: string;
  templates: Template[];
}

export interface PhotoTool {
  title: string;
  desc: string;
  prompt: string;
  imageUrl: string;
  aspect: string;
  emoji: string;
}

export interface AiTool {
  icon: LucideIcon;
  label: string;
  desc: string;
  gradient: string;
  soon: boolean;
}

export const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: '1:1', label: '1:1' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '4:3', label: '4:3' },
];

// 不显示宽高比选择器的模型（Imagen / Gemini image 类）
export const NO_ASPECT_RATIO_MODELS = [
  'imagen-4', 'imagen-4-ultra', 'imagen-4-fast',
  'gemini-2.5-flash-image', 'gemini-3-pro-image', 'gemini-3.1-flash-image',
];

// 支持参考图上传（图生图）的模型 —— Gemini content image 类
export const REFERENCE_IMAGE_MODELS = [
  'gemini-2.5-flash-image', 'gemini-3-pro-image', 'gemini-3.1-flash-image',
];

export const AI_TOOLS: AiTool[] = [
  { icon: Expand,   label: '扩图',    desc: '智能延伸画面边界',  gradient: 'from-blue-500 to-cyan-400',    soon: false },
  { icon: Eraser,   label: '移除物体', desc: '一键抹去多余元素',  gradient: 'from-violet-500 to-purple-400', soon: true  },
  { icon: Scissors, label: '移除背景', desc: '自动抠图留主体',    gradient: 'from-rose-500 to-pink-400',    soon: true  },
  { icon: ZoomIn,   label: '高清放大', desc: 'AI 超分辨率增强',  gradient: 'from-amber-500 to-orange-400', soon: true  },
];

export const PHOTO_TOOLS: PhotoTool[] = [
  // 原样复制 page.tsx 第 657-720 行 8 个对象（证件照 … 旅行纪念），
  // 字段名一致：title, desc, prompt, imageUrl, aspect, emoji
];

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  // 原样复制 page.tsx 第 37-430 行的 TEMPLATE_CATEGORIES 数组内容
];

export const TOTAL_TEMPLATE_COUNT = TEMPLATE_CATEGORIES.reduce(
  (s, c) => s + c.templates.length, 0,
);
```

`PHOTO_TOOLS` 与 `TEMPLATE_CATEGORIES` 的数组内容从现有 `page.tsx` 原样复制：
- `TEMPLATE_CATEGORIES`：复制 `page.tsx:37-430` 的数组字面量（即 `const TEMPLATE_CATEGORIES: TemplateCategory[] = [ ... ];` 的 `[ ... ]` 部分）。
- `PHOTO_TOOLS`：复制 `page.tsx:657-720` 内 `.map()` 渲染的那 8 个对象字面量（`{ title: '证件照', ... }` … `{ title: '旅行纪念', ... }`）。

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit`
Expected: 通过，无报错。

- [ ] **Step 3: Commit**

```bash
git add src/components/image/templates.ts
git commit -m "refactor(image): 抽出图片页数据常量到 templates.ts"
```

---

### Task 2: 后端 —— `gemini-image` 库支持参考图输入

**Files:**
- Modify: `src/lib/ai/gemini-image.ts`

让 `generateGeminiImage` 接受可选的 base64 data URI 图片数组，并在 `generateContent` 路径把图片作为 `inlineData` part 传入。Imagen 路径不支持图片。

- [ ] **Step 1: 新增 `isGeminiContentImageModel` 导出**

在 `src/lib/ai/gemini-image.ts` 的 `IMAGEN_MODELS` 常量定义之后，新增：

```ts
// content（generateContent）路径的 Gemini image 模型 —— 支持图片输入
export function isGeminiContentImageModel(id: string): id is GeminiImageModelId {
  return isGeminiImageModel(id) && !IMAGEN_MODELS.includes(id as GeminiImageModelId);
}

// 把 base64 data URI 解析为 { mimeType, data }
function parseDataUri(dataUri: string): { mimeType: string; data: string } {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUri);
  if (!match) throw new Error('Invalid image data URI');
  return { mimeType: match[1], data: match[2] };
}
```

- [ ] **Step 2: 给 `generateGeminiImage` 增加 `images` 参数**

把 `generateGeminiImage` 函数签名与函数体改为：

```ts
export async function generateGeminiImage(
  prompt: string,
  modelId: GeminiImageModelId = 'imagen-4',
  images: string[] = [],
): Promise<string> {
  const apiKey = await getConfig('GOOGLE_API_KEY');
  const modelName = GEMINI_IMAGE_MODELS[modelId];

  if (IMAGEN_MODELS.includes(modelId)) {
    if (images.length > 0) {
      throw new Error('该模型不支持参考图，请改用 Gemini image 模型');
    }
    return generateWithImagen(prompt, modelName, apiKey);
  }
  return generateWithGeminiContent(prompt, modelName, apiKey, images);
}
```

- [ ] **Step 3: 让 `generateWithGeminiContent` 接受图片**

把 `generateWithGeminiContent` 函数改为：

```ts
async function generateWithGeminiContent(
  prompt: string,
  model: string,
  apiKey: string,
  images: string[] = [],
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  const parts: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = images.map((uri) => ({ inlineData: parseDataUri(uri) }));
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts }],
    config: {
      responseModalities: ['IMAGE'],
    },
  });

  const respParts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of respParts) {
    if (part.inlineData?.mimeType?.startsWith('image/') && part.inlineData?.data) {
      return part.inlineData.data as string;
    }
  }
  throw new Error('Gemini did not return an image');
}
```

- [ ] **Step 4: 类型检查**

Run: `npx tsc --noEmit`
Expected: 通过，无报错。

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/gemini-image.ts
git commit -m "feat(image): gemini-image 支持参考图输入"
```

---

### Task 3: 后端 —— `generate` 路由接受 `reference_images`

**Files:**
- Modify: `src/app/api/ai/image/generate/route.ts`

`generate` 路由新增可选 `reference_images` 字段：非空时模型必须是 Gemini content image 类，否则 400；并把图片透传给 `generateGeminiImage`。

- [ ] **Step 1: 引入新工具函数**

把 import 行
```ts
import { generateGeminiImage, isGeminiImageModel } from '@/lib/ai/gemini-image';
```
改为：
```ts
import { generateGeminiImage, isGeminiImageModel, isGeminiContentImageModel } from '@/lib/ai/gemini-image';
```

- [ ] **Step 2: 解析与校验 `reference_images`**

把请求体类型与解构（现 `route.ts:46-52`）改为：

```ts
  let body: { prompt?: string; aspect_ratio?: string; model?: string; reference_images?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { prompt, aspect_ratio = '1:1', model = 'flux-pro', reference_images = [] } = body;
```

在 `VALID_MODELS.includes(...)` 校验块之后、`const imageModel = model as ImageModel;` 之前，新增参考图校验：

```ts
  if (!Array.isArray(reference_images)) {
    return NextResponse.json({ error: 'reference_images must be an array' }, { status: 400 });
  }
  if (reference_images.length > 3) {
    return NextResponse.json({ error: '最多上传 3 张参考图' }, { status: 400 });
  }
  if (reference_images.length > 0 && !isGeminiContentImageModel(model)) {
    return NextResponse.json({ error: '该模型不支持参考图' }, { status: 400 });
  }
```

- [ ] **Step 3: 把参考图透传给 Gemini 生成**

在 Gemini 同步生成分支里，把
```ts
      const base64Data = await generateGeminiImage(prompt.trim(), imageModel);
```
改为：
```ts
      const base64Data = await generateGeminiImage(prompt.trim(), imageModel, reference_images);
```

- [ ] **Step 4: 类型检查**

Run: `npx tsc --noEmit`
Expected: 通过，无报错。

- [ ] **Step 5: Commit**

```bash
git add src/app/api/ai/image/generate/route.ts
git commit -m "feat(image): generate 路由支持 reference_images"
```

---

### Task 4: `ReferenceUploader` 组件

**Files:**
- Create: `src/components/image/ReferenceUploader.tsx`

参考图上传区：点击选择、拖拽、缩略图预览、删除。读文件为 base64 data URI。

- [ ] **Step 1: 创建 `src/components/image/ReferenceUploader.tsx`**

```tsx
'use client';

import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';

interface ReferenceUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  disabled?: boolean;
  max?: number;
}

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

function readAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsDataURL(file);
  });
}

export function ReferenceUploader({ images, onChange, disabled, max = 3 }: ReferenceUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    const room = max - images.length;
    if (room <= 0) { toast.error(`最多上传 ${max} 张参考图`); return; }
    const accepted: string[] = [];
    for (const file of list.slice(0, room)) {
      if (!ALLOWED.includes(file.type)) { toast.error(`不支持的文件类型：${file.name}`); continue; }
      if (file.size > MAX_SIZE) { toast.error(`图片过大（上限 5MB）：${file.name}`); continue; }
      try { accepted.push(await readAsDataUri(file)); }
      catch { toast.error(`读取失败：${file.name}`); }
    }
    if (accepted.length > 0) onChange([...images, ...accepted]);
  };

  const removeAt = (idx: number) => onChange(images.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        参考图（选填，最多 {max} 张）
      </label>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((src, idx) => (
            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`参考图 ${idx + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(idx)}
                disabled={disabled}
                className="absolute top-1 right-1 rounded-full bg-black/60 hover:bg-red-600 p-1 transition-colors"
              >
                <X className="size-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length < max && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
          }}
          className={`flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed py-6 text-muted-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            dragOver ? 'border-primary bg-primary/5' : 'hover:border-primary/50 hover:bg-muted/40'
          }`}
        >
          <ImagePlus className="size-5" />
          <span className="text-xs">点击或拖拽上传图片</span>
          <span className="text-[10px]">JPG / PNG / WEBP，单张 ≤ 5MB</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED.join(',')}
        multiple
        hidden
        onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ''; }}
      />
    </div>
  );
}
```

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit`
Expected: 通过，无报错。

- [ ] **Step 3: Commit**

```bash
git add src/components/image/ReferenceUploader.tsx
git commit -m "feat(image): 参考图上传组件 ReferenceUploader"
```

---

### Task 5: `GenerationControls` 左栏组件

**Files:**
- Create: `src/components/image/GenerationControls.tsx`

左栏控制面板：模型选择、参考图上传、描述词、宽高比、生成按钮。纯受控组件，所有状态经 props。

- [ ] **Step 1: 创建 `src/components/image/GenerationControls.tsx`**

```tsx
'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles } from 'lucide-react';
import type { ModelInfo } from '@/lib/hooks/useModels';
import { ReferenceUploader } from './ReferenceUploader';
import {
  ASPECT_RATIOS, NO_ASPECT_RATIO_MODELS, REFERENCE_IMAGE_MODELS,
  type AspectRatio,
} from './templates';

interface GenerationControlsProps {
  models: ModelInfo[];
  imageModel: string;
  onModelChange: (id: string) => void;
  prompt: string;
  onPromptChange: (v: string) => void;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (r: AspectRatio) => void;
  referenceImages: string[];
  onReferenceImagesChange: (imgs: string[]) => void;
  loading: boolean;
  creditCost: number;
  error: string | null;
  onGenerate: () => void;
}

export function GenerationControls({
  models, imageModel, onModelChange,
  prompt, onPromptChange,
  aspectRatio, onAspectRatioChange,
  referenceImages, onReferenceImagesChange,
  loading, creditCost, error, onGenerate,
}: GenerationControlsProps) {
  const hasRefs = referenceImages.length > 0;

  return (
    <div className="flex flex-col gap-4 p-4 md:h-full md:overflow-y-auto">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="size-4 text-primary" />
        图片生成
      </h2>

      {/* 模型选择 */}
      {models.length > 1 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">模型</label>
          <div className="grid grid-cols-2 gap-2">
            {models.map((m) => {
              const unsupported = hasRefs && !REFERENCE_IMAGE_MODELS.includes(m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => !unsupported && onModelChange(m.id)}
                  disabled={loading || unsupported}
                  title={unsupported ? '该模型不支持参考图' : undefined}
                  className={`rounded-lg border p-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    imageModel === m.id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <div className="text-xs font-medium">{m.label}</div>
                  <div className="text-xs text-muted-foreground">{m.credits} 积分</div>
                </button>
              );
            })}
          </div>
          {hasRefs && (
            <p className="text-[11px] text-muted-foreground">已上传参考图，仅 Gemini image 类模型可用。</p>
          )}
        </div>
      )}

      {/* 参考图上传 */}
      <ReferenceUploader
        images={referenceImages}
        onChange={onReferenceImagesChange}
        disabled={loading}
      />

      {/* 描述词 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">描述词 Prompt</label>
          <span className="text-xs text-muted-foreground">{prompt.length}/1000</span>
        </div>
        <Textarea
          placeholder="描述你想要生成的图像，例如：a serene mountain lake at sunset, photorealistic, 8k..."
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value.slice(0, 1000))}
          rows={5}
          disabled={loading}
          className="resize-none text-sm"
        />
      </div>

      {/* 宽高比 */}
      {!NO_ASPECT_RATIO_MODELS.includes(imageModel) && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">宽高比</label>
          <div className="flex flex-wrap gap-2">
            {ASPECT_RATIOS.map((ratio) => (
              <Button
                key={ratio.value}
                variant={aspectRatio === ratio.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => onAspectRatioChange(ratio.value)}
                disabled={loading}
                className="min-w-14 text-xs"
              >
                {ratio.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 生成按钮 */}
      <div className="mt-auto space-y-2 pt-2">
        <Button onClick={onGenerate} disabled={loading || !prompt.trim()} className="w-full" size="lg">
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />正在生成图像，请稍候...</>
          ) : (
            <><Sparkles className="mr-2 h-4 w-4" />生成图像 · {creditCost} 积分</>
          )}
        </Button>
        {error && (
          <p className="rounded-lg bg-destructive/5 px-3 py-2 text-center text-sm text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit`
Expected: 通过，无报错。

- [ ] **Step 3: Commit**

```bash
git add src/components/image/GenerationControls.tsx
git commit -m "feat(image): 左栏控制面板 GenerationControls"
```

---

### Task 6: `DiscoveryPanel` 右栏组件

**Files:**
- Create: `src/components/image/DiscoveryPanel.tsx`

右栏：`发现 / 创建` 标签。发现 = AI 工具 + 实用写真 + 创作模版；创建 = 生成结果 + 最近生成。

- [ ] **Step 1: 创建 `src/components/image/DiscoveryPanel.tsx`**

```tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Compass, Download, Loader2, Sparkles, Wand2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  AI_TOOLS, PHOTO_TOOLS, TEMPLATE_CATEGORIES, TOTAL_TEMPLATE_COUNT,
  type AspectRatio, type TaskRecord,
} from './templates';

interface DiscoveryPanelProps {
  activeTab: 'discover' | 'create';
  onTabChange: (t: 'discover' | 'create') => void;
  activeCategory: string;
  onCategoryChange: (id: string) => void;
  onApplyTemplate: (prompt: string, aspect?: AspectRatio) => void;
  loading: boolean;
  generatedImage: string | null;
  history: TaskRecord[];
  onSelectHistory: (url: string) => void;
  onDownload: (url: string) => void;
  onDeleteHistory: (id: string) => void;
  onClearHistory: () => void;
}

export function DiscoveryPanel({
  activeTab, onTabChange,
  activeCategory, onCategoryChange,
  onApplyTemplate,
  loading, generatedImage, history,
  onSelectHistory, onDownload, onDeleteHistory, onClearHistory,
}: DiscoveryPanelProps) {
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
          <div className="space-y-8">
            {/* AI 工具 */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <h2 className="text-sm font-semibold">AI 工具</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {AI_TOOLS.map(({ icon: Icon, label, desc, gradient, soon }) => (
                  <button
                    key={label}
                    disabled={soon}
                    onClick={() => !soon && toast.info(`${label} 功能即将上线`)}
                    className="group relative overflow-hidden rounded-xl border bg-card text-left transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <div className={`flex h-20 w-full items-center justify-center bg-gradient-to-br ${gradient}`}>
                      <Icon className="size-8 text-white drop-shadow" />
                    </div>
                    <div className="p-2.5">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold">{label}</p>
                        {soon && (
                          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">即将上线</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* 实用写真 */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Wand2 className="size-4 text-primary" />
                <h2 className="text-sm font-semibold">实用写真</h2>
                <span className="text-xs text-muted-foreground">点击自动填充生成参数</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {PHOTO_TOOLS.map(({ title, desc, prompt, imageUrl, aspect, emoji }) => (
                  <button
                    key={title}
                    onClick={() => {
                      const ar = aspect === '3:4' ? '9:16' : aspect === '4:3' ? '16:9' : aspect;
                      onApplyTemplate(prompt, ar as AspectRatio);
                      toast.success(`已填充「${title}」参数`);
                    }}
                    className="group relative overflow-hidden rounded-xl border bg-card text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt={title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      <span className="absolute bottom-2 left-2 text-xs font-semibold text-white drop-shadow">{title}</span>
                      <span className="absolute top-2 right-2 text-lg drop-shadow">{emoji}</span>
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* 创作模版 */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Wand2 className="size-4 text-primary" />
                <h2 className="text-sm font-semibold">创作模版</h2>
                <Badge variant="secondary" className="text-xs">{TOTAL_TEMPLATE_COUNT} 个模版</Badge>
              </div>
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
                    <div className={`relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br ${template.gradient}`}>
                      {template.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={template.imageUrl}
                          alt={template.title}
                          className="absolute inset-0 h-full w-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/10" />
                      <span className="absolute top-2 right-2 text-lg drop-shadow">{template.emoji}</span>
                    </div>
                    <div className="rounded-b-xl border border-t-0 bg-card p-2">
                      <p className="truncate text-xs font-medium">{template.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 生成结果 */}
            {(loading || generatedImage) && (
              <section className="space-y-3 rounded-xl border bg-card p-5">
                <h2 className="text-sm font-semibold">生成结果</h2>
                {loading && !generatedImage && (
                  <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
                    <div className="relative">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <Sparkles className="absolute -top-1 -right-1 h-4 w-4 animate-pulse text-primary" />
                    </div>
                    <p className="text-sm">AI 正在创作中，请稍候...</p>
                  </div>
                )}
                {generatedImage && (
                  <div className="space-y-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={generatedImage} alt="Generated" className="max-h-[600px] w-full rounded-lg object-contain" />
                    <Button variant="outline" size="sm" onClick={() => onDownload(generatedImage)} className="w-full">
                      <Download className="mr-2 h-4 w-4" />下载图像
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
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="group relative cursor-pointer"
                      onClick={() => item.output_url && onSelectHistory(item.output_url)}
                    >
                      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                        {item.output_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.output_url}
                            alt={item.prompt}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            {item.status === 'failed'
                              ? <span className="text-xs text-destructive">失败</span>
                              : <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                          {item.output_url && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onDownload(item.output_url!); }}
                              className="rounded-full bg-white/20 p-1.5 transition-colors hover:bg-white/30"
                            >
                              <Download className="size-3.5 text-white" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteHistory(item.id); }}
                            className="rounded-full bg-white/20 p-1.5 transition-colors hover:bg-red-600"
                            title="删除"
                          >
                            <X className="size-3.5 text-white" />
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 line-clamp-1 px-0.5 text-xs text-muted-foreground">{item.prompt}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              !loading && !generatedImage && (
                <div className="flex flex-col items-center justify-center gap-2 py-24 text-muted-foreground">
                  <Sparkles className="size-8" />
                  <p className="text-sm">还没有作品，去左侧输入描述词生成第一张吧</p>
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

Run: `npx tsc --noEmit`
Expected: 通过，无报错。

- [ ] **Step 3: Commit**

```bash
git add src/components/image/DiscoveryPanel.tsx
git commit -m "feat(image): 右栏发现/创建面板 DiscoveryPanel"
```

---

### Task 7: `ImageWorkspace` 顶层组件 + 替换 `page.tsx`

**Files:**
- Create: `src/components/image/ImageWorkspace.tsx`
- Modify: `src/app/(dashboard)/image/page.tsx`

`ImageWorkspace` 持有全部状态与业务逻辑（生成、轮询、历史、下载），组织双栏布局。

- [ ] **Step 1: 创建 `src/components/image/ImageWorkspace.tsx`**

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useModels } from '@/lib/hooks/useModels';
import { useAuthGate } from '@/lib/auth-gate';
import { GenerationControls } from './GenerationControls';
import { DiscoveryPanel } from './DiscoveryPanel';
import {
  TEMPLATE_CATEGORIES, REFERENCE_IMAGE_MODELS,
  type AspectRatio, type TaskRecord,
} from './templates';

const POLL_INTERVAL = 3000;
const MAX_POLL_DURATION = 3 * 60 * 1000;

export function ImageWorkspace() {
  const { models, loading: modelsLoading } = useModels('image');
  const { require } = useAuthGate();

  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [imageModel, setImageModel] = useState('');
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<TaskRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'discover' | 'create'>('discover');
  const [activeCategory, setActiveCategory] = useState(TEMPLATE_CATEGORIES[0].id);

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollStartRef = useRef<number>(0);

  // 默认选中第一个模型
  useEffect(() => {
    if (models.length > 0 && !models.find((m) => m.id === imageModel)) {
      setImageModel(models[0].id);
    }
  }, [models, imageModel]);

  // 上传参考图后，若当前模型不支持，自动切到第一个支持的模型
  useEffect(() => {
    if (referenceImages.length > 0 && !REFERENCE_IMAGE_MODELS.includes(imageModel)) {
      const supported = models.find((m) => REFERENCE_IMAGE_MODELS.includes(m.id));
      if (supported) setImageModel(supported.id);
    }
  }, [referenceImages, imageModel, models]);

  const currentModel = models.find((m) => m.id === imageModel);
  const creditCost = currentModel?.credits ?? 0;

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/ai/image/history');
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

  const pollStatus = async (taskId: string) => {
    if (Date.now() - pollStartRef.current > MAX_POLL_DURATION) {
      setLoading(false);
      setError('Generation timed out. Please try again.');
      return;
    }
    try {
      const res = await fetch(`/api/ai/image/status/${taskId}`);
      if (!res.ok) { setLoading(false); setError('Failed to check generation status.'); return; }
      const data = await res.json();
      if (data.status === 'completed') {
        setLoading(false);
        if (data.output_urls?.[0]) setGeneratedImage(data.output_urls[0]);
        fetchHistory();
        return;
      }
      if (data.status === 'failed') {
        setLoading(false);
        setError(data.error ?? 'Image generation failed.');
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
    setGeneratedImage(null);
    setActiveTab('create');
    try {
      const res = await fetch('/api/ai/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspect_ratio: aspectRatio,
          model: imageModel,
          reference_images: referenceImages,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoading(false);
        setError(data.error ?? 'Failed to start generation');
        toast.error(data.error === 'Insufficient credits' ? '积分不足，请购买积分' : (data.error ?? 'Failed to start generation'));
        return;
      }
      if (data.status === 'completed' && data.output_url) {
        setLoading(false);
        setGeneratedImage(data.output_url);
        fetchHistory();
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
      a.download = `ai-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  const handleApplyTemplate = (tplPrompt: string, aspect?: AspectRatio) => {
    setPrompt(tplPrompt);
    if (aspect) setAspectRatio(aspect);
  };

  const handleDeleteHistory = async (id: string) => {
    await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
    setHistory((prev) => prev.filter((h) => h.id !== id));
    toast.success('已删除');
  };

  const handleClearHistory = async () => {
    if (!confirm('确认清空全部图像记录？')) return;
    await fetch('/api/tasks?type=image', { method: 'DELETE' });
    setHistory([]);
    toast.success('已清空');
  };

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
        <h1 className="mb-2 text-2xl font-semibold">AI 图像生成</h1>
        <p className="text-muted-foreground">暂无可用的图像模型，请在管理后台配置 FAL_KEY 或 GOOGLE_API_KEY。</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:h-full md:flex-row">
      {/* 左栏：控制面板 */}
      <div className="shrink-0 overflow-hidden rounded-xl border bg-card md:w-[340px]">
        <GenerationControls
          models={models}
          imageModel={imageModel}
          onModelChange={setImageModel}
          prompt={prompt}
          onPromptChange={setPrompt}
          aspectRatio={aspectRatio}
          onAspectRatioChange={setAspectRatio}
          referenceImages={referenceImages}
          onReferenceImagesChange={setReferenceImages}
          loading={loading}
          creditCost={creditCost}
          error={error}
          onGenerate={handleGenerate}
        />
      </div>

      {/* 右栏：发现 / 创建 */}
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border bg-card">
        <DiscoveryPanel
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          onApplyTemplate={handleApplyTemplate}
          loading={loading}
          generatedImage={generatedImage}
          history={history}
          onSelectHistory={(url) => { setGeneratedImage(url); setActiveTab('create'); }}
          onDownload={handleDownload}
          onDeleteHistory={handleDeleteHistory}
          onClearHistory={handleClearHistory}
        />
      </div>
    </div>
  );
}
```

> 布局说明：双栏为卡片式（`rounded-xl border bg-card`），位于 dashboard `<main>` 的内边距之内，风格与其他页一致。
> - **桌面 (`md+`)**：根 `md:h-full md:flex-row` —— 撑满 `<main>` 内容高度。左右栏 wrapper 因 `align-items: stretch` 各自获得满高；`GenerationControls`（`md:h-full md:overflow-y-auto`）与 `DiscoveryPanel`（`md:h-full md:overflow-hidden` + 内部 `flex-1 overflow-y-auto`）各自独立滚动。
> - **移动端 (`< md`)**：根无高度约束、`flex-col` 堆叠；`md:` 前缀的高度/滚动类不生效，两个面板按内容自然高度排列，整页随 `<main>` 的 `overflow-auto` 滚动。

- [ ] **Step 2: 替换 `src/app/(dashboard)/image/page.tsx`**

把整个文件内容替换为：

```tsx
import { ImageWorkspace } from '@/components/image/ImageWorkspace';

export default function ImagePage() {
  return <ImageWorkspace />;
}
```

- [ ] **Step 3: 类型检查与 lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: 均通过，无报错。

- [ ] **Step 4: Commit**

```bash
git add src/components/image/ImageWorkspace.tsx "src/app/(dashboard)/image/page.tsx"
git commit -m "feat(image): 双栏工作台 ImageWorkspace 并接入 page"
```

---

### Task 8: 构建与手动验证

**Files:** 无（验证任务）

- [ ] **Step 1: 生产构建**

Run: `npm run build`
Expected: 构建成功，无 TypeScript / ESLint 报错。

- [ ] **Step 2: 启动开发服务器手动验证**

Run: `npm run dev`，浏览器打开 `/image`，逐项核对：

- 桌面（宽屏）：左栏固定约 340px、右栏独立滚动；两栏为卡片式（圆角描边），各自内部滚动互不影响。
- 移动端（窄屏 / DevTools 模拟）：上下堆叠，控制面板在上、发现区在下。
- 右栏 `发现 / 创建` 标签可切换；初始在「发现」。
- 「发现」标签：AI 工具卡片行、实用写真、创作模版（分类 tab 切换、卡片网格）正常显示。
- 点击模板卡片 → 左栏描述词被填充、停留在「发现」、出现 toast「已填入「…」模板」。
- 点击实用写真卡片 → 左栏描述词与宽高比被填充、toast「已填充「…」参数」。
- 文生图（不传参考图）：选任一模型输入描述词 → 生成 → 自动切到「创建」标签 → 显示结果大图与下载按钮。
- 上传参考图：左栏出现缩略图；模型列表中非 Gemini image 类被置灰；若当前模型不支持则自动切换；用 Gemini image 模型生成成功返回结果。
- 「创建」标签：最近生成网格、hover 下载/删除、清空、点击历史项回填结果。
- 历史为空且无结果时「创建」标签显示空状态提示。

- [ ] **Step 3: 收尾 commit（如有手动修复）**

若手动验证中发现并修复了问题：

```bash
git add -A
git commit -m "fix(image): 修复双栏布局手动验证发现的问题"
```

若无问题则跳过此步。

---

## 完成标准

- `npm run build` 通过。
- `/image` 桌面双栏、移动端堆叠，交互对齐 imini 参考。
- 文生图与参考图图生图均可用，参考图仅 Gemini image 类模型生效。
- 模板/写真填充、生成、轮询、历史、下载、删除、清空全部正常。
