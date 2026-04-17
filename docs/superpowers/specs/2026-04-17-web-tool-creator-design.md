# 网页工具生成器 设计文档

**日期：** 2026-04-17  
**状态：** 已确认，待实现

---

## 概述

在创作室（Studio）新增「网页工具」Tab，用户通过自然语言描述 + 可选参考图片 + 预设模板，让 AI 生成一个自包含的单文件 HTML 网页工具，实时预览，一键部署到 GitHub Gist。

---

## UI 布局

### 创作室 Tab 切换

```
[ 图片编辑 ]  [ 网页工具 ]
```

### 网页工具 Tab（左右分栏，桌面端）

```
┌─────────────────────┬──────────────────────────────┐
│   左侧：输入区       │   右侧：预览区                │
│                     │                              │
│  [模板选择 - 6格]    │     iframe                   │
│                     │   (实时渲染生成的 HTML)        │
│  [描述文字输入框]    │                              │
│                     │                              │
│  [上传参考图(可选)]  ├──────────────────────────────┤
│                     │  [部署到 Gist] [查看代码 ▼]   │
│  [模型选择]          │                              │
│                     │  ▼ 代码折叠面板（可展开）      │
│  [生成] [停止]       │                              │
└─────────────────────┴──────────────────────────────┘
```

移动端竖向堆叠：输入区在上，预览区在下。

### 预设模板（6 格）

| 图标 | 名称 | 用途 |
|------|------|------|
| 📐 | 数学可视化 | 函数图像、几何动画、参数调节 |
| 🌊 | 物理模拟 | 粒子、重力、流体动画 |
| 📊 | 数据图表 | 交互式图表（Chart.js） |
| 🎮 | 小游戏 | 键盘/鼠标控制的浏览器小游戏 |
| 🔧 | 实用工具 | 计算器、转换器、生成器 |
| ✨ | 自由发挥 | 无约束，完全由 prompt 决定 |

---

## 数据流

```
用户输入（prompt + template + image? + model）
    ↓
POST /api/ai/web/generate
    ↓ SSE 流式返回 HTML chunks
前端每 300ms 把累积 HTML 写入 iframe srcdoc
    ↓
生成完成 → 激活「部署到 Gist」按钮
    ↓
点击部署 → POST /api/github/gist/deploy
    ↓
返回 { gist_url, preview_url }
    ↓
显示链接 + 「在新标签打开」按钮
```

---

## API 设计

### `POST /api/ai/web/generate`

**入参：**
```ts
{
  prompt: string;
  template: 'math' | 'physics' | 'chart' | 'game' | 'tool' | 'free';
  model: string;           // 从现有模型列表选择
  image_data?: string;     // base64 data URI，可选
}
```

**出参：** `text/event-stream`，每个 event 是一段 HTML 字符串

**行为：**
- 拼接 system prompt（基础 + 模板专属）
- 若模型不支持视觉，忽略 image_data 并在响应头返回 `X-Image-Ignored: true`
- 复用现有积分扣费逻辑

### `POST /api/github/gist/deploy`

**入参：**
```ts
{
  html: string;
  description: string;   // 自动生成，如 "AI 数学可视化 - 抛物线动画"
}
```

**出参：**
```ts
{
  gist_url: string;      // https://gist.github.com/...
  preview_url: string;   // https://htmlpreview.github.io/?https://gist.githubusercontent.com/...
}
```

**行为：**
- 从 `app_config` 读取 `GITHUB_TOKEN`（管理员统一配置）
- 调用 GitHub Gist API 创建 public gist，文件名 `index.html`
- 每次部署都创建新 Gist（不覆盖旧的）
- Token 未配置时返回 503 + 友好提示

---

## AI 提示词设计

### 基础 System Prompt（所有模板通用）

```
你是顶级前端工程师。生成一个完整的单文件 HTML，内嵌所有 CSS 和 JavaScript。
要求：
- 不依赖本地文件，CDN 资源可用
- 视觉精美，有交互性
- 代码简洁，注释清晰
- 只输出 HTML 代码，不要任何解释文字
```

### 各模板追加指令

| 模板 | 追加指令 |
|------|---------|
| 数学可视化 | 用 Canvas 或 SVG 绘制图形；提供参数调节滑块；公式渲染使用 MathJax CDN |
| 物理模拟 | 使用 requestAnimationFrame 实现流畅动画；支持鼠标/触摸交互 |
| 数据图表 | 引入 Chart.js CDN；图表支持点击/悬停交互；配色美观 |
| 小游戏 | 键盘/鼠标控制；有开始、重置按钮；显示分数或状态 |
| 实用工具 | 输入即时反馈；界面清晰直观；有输入校验和错误提示 |
| 自由发挥 | 无额外约束 |

---

## 错误处理

| 场景 | 处理方式 |
|------|---------|
| 生成中途流中断 | toast 提示「生成中断」，保留已生成内容，可重新生成 |
| 模型不支持视觉 | 忽略图片，响应头标记，前端提示「该模型不支持图片，已忽略」 |
| iframe 渲染出错（HTML 不完整） | try/catch 静默忽略，等下一个 chunk 再重试 |
| GITHUB_TOKEN 未配置 | 503 + toast「管理员尚未配置 GitHub Token」 |
| Gist 创建失败 | toast 报错，提示手动复制 HTML 代码 |
| 积分不足 | 同其他 AI 功能，返回 402 + toast |

---

## 新增文件清单

```
src/app/(dashboard)/studio/page.tsx        ← 修改：添加 Tab 切换 + 网页工具 Tab UI
src/app/api/ai/web/generate/route.ts       ← 新增：流式 HTML 生成
src/app/api/github/gist/deploy/route.ts   ← 新增：Gist 部署
```

---

## 不在本期范围内

- 历史记录（已生成的网页列表）
- 在线编辑生成的代码
- 多文件项目（多个 HTML/CSS/JS 分离）
- GitHub Pages 部署
- 分享链接到社区
