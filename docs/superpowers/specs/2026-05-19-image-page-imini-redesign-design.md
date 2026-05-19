# 图片生成页 imini 风格双栏重设计

> 日期：2026-05-19
> 参考：https://imini.ai/zh/tools/ai-image

## 背景与目标

当前图片生成页 `src/app/(dashboard)/image/page.tsx` 是单文件 1004 行、单列从上到下的布局
（AI 工具 → 实用写真 → 创作模版 → 生成设置 → 生成结果 → 历史）。

参考 imini.ai 的 AI 图片工具，将其改造为**双栏工作台**：左侧固定控制面板 + 右侧可滚动发现区，
并新增**参考图上传（图生图）**能力。

成功标准：
- 桌面端呈现 imini 式双栏交互，左栏固定、右栏独立滚动。
- 移动端优雅降级为单列堆叠。
- 用户可上传参考图，配合 Gemini image 类模型做图生图。
- 现有功能（模型选择、模板填充、生成、轮询、历史、下载、删除）全部保留。

## 布局与外壳

沿用 chat 页 `<div className="h-full">` 自管理高度与滚动的做法，外层 `main`（带 `p-4 md:p-6`、
`overflow-auto`）不参与滚动。

- **桌面 (`md+`)**：`flex` 行向。
  - 左栏 `GenerationControls`：固定宽约 `340px`，`overflow-y-auto`，自身滚动。
  - 右栏 `DiscoveryPanel`：`flex-1`，`overflow-y-auto`，独立滚动。
- **移动端 (`< md`)**：`flex-col` 堆叠 —— 控制面板在上、发现区在下，整体随页面滚动。左栏不固定。
- 配色使用现有主题 token（`bg-card` / `border` / `text-muted-foreground` / `bg-background` 等）。
  应用根布局已是 `<html className="dark">`，深色风格与 imini 天然一致，无需改主题。

## 组件拆分

新建目录 `src/components/image/`，把 1004 行单文件拆分为聚焦组件：

| 文件 | 职责 | 依赖 |
| --- | --- | --- |
| `ImageWorkspace.tsx` | 顶层 client 组件。持有全部状态，组织双栏布局，处理生成/轮询/历史逻辑。 | `useModels`、`useAuthGate`、下列子组件 |
| `GenerationControls.tsx` | 左栏。模型选择、参考图上传、描述词、比例、生成按钮、积分展示。 | `ReferenceUploader`、props 回调 |
| `ReferenceUploader.tsx` | 参考图上传/拖拽/粘贴区。缩略图预览、删除。 | props：`images`、`onChange` |
| `DiscoveryPanel.tsx` | 右栏。`发现 / 创建` 标签 + 内容渲染。 | `templates.ts`、props |
| `templates.ts` | 数据常量：`TEMPLATE_CATEGORIES`、AI 工具、实用写真。 | 无（纯数据） |

`page.tsx` 精简为只渲染 `<ImageWorkspace />`。

状态全部集中在 `ImageWorkspace`，子组件通过 props 接收数据与回调，保持单向数据流。
`ImageWorkspace` 持有的状态：`prompt`、`imageModel`、`aspectRatio`、`referenceImages`、
`loading`、`generatedImage`、`error`、`history`、`activeTab`（发现/创建）、`activeCategory`。

## 右栏「发现 / 创建」标签

`DiscoveryPanel` 顶部为两个标签（参考 imini 的 `发现 / 创建`）：

- **发现**（默认）：
  - AI 工具卡片行（扩图/移除物体/移除背景/高清放大，沿用现有 `soon` 标记逻辑）。
  - 实用写真卡片（证件照、结婚照……，点击填充左栏 prompt + 比例）。
  - 创作模版（分类 tab + 卡片网格，沿用现有 `TEMPLATE_CATEGORIES`）。
  - 即现有三个板块按 imini 卡片密度重新排版。
- **创建**：
  - 本次生成结果：大图展示 + 下载按钮；生成中显示骨架/Loading 卡片。
  - 最近生成：历史网格（沿用现有缩略图网格、hover 下载/删除、清空）。

交互：
- 点击生成后自动切到「创建」标签，新结果置顶。
- 点击模板/写真卡片：填充左栏参数，停留在「发现」标签，用 toast 提示「已填入模板」。
  （左栏始终可见，无需滚动跳转。）
- **不**引入社区灵感画廊 —— 已有独立 `/community` 页，避免重复。

## 参考图上传 / 图生图

### 前端
- `ReferenceUploader` 支持点击选择、拖拽、粘贴；最多 3 张；单张 ≤ 5MB；
  类型限 `image/jpeg|png|webp`。
- 读为 base64 data URI，存入 `ImageWorkspace` 的 `referenceImages: string[]`。
- 当 `referenceImages.length > 0` 时，左栏模型列表只保留 Gemini image 类模型
  （`gemini-2.5-flash-image`、`gemini-3-pro-image`、`gemini-3.1-flash-image`），
  其余（Imagen-4、Flux、Grok）置灰并给提示「该模型不支持参考图」。
  若当前选中模型不支持，自动切到第一个支持的模型。
- 无参考图时所有模型可用，行为同现状。

### 后端
- `POST /api/ai/image/generate` 请求体新增可选字段 `reference_images?: string[]`
  （base64 data URI 数组，服务端校验 ≤ 3 张）。
- 若 `reference_images` 非空：
  - 模型必须是 Gemini image 类（`generateWithGeminiContent` 路径），否则返回 400
    `{ error: '该模型不支持参考图' }`。
  - 调用 `generateGeminiImage(prompt, model, images)` —— 新增第三个可选参数。
- `generateGeminiImage` / `generateWithGeminiContent` 增加可选 `images?: string[]` 参数：
  把每张图拆成 `data:` 前缀与 base64，构造 `inlineData` part，与文本 prompt 一起作为
  `contents` 的 parts 数组传给 `ai.models.generateContent`。
- Imagen 路径（`generateWithImagen`）不支持图片输入，收到参考图时由上层 400 拦截，不进入。
- 参考图以 base64 内联传给 Gemini，不落 Supabase Storage。

## 错误处理

- 沿用现有：toast + 左栏内联 `error` 文案。
- 参考图相关：上传超限/类型错误 → toast；选中不支持参考图的模型 → 前端拦截，理论上不会发请求；
  后端兜底 400。
- 生成失败/超时/积分不足：行为同现状（退款、失败状态、toast）。

## 取舍点（已与用户确认）

- **不做多张生成**：imini 有「张数」选择器，但多图需要多任务/多次扣积分/多路轮询，
  属较大后端改动。v1 固定单张，不放该选择器，后续再议。
- **不引入社区灵感画廊**：已有 `/community` 页。
- 比例选择器保留，沿用现有 `NO_ASPECT_RATIO_MODELS` 逻辑（Gemini image / Imagen 不显示比例）。

## 测试

- 手动验证：
  - 桌面双栏：左栏固定、右栏独立滚动；移动端单列堆叠。
  - 发现/创建标签切换；生成后自动切到创建并置顶。
  - 模板/写真卡片点击填充左栏参数。
  - 文生图（无参考图）所有模型可用，行为同现状。
  - 上传参考图 → 模型列表收敛到 Gemini image 类 → 图生图成功返回结果。
  - 参考图 + 不支持模型 → 前端拦截 + 后端 400 兜底。
  - 历史加载、下载、删除、清空。
- 构建：`npm run build` 通过，无 TS / lint 报错。
