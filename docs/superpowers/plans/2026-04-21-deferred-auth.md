# 登录后置（Deferred Auth）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 游客可自由进入 `/chat` `/image` `/video` `/studio` `/community`，只有点击 AI 调用按钮时弹出登录 Modal，登录成功后停留原页面。

**Architecture:** 新增 `AuthGateContext` 全局持有 Modal 开关状态，`useAuthGate().require()` 在各 handler 开头做一行守卫。Dashboard layout 去掉强制跳转，middleware 缩小保护路由到 `/history` `/credits` `/admin`。

**Tech Stack:** Next.js 15 App Router, Supabase Auth (`@supabase/ssr`), shadcn/ui Dialog, React Context

---

## File Map

| 操作 | 文件 | 职责 |
|------|------|------|
| Create | `src/lib/auth-gate.tsx` | Context + Provider + `useAuthGate` hook |
| Create | `src/components/auth/AuthModal.tsx` | 登录/注册弹窗（复用 Supabase client） |
| Modify | `src/lib/supabase/middleware.ts` | 缩小 PROTECTED 路由 |
| Modify | `src/app/(dashboard)/layout.tsx` | 移除强制跳转，包裹 AuthGateProvider |
| Modify | `src/components/dashboard/UserMenu.tsx` | 支持 `user: User \| null` |
| Modify | `src/components/chat/ChatWindow.tsx` | `sendMessage` 加守卫 |
| Modify | `src/app/(dashboard)/image/page.tsx` | `handleGenerate` 加守卫 |
| Modify | `src/app/(dashboard)/video/page.tsx` | `handleGenerate` 加守卫 |
| Modify | `src/components/studio/WebToolTab.tsx` | `handleGenerate` 加守卫 |
| Modify | `src/app/(dashboard)/studio/page.tsx` | 图片 AI 生成 handler 加守卫 |
| Modify | `src/app/(dashboard)/community/page.tsx` | `toggleLike`/`toggleBookmark` 加守卫 |

---

## Task 1: AuthGate Context

**Files:**
- Create: `src/lib/auth-gate.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface AuthGateContextValue {
  isOpen: boolean;
  require: () => boolean;
  openModal: () => void;
  closeModal: () => void;
}

const AuthGateContext = createContext<AuthGateContextValue | null>(null);

export function AuthGateProvider({ user, children }: { user: unknown; children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);

  const require = useCallback((): boolean => {
    if (user) return true;
    setIsOpen(true);
    return false;
  }, [user]);

  return (
    <AuthGateContext.Provider value={{ isOpen, require, openModal, closeModal }}>
      {children}
    </AuthGateContext.Provider>
  );
}

export function useAuthGate(): AuthGateContextValue {
  const ctx = useContext(AuthGateContext);
  if (!ctx) throw new Error('useAuthGate must be used inside AuthGateProvider');
  return ctx;
}
```

- [ ] **Step 2: Verify build**

```bash
cd /app/ai-creator && npm run build 2>&1 | grep -E "error|Error|✓" | head -20
```

