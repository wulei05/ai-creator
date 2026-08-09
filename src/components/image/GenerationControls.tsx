'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Languages, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ModelInfo } from '@/lib/hooks/useModels';
import { useT } from '@/lib/i18n';
import { ReferenceUploader } from './ReferenceUploader';
import {
  ASPECT_RATIOS, NO_ASPECT_RATIO_MODELS, REFERENCE_IMAGE_MODELS,
  type AspectRatio,
} from './templates';

interface GenerationControlsProps {
  models: ModelInfo[];
  imageModel: string;
  onModelChange: (id: string) => void;
  prompt: string;
  onPromptChange: (v: string) => void;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (r: AspectRatio) => void;
  referenceImages: string[];
  onReferenceImagesChange: (imgs: string[]) => void;
  loading: boolean;
  creditCost: number;
  error: string | null;
  onGenerate: () => void;
}

export function GenerationControls({
  models, imageModel, onModelChange,
  prompt, onPromptChange,
  aspectRatio, onAspectRatioChange,
  referenceImages, onReferenceImagesChange,
  loading, creditCost, error, onGenerate,
}: GenerationControlsProps) {
  const hasRefs = referenceImages.length > 0;
  const [translating, setTranslating] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const { t } = useT();

  const handleTranslate = async () => {
    if (!prompt.trim()) { toast.error('请先输入描述词'); return; }
    setTranslating(true);
    try {
      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: prompt }),
      });
      const data = await res.json();
      if (!res.ok || !data.translated) throw new Error(data.error ?? '翻译失败');
      onPromptChange(data.translated);
      toast.success('已翻译为英文提示词');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '翻译失败，请稍后重试');
    } finally {
      setTranslating(false);
    }
  };

  const handleOptimize = async () => {
    if (!prompt.trim()) { toast.error('请先输入描述词'); return; }
    setOptimizing(true);
    try {
      const res = await fetch('/api/ai/optimize-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: prompt }),
      });
      const data = await res.json();
      if (!res.ok || !data.optimized) throw new Error(data.error ?? '优化失败');
      onPromptChange(data.optimized);
      toast.success('提示词已 AI 优化');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '优化失败，请稍后重试');
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:h-full md:overflow-y-auto">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="size-4 text-primary" />
        {t('image_title')}
      </h2>

      {/* 模型选择 */}
      {models.length > 1 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('image_model')}</label>
          <div className="grid grid-cols-2 gap-2">
            {models.map((m) => {
              const refMismatch = hasRefs && !REFERENCE_IMAGE_MODELS.includes(m.id);
              const unavailable = !m.available;
              const disabledClick = loading || refMismatch || unavailable;
              const title = unavailable
                ? '该模型尚未配置 API Key'
                : refMismatch
                  ? '该模型不支持参考图'
                  : undefined;
              return (
                <button
                  key={m.id}
                  onClick={() => !disabledClick && onModelChange(m.id)}
                  disabled={disabledClick}
                  title={title}
                  className={`relative rounded-lg border p-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    imageModel === m.id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <div className="text-xs font-medium">{m.label}</div>
                  {unavailable ? (
                    <div className="text-[10px] text-muted-foreground mt-0.5">{t('unavailable')}</div>
                  ) : (
                    <div className="text-xs text-muted-foreground">{m.credits} {t('credits')}</div>
                  )}
                </button>
              );
            })}
          </div>
          {hasRefs && (
            <p className="text-[11px] text-muted-foreground">已上传参考图，仅 Gemini image 类模型可用。</p>
          )}
        </div>
      )}

      {/* 参考图上传 */}
      <ReferenceUploader
        images={referenceImages}
        onChange={onReferenceImagesChange}
        disabled={loading}
      />

      {/* 描述词 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">描述词 Prompt</label>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{prompt.length}/1000</span>
            <button
              type="button"
              onClick={handleTranslate}
              disabled={loading || translating || optimizing || !prompt.trim()}
              title="AI 翻译为英文（英文提示词效果更佳）"
              className="flex items-center gap-1 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground px-2 py-0.5 text-[11px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {translating ? <Loader2 className="size-3 animate-spin" /> : <Languages className="size-3" />}
              {t('image_translate')}
            </button>
            <button
              type="button"
              onClick={handleOptimize}
              disabled={loading || translating || optimizing || !prompt.trim()}
              title="AI 智能优化提示词，自动补充风格、光线、构图等细节"
              className="flex items-center gap-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary px-2 py-0.5 text-[11px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {optimizing ? <Loader2 className="size-3 animate-spin" /> : <Wand2 className="size-3" />}
              {t('image_optimize')}
            </button>
          </div>
        </div>
        <Textarea
          placeholder="支持中文描述，点击「AI 翻译」转为英文效果更佳。例如：日落时分宁静的山中湖泊，写实摄影风格..."
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value.slice(0, 1000))}
          rows={5}
          disabled={loading}
          className="resize-none text-sm"
        />
      </div>

      {/* 宽高比 */}
      {!NO_ASPECT_RATIO_MODELS.includes(imageModel) && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('image_ratio')}</label>
          <div className="flex flex-wrap gap-2">
            {ASPECT_RATIOS.map((ratio) => (
              <Button
                key={ratio.value}
                variant={aspectRatio === ratio.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => onAspectRatioChange(ratio.value)}
                disabled={loading}
                className="min-w-14 text-xs"
              >
                {ratio.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 生成按钮 */}
      <div className="mt-auto space-y-2 pt-2">
        <Button onClick={onGenerate} disabled={loading || !prompt.trim()} className="w-full" size="lg">
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('image_generating')}</>
          ) : (
            <><Sparkles className="mr-2 h-4 w-4" />{t('image_generate')} · {creditCost} {t('credits')}</>
          )}
        </Button>
        {error && (
          <p className="rounded-lg bg-destructive/5 px-3 py-2 text-center text-sm text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
}
