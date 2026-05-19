'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, Compass, Download, Loader2, Play, Sparkles, Video, Wand2, X } from 'lucide-react';
import { toast } from 'sonner';
import { TEMPLATE_CATEGORIES, TOTAL_TEMPLATE_COUNT, type TaskRecord } from './video-templates';

interface VideoDiscoveryPanelProps {
  activeTab: 'discover' | 'create';
  onTabChange: (t: 'discover' | 'create') => void;
  activeCategory: string;
  onCategoryChange: (id: string) => void;
  onApplyTemplate: (prompt: string) => void;
  loading: boolean;
  generatedVideo: string | null;
  history: TaskRecord[];
  onSelectHistory: (url: string) => void;
  onDownload: (url: string) => void;
  onDeleteHistory: (id: string) => void;
  onClearHistory: () => void;
}

export function VideoDiscoveryPanel({
  activeTab, onTabChange,
  activeCategory, onCategoryChange,
  onApplyTemplate,
  loading, generatedVideo, history,
  onSelectHistory, onDownload, onDeleteHistory, onClearHistory,
}: VideoDiscoveryPanelProps) {
  const activeTemplates = TEMPLATE_CATEGORIES.find((c) => c.id === activeCategory)?.templates ?? [];

  return (
    <div className="flex flex-col md:h-full md:overflow-hidden">
      {/* 标签栏 */}
      <div className="flex items-center gap-1 border-b px-4 py-2">
        {([
          { id: 'discover', label: '发现', icon: Compass },
          { id: 'create',   label: '创建', icon: Sparkles },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'discover' ? (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Wand2 className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">运镜模版</h2>
              <Badge variant="secondary" className="text-xs">{TOTAL_TEMPLATE_COUNT} 个模版</Badge>
            </div>

            {/* 分类 tab */}
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onCategoryChange(cat.id)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                    activeCategory === cat.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* 模版卡片 */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {activeTemplates.map((template) => (
                <button
                  key={template.title}
                  onClick={() => {
                    onApplyTemplate(template.prompt);
                    toast.success(`已填入「${template.title}」模板`);
                  }}
                  className="group relative overflow-hidden rounded-xl text-left transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
                >
                  <div className={`relative flex aspect-video w-full items-center justify-center bg-gradient-to-br ${template.gradient}`}>
                    <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/10" />
                    <div className="relative z-10 rounded-full bg-white/20 p-2 backdrop-blur-sm transition-all group-hover:scale-110 group-hover:bg-white/30">
                      <Play className="size-4 fill-white text-white" />
                    </div>
                    <span className="absolute top-2 right-2 text-base">{template.emoji}</span>
                    <ChevronRight className="absolute bottom-2 right-2 size-3 text-white/60 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <div className="rounded-b-xl border border-t-0 bg-card p-2">
                    <p className="truncate text-xs font-medium">{template.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{template.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <div className="space-y-6">
            {/* 生成结果 */}
            {(loading || generatedVideo) && (
              <section className="space-y-3 rounded-xl border bg-card p-5">
                <h2 className="text-sm font-semibold">生成结果</h2>
                {loading && !generatedVideo && (
                  <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground">
                    <div className="relative">
                      <div className="size-16 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                      <Video className="absolute top-1/2 left-1/2 size-5 -translate-x-1/2 -translate-y-1/2 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">AI 正在创作视频</p>
                      <p className="mt-1 text-xs text-muted-foreground">预计需要 1-3 分钟，请耐心等待...</p>
                    </div>
                  </div>
                )}
                {generatedVideo && (
                  <div className="space-y-3">
                    <video src={generatedVideo} controls className="max-h-[600px] w-full rounded-xl bg-black" />
                    <Button variant="outline" size="sm" onClick={() => onDownload(generatedVideo)} className="w-full">
                      <Download className="mr-2 h-4 w-4" />下载视频
                    </Button>
                  </div>
                )}
              </section>
            )}

            {/* 最近生成 */}
            {history.length > 0 ? (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-muted-foreground">最近生成</h2>
                  <button
                    onClick={onClearHistory}
                    className="text-xs text-muted-foreground transition-colors hover:text-destructive"
                  >
                    清空
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="group relative cursor-pointer"
                      onClick={() => item.output_url && onSelectHistory(item.output_url)}
                    >
                      <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
                        {item.output_url ? (
                          <>
                            <video src={item.output_url} className="h-full w-full object-cover" muted />
                            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                              <div className="rounded-full bg-white/20 p-2">
                                <Play className="size-4 fill-white text-white" />
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); onDownload(item.output_url!); }}
                                className="rounded-full bg-white/20 p-2 transition-colors hover:bg-white/30"
                              >
                                <Download className="size-4 text-white" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            {item.status === 'failed'
                              ? <span className="text-xs text-destructive">失败</span>
                              : <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteHistory(item.id); }}
                          className="absolute top-1.5 right-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-all hover:bg-red-600 group-hover:opacity-100"
                          title="删除"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                      <p className="mt-1.5 line-clamp-1 px-0.5 text-xs text-muted-foreground">{item.prompt}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              !loading && !generatedVideo && (
                <div className="flex flex-col items-center justify-center gap-2 py-24 text-muted-foreground">
                  <Video className="size-8" />
                  <p className="text-sm">还没有作品，去左侧输入描述词生成第一个视频吧</p>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
