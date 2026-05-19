# 视频生成页 imini 风格双栏重设计

> 日期：2026-05-19
> 参考：https://imini.ai/zh/tools/ai-image（图片页同款交互）
> 关联：`docs/superpowers/specs/2026-05-19-image-page-imini-redesign-design.md`

## 背景与目标

当前视频生成页 `src/app/(dashboard)/video/page.tsx` 是单文件 975 行、单列从上到下的布局
（运镜模版 → 生成设置 → 生成结果 → 历史）。

继图片页之后，把视频页改造为与图片页一致的 **imini 式双栏工作台**：左侧固定控制面板 +
右侧可滚动发现区。

成功标准：
- 桌面端双栏（左栏固定、右栏独立滚动），移动端单列堆叠。
- 现有功能（模型选择、参考图上传、时长/比例、模版填充、生成、轮询、历史、下载、删除）全部保留。
- 修复「生成按钮强制要求参考图」与「页面声称支持纯文字生成」的矛盾。

## 布局与外壳

与图片页 `ImageWorkspace` 完全一致的双栏卡片式布局，外层 dashboard `<main>` 不参与滚动。

- **桌面 (`md+`)**：根 `md:h-full md:flex-row`。
  - 左栏 `VideoControls`：固定宽约 `340px`，`md:h-full md:overflow-y-auto` 自身滚动。
  - 右栏 `VideoDiscoveryPanel`：`flex-1`，`md:h-full md:overflow-hidden` + 内部 `flex-1 overflow-y-auto`。
- **移动端 (`< md`)**：根无高度约束、`flex-col` 堆叠，`md:` 高度/滚动类不生效，
  两面板按内容自然高度排列，整页随 `<main>` 滚动。
- 两栏均为卡片式 `rounded-xl border bg-card`，位于 `<main>` 内边距之内。
- 配色使用现有主题 token，应用根布局已是 `<html className="dark">`。

## 组件拆分

新建组件到 `src/components/video/`（当前为空目录），把 975 行单文件拆分：

| 文件 | 职责 | 依赖 |
| --- | --- | --- |
| `VideoWorkspace.tsx` | 顶层 client 组件。持有全部状态，组织双栏布局，处理生成/轮询/历史/上传逻辑。 | `useModels`、`useAuthGate`、下列子组件 |
| `VideoControls.tsx` | 左栏。模型选择、参考图上传、描述词、时长、画面比例、积分、生成按钮。 | `VideoImageUploader`、props 回调 |
| `VideoImageUploader.tsx` | 单张参考图上传/预览/删除。预览按当前画面比例变形显示。 | props：`file`、`previewUrl`、`aspectRatio`、回调 |
| `VideoDiscoveryPanel.tsx` | 右栏。`发现 / 创建` 标签 + 内容渲染。 | `video-templates.ts`、props |
| `video-templates.ts` | 数据常量：`TEMPLATE_CATEGORIES`（8 分类 48 模版）、`ASPECT_RATIOS`、`DURATIONS`、相关类型。 | 无（纯数据） |

`page.tsx` 精简为只渲染 `<VideoWorkspace />`。

状态全部集中在 `VideoWorkspace`，子组件经 props 接收数据与回调，保持单向数据流。
`VideoWorkspace` 持有的状态：`videoModel`、`prompt`、`aspectRatio`、`duration`、
`imageFile`、`imagePreview`、`uploading`、`loading`、`generatedVideo`、`error`、
`history`、`activeTab`（discover/create）、`activeCategory`。

## 右栏「发现 / 创建」标签

`VideoDiscoveryPanel` 顶部为两个标签（与图片页一致）：

- **发现**（默认）：
  - 运镜模版：8 个分类 tab（电影镜头/自然风景/人物动态/动物生灵/魔法特效/城市街景/慢动作/抽象艺术）
    + 卡片网格，沿用现有 `TEMPLATE_CATEGORIES` 数据。
  - 视频无图片页的「AI 工具」「实用写真」板块，发现 tab 只此一块。
- **创建**：
  - 本次生成结果：`<video controls>` 大图展示 + 下载按钮；生成中显示 Loading 卡片
    （沿用现有「AI 正在创作视频，预计 1-3 分钟」样式）。
  - 最近生成：历史网格（沿用现有缩略 `<video muted>`、hover 播放/下载/删除、清空）。

交互：
- 点击生成后自动切到「创建」标签。
- 点击模版卡片：填充左栏描述词，停留在「发现」标签，toast 提示「已填入「…」模板」。
- 点击历史项：把该视频载入「创建」标签的结果区。

## 参考图上传（图生图）

- `VideoImageUploader` 单张上传，沿用现有逻辑：
  - 文件类型限 `image/jpeg|png|webp|gif`，大小 ≤ 10MB。
  - 选择后 `URL.createObjectURL` 本地预览，预览容器按当前 `aspectRatio` 变形
    （16:9 / 9:16 / 1:1）。
  - 生成时先 `POST /api/upload`（FormData）拿到公网 URL，再作为 `image_url` 传给
    generate API。
  - 可删除已选图片。
- **图片改为可选（修复现状矛盾）**：生成按钮 `disabled` 条件改为
  `loading || !prompt.trim()`，去掉 `!imageFile`。无图走文生视频、有图走图生视频。
  保留「不上传图片则使用纯文字生成」提示文字。

## 后端

视频 `POST /api/ai/video/generate` 已支持可选 `image_url`（四类模型 fal/grok/veo/kling
均接受 `imageUrl`，并有 `isSafeImageUrl` SSRF 校验）。本次**无后端改动**，纯前端重构 +
修复按钮 `disabled` 条件。

## 错误处理

- 沿用现有：toast + 左栏内联 `error` 文案。
- 图片上传失败 → 设置 error + toast，中止生成。
- 生成失败/超时/积分不足：行为同现状（失败状态、toast）。
- 轮询沿用现有 `POLL_INTERVAL = 5000`、`MAX_POLL_DURATION = 5 分钟`。

## 取舍点（已与用户确认）

- **图片改为可选**：修复「按钮要求图片」与「提示支持纯文字」的矛盾。
- **不引入社区灵感画廊**：已有 `/community` 页。
- **不做多张参考图**：视频 API 只接受单张 `image_url`。
- 时长（5s/10s）、画面比例（16:9/9:16/1:1）选择器保留在左栏。

## 测试

- 手动验证：
  - 桌面双栏（左栏固定、右栏独立滚动）；移动端单列堆叠。
  - 发现/创建标签切换；生成后自动切到创建。
  - 模版卡片点击填充左栏描述词。
  - 文生视频（无参考图）：仅输入描述词即可生成 —— 验证按钮不再被 `!imageFile` 锁死。
  - 图生视频：上传参考图 → 预览按比例显示 → 生成成功。
  - 时长/比例切换；历史加载、播放、下载、删除、清空。
- 构建：`npm run build` 通过，无 TS / lint 报错。
