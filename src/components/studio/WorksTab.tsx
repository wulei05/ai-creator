'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Download, Trash2, CheckSquare, Square, ImageIcon,
  Video, Loader2, RefreshCw, ChevronDown, Search, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useT } from '@/lib/i18n';

interface Task {
  id: string;
  type: 'image' | 'video';
  model: string;
  prompt: string;
  status: string;
  output_url: string | null;
  credits_cost: number;
  created_at: string;
}

type FilterType = 'all' | 'image' | 'video';

const PAGE_SIZE = 24;

export function WorksTab() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const offsetRef = useRef(0);
  const { t } = useT();

  // debounce search input 400ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchTasks = useCallback(async (type: FilterType, offset: number, replace: boolean, keyword = '') => {
    if (offset === 0) setLoading(true); else setLoadingMore(true);
    try {
      const params = new URLSearchParams({ type, limit: String(PAGE_SIZE), offset: String(offset) });
      if (keyword) params.set('search', keyword);
      const res = await fetch(`/api/tasks?${params}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setTasks((prev) => replace ? data.tasks : [...prev, ...data.tasks]);
      setTotal(data.total);
      offsetRef.current = offset + data.tasks.length;
    } catch {
      toast.error('加载作品失败');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    offsetRef.current = 0;
    setSelected(new Set());
    setSelectMode(false);
    fetchTasks(filter, 0, true, debouncedSearch);
  }, [filter, debouncedSearch, fetchTasks]);

  const loadMore = () => fetchTasks(filter, offsetRef.current, false, debouncedSearch);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const withUrl = tasks.filter((t) => t.output_url).map((t) => t.id);
    setSelected(new Set(withUrl));
  };

  const deleteTask = async (id: string) => {
    setDeleting((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setTotal((n) => n - 1);
      setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
      toast.success('已删除');
    } catch {
      toast.error('删除失败');
    } finally {
      setDeleting((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const downloadFile = async (url: string, filename: string) => {
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const downloadSelected = async () => {
    const targets = tasks.filter((t) => selected.has(t.id) && t.output_url);
    if (targets.length === 0) return;
    setDownloading(true);
    try {
      for (const t of targets) {
        const ext = t.type === 'video' ? 'mp4' : 'jpg';
        await downloadFile(t.output_url!, `${t.type}-${t.id.slice(0, 8)}.${ext}`);
        await new Promise((r) => setTimeout(r, 300));
      }
      toast.success(`已下载 ${targets.length} 个文件`);
    } catch {
      toast.error('部分下载失败');
    } finally {
      setDownloading(false);
    }
  };

  const FILTERS: { id: FilterType; label: string }[] = [
    { id: 'all', label: t('studio_all') },
    { id: 'image', label: t('studio_image') },
    { id: 'video', label: t('studio_video') },
  ];

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* 左：类型筛选 + 搜索 */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-lg border overflow-hidden">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  filter === f.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('studio_search')}
              className="h-7 w-44 rounded-md border border-border bg-background pl-8 pr-7 text-xs outline-none focus:border-primary/60 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        </div>

        {/* 右：操作按钮 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t('studio_count')} {total} {t('studio_items')}</span>
          <button
            onClick={() => { setSelectMode((v) => !v); setSelected(new Set()); }}
            className={cn(
              'flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
              selectMode
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground border border-border',
            )}
          >
            <CheckSquare className="size-3.5" />
            {selectMode ? t('studio_exit_sel') : t('studio_select')}
          </button>
          {selectMode && (
            <>
              <button
                onClick={selectAll}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {t('studio_select_all')}
              </button>
              <Button
                size="sm"
                variant="outline"
                disabled={selected.size === 0 || downloading}
                onClick={downloadSelected}
                className="h-7 text-xs"
              >
                {downloading ? (
                  <Loader2 className="size-3 animate-spin mr-1" />
                ) : (
                  <Download className="size-3 mr-1" />
                )}
                {t('studio_download')} {selected.size > 0 ? `(${selected.size})` : ''}
              </Button>
            </>
          )}
          <button
            onClick={() => fetchTasks(filter, 0, true)}
            className="text-muted-foreground hover:text-foreground"
            title={t('studio_refresh')}
          >
            <RefreshCw className="size-4" />
          </button>
        </div>
      </div>

      {/* 内容区 */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <ImageIcon className="size-12 text-muted-foreground/30" />
          <div>
            <p className="font-medium text-muted-foreground">{t('studio_empty')}</p>
            <p className="text-sm text-muted-foreground/60 mt-1">{t('studio_empty_hint')}</p>
          </div>
        </div>
      ) : (
        <>
          {/* 瀑布流网格 */}
          <div className="columns-2 gap-3 sm:columns-3 md:columns-4 lg:columns-5">
            {tasks.map((task) => (
              <WorkCard
                key={task.id}
                task={task}
                selectMode={selectMode}
                selected={selected.has(task.id)}
                deleting={deleting.has(task.id)}
                onToggle={() => toggleSelect(task.id)}
                onDelete={() => deleteTask(task.id)}
                onDownload={() => {
                  const ext = task.type === 'video' ? 'mp4' : 'jpg';
                  downloadFile(task.output_url!, `${task.type}-${task.id.slice(0, 8)}.${ext}`);
                }}
              />
            ))}
          </div>

          {/* 加载更多 */}
          {tasks.length < total && (
            <div className="flex justify-center pt-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {loadingMore ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
                {t('studio_load_more')} ({total - tasks.length})
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function WorkCard({
  task, selectMode, selected, deleting, onToggle, onDelete, onDownload,
}: {
  task: Task;
  selectMode: boolean;
  selected: boolean;
  deleting: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onDownload: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  if (!task.output_url) return null;

  const isVideo = task.type === 'video';
  const dateStr = new Date(task.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });

  return (
    <div
      className={cn(
        'group relative mb-3 break-inside-avoid overflow-hidden rounded-xl border border-border/40 bg-card transition-all',
        selected && 'ring-2 ring-primary ring-offset-1',
        selectMode && 'cursor-pointer',
      )}
      onClick={selectMode ? onToggle : undefined}
    >
      {/* 媒体 */}
      {isVideo ? (
        <video
          src={task.output_url}
          className="w-full object-cover"
          muted
          playsInline
          onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
          onMouseLeave={(e) => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
        />
      ) : imgError ? (
        <div className="flex aspect-square items-center justify-center bg-muted">
          <ImageIcon className="size-8 text-muted-foreground/40" />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={task.output_url}
          alt={task.prompt}
          loading="lazy"
          className="w-full object-cover"
          onError={() => setImgError(true)}
        />
      )}

      {/* 选择框 */}
      {selectMode && (
        <div className="absolute left-2 top-2 z-10">
          {selected ? (
            <CheckSquare className="size-5 text-primary drop-shadow" />
          ) : (
            <Square className="size-5 text-white/70 drop-shadow" />
          )}
        </div>
      )}

      {/* 类型角标 */}
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full bg-black/40 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-sm">
        {isVideo ? <Video className="size-2.5" /> : <ImageIcon className="size-2.5" />}
        {isVideo ? '视频' : '图像'}
      </div>

      {/* Hover 底部操作栏 */}
      {!selectMode && (
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out z-10">
          <div className="bg-black/75 backdrop-blur-sm p-2.5 space-y-1.5">
            <p className="line-clamp-2 text-[10px] leading-relaxed text-white/80">{task.prompt}</p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/40">{dateStr} · {task.model}</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); onDownload(); }}
                  className="rounded-md bg-white/15 p-1 hover:bg-white/25 transition-colors"
                  title="下载"
                >
                  <Download className="size-3 text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  disabled={deleting}
                  className="rounded-md bg-white/15 p-1 hover:bg-red-500/60 transition-colors disabled:opacity-50"
                  title="删除"
                >
                  {deleting ? (
                    <Loader2 className="size-3 text-white animate-spin" />
                  ) : (
                    <Trash2 className="size-3 text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
