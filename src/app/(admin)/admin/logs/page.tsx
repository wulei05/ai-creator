'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TaskRow {
  id: string;
  user_id: string;
  user_email: string;
  type: string;
  model: string;
  status: string;
  prompt_preview: string;
  credits_cost: number;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
}

const TYPE_FILTERS = [
  { value: '', label: '全部类型' },
  { value: 'image', label: '🖼️ 图像' },
  { value: 'video', label: '🎬 视频' },
  { value: 'chat', label: '💬 对话' },
];
const STATUS_FILTERS = [
  { value: '', label: '全部状态' },
  { value: 'completed', label: '成功' },
  { value: 'failed', label: '失败' },
  { value: 'processing', label: '处理中' },
];

const STATUS_STYLE: Record<string, string> = {
  completed: 'bg-emerald-500/10 text-emerald-600',
  failed: 'bg-red-500/10 text-red-500',
  processing: 'bg-blue-500/10 text-blue-600',
  pending: 'bg-amber-500/10 text-amber-600',
};

export default function AdminLogsPage() {
  const searchParams = useSearchParams();
  const initUserId = searchParams.get('user_id') ?? '';

  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [userId] = useState(initUserId);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (typeFilter) params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (userId) params.set('user_id', userId);
      const res = await fetch(`/api/admin/logs?${params}`);
      const data = await res.json();
      setTasks(data.tasks ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, statusFilter, userId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [typeFilter, statusFilter]);

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold">
          使用日志
          {userId && <span className="ml-2 text-sm font-normal text-muted-foreground">用户筛选</span>}
          <span className="ml-2 text-sm font-normal text-muted-foreground">共 {total} 条</span>
        </h2>

        <div className="flex gap-2 flex-wrap">
          {/* Type filter */}
          <div className="flex rounded-lg border overflow-hidden">
            {TYPE_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setTypeFilter(f.value)}
                className={cn('px-3 py-1.5 text-xs font-medium transition-colors', typeFilter === f.value ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:text-foreground')}
              >
                {f.label}
              </button>
            ))}
          </div>
          {/* Status filter */}
          <div className="flex rounded-lg border overflow-hidden">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={cn('px-3 py-1.5 text-xs font-medium transition-colors', statusFilter === f.value ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:text-foreground')}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-background overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">时间</th>
              <th className="text-left px-4 py-3 font-medium">用户</th>
              <th className="text-left px-4 py-3 font-medium">类型</th>
              <th className="text-left px-4 py-3 font-medium">模型</th>
              <th className="text-left px-4 py-3 font-medium">Prompt</th>
              <th className="text-center px-4 py-3 font-medium">状态</th>
              <th className="text-right px-4 py-3 font-medium">积分</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">加载中...</td></tr>
            ) : tasks.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">暂无日志</td></tr>
            ) : tasks.map(t => (
              <>
                <tr
                  key={t.id}
                  className="hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                >
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(t.created_at).toLocaleString('zh-CN', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs truncate max-w-[150px]">{t.user_email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-base">{t.type === 'image' ? '🖼️' : t.type === 'video' ? '🎬' : '💬'}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{t.model}</td>
                  <td className="px-4 py-3 text-xs max-w-[220px]">
                    <span className="truncate block">{t.prompt_preview || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLE[t.status] ?? 'bg-muted text-muted-foreground')}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-medium">{t.credits_cost}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm('确认删除该条记录？')) return;
                        const res = await fetch(`/api/admin/logs?id=${t.id}`, { method: 'DELETE' });
                        if (res.ok) {
                          setTasks(prev => prev.filter(r => r.id !== t.id));
                          setTotal(prev => prev - 1);
                          toast.success('已删除');
                        } else {
                          toast.error('删除失败');
                        }
                      }}
                      className="text-muted-foreground hover:text-red-500 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
                {expanded === t.id && (
                  <tr key={`${t.id}-detail`} className="bg-muted/10">
                    <td colSpan={8} className="px-4 py-3">
                      <div className="space-y-1.5 text-xs">
                        <div><span className="text-muted-foreground">任务 ID：</span><span className="font-mono">{t.id}</span></div>
                        <div><span className="text-muted-foreground">用户 ID：</span><span className="font-mono">{t.user_id}</span></div>
                        {t.prompt_preview && <div><span className="text-muted-foreground">Prompt：</span>{t.prompt_preview}</div>}
                        {t.completed_at && <div><span className="text-muted-foreground">完成时间：</span>{new Date(t.completed_at).toLocaleString('zh-CN')}</div>}
                        {t.error_message && <div className="text-red-500"><span className="text-muted-foreground">错误：</span>{t.error_message}</div>}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>第 {page} / {totalPages} 页（每页 50 条）</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
