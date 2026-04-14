'use client';

// NOTE: The 'task-uploads' Supabase Storage bucket must exist with public access enabled.
// Create it in Supabase Dashboard → Storage → New Bucket → name: "task-uploads", Public: true

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Video, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

type AspectRatio = '16:9' | '9:16' | '1:1';
type Duration = 5 | 10;

interface TaskRecord {
  id: string;
  prompt: string;
  status: string;
  output_url: string | null;
  created_at: string;
}

const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '1:1', label: '1:1' },
];

const DURATIONS: { value: Duration; label: string }[] = [
  { value: 5, label: '5秒' },
  { value: 10, label: '10秒' },
];

const CREDIT_COST = 50;
const POLL_INTERVAL = 5000;
const MAX_POLL_DURATION = 5 * 60 * 1000; // 5 minutes

export default function VideoPage() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [duration, setDuration] = useState<Duration>(5);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<TaskRecord[]>([]);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollStartRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const uploadImage = async (): Promise<string> => {
    if (!imageFile) throw new Error('No image selected');

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const timestamp = Date.now();
    const path = `${user.id}/video-inputs/${timestamp}-${imageFile.name}`;

    const { data, error } = await supabase.storage
      .from('task-uploads')
      .upload(path, imageFile, { upsert: true });

    if (error) throw new Error(`Upload failed: ${error.message}`);

    const {
      data: { publicUrl },
    } = supabase.storage.from('task-uploads').getPublicUrl(data.path);

    return publicUrl;
  };

  const pollStatus = async (taskId: string) => {
    if (Date.now() - pollStartRef.current > MAX_POLL_DURATION) {
      setLoading(false);
      setError('Generation timed out. Please try again.');
      return;
    }

    try {
      const res = await fetch(`/api/ai/video/status/${taskId}`);
      if (!res.ok) {
        setLoading(false);
        setError('Failed to check generation status.');
        return;
      }
      const data = await res.json();

      if (data.status === 'completed') {
        setLoading(false);
        if (data.output_url) {
          setGeneratedVideo(data.output_url);
        }
        fetchHistory();
        return;
      }

      if (data.status === 'failed') {
        setLoading(false);
        setError(data.error ?? 'Video generation failed.');
        fetchHistory();
        return;
      }

      // Still pending/processing — keep polling
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
    if (!imageFile) {
      toast.error('Please select a reference image');
      return;
    }

    setLoading(true);
    setUploading(true);
    setError(null);
    setGeneratedVideo(null);

    let image_url: string;
    try {
      image_url = await uploadImage();
    } catch (err) {
      setLoading(false);
      setUploading(false);
      const msg = err instanceof Error ? err.message : 'Image upload failed';
      setError(msg);
      toast.error(msg);
      return;
    }
    setUploading(false);

    try {
      const res = await fetch('/api/ai/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          image_url,
          duration,
          aspect_ratio: aspectRatio,
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
      a.download = `kling-video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">AI 视频生成</h1>
        <p className="text-muted-foreground text-sm mt-1">
          由 Kling v2 驱动，图生视频，每次生成消耗 {CREDIT_COST} 积分
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">参考图片</label>
            <div
              className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-48 mx-auto rounded object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
                  <Upload className="h-8 w-8" />
                  <p className="text-sm">点击上传参考图片</p>
                  <p className="text-xs">支持 JPG、PNG、WebP 等格式</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={loading}
            />
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">描述词 (Prompt)</label>
              <span className="text-xs text-muted-foreground">{prompt.length}/1000</span>
            </div>
            <Textarea
              placeholder="描述你想要生成的视频内容，例如：a person walking in a garden, cinematic..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, 1000))}
              rows={4}
              disabled={loading}
              className="resize-none"
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="text-sm font-medium">视频时长</label>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <Button
                  key={d.value}
                  variant={duration === d.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDuration(d.value)}
                  disabled={loading}
                  className="min-w-16"
                >
                  {d.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
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

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim() || !imageFile}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {uploading ? '上传图片中...' : '生成视频中，请耐心等待...'}
              </>
            ) : (
              <>
                <Video className="mr-2 h-4 w-4" />
                生成视频 ({CREDIT_COST} 积分)
              </>
            )}
          </Button>

          {/* Error */}
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
        </CardContent>
      </Card>

      {/* Result */}
      {(loading || generatedVideo) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">生成结果</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !generatedVideo && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm">正在生成视频，预计需要 1-3 分钟，请耐心等待...</p>
              </div>
            )}
            {generatedVideo && (
              <div className="space-y-3">
                <video
                  src={generatedVideo}
                  controls
                  className="w-full rounded-lg max-h-[600px]"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(generatedVideo)}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  下载视频
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
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-24 aspect-video bg-muted rounded overflow-hidden">
                    {item.output_url ? (
                      <video
                        src={item.output_url}
                        className="w-full h-full object-cover"
                        muted
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Video className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.prompt}</p>
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
                  {item.output_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(item.output_url!)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
