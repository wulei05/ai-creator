'use client';

import { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import type { AspectRatio } from './video-templates';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 10 * 1024 * 1024;

interface VideoImageUploaderProps {
  previewUrl: string | null;
  fileName: string | null;
  aspectRatio: AspectRatio;
  disabled?: boolean;
  onSelect: (file: File) => void;
  onRemove: () => void;
}

export function VideoImageUploader({
  previewUrl, fileName, aspectRatio, disabled, onSelect, onRemove,
}: VideoImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const ratioCss = aspectRatio === '9:16' ? '9 / 16' : aspectRatio === '1:1' ? '1 / 1' : '16 / 9';

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!ALLOWED.includes(file.type)) { toast.error('请上传 JPG、PNG、WebP 或 GIF 格式的图片'); return; }
    if (file.size > MAX_SIZE) { toast.error('图片大小不能超过 10MB'); return; }
    onSelect(file);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        参考图片 <span className="normal-case text-muted-foreground/60">（可选）</span>
      </label>
      <div
        className={`relative overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
        } ${previewUrl ? 'border-primary/50' : 'border-border hover:border-primary/50'}`}
        style={{ aspectRatio: ratioCss, maxHeight: '220px' }}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="参考图预览" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="absolute top-2 right-2 rounded-full bg-black/50 p-1 transition-colors hover:bg-red-600"
            >
              <X className="size-3 text-white" />
            </button>
            {fileName && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="truncate text-xs text-white">{fileName}</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 p-4 text-muted-foreground">
            <Upload className="h-7 w-7 opacity-50" />
            <p className="text-sm font-medium">点击上传参考图片</p>
            <p className="text-[11px] opacity-60">可选 · JPG/PNG/WebP/GIF · ≤ 10MB</p>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED.join(',')}
        hidden
        disabled={disabled}
        onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }}
      />
    </div>
  );
}
