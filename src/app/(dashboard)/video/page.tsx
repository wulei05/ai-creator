'use client';

// NOTE: The 'task-uploads' Supabase Storage bucket must exist with public access enabled.
// Create it in Supabase Dashboard → Storage → New Bucket → name: "task-uploads", Public: true

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Download, Video, Loader2, Upload, Sparkles, Wand2, Play, ChevronRight, X } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useModels } from '@/lib/hooks/useModels';

type AspectRatio = '16:9' | '9:16' | '1:1';
type Duration = 5 | 10;

interface TaskRecord {
  id: string;
  prompt: string;
  status: string;
  output_url: string | null;
  created_at: string;
}

interface Template {
  title: string;
  desc: string;
  prompt: string;
  gradient: string;
  emoji: string;
}

interface TemplateCategory {
  id: string;
  label: string;
  emoji: string;
  templates: Template[];
}

const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: 'cinematic',
    label: '电影镜头',
    emoji: '🎬',
    templates: [
      {
        title: '慢推镜头',
        desc: '缓慢推近，景深虚化',
        prompt: 'slow cinematic push-in shot, camera gently moves forward, bokeh depth of field, dramatic lighting, film grain, 24fps cinematic look',
        gradient: 'from-slate-700 via-gray-600 to-zinc-800',
        emoji: '🎥',
      },
      {
        title: '环绕飞行',
        desc: '无人机环绕俯拍',
        prompt: 'aerial drone shot slowly orbiting around the subject, sweeping circular movement, golden hour light, epic cinematic scale',
        gradient: 'from-sky-500 via-blue-600 to-indigo-700',
        emoji: '🚁',
      },
      {
        title: '雨中特写',
        desc: '雨滴打落，情绪渲染',
        prompt: 'close-up shot with rain falling, water droplets hitting surface, slow motion, moody atmospheric lighting, shallow depth of field, cinematic',
        gradient: 'from-blue-600 via-slate-600 to-gray-700',
        emoji: '🌧️',
      },
      {
        title: '黄金时刻',
        desc: '日落光线横扫画面',
        prompt: 'golden hour sunlight sweeping across the scene, long shadows moving, warm orange glow, lens flare, epic landscape cinematography',
        gradient: 'from-orange-500 via-amber-500 to-yellow-500',
        emoji: '🌅',
      },
      {
        title: '烟雾缭绕',
        desc: '烟雾弥漫神秘感',
        prompt: 'atmospheric fog and smoke slowly drifting through scene, mystical mood, soft diffused light, cinematic color grading, dreamlike quality',
        gradient: 'from-purple-600 via-violet-500 to-indigo-600',
        emoji: '🌫️',
      },
      {
        title: '时光流逝',
        desc: '快速延时摄影效果',
        prompt: 'dynamic time-lapse effect, clouds racing across sky, light shifting dramatically, fast motion, epic timelapse cinematography, wide angle',
        gradient: 'from-teal-500 via-cyan-500 to-sky-600',
        emoji: '⏩',
      },
    ],
  },
  {
    id: 'nature',
    label: '自然风景',
    emoji: '🌿',
    templates: [
      {
        title: '海浪拍岸',
        desc: '海浪涌动，浪花飞溅',
        prompt: 'ocean waves crashing against rocky shore, slow motion white foam and spray, turquoise water, dramatic coastal scenery, natural sound',
        gradient: 'from-cyan-500 via-blue-500 to-teal-600',
        emoji: '🌊',
      },
      {
        title: '森林晨光',
        desc: '光线穿透树冠洒落',
        prompt: 'morning sunlight rays filtering through forest canopy, god rays through trees, leaves gently swaying in breeze, peaceful atmosphere, birds in background',
        gradient: 'from-green-600 via-emerald-500 to-teal-500',
        emoji: '🌲',
      },
      {
        title: '瀑布飞流',
        desc: '瀑布湍急，水雾弥漫',
        prompt: 'powerful waterfall cascading down rocky cliff, slow motion water and mist, rainbow in spray, lush green surroundings, epic nature shot',
        gradient: 'from-blue-500 via-teal-500 to-emerald-500',
        emoji: '💦',
      },
      {
        title: '花田风吹',
        desc: '风吹花海，随风起伏',
        prompt: 'vast flower field gently swaying in the wind, soft breeze creating wave-like motion across blossoms, golden hour light, romantic and peaceful',
        gradient: 'from-pink-400 via-rose-400 to-orange-300',
        emoji: '🌸',
      },
      {
        title: '极光舞动',
        desc: '极光在夜空中舞动',
        prompt: 'northern lights aurora borealis dancing across night sky, vivid green and purple colors swirling, stars visible, reflection in still lake below',
        gradient: 'from-green-400 via-teal-500 to-indigo-600',
        emoji: '🌌',
      },
      {
        title: '火山喷发',
        desc: '岩浆涌动壮观震撼',
        prompt: 'volcanic lava slowly flowing down mountain slope at night, glowing orange and red molten rock, steam and smoke, epic geological power',
        gradient: 'from-red-600 via-orange-600 to-amber-500',
        emoji: '🌋',
      },
    ],
  },
  {
    id: 'character',
    label: '人物动态',
    emoji: '🧍',
    templates: [
      {
        title: '头发飘动',
        desc: '发丝随风自然飘扬',
        prompt: 'hair gently flowing in the wind, soft breeze, natural movement, close-up portrait, cinematic depth of field, beautiful light',
        gradient: 'from-amber-400 via-orange-400 to-rose-400',
        emoji: '💨',
      },
      {
        title: '眨眼微笑',
        desc: '自然眨眼，嘴角微扬',
        prompt: 'subtle facial animation, natural blinking, gentle smile forming, soft portrait lighting, lifelike micro-expressions, cinematic close-up',
        gradient: 'from-pink-400 via-rose-400 to-red-400',
        emoji: '😊',
      },
      {
        title: '衣袂飘飘',
        desc: '衣物随风优雅飘动',
        prompt: 'flowing fabric and clothing swaying gracefully in wind, elegant slow motion, soft light playing on fabric texture, dramatic and beautiful',
        gradient: 'from-violet-400 via-purple-400 to-indigo-500',
        emoji: '👗',
      },
      {
        title: '舞蹈动作',
        desc: '流畅舞蹈动作展现',
        prompt: 'graceful dance movement, fluid body motion, spinning and flowing, artistic choreography, dramatic lighting, slow motion beauty',
        gradient: 'from-fuchsia-500 via-pink-500 to-rose-500',
        emoji: '💃',
      },
      {
        title: '武术出击',
        desc: '武术动作快速有力',
        prompt: 'martial arts strike in slow motion, powerful punch or kick, motion blur on fast movement, dramatic impact, black background, cinematic action',
        gradient: 'from-orange-600 via-red-600 to-rose-700',
        emoji: '🥋',
      },
      {
        title: '转身回眸',
        desc: '优雅转身，眼神深邃',
        prompt: 'person slowly turning around to look back over shoulder, hair sweeping motion, mysterious and alluring expression, cinematic slow motion, beautiful lighting',
        gradient: 'from-indigo-400 via-blue-500 to-cyan-500',
        emoji: '👀',
      },
    ],
  },
  {
    id: 'animals',
    label: '动物生灵',
    emoji: '🐾',
    templates: [
      {
        title: '猫咪懒伸',
        desc: '猫咪慵懒伸展打呵欠',
        prompt: 'cat slowly stretching and yawning, lazy afternoon movement, soft fur detail, cozy home environment, natural cute animal behavior',
        gradient: 'from-orange-400 via-amber-400 to-yellow-400',
        emoji: '🐱',
      },
      {
        title: '雄鹰翱翔',
        desc: '老鹰展翅翱翔蓝天',
        prompt: 'eagle soaring gracefully through blue sky, wings spread wide, thermal updraft gliding, epic bird of prey, slow motion feather detail',
        gradient: 'from-sky-500 via-blue-600 to-indigo-600',
        emoji: '🦅',
      },
      {
        title: '马儿奔腾',
        desc: '骏马在草原上飞驰',
        prompt: 'horse galloping across open meadow, mane and tail flowing in wind, slow motion hooves hitting ground, dramatic golden hour, epic freedom',
        gradient: 'from-amber-500 via-orange-500 to-red-500',
        emoji: '🐎',
      },
      {
        title: '鱼群穿梭',
        desc: '鱼群在珊瑚礁中游弋',
        prompt: 'school of colorful fish swimming through coral reef, synchronized movement, shimmering scales catching light, clear blue tropical water, underwater paradise',
        gradient: 'from-cyan-400 via-teal-500 to-blue-600',
        emoji: '🐟',
      },
      {
        title: '蝴蝶飞舞',
        desc: '蝴蝶在花丛中翩翩飞',
        prompt: 'butterfly slowly flapping wings and flying from flower to flower, delicate wing patterns in detail, soft bokeh garden background, magical nature moment',
        gradient: 'from-yellow-400 via-orange-400 to-pink-400',
        emoji: '🦋',
      },
      {
        title: '狼嚎月夜',
        desc: '孤狼对月长嚎',
        prompt: 'wolf howling at full moon on rocky hilltop, dramatic backlit silhouette, moonlit landscape, atmospheric mist, epic wildlife moment, cinematic',
        gradient: 'from-indigo-700 via-blue-700 to-slate-800',
        emoji: '🐺',
      },
    ],
  },
  {
    id: 'magic',
    label: '魔法特效',
    emoji: '✨',
    templates: [
      {
        title: '魔法粒子',
        desc: '绚丽粒子环绕飞散',
        prompt: 'magical sparkling particles swirling and floating around subject, glowing light trails, mystical energy, fantasy visual effects, ethereal atmosphere',
        gradient: 'from-purple-500 via-violet-500 to-indigo-500',
        emoji: '🔮',
      },
      {
        title: '火焰燃烧',
        desc: '烈焰腾起，火光耀眼',
        prompt: 'dramatic fire and flames rising upward, slow motion fire movement, orange and red glow, embers floating, powerful elemental energy, dark background',
        gradient: 'from-red-500 via-orange-500 to-yellow-500',
        emoji: '🔥',
      },
      {
        title: '闪电风暴',
        desc: '雷电交加震撼场面',
        prompt: 'lightning bolt striking dramatically, electric discharge branching across dark storm sky, thunder and light, high voltage energy, slow motion capture',
        gradient: 'from-yellow-400 via-amber-500 to-slate-700',
        emoji: '⚡',
      },
      {
        title: '冰霜蔓延',
        desc: '冰晶快速向外扩散',
        prompt: 'ice crystals rapidly spreading and forming across surface, frost patterns growing in real time, cold blue light, macro detail, mesmerizing time-lapse',
        gradient: 'from-cyan-300 via-blue-400 to-indigo-500',
        emoji: '❄️',
      },
      {
        title: '花朵绽放',
        desc: '花朵快速开放展示',
        prompt: 'flower blooming in fast time-lapse, petals slowly opening, dew drops on petals, soft morning light, macro photography, beautiful nature transformation',
        gradient: 'from-rose-400 via-pink-400 to-fuchsia-500',
        emoji: '🌹',
      },
      {
        title: '星轨旋转',
        desc: '星空缓慢旋转流动',
        prompt: 'star trails rotating around north star in night sky, long exposure milky way movement, stars as light streaks, dark clear sky, cosmic time-lapse',
        gradient: 'from-indigo-700 via-purple-700 to-blue-800',
        emoji: '🌠',
      },
    ],
  },
  {
    id: 'urban',
    label: '城市街景',
    emoji: '🏙️',
    templates: [
      {
        title: '霓虹夜雨',
        desc: '雨夜霓虹倒影闪烁',
        prompt: 'neon lights reflecting on wet city streets at night, rain falling, colorful reflections in puddles, urban atmosphere, cinematic night shot, bokeh lights',
        gradient: 'from-fuchsia-600 via-purple-600 to-blue-700',
        emoji: '🌃',
      },
      {
        title: '车流光轨',
        desc: '夜间车流形成光线',
        prompt: 'city traffic light trails at night, long exposure effect, red and white streaks on highway, urban nightscape, time-lapse speed, aerial perspective',
        gradient: 'from-red-600 via-orange-500 to-yellow-500',
        emoji: '🚗',
      },
      {
        title: '地铁呼啸',
        desc: '地铁快速驶过站台',
        prompt: 'subway train rushing past platform, motion blur, wind effect, commuters as silhouettes, underground station lighting, dynamic urban energy',
        gradient: 'from-gray-600 via-slate-600 to-zinc-700',
        emoji: '🚇',
      },
      {
        title: '繁华市集',
        desc: '熙熙攘攘的街市人流',
        prompt: 'busy Asian night market, crowd of people walking, colorful food stalls and signs, warm light, slow motion through crowd, vibrant street life',
        gradient: 'from-yellow-500 via-orange-500 to-red-500',
        emoji: '🏮',
      },
      {
        title: '摩天楼云',
        desc: '云朵快速掠过高楼',
        prompt: 'clouds rapidly moving past modern glass skyscrapers, dramatic fast-moving sky, reflections in tower windows, urban canyon, time-lapse atmosphere',
        gradient: 'from-sky-400 via-blue-500 to-indigo-600',
        emoji: '🏗️',
      },
      {
        title: '咖啡蒸汽',
        desc: '咖啡杯袅袅白雾升腾',
        prompt: 'steam gently rising from hot coffee cup, close-up macro shot, soft morning light, cozy cafe atmosphere, slow motion vapor, warm and inviting mood',
        gradient: 'from-amber-700 via-amber-600 to-orange-500',
        emoji: '☕',
      },
    ],
  },
  {
    id: 'slowmo',
    label: '慢动作',
    emoji: '🎞️',
    templates: [
      {
        title: '水花四溅',
        desc: '水滴落入水面慢镜',
        prompt: 'water drop falling in extreme slow motion, crown splash formation, crystal clear liquid, black background, macro detail, high speed photography',
        gradient: 'from-blue-400 via-cyan-400 to-teal-500',
        emoji: '💧',
      },
      {
        title: '玻璃破碎',
        desc: '玻璃爆炸破碎瞬间',
        prompt: 'glass shattering in ultra slow motion, fragments flying through air, light refracting through shards, dramatic impact moment, high speed capture',
        gradient: 'from-gray-400 via-slate-500 to-zinc-600',
        emoji: '💥',
      },
      {
        title: '羽毛飘落',
        desc: '羽毛缓缓落下飘飞',
        prompt: 'feather slowly floating down through air, gentle rotation, soft ethereal lighting, white background or bokeh, delicate and peaceful slow motion',
        gradient: 'from-rose-200 via-pink-300 to-purple-300',
        emoji: '🪶',
      },
      {
        title: '气泡爆破',
        desc: '肥皂泡破裂彩虹瞬间',
        prompt: 'soap bubble popping in slow motion, iridescent rainbow colors on surface just before burst, ultra close macro, high speed photography, magical moment',
        gradient: 'from-rainbow-500 via-pink-400 to-cyan-400',
        emoji: '🫧',
      },
      {
        title: '面粉爆炸',
        desc: '面粉击打扬起云雾',
        prompt: 'flour or powder exploding in slow motion, white cloud billowing outward, person or object at center of explosion, dramatic backlight, artistic slow motion',
        gradient: 'from-amber-200 via-orange-300 to-red-400',
        emoji: '💨',
      },
      {
        title: '子弹穿透',
        desc: '子弹穿过物体瞬间',
        prompt: 'bullet traveling through object in extreme slow motion, deformation and debris flying, high speed photography, dramatic lighting, physics in action',
        gradient: 'from-zinc-500 via-slate-600 to-gray-800',
        emoji: '🎯',
      },
    ],
  },
  {
    id: 'abstract',
    label: '抽象艺术',
    emoji: '🎨',
    templates: [
      {
        title: '油墨扩散',
        desc: '彩色油墨在水中晕染',
        prompt: 'colorful ink drops diffusing in water in slow motion, swirling abstract patterns, vivid colors mixing, macro shot, black background, mesmerizing fluid art',
        gradient: 'from-purple-500 via-pink-500 to-orange-500',
        emoji: '🖌️',
      },
      {
        title: '熔岩灯',
        desc: '流体蜡油缓缓漂浮',
        prompt: 'lava lamp blobs slowly rising and falling, warm orange and yellow glow in liquid, hypnotic movement, close-up macro, retro aesthetic, relaxing loop',
        gradient: 'from-orange-500 via-red-500 to-pink-500',
        emoji: '🌡️',
      },
      {
        title: '磁铁沙纹',
        desc: '磁场控制铁砂成形',
        prompt: 'magnetic field patterns forming in iron filings, abstract geometric shapes emerging, black and silver, scientific beauty, slow motion formation, mesmerizing',
        gradient: 'from-gray-600 via-zinc-500 to-slate-700',
        emoji: '🧲',
      },
      {
        title: '万花筒',
        desc: '万花筒旋转绚丽图案',
        prompt: 'kaleidoscope patterns rotating and morphing, symmetrical geometric shapes, vibrant colors, psychedelic visual, smooth rotation animation, hypnotic',
        gradient: 'from-rainbow-400 via-fuchsia-500 to-violet-600',
        emoji: '🔯',
      },
      {
        title: '流体模拟',
        desc: '流体物理艺术效果',
        prompt: 'fluid simulation art, swirling paint-like liquid, abstract flowing forms, rich saturated colors, satisfying continuous motion, digital art aesthetics',
        gradient: 'from-blue-400 via-purple-500 to-pink-500',
        emoji: '🌀',
      },
      {
        title: '晶体生长',
        desc: '晶体在溶液中生长',
        prompt: 'crystal growing from solution in time-lapse, geometric mineral formations emerging, sparkling facets catching light, scientific beauty, macro detail',
        gradient: 'from-cyan-400 via-blue-400 to-indigo-500',
        emoji: '💎',
      },
    ],
  },
];

