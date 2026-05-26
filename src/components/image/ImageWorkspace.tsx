'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useModels } from '@/lib/hooks/useModels';
import { useAuthGate } from '@/lib/auth-gate';
import { GenerationControls } from './GenerationControls';
import { DiscoveryPanel } from './DiscoveryPanel';
import {
  TEMPLATE_CATEGORIES, REFERENCE_IMAGE_MODELS,
  type AspectRatio, type TaskRecord,
} from './templates';

const POLL_INTERVAL = 3000;
const MAX_POLL_DURATION = 3 * 60 * 1000;

export function ImageWorkspace() {
  const { models, loading: modelsLoading } = useModels('image');
  const { require } = useAuthGate();
  const searchParams = useSearchParams();

  const [prompt, setPrompt] = useState(() => searchParams.get('prompt') ?? '');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [imageModel, setImageModel] = useState('');
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<TaskRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'discover' | 'create'>('discover');
  const [activeCategory, setActiveCategory] = useState(TEMPLATE_CATEGORIES[0].id);

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollStartRef = useRef<number>(0);

  // 默认选中第一个模型
  useEffect(() => {
    if (models.length > 0 && !models.find((m) => m.id === imageModel)) {
      setImageModel(models[0].id);
    }
  }, [models, imageModel]);

  // 上传参考图后，若当前模型不支持，自动切到第一个支持的模型
  useEffect(() => {
    if (referenceImages.length > 0 && !REFERENCE_IMAGE_MODELS.includes(imageModel)) {
      const supported = models.find((m) => REFERENCE_IMAGE_MODELS.includes(m.id));
      if (supported) setImageModel(supported.id);
    }
  }, [referenceImages, imageModel, models]);

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
    return () => { if (pollTimerRef.current) clearTimeout(pollTimerRef.current); };
  }, []);

  const pollStatus = async (taskId: string) => {
    // pollStatus 经 setTimeout 调用，非渲染期；Date.now 在此安全
    // eslint-disable-next-line react-hooks/purity
    if (Date.now() - pollStartRef.current > MAX_POLL_DURATION) {
      setLoading(false);
      setError('Generation timed out. Please try again.');
      return;
    }
    try {
      const res = await fetch(`/api/ai/image/status/${taskId}`);
      if (!res.ok) { setLoading(false); setError('Failed to check generation status.'); return; }
      const data = await res.json();
      if (data.status === 'completed') {
        setLoading(false);
        if (data.output_urls?.[0]) setGeneratedImage(data.output_urls[0]);
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
    if (!require()) return;
    if (!prompt.trim()) { toast.error('请输入描述词'); return; }
    setLoading(true);
    setError(null);
    setGeneratedImage(null);
    setActiveTab('create');
    try {
      const res = await fetch('/api/ai/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspect_ratio: aspectRatio,
          model: imageModel,
          reference_images: referenceImages,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoading(false);
        setError(data.error ?? 'Failed to start generation');
        toast.error(data.error === 'Insufficient credits' ? '积分不足，请购买积分' : (data.error ?? 'Failed to start generation'));
        return;
      }
      if (data.status === 'completed' && data.output_url) {
        setLoading(false);
        setGeneratedImage(data.output_url);
        fetchHistory();
        return;
      }
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

  const handleApplyTemplate = (tplPrompt: string, aspect?: AspectRatio) => {
    setPrompt(tplPrompt);
    if (aspect) setAspectRatio(aspect);
  };

  const handleDeleteHistory = async (id: string) => {
    await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
    setHistory((prev) => prev.filter((h) => h.id !== id));
    toast.success('已删除');
  };

  const handleClearHistory = async () => {
    if (!confirm('确认清空全部图像记录？')) return;
    await fetch('/api/tasks?type=image', { method: 'DELETE' });
    setHistory([]);
    toast.success('已清空');
  };

  if (modelsLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        <span>加载模型列表...</span>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="p-6">
        <h1 className="mb-2 text-2xl font-semibold">AI 图像生成</h1>
        <p className="text-muted-foreground">暂无可用的图像模型，请在管理后台配置 FAL_KEY 或 GOOGLE_API_KEY。</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 md:flex-row">
      {/* 左栏：控制面板 */}
      <div className="shrink-0 overflow-hidden rounded-xl border bg-card md:w-[340px]">
        <GenerationControls
          models={models}
          imageModel={imageModel}
          onModelChange={setImageModel}
          prompt={prompt}
          onPromptChange={setPrompt}
          aspectRatio={aspectRatio}
          onAspectRatioChange={setAspectRatio}
          referenceImages={referenceImages}
          onReferenceImagesChange={setReferenceImages}
          loading={loading}
          creditCost={creditCost}
          error={error}
          onGenerate={handleGenerate}
        />
      </div>

      {/* 右栏：发现 / 创建 */}
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border bg-card">
        <DiscoveryPanel
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          onApplyTemplate={handleApplyTemplate}
          loading={loading}
          generatedImage={generatedImage}
          history={history}
          onSelectHistory={(url) => { setGeneratedImage(url); setActiveTab('create'); }}
          onDownload={handleDownload}
          onDeleteHistory={handleDeleteHistory}
          onClearHistory={handleClearHistory}
        />
      </div>
    </div>
  );
}
