'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Brush, Eraser, RotateCcw, Download, Sparkles, Maximize2, ChevronLeft, Loader2, ImageIcon, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Tool = 'brush' | 'eraser';
type Mode = 'upload' | 'editing' | 'processing' | 'result';

const MAX_DIM = 1024;

function getCanvasPoint(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) * (canvas.width / rect.width),
    y: (clientY - rect.top) * (canvas.height / rect.height),
  };
}

export default function StudioPage() {
  const [mode, setMode] = useState<Mode>('upload');
  const [tool, setTool] = useState<Tool>('brush');
  const [brushSize, setBrushSize] = useState(30);
  const [prompt, setPrompt] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [expandDir, setExpandDir] = useState<'horizontal' | 'vertical'>('horizontal');
  const [pendingImage, setPendingImage] = useState<HTMLImageElement | null>(null);

  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadImage = useCallback((file: File | Blob) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      setPendingImage(img);
      setResultUrl(null);
      setMode('editing');
    };
    img.src = url;
  }, []);

  // Draw pending image once editing canvases are mounted
  useEffect(() => {
    if (!pendingImage) return;
    const ic = imageCanvasRef.current;
    const mc = maskCanvasRef.current;
    if (!ic || !mc) return;
    let w = pendingImage.naturalWidth, h = pendingImage.naturalHeight;
    if (w > MAX_DIM || h > MAX_DIM) {
      const s = MAX_DIM / Math.max(w, h);
      w = Math.round(w * s); h = Math.round(h * s);
    }
    ic.width = mc.width = w;
    ic.height = mc.height = h;
    ic.getContext('2d')!.drawImage(pendingImage, 0, 0, w, h);
    mc.getContext('2d')!.clearRect(0, 0, w, h);
    setPendingImage(null);
  }, [pendingImage, mode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) loadImage(f);
    e.target.value = '';
  };

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'));
      if (item) { e.preventDefault(); loadImage(item.getAsFile()!); }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [loadImage]);

  const draw = useCallback((clientX: number, clientY: number) => {
    const mc = maskCanvasRef.current;
    if (!mc) return;
    const ctx = mc.getContext('2d')!;
    const { x, y } = getCanvasPoint(mc, clientX, clientY);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = brushSize;
    if (tool === 'brush') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = ctx.fillStyle = 'rgba(255,80,80,0.65)';
    } else {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = ctx.fillStyle = 'rgba(0,0,0,1)';
    }
    if (lastPointRef.current) {
      ctx.beginPath(); ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y); ctx.lineTo(x, y); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2); ctx.fill();
    }
    lastPointRef.current = { x, y };
  }, [tool, brushSize]);

  const startDraw = (cx: number, cy: number) => { isDrawingRef.current = true; lastPointRef.current = null; draw(cx, cy); };
  const moveDraw  = (cx: number, cy: number) => { if (isDrawingRef.current) draw(cx, cy); };
  const endDraw   = () => { isDrawingRef.current = false; lastPointRef.current = null; };

  const exportImage = () => imageCanvasRef.current!.toDataURL('image/jpeg', 0.92);

  const exportMask = () => {
    const src = maskCanvasRef.current!;
    const off = document.createElement('canvas');
    off.width = src.width; off.height = src.height;
    const ctx = off.getContext('2d')!;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, off.width, off.height);
    ctx.drawImage(src, 0, 0);
    const d = ctx.getImageData(0, 0, off.width, off.height);
    for (let i = 0; i < d.data.length; i += 4) {
      const bright = (d.data[i] + d.data[i+1] + d.data[i+2]) / 3;
      if (d.data[i+3] > 10 && bright > 10) { d.data[i] = d.data[i+1] = d.data[i+2] = 255; d.data[i+3] = 255; }
      else { d.data[i] = d.data[i+1] = d.data[i+2] = 0; d.data[i+3] = 255; }
    }
    ctx.putImageData(d, 0, 0);
    return off.toDataURL('image/png');
  };

  const callEdit = async (body: object) => {
    setMode('processing');
    try {
      const res = await fetch('/api/ai/image/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setResultUrl(data.output_url);
      setMode('result');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
      setMode('editing');
    }
  };

  const handleInpaint = () => {
    if (!prompt.trim()) { toast.error('请输入描述想要的效果'); return; }
    callEdit({ mode: 'inpaint', image_data: exportImage(), mask_data: exportMask(), prompt });
  };

  const handleOutpaint = () => {
    const expand = expandDir === 'horizontal'
      ? { expand_left: 256, expand_right: 256, expand_top: 0, expand_bottom: 0 }
      : { expand_left: 0, expand_right: 0, expand_top: 256, expand_bottom: 256 };
    callEdit({ mode: 'outpaint', image_data: exportImage(), prompt, ...expand });
  };

  const clearMask = () => {
    const mc = maskCanvasRef.current;
    if (mc) mc.getContext('2d')!.clearRect(0, 0, mc.width, mc.height);
  };

  const useResult = async () => {
    if (!resultUrl) return;
    const blob = await fetch(resultUrl).then(r => r.blob());
    loadImage(blob);
  };

  const downloadResult = () => {
    if (!resultUrl) return;
    const a = document.createElement('a'); a.href = resultUrl; a.download = `studio-${Date.now()}.jpg`; a.click();
  };

  // ── Upload view ──────────────────────────────────────────────
  if (mode === 'upload') return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Wand2 className="h-6 w-6 text-primary" /> 创作间</h1>
        <p className="text-sm text-muted-foreground mt-1">上传图片，用 AI 画笔局部修改、扩展画面</p>
      </div>
      <div
        className="rounded-2xl border-2 border-dashed border-border hover:border-primary/40 transition-colors cursor-pointer bg-muted/20"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) loadImage(f); }}
      >
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <ImageIcon className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-semibold">点击上传或拖拽图片</p>
            <p className="text-sm text-muted-foreground mt-1">JPG · PNG · WebP，或直接 Ctrl+V 粘贴</p>
          </div>
          <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
            <Upload className="mr-2 h-4 w-4" /> 选择文件
          </Button>
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <div className="grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground">
        {[
          { icon: '🖌️', label: '局部重绘', desc: '涂抹区域，描述想要的效果' },
          { icon: '🔲', label: '扩展画面', desc: '向外延伸画面，无缝填充' },
          { icon: '✨', label: 'AI 精修', desc: '用 AI 修改细节，保持整体一致' },
        ].map(t => (
          <div key={t.label} className="rounded-xl border bg-card p-4">
            <div className="text-2xl mb-2">{t.icon}</div>
            <div className="font-medium text-foreground text-sm">{t.label}</div>
            <div className="mt-1">{t.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Result view ──────────────────────────────────────────────
  if (mode === 'result' && resultUrl) return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setMode('editing')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> 返回编辑
        </button>
        <h1 className="font-bold">生成结果</h1>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={resultUrl} alt="result" className="w-full rounded-2xl border" />
      <div className="flex gap-3">
        <Button className="flex-1" onClick={useResult}><Sparkles className="mr-2 h-4 w-4" /> 继续编辑此图</Button>
        <Button variant="outline" onClick={downloadResult}><Download className="mr-2 h-4 w-4" /> 下载</Button>
      </div>
    </div>
  );

  // ── Editing view ─────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setMode('upload')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> 重新上传
          </button>
          <h1 className="font-bold flex items-center gap-2"><Wand2 className="h-4 w-4 text-primary" /> 创作间</h1>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-2.5 flex-wrap">
        <div className="flex rounded-lg border overflow-hidden">
          {(['brush', 'eraser'] as Tool[]).map(t => (
            <button key={t} onClick={() => setTool(t)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
                tool === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {t === 'brush' ? <><Brush className="h-3.5 w-3.5" /> 画笔</> : <><Eraser className="h-3.5 w-3.5" /> 橡皮</>}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">大小</span>
          <input type="range" min={5} max={80} value={brushSize} onChange={e => setBrushSize(+e.target.value)} className="w-24 h-1.5 accent-primary" />
          <span className="text-xs text-muted-foreground w-5">{brushSize}</span>
        </div>
        <button onClick={clearMask} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground ml-auto">
          <RotateCcw className="h-3.5 w-3.5" /> 清除涂抹
        </button>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="relative rounded-2xl border overflow-hidden bg-black select-none" style={{ touchAction: 'none' }}>
        <canvas ref={imageCanvasRef} className="block w-full" />
        <canvas ref={maskCanvasRef} className="absolute inset-0 w-full h-full"
          style={{ cursor: 'crosshair', opacity: 0.75 }}
          onMouseDown={e => startDraw(e.clientX, e.clientY)}
          onMouseMove={e => moveDraw(e.clientX, e.clientY)}
          onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={e => { e.preventDefault(); startDraw(e.touches[0].clientX, e.touches[0].clientY); }}
          onTouchMove={e => { e.preventDefault(); moveDraw(e.touches[0].clientX, e.touches[0].clientY); }}
          onTouchEnd={endDraw}
        />
        {mode === 'processing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium">AI 正在处理，约 15-40 秒...</p>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        {tool === 'brush' ? '🖌️ 用画笔涂抹想修改的区域（红色高亮显示）' : '🧹 橡皮擦：擦除已涂抹区域'}
      </p>

      {/* Controls */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <Textarea value={prompt} onChange={e => setPrompt(e.target.value)}
          placeholder="描述想要的效果，例如：将背景改为海边日落、在空白处添加一棵树..."
          rows={3} className="resize-none" />
        <div className="flex gap-2 flex-wrap">
          <Button className="flex-1" onClick={handleInpaint} disabled={mode === 'processing'}>
            <Sparkles className="mr-2 h-4 w-4" /> 局部重绘
          </Button>
          <div className="flex items-center rounded-lg border overflow-hidden">
            {(['horizontal', 'vertical'] as const).map(d => (
              <button key={d} onClick={() => setExpandDir(d)}
                className={cn('px-2.5 py-2 text-xs transition-colors',
                  expandDir === d ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                {d === 'horizontal' ? '横向' : '纵向'}
              </button>
            ))}
          </div>
          <Button variant="outline" onClick={handleOutpaint} disabled={mode === 'processing'}>
            <Maximize2 className="mr-2 h-4 w-4" /> 扩展画面
          </Button>
        </div>
      </div>
    </div>
  );
}
