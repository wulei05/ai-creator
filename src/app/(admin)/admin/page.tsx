'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Image, Video, MessageSquare, Coins, ArrowRight, TrendingUp, DollarSign } from 'lucide-react';

interface Stats {
  total_users: number;
  total_tasks: number;
  image_tasks: number;
  video_tasks: number;
  chat_tasks: number;
  total_credits_spent: number;
  recent_users: { email: string; created_at: string; balance: number }[];
  recent_tasks: { type: string; model: string; status: string; created_at: string; user_email: string }[];
}

interface ModelStat {
  model: string;
  count: number;
  completed: number;
  failed: number;
  credits: number;
  estUsd: number;
  estCny: number;
}

interface Totals {
  totalTasks: number;
  completedTasks: number;
  totalCredits: number;
  totalEstUsd: number;
  totalEstCny: number;
}

interface DailyEntry { tasks: number; credits: number }

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [modelStats, setModelStats] = useState<ModelStat[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [daily, setDaily] = useState<Record<string, DailyEntry>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [usersRes, logsRes, statsRes] = await Promise.all([
          fetch('/api/admin/users?page=1'),
          fetch('/api/admin/logs?page=1'),
          fetch('/api/admin/stats'),
        ]);
        const usersData = await usersRes.json();
        const logsData = await logsRes.json();
        const statsData = await statsRes.json();

        const tasks = logsData.tasks ?? [];
        const users = usersData.users ?? [];

        setStats({
          total_users: usersData.total ?? users.length,
          total_tasks: logsData.total ?? tasks.length,
          image_tasks: tasks.filter((t: { type: string }) => t.type === 'image').length,
          video_tasks: tasks.filter((t: { type: string }) => t.type === 'video').length,
          chat_tasks: tasks.filter((t: { type: string }) => t.type === 'chat').length,
          total_credits_spent: users.reduce((s: number, u: { credits_spent: number }) => s + u.credits_spent, 0),
          recent_users: users.slice(0, 5),
          recent_tasks: tasks.slice(0, 8),
        });
        setModelStats(statsData.modelStats ?? []);
        setTotals(statsData.totals ?? null);
        setDaily(statsData.daily ?? {});
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="text-sm text-muted-foreground">加载中...</div>;
  if (!stats) return null;

  const statCards = [
    { label: '注册用户', value: stats.total_users, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: '总任务数', value: stats.total_tasks, icon: TrendingUp, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { label: '图像生成', value: stats.image_tasks, icon: Image, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { label: '视频生成', value: stats.video_tasks, icon: Video, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { label: 'AI 对话', value: stats.chat_tasks, icon: MessageSquare, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: '积分消耗', value: stats.total_credits_spent, icon: Coins, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  const maxDailyTasks = Math.max(1, ...Object.values(daily).map(d => d.tasks));

  return (
    <div className="space-y-6 max-w-5xl">
      <h2 className="text-xl font-bold">数据概览</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border bg-background p-4">
            <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div className="text-2xl font-bold">{value.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Cost estimation */}
      {totals && (
        <div className="rounded-xl border bg-background p-5">
          <div className="mb-4 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            <h3 className="font-semibold">API 成本估算（已完成任务）</h3>
            <span className="ml-auto text-xs text-muted-foreground">基于各模型公开定价估算</span>
          </div>

          {/* Summary */}
          <div className="mb-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-muted/40 p-3 text-center">
              <div className="text-xl font-bold">{totals.completedTasks}</div>
              <div className="text-xs text-muted-foreground">已完成任务</div>
            </div>
            <div className="rounded-lg bg-emerald-500/10 p-3 text-center">
              <div className="text-xl font-bold text-emerald-600">${totals.totalEstUsd.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">预估 API 成本(USD)</div>
            </div>
            <div className="rounded-lg bg-blue-500/10 p-3 text-center">
              <div className="text-xl font-bold text-blue-600">¥{totals.totalEstCny.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">预估 API 成本(CNY)</div>
            </div>
          </div>

          {/* Per-model breakdown */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b">
                  <th className="text-left pb-2 font-medium">模型</th>
                  <th className="text-right pb-2 font-medium">总次</th>
                  <th className="text-right pb-2 font-medium">成功</th>
                  <th className="text-right pb-2 font-medium">失败</th>
                  <th className="text-right pb-2 font-medium">积分消耗</th>
                  <th className="text-right pb-2 font-medium">估算成本(USD)</th>
                  <th className="text-right pb-2 font-medium">估算成本(CNY)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {modelStats.filter(m => m.count > 0).map(m => (
                  <tr key={m.model} className="hover:bg-muted/20">
                    <td className="py-2 font-mono">{m.model}</td>
                    <td className="py-2 text-right">{m.count}</td>
                    <td className="py-2 text-right text-emerald-600">{m.completed}</td>
                    <td className="py-2 text-right text-red-500">{m.failed}</td>
                    <td className="py-2 text-right text-amber-600">{m.credits}</td>
                    <td className="py-2 text-right">${m.estUsd.toFixed(3)}</td>
                    <td className="py-2 text-right">¥{m.estCny.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily bar chart */}
      <div className="rounded-xl border bg-background p-5">
        <h3 className="font-semibold mb-4">近 14 天任务量</h3>
        <div className="flex items-end gap-1 h-24">
          {Object.entries(daily).map(([date, d]) => (
            <div key={date} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-primary/70 transition-all"
                style={{ height: `${Math.round((d.tasks / maxDailyTasks) * 80)}px`, minHeight: d.tasks > 0 ? '4px' : '0' }}
                title={`${date}: ${d.tasks} 任务, ${d.credits} 积分`}
              />
              <span className="text-[8px] text-muted-foreground rotate-45 origin-left w-6 truncate">
                {date.slice(5)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent users */}
        <div className="rounded-xl border bg-background p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-sm">最新注册用户</h3>
            <Link href="/admin/users" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              查看全部 <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {stats.recent_users.map((u, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                <div>
                  <div className="font-medium truncate max-w-[180px]">{u.email}</div>
                  <div className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString('zh-CN')}</div>
                </div>
                <div className="text-xs font-medium text-amber-600">{u.balance} 积分</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent tasks */}
        <div className="rounded-xl border bg-background p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-sm">最新任务</h3>
            <Link href="/admin/logs" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              查看全部 <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {stats.recent_tasks.map((t, i) => {
              const statusColor = t.status === 'completed' ? 'text-emerald-600' : t.status === 'failed' ? 'text-red-500' : 'text-amber-500';
              const typeIcon = t.type === 'image' ? '🖼️' : t.type === 'video' ? '🎬' : '💬';
              return (
                <div key={i} className="flex items-center gap-2 text-sm py-1.5 border-b last:border-0">
                  <span className="text-base">{typeIcon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{t.model}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[160px]">{t.user_email}</div>
                  </div>
                  <span className={`text-xs font-medium ${statusColor}`}>{t.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
