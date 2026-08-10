import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { isAdmin } from '@/lib/is-admin';

async function getAuthenticatedAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return null;
  return user;
}

const adminClient = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Estimated API cost per task (USD) by model
const API_COST_USD: Record<string, number> = {
  // Image
  'grok-image':             0.07,
  'flux-schnell':           0.003,
  'flux-dev':               0.025,
  'flux-pro':               0.055,
  'imagen-4':               0.04,
  'imagen-4-ultra':         0.08,
  'imagen-4-fast':          0.02,
  'gemini-2.5-flash-image': 0.03,
  'gemini-3-pro-image':     0.06,
  'gemini-3.1-flash-image': 0.03,
  // Video
  'grok-video':             0.31,
  'veo-2':                  0.35,
  'veo-3':                  0.50,
  'veo-3-fast':             0.35,
  'veo-3.1':                0.60,
  'veo-3.1-fast':           0.40,
  'veo-3.1-lite':           0.20,
  'kling-v2':               0.14,
  'kling-v2-10s':           0.28,
  'kling-v1-6':             0.07,
  'kling-v1-6-10s':         0.14,
  // Chat (per 1k tokens approx)
  'gpt-4o':                 0.005,
  'deepseek-chat':          0.001,
  'grok-4':                 0.015,
  'grok-3':                 0.009,
  'grok-3-fast':            0.003,
  'grok-3-mini':            0.001,
  'grok-3-mini-fast':       0.001,
  'claude-sonnet-4-6':      0.008,
  'gemini-2.5-pro':         0.006,
  'gemini-2.5-flash':       0.001,
  'gemini-3-pro':           0.007,
  'gemini-3-flash':         0.001,
};

const CNY_RATE = 7.2; // USD to CNY

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Tasks by model and status
  const { data: tasks } = await adminClient
    .from('tasks')
    .select('model, type, status, credits_cost, created_at');

  if (!tasks) return NextResponse.json({ modelStats: [], totals: {} });

  // Aggregate by model
  const byModel: Record<string, { count: number; completed: number; failed: number; credits: number; estUsd: number }> = {};

  for (const t of tasks) {
    const m = t.model ?? 'unknown';
    if (!byModel[m]) byModel[m] = { count: 0, completed: 0, failed: 0, credits: 0, estUsd: 0 };
    byModel[m].count++;
    if (t.status === 'completed') {
      byModel[m].completed++;
      byModel[m].credits += t.credits_cost ?? 0;
      byModel[m].estUsd += API_COST_USD[m] ?? 0;
    }
    if (t.status === 'failed') byModel[m].failed++;
  }

  const modelStats = Object.entries(byModel)
    .map(([model, s]) => ({ model, ...s, estCny: s.estUsd * CNY_RATE }))
    .sort((a, b) => b.completed - a.completed);

  const totals = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    totalCredits: modelStats.reduce((s, m) => s + m.credits, 0),
    totalEstUsd: modelStats.reduce((s, m) => s + m.estUsd, 0),
    totalEstCny: modelStats.reduce((s, m) => s + m.estCny, 0),
  };

  // Daily usage (last 14 days)
  const now = Date.now();
  const daily: Record<string, { tasks: number; credits: number }> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * 86400000).toISOString().slice(0, 10);
    daily[d] = { tasks: 0, credits: 0 };
  }
  for (const t of tasks) {
    const d = t.created_at?.slice(0, 10);
    if (d && daily[d] && t.status === 'completed') {
      daily[d].tasks++;
      daily[d].credits += t.credits_cost ?? 0;
    }
  }

  return NextResponse.json({ modelStats, totals, daily });
}
