'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthGate } from '@/lib/auth-gate';
import { translateAuthError } from '@/lib/auth-errors';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const RESEND_SECONDS = 60;

export function AuthModal() {
  const { isOpen, closeModal } = useAuthGate();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Shared
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  // Register — two steps
  const [regStep, setRegStep] = useState<'email' | 'verify'>('email');
  const [code, setCode] = useState('');
  const [registered, setRegistered] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  function startCountdown() {
    setCountdown(RESEND_SECONDS);
    timerRef.current = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) { clearInterval(timerRef.current!); return 0; }
        return n - 1;
      });
    }, 1000);
  }

  function resetAll() {
    setEmail(''); setPassword(''); setError('');
    setAlreadyRegistered(false);
    setRegStep('email'); setCode(''); setRegistered(false); setCountdown(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function switchTab(t: 'login' | 'register') {
    setTab(t);
    resetAll();
  }

  // ── Login ────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(translateAuthError(error)); }
    else { closeModal(); router.refresh(); }
    setLoading(false);
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  }

  // ── Register step 1: send code ────────────────────────────────
  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');

    const res = await fetch('/api/auth/send-register-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json() as { ok?: boolean; error?: string };

    setLoading(false);
    if (!res.ok) { setError(data.error ?? '发送失败，请稍后重试'); return; }

    setRegStep('verify');
    startCountdown();
  }

  async function handleResend() {
    if (countdown > 0) return;
    setError('');
    const res = await fetch('/api/auth/send-register-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (res.ok) startCountdown();
    else {
      const data = await res.json() as { error?: string };
      setError(data.error ?? '发送失败');
    }
  }

  // ── Register step 2: verify + create account ─────────────────
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, password }),
    });
    const data = await res.json() as { ok?: boolean; error?: string };

    if (!res.ok) { setError(data.error ?? '注册失败，请重试'); setLoading(false); return; }

    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (signInErr) { setError(translateAuthError(signInErr)); return; }

    closeModal();
    router.refresh();
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tab === 'login' ? '登录' : '注册'} IHuiToken</DialogTitle>
        </DialogHeader>

        {/* Tab bar */}
        <div className="flex border-b mb-4">
          {(['login', 'register'] as const).map((t) => (
            <button
              key={t}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
              }`}
              onClick={() => switchTab(t)}
            >
              {t === 'login' ? '登录' : '注册'}
            </button>
          ))}
        </div>

        {/* Login */}
        {tab === 'login' && (
          alreadyRegistered ? (
            <div className="space-y-4 py-2 text-center">
              <p className="text-sm">
                <span className="font-medium">{email}</span> 已是 IHuiToken 用户。
              </p>
              <p className="text-xs text-muted-foreground">
                请直接登录，忘记密码可在登录页选择「忘记密码」重置。
              </p>
              <Button className="w-full" onClick={() => setAlreadyRegistered(false)}>去登录</Button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="modal-email">邮箱</Label>
                <Input id="modal-email" type="email" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modal-password">密码</Label>
                <Input id="modal-password" type="password" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '登录中…' : '登录'}
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">或</span>
                </div>
              </div>
              <Button type="button" variant="outline" className="w-full" onClick={handleGoogle}>
                使用 Google 登录
              </Button>
            </form>
          )
        )}

        {/* Register — step 1: email */}
        {tab === 'register' && regStep === 'email' && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="modal-reg-email">邮箱</Label>
              <Input id="modal-reg-email" type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '发送中…' : '发送验证码'}
            </Button>
          </form>
        )}

        {/* Register — step 2: code + password */}
        {tab === 'register' && regStep === 'verify' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <p className="text-xs text-muted-foreground">验证码已发送至 {email}</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="modal-code">验证码</Label>
                <button type="button" onClick={handleResend} disabled={countdown > 0}
                  className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50">
                  {countdown > 0 ? `重新发送 (${countdown}s)` : '重新发送'}
                </button>
              </div>
              <Input id="modal-code" type="text" inputMode="numeric" placeholder="8 位验证码"
                maxLength={8} value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                required autoFocus />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modal-reg-password">密码</Label>
              <Input id="modal-reg-password" type="password" placeholder="至少 8 位"
                minLength={8} value={password}
                onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '注册中…' : '注册'}
            </Button>
            <button type="button"
              onClick={() => { setRegStep('email'); setError(''); setCode(''); }}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground">
              ← 更换邮箱
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
