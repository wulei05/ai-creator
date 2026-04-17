'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Sparkles, Square, Upload, ExternalLink, ChevronDown, ChevronUp, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { stripCodeBlock, type WebTemplate } from '@/lib/ai/web-shared';
import type { ModelInfo } from '@/app/api/models/route';

const TEMPLATES: { id: WebTemplate; icon: string; name: string; desc: string }[] = [
  { id: 'math',    icon: '📐', name: '数学可视化', desc: '函数图像、几何动画' },
  { id: 'physics', icon: '🌊', name: '物理模拟',   desc: '粒子、重力、流体' },
  { id: 'chart',   icon: '📊', name: '数据图表',   desc: '交互式图表' },
  { id: 'game',    icon: '🎮', name: '小游戏',     desc: '浏览器小游戏' },
  { id: 'tool',    icon: '🔧', name: '实用工具',   desc: '计算器、转换器' },
  { id: 'free',    icon: '✨', name: '自由发挥',   desc: '不限类型' },
];

type GenMode = 'idle' | 'generating' | 'done';

export function WebToolTab() {
  const [template, setTemplate]       = useState<WebTemplate>('free');
  const [prompt, setPrompt]           = useState('');
  const [model, setModel]             = useState('');
  const [models, setModels]           = useState<ModelInfo[]>([]);
  const [imageData, setImageData]     = useState<string | null>(null);
  const [mode, setMode]               = useState<GenMode>('idle');
  const [html, setHtml]               = useState('');
  const [showCode, setShowCode]       = useState(false);
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  const iframeRef    = useRef<HTMLIFrameElement>(null);
  const abortRef     = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accHtmlRef   = useRef('');

  useEffect(() => {
    fetch('/api/models')
      .then(r => r.json())
      .then((data: { chat?: ModelInfo[] }) => {
        const chatModels = data.chat ?? [];
        setModels(chatModels);
        if (chatModels.length > 0) setModel(chatModels[0].id);
      })
      .catch(() => {});
  }, []);

  const updatePreview = useCallback((content: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        if (iframeRef.current) iframeRef.current.srcdoc = content;
      } catch { /* silent */ }
    }, 300);
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error('请输入描述'); return; }
    if (!model) { toast.error('请选择模型'); return; }

    abortRef.current = new AbortController();
    setMode('generating');
    setHtml('');
    setDeployedUrl(null);
    accHtmlRef.current = '';

    try {
      const res = await fetch('/api/ai/web/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, template, model, image_data: imageData }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? '生成失败');
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') break outer;
          try {
            const obj = JSON.parse(payload) as { delta?: string; error?: string };
            if (obj.error) throw new Error(obj.error);
            if (obj.delta) {
              accHtmlRef.current += obj.delta;
              updatePreview(accHtmlRef.current);
            }
          } catch (e) {
            if (e instanceof Error && e.message !== 'Unexpected end of JSON input') throw e;
          }
        }
      }

      const finalHtml = stripCodeBlock(accHtmlRef.current);
      setHtml(finalHtml);
      updatePreview(finalHtml);
      setMode('done');
    } catch (err) {
      if ((err as Error).name === 'AbortError') { setMode('idle'); return; }
      toast.error(err instanceof Error ? err.message : '生成失败');
      setMode('idle');
    }
  };

  const handleStop = () => { abortRef.current?.abort(); setMode('idle'); };

  const handleDeploy = async () => {
    if (!html) return;
    setIsDeploying(true);
    try {
      const res = await fetch('/api/github/gist/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, description: `AI 网页工具 - ${prompt.slice(0, 50)}` }),
      });
      const data = await res.json() as { error?: string; preview_url?: string };
      if (!res.ok) throw new Error(data.error ?? '部署失败');
      setDeployedUrl(data.preview_url ?? null);
      toast.success('部署成功！');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '部署失败');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageData(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const isGenerating = mode === 'generating';
  const hasDone = mode === 'done' && !!html;

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-[600px]">
      {/* Left: Input */}
      <div className="lg:w-2/5 space-y-4 flex flex-col">
        <div className="grid grid-cols-3 gap-2">
          {TEMPLATES.map(t => (
            <button key={t.id} onClick={() => setTemplate(t.id)}
              className={cn(
                'rounded-xl border p-3 text-left transition-colors',
                template === t.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40',
              )}>
              <div className="text-xl mb-1">{t.icon}</div>
              <div className="text-xs font-medium">{t.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5 hidden sm:block">{t.desc}</div>
            </button>
          ))}
        </div>

        <Textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="描述你想要的工具，例如：生成一个可以调节 a、b、c 参数的二次函数抛物线动画..."
          rows={4}
          className="resize-none"
          disabled={isGenerating}
        />

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isGenerating}>
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            {imageData ? '已上传参考图' : '上传参考图（可选）'}
          </Button>
          {imageData && (
            <button onClick={() => setImageData(null)} className="text-xs text-muted-foreground hover:text-foreground">
              移除
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </div>

        <select
          value={model}
          onChange={e => setModel(e.target.value)}
          disabled={isGenerating}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {models.length === 0 && <option value="">加载模型中...</option>}
          {models.map(m => (
            <option key={m.id} value={m.id}>{m.label} ({m.credits} 积分/K)</option>
          ))}
        </select>

        {isGenerating ? (
          <Button variant="outline" onClick={handleStop} className="w-full">
            <Square className="mr-2 h-4 w-4" /> 停止生成
          </Button>
        ) : (
          <Button onClick={handleGenerate} className="w-full" disabled={!prompt.trim() || !model}>
            <Sparkles className="mr-2 h-4 w-4" /> 生成网页
          </Button>
        )}
      </div>

      {/* Right: Preview */}
      <div className="lg:w-3/5 flex flex-col gap-3">
        <div className="flex-1 rounded-2xl border overflow-hidden bg-muted/20 min-h-[400px] relative">
          {!html && !isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              生成结果将在此实时预览
            </div>
          )}
          {isGenerating && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-full border">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              AI 正在生成...
            </div>
          )}
          <iframe
            ref={iframeRef}
            sandbox="allow-scripts"
            className="w-full h-full border-0"
            title="web tool preview"
          />
        </div>

        {hasDone && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={handleDeploy} disabled={isDeploying}>
              <Rocket className="mr-2 h-4 w-4" />
              {isDeploying ? '部署中...' : '部署到 Gist'}
            </Button>
            {deployedUrl && (
              <a href={deployedUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> 在新标签打开
                </Button>
              </a>
            )}
            <button
              onClick={() => setShowCode(v => !v)}
              className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {showCode ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {showCode ? '收起代码' : '查看代码'}
            </button>
          </div>
        )}

        {showCode && html && (
          <div className="rounded-xl border bg-muted/30 p-3 max-h-64 overflow-auto">
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all">{html}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
