'use client';

import { useEffect, useState } from 'react';
import { X, Trash2, RotateCcw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  StudioHistoryRecord,
  WebHistoryData,
  ImageHistoryData,
} from '@/lib/studio-storage';

const TEMPLATE_ICONS: Record<string, string> = {
  math: '📐', physics: '🌊', chart: '📊', game: '🎮', tool: '🔧', free: '✨',
};

type Props = {
  open: boolean;
  onClose: () => void;
  onRestoreWeb: (data: WebHistoryData) => void;
  onRestoreImage: (data: ImageHistoryData) => void;
};

export function HistoryPanel({ open, onClose, onRestoreWeb, onRestoreImage }: Props) {
  const [tab, setTab]         = useState<'web' | 'image'>('web');
  const [records, setRecords] = useState<StudioHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/studio/history?type=${tab}&limit=20`)
      .then(r => r.json())
      .then((d: { records?: StudioHistoryRecord[] }) => setRecords(d.records ?? []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [open, tab]);

  const handleDelete = async (id: string) => {
    await fetch(`/api/studio/history/${id}`, { method: 'DELETE' });
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const handleRestore = (record: StudioHistoryRecord) => {
    if (record.type === 'web') onRestoreWeb(record.data as WebHistoryData);
    else onRestoreImage(record.data as ImageHistoryData);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 flex h-full w-80 flex-col border-l bg-background shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-semibold text-sm">历史记录</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex border-b">
          {(['web', 'image'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-2 text-xs font-medium transition-colors',
                tab === t ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}>
              {t === 'web' ? '🌐 网页工具' : '🖼️ 图片编辑'}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && records.length === 0 && (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              暂无历史记录
            </div>
          )}
          {!loading && records.map(record => (
            <div key={record.id} className="flex gap-3 border-b p-3 hover:bg-muted/30">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-muted flex items-center justify-center text-2xl">
                {record.type === 'web' ? (
                  <span>{TEMPLATE_ICONS[(record.data as WebHistoryData).template ?? 'free'] ?? '✨'}</span>
                ) : (
                  (record.data as ImageHistoryData).original_url
                    ? <img src={(record.data as ImageHistoryData).original_url!} alt="" className="h-full w-full object-cover" />
                    : <span className="text-xs text-muted-foreground">无图</span>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between min-w-0">
                <p className="truncate text-xs font-medium">{record.title ?? '未命名'}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(record.created_at).toLocaleString('zh-CN', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
                <div className="flex gap-2 mt-1">
                  <button onClick={() => handleRestore(record)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <RotateCcw className="h-3 w-3" /> 恢复
                  </button>
                  <button onClick={() => handleDelete(record.id)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3 w-3" /> 删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