Expected: No TypeScript errors for this file.

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth-gate.tsx
git commit -m "feat(auth): add AuthGateContext and useAuthGate hook"
```

---

## Task 2: AuthModal Component

**Files:**
- Create: `src/components/auth/AuthModal.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthGate } from '@/lib/auth-gate';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AuthModal() {
  const { isOpen, closeModal } = useAuthGate();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  function resetForm() {
    setEmail('');
    setPassword('');
    setError('');
    setRegistered(false);
  }

  function switchTab(t: 'login' | 'register') {
    setTab(t);
    resetForm();
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      closeModal();
      router.refresh();
    }
    setLoading(false);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    });
    if (error) {
      setError(error.message);
    } else {
      setRegistered(true);
    }
    setLoading(false);
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {tab === 'login' ? '登录' : '注册'} AI Creator
          </DialogTitle>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex border-b mb-4">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'login' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
            onClick={() => switchTab('login')}
          >
            登录
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'register' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
            onClick={() => switchTab('register')}
          >
            注册
          </button>
        </div>

        {registered ? (
          <p className="text-sm text-center py-4 text-muted-foreground">
            验证邮件已发送到 {email}，请点击邮件中的链接完成注册。
          </p>
        ) : (
          <form onSubmit={tab === 'login' ? handleLogin : handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="modal-email">邮箱</Label>
              <Input
                id="modal-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modal-password">密码</Label>
              <Input
                id="modal-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (tab === 'login' ? '登录中...' : '注册中...') : (tab === 'login' ? '登录' : '注册')}
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">或</span>
              </div>
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={handleGoogle}>
              使用 Google 登录
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify no build errors**

```bash
npm run build 2>&1 | grep -E "error TS|Error:" | head -10
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/AuthModal.tsx
git commit -m "feat(auth): add AuthModal login/register dialog"
```

---

## Task 3: Shrink Middleware Protected Routes

**Files:**
- Modify: `src/lib/supabase/middleware.ts:31`

- [ ] **Step 1: Update PROTECTED array**

In `src/lib/supabase/middleware.ts`, change line 31:

```ts
// Before
const PROTECTED = ['/chat', '/image', '/video', '/history', '/credits', '/admin']

// After
const PROTECTED = ['/history', '/credits', '/admin']
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep -E "error TS|Error:" | head -10
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/middleware.ts
git commit -m "feat(auth): open /chat /image /video /studio /community to guests"
```

---

## Task 4: Update Dashboard Layout

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Rewrite the layout**

Replace the entire file content:

```tsx
import { createClient } from '@/lib/supabase/server'
import { SidebarNav } from '@/components/dashboard/SidebarNav'
import { BottomNav } from '@/components/dashboard/BottomNav'
import { UserMenu } from '@/components/dashboard/UserMenu'
import { AuthGateProvider } from '@/lib/auth-gate'
import { AuthModal } from '@/components/auth/AuthModal'
import { Sparkles } from 'lucide-react'
import { Toaster } from 'sonner'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <AuthGateProvider user={user}>
      <div className="flex h-screen bg-background">
        {/* 桌面侧边栏 */}
        <div className="hidden md:flex">
          <SidebarNav />
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-14 items-center justify-between border-b px-4">
            <div className="flex items-center gap-1.5 md:hidden">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">AI Creator</span>
            </div>
            <div className="hidden md:block" />
            <UserMenu user={user} />
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6 pb-16 md:pb-6">
            {children}
          </main>
        </div>
        <BottomNav />
        <Toaster richColors position="top-center" />
        <AuthModal />
      </div>
    </AuthGateProvider>
  )
}
```

Note: `AuthModal` is inside `AuthGateProvider` so it can access the context.

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep -E "error TS|Error:" | head -10
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/'(dashboard)'/layout.tsx
git commit -m "feat(auth): wrap dashboard in AuthGateProvider, remove forced redirect"
```

---

## Task 5: Update UserMenu for Guest State

**Files:**
- Modify: `src/components/dashboard/UserMenu.tsx`

- [ ] **Step 1: Update component to accept `user: User | null`**

Replace the entire file content:

```tsx
'use client'

import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useAuthGate } from '@/lib/auth-gate'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { History, LogOut, Coins } from 'lucide-react'

export function UserMenu({ user }: { user: User | null }) {
  const router = useRouter()
  const supabase = createClient()
  const { openModal } = useAuthGate()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (!user) {
    return (
      <Button size="sm" onClick={openModal}>
        登录
      </Button>
    )
  }

  const initials = user.email?.slice(0, 2).toUpperCase() ?? 'U'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary bg-transparent border-none p-0 cursor-pointer">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
          {user.email}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/history')} className="cursor-pointer">
          <History className="mr-2 h-4 w-4" />
          历史记录
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/credits')} className="cursor-pointer">
          <Coins className="mr-2 h-4 w-4" />
          积分
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} variant="destructive" className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep -E "error TS|Error:" | head -10
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/UserMenu.tsx
git commit -m "feat(auth): UserMenu shows login button for guests"
```

---

## Task 6: Guard Chat – sendMessage

**Files:**
- Modify: `src/components/chat/ChatWindow.tsx`

- [ ] **Step 1: Add import at top of file**

Find the existing imports block and add:

```ts
import { useAuthGate } from '@/lib/auth-gate';
```

- [ ] **Step 2: Add hook call inside the component**

Find the component function body (look for `const [` state declarations) and add after the existing hooks:

```ts
const { require } = useAuthGate();
```

- [ ] **Step 3: Add guard at top of `sendMessage` (line ~99)**

Find:
```ts
const sendMessage = async () => {
```

Add as the very first line inside the function body:
```ts
const sendMessage = async () => {
  if (!require()) return;
  // ... rest of existing code unchanged
```

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | grep -E "error TS|Error:" | head -10
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/ChatWindow.tsx
git commit -m "feat(auth): guard chat sendMessage with auth gate"
```

---

## Task 7: Guard Image Generation

**Files:**
- Modify: `src/app/(dashboard)/image/page.tsx`

- [ ] **Step 1: Add import**

Add to the imports at top of file:

```ts
import { useAuthGate } from '@/lib/auth-gate';
```

- [ ] **Step 2: Add hook call inside component function body**

After existing hook declarations, add:

```ts
const { require } = useAuthGate();
```

- [ ] **Step 3: Add guard at top of `handleGenerate` (~line 518)**

Find:
```ts
const handleGenerate = async () => {
```

Add as first line inside:
```ts
const handleGenerate = async () => {
  if (!require()) return;
  // ... rest of existing code unchanged
```

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | grep -E "error TS|Error:" | head -10
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/'(dashboard)'/image/page.tsx
git commit -m "feat(auth): guard image handleGenerate with auth gate"
```

---

## Task 8: Guard Video Generation

**Files:**
- Modify: `src/app/(dashboard)/video/page.tsx`

- [ ] **Step 1: Add import**

```ts
import { useAuthGate } from '@/lib/auth-gate';
```

- [ ] **Step 2: Add hook call inside component**

```ts
const { require } = useAuthGate();
```

- [ ] **Step 3: Add guard at top of `handleGenerate` (~line 546)**

```ts
const handleGenerate = async () => {
  if (!require()) return;
  // ... rest of existing code unchanged
```

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | grep -E "error TS|Error:" | head -10
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/'(dashboard)'/video/page.tsx
git commit -m "feat(auth): guard video handleGenerate with auth gate"
```

---

## Task 9: Guard Studio

**Files:**
- Modify: `src/components/studio/WebToolTab.tsx`
- Modify: `src/app/(dashboard)/studio/page.tsx`

### WebToolTab

- [ ] **Step 1: Add import to WebToolTab**

```ts
import { useAuthGate } from '@/lib/auth-gate';
```

- [ ] **Step 2: Add hook call inside `WebToolTab` component body**

```ts
const { require } = useAuthGate();
```

- [ ] **Step 3: Add guard at top of `handleGenerate` (~line 92)**

```ts
const handleGenerate = async () => {
  if (!require()) return;
  // ... rest unchanged
```

### Studio page (image AI generation)

- [ ] **Step 4: Read the studio page to find the AI generation handler**

```bash
grep -n "handleAI\|handleEdit\|handleGen\|applyAI\|onClick.*AI\|AI.*onClick" src/app/'(dashboard)'/studio/page.tsx | head -20
```

- [ ] **Step 5: Add import to studio page**

```ts
import { useAuthGate } from '@/lib/auth-gate';
```

- [ ] **Step 6: Add hook call and guard**

Add inside the component:
```ts
const { require } = useAuthGate();
```

Add `if (!require()) return;` as the first line of whichever handler triggers the fal.ai image API call.

- [ ] **Step 7: Verify build**

```bash
npm run build 2>&1 | grep -E "error TS|Error:" | head -10
```

Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/studio/WebToolTab.tsx src/app/'(dashboard)'/studio/page.tsx
git commit -m "feat(auth): guard studio generation with auth gate"
```

---

## Task 10: Guard Community Like/Bookmark

**Files:**
- Modify: `src/app/(dashboard)/community/page.tsx`

- [ ] **Step 1: Add import**

```ts
import { useAuthGate } from '@/lib/auth-gate';
```

- [ ] **Step 2: Add hook call inside `CommunityPage` component**

```ts
const { require } = useAuthGate();
```

- [ ] **Step 3: Guard `toggleLike` (~line 152)**

Find:
```ts
const toggleLike = (id: string) => {
  setPosts(prev => prev.map(p =>
```

Replace with:
```ts
const toggleLike = (id: string) => {
  if (!require()) return;
  setPosts(prev => prev.map(p =>
```

- [ ] **Step 4: Guard `toggleBookmark` (~line 158)**

Find:
```ts
const toggleBookmark = (id: string) => {
  setPosts(prev => prev.map(p =>
```

Replace with:
```ts
const toggleBookmark = (id: string) => {
  if (!require()) return;
  setPosts(prev => prev.map(p =>
```

- [ ] **Step 5: Verify build**

```bash
npm run build 2>&1 | grep -E "error TS|Error:" | head -10
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/'(dashboard)'/community/page.tsx
git commit -m "feat(auth): guard community like/bookmark with auth gate"
```

---

## Task 11: Final Build + Deploy

- [ ] **Step 1: Full local build**

```bash
npm run build 2>&1 | tail -20
```

Expected: Route table printed, no errors, `✓ Generating static pages` line visible.

- [ ] **Step 2: Deploy to server**

```bash
sshpass -p 'BP5wqKoczwxJTWC3' rsync -avz \
  --exclude='.env*' --exclude='node_modules' --exclude='.next' --exclude='.git' --exclude='*.log' \
  -e "ssh -o StrictHostKeyChecking=no" \
  . root@38.47.113.78:/app/ai-creator/
```

- [ ] **Step 3: Build on server**

```bash
sshpass -p 'BP5wqKoczwxJTWC3' ssh -o StrictHostKeyChecking=no root@38.47.113.78 \
  'cd /app/ai-creator && npm run build 2>&1 | tail -20'
```

Expected: No errors, route table visible.

- [ ] **Step 4: Restart PM2**

```bash
sshpass -p 'BP5wqKoczwxJTWC3' ssh -o StrictHostKeyChecking=no root@38.47.113.78 \
  'pm2 restart ai-creator && sleep 3 && pm2 list'
```

Expected: status = `online`, uptime > 3s.

- [ ] **Step 5: Smoke test**

Open browser to `http://38.47.113.78:3000/image` without being logged in.
- Should load the image generation UI (not redirect to `/login`)
- Click「生成图片」→ AuthModal should appear with login/register tabs
- Log in → modal closes, stay on `/image` page

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat(auth): deferred auth - guests can browse, modal on AI action"
```
