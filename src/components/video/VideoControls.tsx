'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Video } from 'lucide-react';
import type { ModelInfo } from '@/lib/hooks/useModels';
import { VideoImageUploader } from './VideoImageUploader';
import { ASPECT_RATIOS, DURATIONS, type AspectRatio, type Duration } from './video-templates';
import { useT } from '@/lib/i18n';

interface VideoControlsProps {
  models: ModelInfo[];
  videoModel: string;
  onModelChange: (id: string) => void;
  prompt: string;
  onPromptChange: (v: string) => void;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (r: AspectRatio) => void;
  duration: Duration;
  onDurationChange: (d: Duration) => void;
  imagePreview: string | null;
  imageFileName: string | null;
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
  loading: boolean;
  uploading: boolean;
  creditCost: number;
  error: string | null;
  onGenerate: () => void;
}

export function VideoControls({
  models, videoModel, onModelChange,
  prompt, onPromptChange,
  aspectRatio, onAspectRatioChange,
  duration, onDurationChange,
  imagePreview, imageFileName, onImageSelect, onImageRemove,
  loading, uploading, creditCost, error, onGenerate,
}: VideoControlsProps) {
  const { t } = useT();
  return (
    <div className="flex flex-col gap-4 p-4 md:h-full md:overflow-y-auto">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Video className="size-4 text-primary" />
        {t('video_title')}
      </h2>

      {/* 模型选择 */}
      {models.length > 1 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('video_model')}</label>
          <div className="grid grid-cols-2 gap-2">
            {models.map((m) => {
              const unavailable = !m.available;
              return (
                <button
                  key={m.id}
                  onClick={() => !unavailable && onModelChange(m.id)}
                  disabled={loading || unavailable}
                  title={unavailable ? '该模型尚未配置 API Key' : undefined}
                  className={`rounded-lg border p-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    videoModel === m.id
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
        </div>
      )}

      {/* 参考图上传 */}
      <VideoImageUploader
        previewUrl={imagePreview}
        fileName={imageFileName}
        aspectRatio={aspectRatio}
        disabled={loading}
        onSelect={onImageSelect}
        onRemove={onImageRemove}
      />

      {/* 描述词 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">运动描述词 Prompt</label>
          <span className="text-xs text-muted-foreground">{prompt.length}/1000</span>
        </div>
        <Textarea
          placeholder="描述视频的运动方式，例如：slow cinematic push-in shot, camera gently moves forward..."
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value.slice(0, 1000))}
          rows={4}
          disabled={loading}
          className="resize-none text-sm"
        />
      </div>

      {/* 视频时长 */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('video_duration')}</label>
        <div className="grid grid-cols-2 gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => onDurationChange(d.value)}
              disabled={loading}
              className={`rounded-lg border p-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                duration === d.value
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <div className="text-sm font-medium">{d.label}</div>
              <div className="text-xs text-muted-foreground">{d.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 画面比例 */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('video_ratio')}</label>
        <div className="grid grid-cols-3 gap-2">
          {ASPECT_RATIOS.map((r) => (
            <button
              key={r.value}
              onClick={() => onAspectRatioChange(r.value)}
              disabled={loading}
              className={`rounded-lg border p-2 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                aspectRatio === r.value
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <div className="text-base">{r.icon}</div>
              <div className="mt-0.5 text-xs font-medium">{r.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 生成按钮 */}
      <div className="mt-auto space-y-2 pt-2">
        <Button onClick={onGenerate} disabled={loading || !prompt.trim()} className="w-full" size="lg">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {uploading ? t('loading') : t('video_generating')}
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              {t('video_generate')} · {creditCost} {t('credits')}
            </>
          )}
        </Button>
        {!imagePreview && !loading && (
          <p className="text-center text-xs text-muted-foreground">不上传图片则使用纯文字生成视频</p>
        )}
        {error && (
          <p className="rounded-lg bg-destructive/5 px-3 py-2 text-center text-sm text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
}
