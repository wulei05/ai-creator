# 登录后置（Deferred Auth）设计文档

**日期：** 2026-04-21
**状态：** 已确认，待实现

---

## 概述

将登录时机从「进入功能页时」延后到「触发 AI 调用时」。游客可以自由浏览界面、填写提示词，只有在点击「发送」「生成」等 AI 调用按钮时才弹出登录 Modal。登录成功后停留在原页面，用户手动重试操作。

---

## Section 1：路由权限变更

### 开放路由（游客可进入）

| 路由 | 说明 |
|------|------|
| `/chat` | 可看界面，发送时弹窗 |
| `/image` | 可看界面，生成时弹窗 |
| `/video` | 可看界面，生成时弹窗 |
| `/studio` | 可看界面，生成时弹窗 |
| `/community` | 可浏览作品，点赞/收藏时弹窗 |

### 保持保护（middleware 跳转 `/login`）

| 路由 | 原因 |
|------|------|
| `/history` | 纯账户数据，游客无内容 |
| `/credits` | 纯账户功能 |
| `/admin` | 管理后台 |

### 变更内容

**`src/lib/supabase/middleware.ts`**：
```ts
// 修改前
const PROTECTED = ['/chat', '/image', '/video', '/history', '/credits', '/admin']

// 修改后
const PROTECTED = ['/history', '/credits', '/admin']
```

**`src/app/(dashboard)/layout.tsx`**：
- 移除 `if (!user) redirect('/login')`
- `user` 可为 `null`，透传给 `UserMenu`
- `UserMenu` 未登录时显示「登录」按钮

---

## Section 2：AuthGate 全局状态

### 新增文件

**`src/lib/auth-gate.tsx`**

```ts
interface AuthGateContextValue {
  require: () => boolean  // 已登录返回 true；未登录弹窗并返回 false
  openModal: () => void
}
```

- `AuthGateProvider` 包裹 dashboard layout，持有 `isOpen` 状态
- `AuthGateProvider` 内部渲染 `<AuthModal>`
- `useAuthGate()` hook 供各功能页调用

**`src/components/auth/AuthModal.tsx`**

- Dialog/Modal 组件，覆盖当前页面
- Tab 切换：登录 / 注册
- 复用现有 `src/app/(auth)/login/page.tsx` 和 `src/app/(auth)/register/page.tsx` 中的表单逻辑
- 登录成功后：调用 `router.refresh()` 刷新服务端状态，关闭 Modal

### 使用方式

```ts
// 任意功能页
const { require } = useAuthGate()

const handleGenerate = () => {
  if (!require()) return  // 未登录 → 弹窗，return
  // 正常生成逻辑
}
```

---

## Section 3：各功能页改造点

每处改动：引入 `useAuthGate`，在 handler 开头加守卫。

| 文件 | 守卫位置 |
|------|---------|
| `src/app/(dashboard)/chat/page.tsx` 或 chat 组件 | 发送消息 handler |
| `src/app/(dashboard)/image/page.tsx` | 生成图片 handler |
| `src/app/(dashboard)/video/page.tsx` | 生成视频 handler |
| `src/components/studio/WebToolTab.tsx` | `handleGenerate` |
| `src/app/(dashboard)/studio/page.tsx` | 图片 AI 生成 handler |
| `src/app/(dashboard)/community/page.tsx` | 点赞、收藏 handler |

---

## Section 4：UserMenu 适配

`src/components/dashboard/UserMenu.tsx`：
- 现在假设 `user` 非空
- 改为接受 `user: User | null`
- 未登录时渲染「登录」按钮，点击调用 `openModal()` 或跳转 `/login`

---

## 不在本期范围内

- 登录成功后自动重试上次操作
- 游客试用额度（无需登录可运行 N 次）
- 社区页点赞/收藏的乐观更新

---

## 新增/修改文件清单

```
src/lib/auth-gate.tsx                              ← 新增：Context + Provider + hook
src/components/auth/AuthModal.tsx                  ← 新增：登录/注册 Modal
src/lib/supabase/middleware.ts                     ← 修改：缩小 PROTECTED 路由
src/app/(dashboard)/layout.tsx                     ← 修改：移除强制跳转，user 可为 null
src/components/dashboard/UserMenu.tsx              ← 修改：支持 user = null
src/app/(dashboard)/chat/                          ← 修改：发送守卫
src/app/(dashboard)/image/page.tsx                 ← 修改：生成守卫
src/app/(dashboard)/video/page.tsx                 ← 修改：生成守卫
src/components/studio/WebToolTab.tsx               ← 修改：生成守卫
src/app/(dashboard)/studio/page.tsx                ← 修改：图片生成守卫
src/app/(dashboard)/community/page.tsx             ← 修改：点赞/收藏守卫
```
