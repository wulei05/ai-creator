'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { translateAuthError } from '@/lib/auth-errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const RESEND_SECONDS = 60

export default function RegisterPage() {
  const [step, setStep] = useState<'email' | 'verify'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  function startCountdown() {
    setCountdown(RESEND_SECONDS)
    timerRef.current = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) { clearInterval(timerRef.current!); return 0 }
        return n - 1
      })
    }, 1000)
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/send-register-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json() as { ok?: boolean; error?: string; alreadyRegistered?: boolean }

    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? '发送失败，请稍后重试')
      return
    }

    setStep('verify')
    startCountdown()
  }

  async function handleResend() {
    if (countdown > 0) return
    setError('')
    const res = await fetch('/api/auth/send-register-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (res.ok) startCountdown()
    else {
      const data = await res.json() as { error?: string }
      setError(data.error ?? '发送失败')
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, password }),
    })
    const data = await res.json() as { ok?: boolean; error?: string }

    if (!res.ok) {
      setError(data.error ?? '注册失败，请重试')
      setLoading(false)
      return
    }

    // Sign in with the new password to establish session
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (signInErr) {
      setError(translateAuthError(signInErr))
      return
    }

    setSuccess(true)
    router.push('/')
    router.refresh()
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>注册成功</CardTitle>
            <CardDescription>正在跳转…</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">注册</CardTitle>
          <CardDescription>
            {step === 'email'
              ? '创建 IHuiToken 账号'
              : `验证码已发送至 ${email}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'email' ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '发送中…' : '发送验证码'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="code">邮箱验证码</Label>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={countdown > 0}
                    className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    {countdown > 0 ? `重新发送 (${countdown}s)` : '重新发送'}
                  </button>
                </div>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  placeholder="6 位验证码"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="至少 8 位"
                  minLength={8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '注册中…' : '注册'}
              </Button>
              <button
                type="button"
                onClick={() => { setStep('email'); setError(''); setCode('') }}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
              >
                ← 更换邮箱
              </button>
            </form>
          )}

          {step === 'email' && (
            <p className="text-center text-sm text-muted-foreground">
              已有账号？{' '}
              <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                登录
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
