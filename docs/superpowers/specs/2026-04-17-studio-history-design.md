# 创作室历史记录 设计文档

**日期：** 2026-04-17  
**状态：** 已确认，待实现

---

## 概述

为创作室（图片编辑 + 网页工具两个 Tab）添加历史记录功能：
- **草稿恢复**：localStorage 本地保存，页面重新打开后自动提示恢复
- **历史列表**：Supabase 云端同步，支持跨设备浏览和恢复任意历史记录

---

## Section 1：数据层

### localStorage 草稿

| Key | 内容 | 触发时机 |
|-----|------|---------|
| `studio_web_draft` | `{ prompt, template, model, html, deployed_url, updated_at }` | 网页生成完成时 |
| `studio_image_draft` | `{ original_b64, result_url, updated_at }` | 图片上传时（original）、AI 生成完成时（result） |

### Supabase 表

```sql
create table studio_history (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users not null,
  type       text not null check (type in ('web', 'image')),
  title      text,
  thumbnail  text,   -- 图片用 Storage URL，网页用模板 emoji
  data       jsonb not null,
  created_at timestamptz default now()
);

-- data 结构
-- web:   { prompt, template, model, html, deployed_url }
-- image: { original_url, result_url }

alter table studio_history enable row level security;
create policy "users_own_history"
  on studio_history for all
  using (auth.uid() = user_id);

create index studio_history_user_type_idx
  on studio_history(user_id, type, created_at desc);
```

### Supabase Storage

Bucket：`studio-images`（public）  
用途：存储图片编辑的原始图和结果图  
路径格式：`{user_id}/{timestamp}.jpg`

---

## Section 2：API 路由

| 方法 | 路径 | 功能 |
|------|------|------|
| `GET` | `/api/studio/history?type=web\|image&limit=20` | 获取历史列表（按 created_at desc） |
| `POST` | `/api/studio/history` | 保存一条记录 |
| `DELETE` | `/api/studio/history/[id]` | 删除一条记录 |

**POST 入参：**
```ts
{
  type: 'web' | 'image';
  title: string;
  thumbnail?: string;
  data: {
    // web
    prompt?: string; template?: string; model?: string;
    html?: string; deployed_url?: string;
    // image
    original_url?: string; result_url?: string;
  };
}
```

图片上传流程：`canvas.toDataURL()` → `POST /api/upload` → Supabase Storage URL → 存入 `data.original_url`

---

## Section 3：UI 设计

### 草稿恢复提示条

页面加载时检测 localStorage，若有草稿则在创作室顶部显示：

```
┌──────────────────────────────────────────────────┐
│ 🔄 检测到上次未完成的编辑，是否恢复？[恢复] [忽略] │
└──────────────────────────────────────────────────┘
```

点「恢复」→ 还原完整状态；点「忽略」→ 清除草稿，不再提示。

### 历史面板（右侧抽屉）

创作室右上角加「🕐 历史」按钮，点击展开 320px 宽的右侧抽屉：

```
┌────────────────────────────────┐
│  历史记录             [✕ 关闭] │
│  [🌐 网页工具] [🖼️ 图片编辑]   │
├────────────────────────────────┤
│  ┌──────┐  抛物线动画          │
│  │ 📐   │  数学可视化          │
│  └──────┘  2026-04-17 14:32   │
│            [恢复] [删除]        │
├────────────────────────────────┤
│  ┌──────┐  修改背景为海边       │
│  │ img  │  2026-04-17 13:10   │
│  └──────┘  [恢复] [删除]        │
└────────────────────────────────┘
```

- 网页历史缩略图：使用模板 emoji（📐🌊📊🎮🔧✨）
- 图片历史缩略图：`<img src={original_url}>` 小图
- 每页最多显示 20 条，按时间倒序
- 点「恢复」→ 关闭抽屉，还原对应 Tab 的完整状态

### 触发保存的时机

| 操作 | localStorage | Supabase |
|------|-------------|----------|
| 图片上传 | 立即保存原图 base64 | — |
| 网页生成完成 | 立即保存 HTML + prompt | 异步保存（fire-and-forget） |
| 图片 AI 生成完成 | 保存 result_url | 异步保存（先上传图片到 Storage） |

---

## 新增文件清单

```
src/lib/studio-storage.ts                        ← 新增：localStorage 读写工具
src/app/api/studio/history/route.ts              ← 新增：GET + POST
src/app/api/studio/history/[id]/route.ts         ← 新增：DELETE
src/components/studio/HistoryPanel.tsx           ← 新增：历史抽屉组件
src/components/studio/DraftBanner.tsx            ← 新增：草稿恢复提示条
src/app/(dashboard)/studio/page.tsx              ← 修改：集成 DraftBanner + HistoryPanel
src/components/studio/WebToolTab.tsx             ← 修改：生成完成后保存草稿 + 历史
```

---

## 不在本期范围内

- 历史记录分页（超过 20 条的加载更多）
- 历史记录搜索
- 历史记录导出
- 多设备草稿冲突合并
