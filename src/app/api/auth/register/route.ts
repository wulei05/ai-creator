import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Stateless anon client — verifyOtp returns session data without touching cookies
const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

export async function POST(req: NextRequest) {
  const { email, code, password } = (await req.json()) as {
    email?: string;
    code?: string;
    password?: string;
  };

  if (!email || !code || !password) {
    return NextResponse.json({ error: '参数不完整' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: '密码至少需要 8 位字符' }, { status: 400 });
  }

  // Verify the OTP code sent to the email
  const { data, error: verifyErr } = await anonClient.auth.verifyOtp({
    email,
    token: code,
    type: 'email',
  });

  if (verifyErr || !data.user) {
    return NextResponse.json({ error: '验证码错误或已过期，请重试' }, { status: 400 });
  }

  // Set password (user was created passwordless by signInWithOtp)
  const { error: updateErr } = await adminClient.auth.admin.updateUserById(
    data.user.id,
    { password, email_confirm: true },
  );

  if (updateErr) {
    return NextResponse.json({ error: '账号创建失败，请稍后重试' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
