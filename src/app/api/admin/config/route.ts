import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { invalidateConfigCache } from '@/lib/config';

const adminClient = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function getAuthenticatedAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  if (user.email !== process.env.ADMIN_EMAIL) return null;
  return user;
}

function maskValue(key: string, value: string): string {
  if (!value) return '';
  // Non-secret config values are returned in full so admins can verify them
  if (key.endsWith('_BASE_URL')) return value;
  if (key.startsWith('SITE_')) return value;
  if (value.length <= 4) return value.slice(0, 4) + '****';
  return value.slice(0, 4) + '****';
}

export async function GET() {
  const user = await getAuthenticatedAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await adminClient
    .from('app_config')
    .select('key, value, description, updated_at')
    .order('key');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = (data ?? []).map((row) => ({
    key: row.key,
    description: row.description,
    masked_value: maskValue(row.key, row.value),
    has_value: Boolean(row.value),
    updated_at: row.updated_at,
  }));

  return NextResponse.json({ configs: result });
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as { key?: string; value?: string };
  const { key, value } = body;

  if (!key || typeof value !== 'string') {
    return NextResponse.json({ error: 'Missing key or value' }, { status: 400 });
  }

  const { error } = await adminClient
    .from('app_config')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  invalidateConfigCache();

  // SITE_* keys feed into root/marketing/dashboard layouts — clear RSC cache so
  // saved branding takes effect immediately rather than after the 5-min TTL.
  if (key.startsWith('SITE_')) {
    revalidatePath('/', 'layout');
  }

  return NextResponse.json({ success: true });
}
