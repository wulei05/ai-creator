# 视频任务服务端轮询 Worker 设计文档

**日期：** 2026-04-23  
**状态：** 已确认，待实现

---

## 概述

为解决用户关闭页面后视频任务永远卡在 `processing` 的问题，增加服务端定时轮询机制。每 2 分钟主动检查所有处理中的视频任务，完成时写入结果，失败/过期时退还积分。

---

## Section 1：API 路由

**`GET /api/cron/poll-videos`**

### 身份验证

请求头 `Authorization: Bearer <CRON_SECRET>`，不匹配返回 401。`CRON_SECRET` 存入 Supabase `app_config` 表，通过 `getConfig('CRON_SECRET')` 读取。

### 执行逻辑

1. 用 service role client 查询所有 `status = 'processing'`、`type = 'video'` 的任务，最多 50 条，按 `created_at ASC`
2. 按每批 5 个并发，用 `Promise.allSettled` 处理，避免打爆上游限速
3. 每个任务根据 `model` 字段调用对应 status check：
   - `grok-video` → `getGrokVideoStatus(upstream_id)`
   - `fal-*` → `getFalVideoStatus(upstream_id)`
   - `veo-*` → `getVeoStatus(upstream_id)`
   - 其余 → `getKlingStatus(upstream_id)`
4. 根据结果更新 DB（见下表）
5. 返回 `{ processed: N, completed: N, failed: N }`

### 状态更新规则

| 上游结果 | DB 操作 |
|---------|---------|
| `completed` + 有 videoUrl | `status='completed'`, `output_url=videoUrl`, `completed_at=now()` |
| `completed` + 无 videoUrl | `status='failed'` + 退积分 |
| `failed` | `status='failed'` + 退积分 |
| 404 / 任何异常 | `status='failed'`, `error_message=原因` + 退积分 |
| `processing` / `pending` | 不更新，继续等待 |
| 创建超过 72 小时仍 processing | `status='failed'`, `error_message='任务超时'` + 退积分 |

### Veo 特殊处理

Veo 视频完成后需将 Google 临时 URL 转存到 Supabase Storage，复用现有 `/api/ai/video/status/[taskId]/route.ts` 中的转存逻辑（提取为共享函数）。

---

## Section 2：Crontab 配置

在服务器（`root@38.47.113.78`）添加 crontab 条目，每 2 分钟执行：

```bash
*/2 * * * * curl -s -H "Authorization: Bearer CRON_SECRET_VALUE" http://localhost:3000/api/cron/poll-videos >> /var/log/poll-videos.log 2>&1
```

- 调用 localhost，不走公网
- 日志追加写入 `/var/log/poll-videos.log`

---

## Section 3：错误处理

- 单个任务处理异常：catch 后继续处理下一个，不影响整批
- 并发控制：每批最多 5 个并发（`Promise.allSettled`）
- 72 小时超时兜底：创建时间超过 72 小时的 processing 任务直接标记失败并退积分

---

## 新增/修改文件清单

```
src/app/api/cron/poll-videos/route.ts     ← 新增：轮询 API 路由
src/lib/ai/veo.ts                          ← 修改：提取 Veo 转存逻辑为独立函数
src/app/api/ai/video/status/[taskId]/route.ts ← 修改：复用提取后的 Veo 转存函数
```

服务器配置：
```
crontab -e  → 新增一行
/var/log/poll-videos.log  → 自动创建
```
