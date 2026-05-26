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
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  function resetForm() {
    setEmail('');
    setPassword('');
    setError('');
    setRegistered(false);
    setAlreadyRegistered(false);
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    });
    if (error) {
      setError(error.message);
    } else if (data.user && (data.user.identities?.length ?? 0) === 0) {
      // 已注册：Supabase 返回 success 但 identities 为空（反枚举）
      setAlreadyRegistered(true);
    } else {
      setRegistered(true);
    }
    setLoading(false);
  }

  function goToLoginWithEmail() {
    const keepEmail = email;
    setTab('login');
    setError('');
    setPassword('');
    setRegistered(false);
    setAlreadyRegistered(false);
    setEmail(keepEmail);
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
            {tab === 'login' ? '登录' : '注册'} IHuiToken
          </DialogTitle>
        </DialogHeader>

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

        {alreadyRegistered ? (
          <div className="space-y-4 py-2 text-center">
            <p className="text-sm">
              <span className="font-medium text-foreground">{email}</span> 已是 IHuiToken 用户。
            </p>
            <p className="text-xs text-muted-foreground">
              请直接登录，忘记密码可在登录页选择「忘记密码」重置。
            </p>
            <Button className="w-full" onClick={goToLoginWithEmail}>
              去登录
            </Button>
          </div>
        ) : registered ? (
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
              {loading
                ? (tab === 'login' ? '登录中...' : '注册中...')
                : (tab === 'login' ? '登录' : '注册')}
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