const ASPECT_RATIOS: { value: AspectRatio; label: string; icon: string }[] = [
  { value: '16:9', label: '16:9', icon: '▬' },
  { value: '9:16', label: '9:16', icon: '▮' },
  { value: '1:1', label: '1:1', icon: '■' },
];

const DURATIONS: { value: Duration; label: string; desc: string }[] = [
  { value: 5, label: '5秒', desc: '快速预览' },
  { value: 10, label: '10秒', desc: '完整呈现' },
];

const POLL_INTERVAL = 5000;
const MAX_POLL_DURATION = 5 * 60 * 1000;

export default function VideoPage() {
  const { models, loading: modelsLoading } = useModels('video');

  const [videoModel, setVideoModel] = useState('');
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
  const [activeCategory, setActiveCategory] = useState(TEMPLATE_CATEGORIES[0].id);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollStartRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (models.length > 0 && !models.find((m) => m.id === videoModel)) {
      setVideoModel(models[0].id);
    }
  }, [models, videoModel]);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/ai/video/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.tasks ?? []);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchHistory();
    return () => { if (pollTimerRef.current) clearTimeout(pollTimerRef.current); };
  }, []);

  useEffect(() => {
    return () => { if (imagePreview) URL.revokeObjectURL(imagePreview); };
  }, [imagePreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!ALLOWED_TYPES.includes(file.type)) { setError('请上传 JPG、PNG、WebP 或 GIF 格式的图片'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('图片大小不能超过 10MB'); return; }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  };

  const uploadImage = async (): Promise<string> => {
    if (!imageFile) throw new Error('No image selected');
    const form = new FormData();
    form.append('file', imageFile);
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Upload failed');
    return json.url as string;
  };

  const pollStatus = async (taskId: string) => {
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
    if (!prompt.trim()) { toast.error('请输入描述词'); return; }
    setLoading(true);
    setError(null);
    setGeneratedVideo(null);

    let image_url: string | undefined;
    if (imageFile) {
      setUploading(true);
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
    }

    try {
      const res = await fetch('/api/ai/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), image_url, duration, aspect_ratio: aspectRatio, model: videoModel || 'kling-v2' }),
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

  const handleTemplateClick = (template: Template) => {
    setPrompt(template.prompt);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast.success(`已填入「${template.title}」模板`);
  };

  const activeTemplates = TEMPLATE_CATEGORIES.find((c) => c.id === activeCategory)?.templates ?? [];
  const currentModel = models.find((m) => m.id === videoModel);

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
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">AI 视频生成</h1>
        <p className="text-muted-foreground">暂无可用的视频模型，请在管理后台配置 KLING_API_KEY 或 GOOGLE_API_KEY。</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Video className="size-6 text-primary" />
          AI 视频生成
        </h1>
        <p className="text-muted-foreground text-sm mt-1">纯文字或上传参考图片，从模板选择运动方式，生成高质量视频</p>
      </div>

      {/* Template Gallery */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Wand2 className="size-4 text-primary" />
          <h2 className="font-semibold text-sm">运镜模版</h2>
          <Badge variant="secondary" className="text-xs">
            {TEMPLATE_CATEGORIES.reduce((s, c) => s + c.templates.length, 0)} 个模版
          </Badge>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap">
          {TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Template cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {activeTemplates.map((template) => (
            <button
              key={template.title}
              onClick={() => handleTemplateClick(template)}
              className="group relative overflow-hidden rounded-xl text-left transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
            >
              <div className={`bg-gradient-to-br ${template.gradient} aspect-video w-full relative flex items-center justify-center`}>
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                {/* Play icon overlay */}
                <div className="relative z-10 flex flex-col items-center gap-1">
                  <div className="bg-white/20 group-hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-all group-hover:scale-110">
                    <Play className="size-4 text-white fill-white" />
                  </div>
                </div>
                <span className="absolute top-2 right-2 text-base">{template.emoji}</span>
                <ChevronRight className="absolute bottom-2 right-2 size-3 text-white/60 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="p-2 bg-card border border-t-0 rounded-b-xl">
                <p className="text-xs font-medium truncate">{template.title}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{template.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Generation Form */}
      <div ref={formRef} className="rounded-xl border bg-card p-5 space-y-5">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          生成设置
        </h2>

        {/* Model selector */}
        {models.length > 1 && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">选择模型</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setVideoModel(m.id)}
                  disabled={loading}
                  className={`rounded-lg border p-2.5 text-left transition-colors ${
                    videoModel === m.id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <div className="font-medium text-xs">{m.label}</div>
                  <div className="text-xs text-muted-foreground">{m.credits} 积分</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">参考图片 <span className="normal-case text-muted-foreground/60">（可选）</span></label>
            <div
              className={`relative border-2 border-dashed rounded-xl cursor-pointer transition-colors overflow-hidden ${
                imagePreview ? 'border-primary/50' : 'hover:border-primary/50 border-border'
              }`}
              style={{ aspectRatio: aspectRatio === '9:16' ? '9/16' : aspectRatio === '1:1' ? '1/1' : '16/9', maxHeight: '220px' }}
              onClick={() => !loading && fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 rounded-full p-1 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                  >
                    <X className="size-3 text-white" />
                  </button>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                    <p className="text-white text-xs">{imageFile?.name}</p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground p-4">
                  <Upload className="h-8 w-8 opacity-50" />
                  <p className="text-sm font-medium">点击上传参考图片</p>
                  <p className="text-xs opacity-70">可选 · JPG · PNG · WebP · 最大 10MB</p>
                  <p className="text-xs opacity-50">不上传则使用纯文字生成</p>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={loading} />
          </div>

          {/* Settings column */}
          <div className="space-y-4">
            {/* Duration */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">视频时长</label>
              <div className="grid grid-cols-2 gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDuration(d.value)}
                    disabled={loading}
                    className={`rounded-lg border p-2.5 text-left transition-colors ${
                      duration === d.value
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <div className="font-medium text-sm">{d.label}</div>
                    <div className="text-xs text-muted-foreground">{d.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">画面比例</label>
              <div className="grid grid-cols-3 gap-2">
                {ASPECT_RATIOS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setAspectRatio(r.value)}
                    disabled={loading}
                    className={`rounded-lg border p-2 text-center transition-colors ${
                      aspectRatio === r.value
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <div className="text-base">{r.icon}</div>
                    <div className="text-xs font-medium mt-0.5">{r.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Credit display */}
            <div className="rounded-lg bg-muted/50 px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">预计消耗</span>
              <span className="text-sm font-semibold text-primary">{currentModel?.credits ?? 0} 积分</span>
            </div>
          </div>
        </div>

        {/* Prompt */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">运动描述词 Prompt</label>
            <span className="text-xs text-muted-foreground">{prompt.length}/1000</span>
          </div>
          <Textarea
            placeholder="描述视频的运动方式，例如：slow cinematic push-in shot, camera gently moves forward..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, 1000))}
            rows={3}
            disabled={loading}
            className="resize-none text-sm"
          />
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
              {uploading ? '上传图片中...' : '正在生成视频，预计 1-3 分钟...'}
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              生成视频 · {currentModel?.credits ?? 0} 积分
            </>
          )}
        </Button>

        {!imageFile && !loading && (
          <p className="text-xs text-center text-muted-foreground">不上传图片则使用纯文字生成视频</p>
        )}

        {error && (
          <p className="text-sm text-destructive text-center bg-destructive/5 rounded-lg px-3 py-2">{error}</p>
        )}
      </div>

      {/* Result */}
      {(loading || generatedVideo) && (
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="font-semibold text-sm">生成结果</h2>
          {loading && !generatedVideo && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
              <div className="relative">
                <div className="size-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <Video className="size-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">AI 正在创作视频</p>
                <p className="text-xs text-muted-foreground mt-1">预计需要 1-3 分钟，请耐心等待...</p>
              </div>
            </div>
          )}
          {generatedVideo && (
            <div className="space-y-3">
              <video src={generatedVideo} controls className="w-full rounded-xl max-h-[600px] bg-black" />
              <Button variant="outline" size="sm" onClick={() => handleDownload(generatedVideo)} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                下载视频
              </Button>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-muted-foreground">最近生成</h2>
            <button
              onClick={async () => {
                if (!confirm('确认清空全部视频记录？')) return;
                await fetch('/api/tasks?type=video', { method: 'DELETE' });
                setHistory([]);
                toast.success('已清空');
              }}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              清空
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="group relative cursor-pointer"
                onClick={() => item.output_url && setGeneratedVideo(item.output_url)}
              >
                <div className="relative aspect-video bg-muted rounded-xl overflow-hidden">
                  {item.output_url ? (
                    <>
                      <video src={item.output_url} className="w-full h-full object-cover" muted />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <div className="bg-white/20 rounded-full p-2">
                          <Play className="size-4 text-white fill-white" />
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDownload(item.output_url!); }}
                          className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                        >
                          <Download className="size-4 text-white" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      {item.status === 'failed' ? (
                        <span className="text-xs text-destructive">失败</span>
                      ) : (
                        <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                      )}
                    </div>
                  )}
                  {/* 删除按钮 */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await fetch(`/api/tasks?id=${item.id}`, { method: 'DELETE' });
                      setHistory(prev => prev.filter(h => h.id !== item.id));
                      toast.success('已删除');
                    }}
                    className="absolute top-1.5 right-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                    title="删除"
                  >
                    <X className="size-3" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1 px-0.5">{item.prompt}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
