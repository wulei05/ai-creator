'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles } from 'lucide-react';
import type { ModelInfo } from '@/lib/hooks/useModels';
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

  return (
    <div className="flex flex-col gap-4 p-4 md:h-full md:overflow-y-auto">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="size-4 text-primary" />
        图片生成
      </h2>

      {/* 模型选择 */}
      {models.length > 1 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">模型</label>
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
                    <div className="text-[10px] text-muted-foreground mt-0.5">暂未支持</div>
                  ) : (
                    <div className="text-xs text-muted-foreground">{m.credits} 积分</div>
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
          <span className="text-xs text-muted-foreground">{prompt.length}/1000</span>
        </div>
        <Textarea
          placeholder="描述你想要生成的图像，例如：a serene mountain lake at sunset, photorealistic, 8k..."
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
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">宽高比</label>
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
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />正在生成图像，请稍候...</>
          ) : (
            <><Sparkles className="mr-2 h-4 w-4" />生成图像 · {creditCost} 积分</>
          )}
        </Button>
        {error && (
          <p className="rounded-lg bg-destructive/5 px-3 py-2 text-center text-sm text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
}
