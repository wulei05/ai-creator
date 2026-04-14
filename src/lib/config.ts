import { createClient } from '@supabase/supabase-js';

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

let cache: Record<string, string> = {};
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function loadConfig(): Promise<void> {
  const { data } = await adminClient.from('app_config').select('key, value');
  if (data) {
    cache = {};
    for (const row of data) {
      if (row.value) cache[row.key] = row.value;
    }
  }
  cacheTime = Date.now();
}

export async function getConfig(key: string): Promise<string> {
  if (Date.now() - cacheTime > CACHE_TTL) {
    await loadConfig();
  }
  // DB value takes priority, fallback to process.env
  return cache[key] ?? process.env[key] ?? '';
}

export function invalidateConfigCache(): void {
  cacheTime = 0;
}
