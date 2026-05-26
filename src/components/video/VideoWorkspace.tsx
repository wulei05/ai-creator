'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useModels } from '@/lib/hooks/useModels';
import { useAuthGate } from '@/lib/auth-gate';
import { VideoControls } from './VideoControls';
import { VideoDiscoveryPanel } from './VideoDiscoveryPanel';
import { TEMPLATE_CATEGORIES, type AspectRatio, type Duration, type TaskRecord } from './video-templates';

const POLL_INTERVAL = 5000;
const MAX_POLL_DURATION = 5 * 60 * 1000;

export function VideoWorkspace() {
  const { models, loading: modelsLoading } = useModels('video');
  const { require } = useAuthGate();
  const searchParams = useSearchParams();

  const [videoModel, setVideoModel] = useState('');
  const [prompt, setPrompt] = useState(() => searchParams.get('prompt') ?? '');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [duration, setDuration] = useState<Duration>(5);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<TaskRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'discover' | 'create'>('discover');
  const [activeCategory, setActiveCategory] = useState(TEMPLATE_CATEGORIES[0].id);

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollStartRef = useRef<number>(0);

  // 默认选中第一个可用模型
  useEffect(() => {
    if (models.length === 0) return;
    const current = models.find((m) => m.id === videoModel);
    if (!current || !current.available) {
      const firstAvailable = models.find((m) => m.available);
      if (firstAvailable) setVideoModel(firstAvailable.id);
    }
  }, [models, videoModel]);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/ai/video/history');
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

  // 卸载时回收预览 URL
  useEffect(() => {
    return () => { if (imagePreview) URL.revokeObjectURL(imagePreview); };
  }, [imagePreview]);

  const handleImageSelect = (file: File) => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleImageRemove = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Upload failed');
    return json.url as string;
  };

  const pollStatus = async (taskId: string) => {
    // pollStatus 经 setTimeout 调用，非渲染期；Date.now 在此安全
    // eslint-disable-next-line react-hooks/purity
    if (Date.now() - pollStartRef.current > MAX_POLL_DURATION) {
      setLoading(false);
      setError('Generation timed out. Please try again.');
      return;
    }
    try {
      const res = await fetch(`/api/ai/video/status/${taskId}`);
      if (!res.ok) { setLoading(false); setError('Failed to check generation status.'); return; }
      const data = await res.json();
      if (data.status === 'completed') {
        setLoading(false);
        if (data.output_url) setGeneratedVideo(data.output_url);
        fetchHistory();
        return;
      }
      if (data.status === 'failed') {
        setLoading(false);
        setError(data.error ?? 'Video generation failed.');
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
    setGeneratedVideo(null);
    setActiveTab('create');

    let image_url: string | undefined;
    if (imageFile) {
      setUploading(true);
      try {
        image_url = await uploadImage(imageFile);
      } catch (err) {
        setLoading(false);
        setUploading(false);
        const msg = err instanceof Error ? err.message : 'Image upload failed';
        setError(msg);
        toast.error(msg);
        return;
      }
      setUploading(false);
    }

    try {
      const res = await fetch('/api/ai/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          image_url,
          duration,
          aspect_ratio: aspectRatio,
          model: videoModel || 'kling-v2',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoading(false);
        setError(data.error ?? 'Failed to start generation');
        toast.error(data.error === 'Insufficient credits' ? '积分不足，请购买积分' : (data.error ?? 'Failed to start generation'));
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
      a.download = `ai-video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  const handleDeleteHistory = async (id: string) => {
    await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
    setHistory((prev) => prev.filter((h) => h.id !== id));
    toast.success('已删除');
  };

  const handleClearHistory = async () => {
    if (!confirm('确认清空全部视频记录？')) return;
    await fetch('/api/tasks?type=video', { method: 'DELETE' });
    setHistory([]);
    toast.success('已清空');
  };

  const creditCost = models.find((m) => m.id === videoModel)?.credits ?? 0;

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
        <h1 className="mb-2 text-2xl font-semibold">AI 视频生成</h1>
        <p className="text-muted-foreground">暂无可用的视频模型，请在管理后台配置 KLING_API_KEY 或 GOOGLE_API_KEY。</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 md:flex-row">
      {/* 左栏：控制面板 */}
      <div className="shrink-0 overflow-hidden rounded-xl border bg-card md:w-[340px]">
        <VideoControls
          models={models}
          videoModel={videoModel}
          onModelChange={setVideoModel}
          prompt={prompt}
          onPromptChange={setPrompt}
          aspectRatio={aspectRatio}
          onAspectRatioChange={setAspectRatio}
          duration={duration}
          onDurationChange={setDuration}
          imagePreview={imagePreview}
          imageFileName={imageFile?.name ?? null}
          onImageSelect={handleImageSelect}
          onImageRemove={handleImageRemove}
          loading={loading}
          uploading={uploading}
          creditCost={creditCost}
          error={error}
          onGenerate={handleGenerate}
        />
      </div>

      {/* 右栏：发现 / 创建 */}
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border bg-card">
        <VideoDiscoveryPanel
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          onApplyTemplate={setPrompt}
          loading={loading}
          generatedVideo={generatedVideo}
          history={history}
          onSelectHistory={(url) => { setGeneratedVideo(url); setActiveTab('create'); }}
          onDownload={handleDownload}
          onDeleteHistory={handleDeleteHistory}
          onClearHistory={handleClearHistory}
        />
      </div>
    </div>
  );
}
