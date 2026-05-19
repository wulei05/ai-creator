'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Video } from 'lucide-react';
import type { ModelInfo } from '@/lib/hooks/useModels';
import { VideoImageUploader } from './VideoImageUploader';
import { ASPECT_RATIOS, DURATIONS, type AspectRatio, type Duration } from './video-templates';

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
  return (
    <div className="flex flex-col gap-4 p-4 md:h-full md:overflow-y-auto">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Video className="size-4 text-primary" />
        视频生成
      </h2>

      {/* 模型选择 */}
      {models.length > 1 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">模型</label>
          <div className="grid grid-cols-2 gap-2">
            {models.map((m) => (
              <button
                key={m.id}
                onClick={() => onModelChange(m.id)}
                disabled={loading}
                className={`rounded-lg border p-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  videoModel === m.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <div className="text-xs font-medium">{m.label}</div>
                <div className="text-xs text-muted-foreground">{m.credits} 积分</div>
              </button>
            ))}
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
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">视频时长</label>
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
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">画面比例</label>
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
              {uploading ? '上传图片中...' : '正在生成视频，预计 1-3 分钟...'}
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              生成视频 · {creditCost} 积分
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
