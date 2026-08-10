import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

export async function POST(req: NextRequest) {
  const { email } = (await req.json()) as { email?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: '请输入有效的邮箱地址' }, { status: 400 });
  }

  // Reject if the email already has a password-based account
  const registered = await emailHasPassword(email);
  if (registered) {
    return NextResponse.json(
      { error: '该邮箱已注册，请直接登录', alreadyRegistered: true },
      { status: 409 },
    );
  }

  // Clean up zombie accounts (created by OTP but never completed registration)
  await deleteZombieUser(email);

  const { error } = await adminClient.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });

  if (error) {
    console.error('[send-register-code] signInWithOtp error:', error.status, error.message, error);
    const msg = error.message.toLowerCase();
    if (msg.includes('rate limit') || error.status === 429) {
      return NextResponse.json({ error: '发送过于频繁，请稍后再试' }, { status: 429 });
    }
    return NextResponse.json({ error: '发送失败，请稍后重试' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// Query auth.users directly via service role to detect existing password accounts.
// Requires the SQL function below in your Supabase project:
//
//   CREATE OR REPLACE FUNCTION public.email_is_registered(check_email text)
//   RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = auth, public AS $$
//     SELECT EXISTS (
//       SELECT 1 FROM auth.users
//       WHERE email = check_email
//         AND encrypted_password IS NOT NULL
//         AND encrypted_password != ''
//         AND deleted_at IS NULL
//     );
//   $$;
async function emailHasPassword(email: string): Promise<boolean> {
  const { data, error } = await adminClient.rpc('email_is_registered', { check_email: email });
  if (error) return false; // function not yet created → fail open
  return data === true;
}

// Delete a user who started OTP registration but never set a password (zombie state).
// Requires SQL function: public.get_zombie_user_id(check_email text) → uuid
// Safe to call even if user doesn't exist or function not yet created.
async function deleteZombieUser(email: string): Promise<void> {
  try {
    const { data: userId } = await adminClient.rpc('get_zombie_user_id', { check_email: email });
    if (userId) {
      await adminClient.auth.admin.deleteUser(userId as string);
    }
  } catch {
    // best-effort, don't block registration
  }
}
