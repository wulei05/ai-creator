'use client';

import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';

interface ReferenceUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  disabled?: boolean;
  max?: number;
}

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

function readAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsDataURL(file);
  });
}

export function ReferenceUploader({ images, onChange, disabled, max = 3 }: ReferenceUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    const room = max - images.length;
    if (room <= 0) { toast.error(`最多上传 ${max} 张参考图`); return; }
    const accepted: string[] = [];
    for (const file of list.slice(0, room)) {
      if (!ALLOWED.includes(file.type)) { toast.error(`不支持的文件类型：${file.name}`); continue; }
      if (file.size > MAX_SIZE) { toast.error(`图片过大（上限 5MB）：${file.name}`); continue; }
      try { accepted.push(await readAsDataUri(file)); }
      catch { toast.error(`读取失败：${file.name}`); }
    }
    if (accepted.length > 0) onChange([...images, ...accepted]);
  };

  const removeAt = (idx: number) => onChange(images.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        参考图（选填，最多 {max} 张）
      </label>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((src, idx) => (
            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`参考图 ${idx + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(idx)}
                disabled={disabled}
                className="absolute top-1 right-1 rounded-full bg-black/60 hover:bg-red-600 p-1 transition-colors"
              >
                <X className="size-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length < max && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
          }}
          className={`flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed py-6 text-muted-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            dragOver ? 'border-primary bg-primary/5' : 'hover:border-primary/50 hover:bg-muted/40'
          }`}
        >
          <ImagePlus className="size-5" />
          <span className="text-xs">点击或拖拽上传图片</span>
          <span className="text-[10px]">JPG / PNG / WEBP，单张 ≤ 5MB</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED.join(',')}
        multiple
        hidden
        onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ''; }}
      />
    </div>
  );
}
