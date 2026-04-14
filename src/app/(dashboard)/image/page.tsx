'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useModels } from '@/lib/hooks/useModels';

type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3';

interface TaskRecord {
  id: string;
  prompt: string;
  status: string;
  output_url: string | null;
  created_at: string;
}

const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: '1:1', label: '1:1' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '4:3', label: '4:3' },
];

const POLL_INTERVAL = 3000;
const MAX_POLL_DURATION = 3 * 60 * 1000;

// Models that don't support aspect ratio selection
const NO_ASPECT_RATIO_MODELS = ['imagen-3', 'imagen-3-fast', 'gemini-image-flash', 'gemini-image-flash-exp'];

export default function ImagePage() {
  const { models, loading: modelsLoading } = useModels('image');

  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [imageModel, setImageModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<TaskRecord[]>([]);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollStartRef = useRef<number>(0);

  // Default to first available model
  useEffect(() => {
    if (models.length > 0 && !models.find((m) => m.id === imageModel)) {
      setImageModel(models[0].id);
    }
  }, [models, imageModel]);

  const currentModel = models.find((m) => m.id === imageModel);
  const creditCost = currentModel?.credits ?? 0;

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/ai/image/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.tasks ?? []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchHistory();
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  const pollStatus = async (taskId: string) => {
    if (Date.now() - pollStartRef.current > MAX_POLL_DURATION) {
      setLoading(false);
      setError('Generation timed out. Please try again.');
      return;
    }

    try {
      const res = await fetch(`/api/ai/image/status/${taskId}`);
      if (!res.ok) {
        setLoading(false);
        setError('Failed to check generation status.');
        return;
      }
      const data = await res.json();

      if (data.status === 'completed') {
        setLoading(false);
        if (data.output_urls?.[0]) {
          setGeneratedImage(data.output_urls[0]);
        }
        fetchHistory();
        return;
      }

      if (data.status === 'failed') {
        setLoading(false);
        setError(data.error ?? 'Image generation failed.');
        fetchHistory();
        return;
      }

      pollTimerRef.current = setTimeout(() => pollStatus(taskId), POLL_INTERVAL);
    } catch {
      setLoading(false);
      setError('Network error while checking status.');
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const res = await fetch('/api/ai/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspect_ratio: aspectRatio,
          model: imageModel,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        setError(data.error ?? 'Failed to start generation');
        if (data.error === 'Insufficient credits') {
          toast.error('积分不足，请购买积分');
        } else {
          toast.error(data.error ?? 'Failed to start generation');
        }
        return;
      }

      // Gemini returns completed immediately with output_url
      if (data.status === 'completed' && data.output_url) {
        setLoading(false);
        setGeneratedImage(data.output_url);
        fetchHistory();
        return;
      }

      // Flux Pro: start polling
      pollStartRef.current = Date.now();
      pollTimerRef.current = setTimeout(() => pollStatus(data.task_id), POLL_INTERVAL);
    } catch {
      setLoading(false);
      setError('Network error. Please try again.');
      toast.error('Network error. Please try again.');
    }
  };

  const handleDownload = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `ai-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  if (modelsLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin mr-2" />
        <span>加载模型列表...</span>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">AI 图像生成</h1>
        <p className="text-muted-foreground">暂无可用的图像模型，请在管理后台配置 FAL_KEY 或 GOOGLE_API_KEY。</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">AI 图像生成</h1>
        <p className="text-muted-foreground text-sm mt-1">选择模型，输入描述词生成图像</p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          {/* Model selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">模型</label>
            <div className="flex gap-2">
              {models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setImageModel(m.id)}
                  disabled={loading}
                  className={`flex-1 rounded-lg border p-3 text-left transition-colors ${
                    imageModel === m.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium text-sm">{m.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {m.credits} 积分
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">描述词 (Prompt)</label>
              <span className="text-xs text-muted-foreground">{prompt.length}/1000</span>
            </div>
            <Textarea
              placeholder="描述你想要生成的图像，例如：a serene mountain lake at sunset, photorealistic..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, 1000))}
              rows={4}
              disabled={loading}
              className="resize-none"
            />
          </div>

          {/* Aspect Ratio — hidden for models that don't support it */}
          {!NO_ASPECT_RATIO_MODELS.includes(imageModel) && (
            <div className="space-y-2">
              <label className="text-sm font-medium">宽高比</label>
              <div className="flex gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <Button
                    key={ratio.value}
                    variant={aspectRatio === ratio.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAspectRatio(ratio.value)}
                    disabled={loading}
                    className="min-w-16"
                  >
                    {ratio.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                生成中{imageModel === 'gemini-image' ? '（约10-20秒）' : '...'}
              </>
            ) : (
              <>
                <ImageIcon className="mr-2 h-4 w-4" />
                生成图像 ({creditCost} 积分)
              </>
            )}
          </Button>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Result */}
      {(loading || generatedImage) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">生成结果</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !generatedImage && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm">正在生成图像，请稍候...</p>
              </div>
            )}
            {generatedImage && (
              <div className="space-y-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={generatedImage}
                  alt="Generated image"
                  className="w-full rounded-lg object-contain max-h-[600px]"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(generatedImage)}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  下载图像
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">最近生成记录</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {history.map((item) => (
                <div key={item.id} className="space-y-1">
                  <div className="relative aspect-square bg-muted rounded-md overflow-hidden">
                    {item.output_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.output_url}
                        alt={item.prompt}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge
                      variant={
                        item.status === 'completed'
                          ? 'default'
                          : item.status === 'failed'
                          ? 'destructive'
                          : 'secondary'
                      }
                      className="text-xs px-1 py-0"
                    >
                      {item.status === 'completed'
                        ? '完成'
                        : item.status === 'failed'
                        ? '失败'
                        : '进行中'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{item.prompt}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
