'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ImageIcon, VideoIcon, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';
type TaskType = 'image' | 'video';

interface Task {
  id: string;
  type: TaskType;
  model: string;
  prompt: string;
  status: TaskStatus;
  output_url: string | null;
  credits_cost: number;
  created_at: string;
}

type FilterTab = 'all' | 'image' | 'video';

const PAGE_SIZE = 20;

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds} 秒前`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const styles: Record<TaskStatus, string> = {
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    processing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
    pending: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };
  const labels: Record<TaskStatus, string> = {
    completed: '已完成',
    failed: '失败',
    processing: '处理中',
    pending: '等待中',
  };
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', styles[status])}>
      {labels[status]}
    </span>
  );
}

function TaskCard({ task }: { task: Task }) {
  const [videoOpen, setVideoOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  const truncatedPrompt =
    task.prompt.length > 50 ? task.prompt.slice(0, 50) + '…' : task.prompt;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {task.status === 'completed' && task.output_url ? (
          task.type === 'image' ? (
            <button
              className="h-full w-full"
              onClick={() => setImageOpen(true)}
              aria-label="查看原图"
            >
              <Image
                src={task.output_url}
                alt={task.prompt}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </button>
          ) : (
            <button
              className="relative h-full w-full"
              onClick={() => setVideoOpen(true)}
              aria-label="播放视频"
            >
              <video
                src={task.output_url}
                className="h-full w-full object-cover"
                muted
                playsInline
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                <VideoIcon className="h-10 w-10 text-white drop-shadow" />
              </span>
            </button>
          )
        ) : task.status === 'processing' || task.status === 'pending' ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : task.status === 'failed' ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-muted-foreground">
            <AlertCircle className="h-8 w-8" />
            <span className="text-xs">生成失败</span>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            {task.type === 'image' ? (
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            ) : (
              <VideoIcon className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <StatusBadge status={task.status} />
          <span className="text-xs text-muted-foreground">{relativeTime(task.created_at)}</span>
        </div>
        <p className="text-sm text-foreground" title={task.prompt}>
          {truncatedPrompt}
        </p>
        <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono">{task.model}</span>
          <span>{task.credits_cost} 积分</span>
        </div>
      </div>

      {/* Image lightbox */}
      {imageOpen && task.output_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setImageOpen(false)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={task.output_url}
              alt={task.prompt}
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />
          </div>
        </div>
      )}

      {/* Video player modal */}
      {videoOpen && task.output_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setVideoOpen(false)}
        >
          <div className="max-h-[90vh] max-w-[90vw] overflow-hidden rounded-lg">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              src={task.output_url}
              className="max-h-[90vh] max-w-[90vw]"
              controls
              autoPlay
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(
    async (tab: FilterTab, offset: number, replace: boolean) => {
      if (offset === 0) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          type: tab,
          limit: String(PAGE_SIZE),
          offset: String(offset),
        });
        const res = await fetch(`/api/tasks?${params}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? '加载失败');
        }
        const data = (await res.json()) as { tasks: Task[]; total: number };
        setTotal(data.total);
        setTasks((prev) => (replace ? data.tasks : [...prev, ...data.tasks]));
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchTasks(activeTab, 0, true);
  }, [activeTab, fetchTasks]);

  const handleTabChange = (tab: FilterTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setTasks([]);
    setTotal(0);
  };

  const handleLoadMore = () => {
    fetchTasks(activeTab, tasks.length, false);
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'image', label: '图片' },
    { key: 'video', label: '视频' },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">历史记录</h1>
        <p className="mt-1 text-sm text-muted-foreground">查看你的图像和视频生成记录</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 py-20 text-muted-foreground">
          <AlertCircle className="h-8 w-8" />
          <p>{error}</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <ImageIcon className="h-12 w-12 opacity-30" />
          <p className="text-lg font-medium">暂无记录</p>
          <p className="text-sm">开始创作后，你的图像和视频记录将显示在这里</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>

          {tasks.length < total && (
            <div className="flex justify-center pt-2">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-lg border bg-background px-6 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted disabled:opacity-50"
              >
                {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                {loadingMore ? '加载中…' : `加载更多 (${total - tasks.length} 条)`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
