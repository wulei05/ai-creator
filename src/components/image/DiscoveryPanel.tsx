'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Compass, Download, Loader2, Sparkles, Wand2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  AI_TOOLS, PHOTO_TOOLS, TEMPLATE_CATEGORIES, TOTAL_TEMPLATE_COUNT,
  type AspectRatio, type TaskRecord,
} from './templates';

interface DiscoveryPanelProps {
  activeTab: 'discover' | 'create';
  onTabChange: (t: 'discover' | 'create') => void;
  activeCategory: string;
  onCategoryChange: (id: string) => void;
  onApplyTemplate: (prompt: string, aspect?: AspectRatio) => void;
  loading: boolean;
  generatedImage: string | null;
  history: TaskRecord[];
  onSelectHistory: (url: string) => void;
  onDownload: (url: string) => void;
  onDeleteHistory: (id: string) => void;
  onClearHistory: () => void;
}

export function DiscoveryPanel({
  activeTab, onTabChange,
  activeCategory, onCategoryChange,
  onApplyTemplate,
  loading, generatedImage, history,
  onSelectHistory, onDownload, onDeleteHistory, onClearHistory,
}: DiscoveryPanelProps) {
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
          <div className="space-y-8">
            {/* AI 工具 */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <h2 className="text-sm font-semibold">AI 工具</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {AI_TOOLS.map(({ icon: Icon, label, desc, gradient, soon }) => (
                  <button
                    key={label}
                    disabled={soon}
                    onClick={() => !soon && toast.info(`${label} 功能即将上线`)}
                    className="group relative overflow-hidden rounded-xl border bg-card text-left transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <div className={`flex h-20 w-full items-center justify-center bg-gradient-to-br ${gradient}`}>
                      <Icon className="size-8 text-white drop-shadow" />
                    </div>
                    <div className="p-2.5">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold">{label}</p>
                        {soon && (
                          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">即将上线</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* 实用写真 */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Wand2 className="size-4 text-primary" />
                <h2 className="text-sm font-semibold">实用写真</h2>
                <span className="text-xs text-muted-foreground">点击自动填充生成参数</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {PHOTO_TOOLS.map(({ title, desc, prompt, imageUrl, aspect, emoji }) => (
                  <button
                    key={title}
                    onClick={() => {
                      const ar = aspect === '3:4' ? '9:16' : aspect === '4:3' ? '16:9' : aspect;
                      onApplyTemplate(prompt, ar as AspectRatio);
                      toast.success(`已填充「${title}」参数`);
                    }}
                    className="group relative overflow-hidden rounded-xl border bg-card text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt={title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      <span className="absolute bottom-2 left-2 text-xs font-semibold text-white drop-shadow">{title}</span>
                      <span className="absolute top-2 right-2 text-lg drop-shadow">{emoji}</span>
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* 创作模版 */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Wand2 className="size-4 text-primary" />
                <h2 className="text-sm font-semibold">创作模版</h2>
                <Badge variant="secondary" className="text-xs">{TOTAL_TEMPLATE_COUNT} 个模版</Badge>
              </div>
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
                    <div className={`relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br ${template.gradient}`}>
                      {template.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={template.imageUrl}
                          alt={template.title}
                          className="absolute inset-0 h-full w-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/10" />
                      <span className="absolute top-2 right-2 text-lg drop-shadow">{template.emoji}</span>
                    </div>
                    <div className="rounded-b-xl border border-t-0 bg-card p-2">
                      <p className="truncate text-xs font-medium">{template.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 生成结果 */}
            {(loading || generatedImage) && (
              <section className="space-y-3 rounded-xl border bg-card p-5">
                <h2 className="text-sm font-semibold">生成结果</h2>
                {loading && !generatedImage && (
                  <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
                    <div className="relative">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <Sparkles className="absolute -top-1 -right-1 h-4 w-4 animate-pulse text-primary" />
                    </div>
                    <p className="text-sm">AI 正在创作中，请稍候...</p>
                  </div>
                )}
                {generatedImage && (
                  <div className="space-y-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={generatedImage} alt="Generated" className="max-h-[600px] w-full rounded-lg object-contain" />
                    <Button variant="outline" size="sm" onClick={() => onDownload(generatedImage)} className="w-full">
                      <Download className="mr-2 h-4 w-4" />下载图像
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
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="group relative cursor-pointer"
                      onClick={() => item.output_url && onSelectHistory(item.output_url)}
                    >
                      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                        {item.output_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.output_url}
                            alt={item.prompt}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            {item.status === 'failed'
                              ? <span className="text-xs text-destructive">失败</span>
                              : <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                          {item.output_url && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onDownload(item.output_url!); }}
                              className="rounded-full bg-white/20 p-1.5 transition-colors hover:bg-white/30"
                            >
                              <Download className="size-3.5 text-white" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteHistory(item.id); }}
                            className="rounded-full bg-white/20 p-1.5 transition-colors hover:bg-red-600"
                            title="删除"
                          >
                            <X className="size-3.5 text-white" />
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 line-clamp-1 px-0.5 text-xs text-muted-foreground">{item.prompt}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              !loading && !generatedImage && (
                <div className="flex flex-col items-center justify-center gap-2 py-24 text-muted-foreground">
                  <Sparkles className="size-8" />
                  <p className="text-sm">还没有作品，去左侧输入描述词生成第一张吧</p>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
