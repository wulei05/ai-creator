'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Download, ImageIcon, Loader2, Sparkles, Wand2, ChevronRight } from 'lucide-react';
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

interface Template {
  title: string;
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
    id: 'portrait',
    label: '人物肖像',
    emoji: '👤',
    templates: [
      {
        title: '赛博朋克少女',
        prompt: 'cyberpunk girl with neon lights, futuristic city background, glowing eyes, detailed portrait, cinematic lighting, 8k ultra realistic',
        gradient: 'from-purple-500 via-pink-500 to-cyan-400',
        emoji: '💜',
      },
      {
        title: '古风仕女',
        prompt: 'beautiful Chinese ancient style woman, traditional hanfu clothing, ink painting background, delicate features, flowing hair with jade ornaments, soft lighting',
        gradient: 'from-rose-400 via-pink-300 to-orange-200',
        emoji: '🌸',
      },
      {
        title: '精灵女王',
        prompt: 'ethereal elf queen, silver flowing hair, emerald forest background, glowing magical aura, intricate crown with gemstones, fantasy art style, highly detailed',
        gradient: 'from-emerald-400 via-teal-400 to-cyan-300',
        emoji: '🧝',
      },
      {
        title: '武士战士',
        prompt: 'Japanese samurai warrior, detailed armor with dragon motifs, cherry blossom petals falling, dramatic side lighting, cinematic, hyperrealistic',
        gradient: 'from-orange-500 via-red-500 to-rose-600',
        emoji: '⚔️',
      },
      {
        title: '蒸汽朋克',
        prompt: 'steampunk inventor woman, Victorian-era goggles, mechanical arm prosthetic, gears and brass pipes, sepia-toned workshop, dramatic lighting, oil painting style',
        gradient: 'from-amber-500 via-yellow-400 to-orange-400',
        emoji: '⚙️',
      },
      {
        title: '宇航员',
        prompt: 'female astronaut floating in space, reflective helmet visor showing galaxy reflection, earth in background, photorealistic, NASA suit, dramatic lighting',
        gradient: 'from-blue-600 via-indigo-500 to-purple-600',
        emoji: '🚀',
      },
    ],
  },
  {
    id: 'landscape',
    label: '风景自然',
    emoji: '🌄',
    templates: [
      {
        title: '极光雪山',
        prompt: 'breathtaking northern lights aurora borealis over snow-capped mountains, reflection in frozen lake, midnight blue sky, ultra wide angle, 8k landscape photography',
        gradient: 'from-green-400 via-teal-400 to-indigo-600',
        emoji: '🌌',
      },
      {
        title: '樱花古道',
        prompt: 'ancient Japanese stone path through tunnel of blooming cherry blossoms, soft pink petals falling, golden hour light, peaceful, ultra detailed',
        gradient: 'from-pink-300 via-rose-300 to-pink-400',
        emoji: '🌸',
      },
      {
        title: '热带雨林',
        prompt: 'lush tropical rainforest with ancient waterfall, bioluminescent plants glowing blue and green, misty atmosphere, exotic birds, national geographic style photography',
        gradient: 'from-green-600 via-emerald-500 to-teal-400',
        emoji: '🌿',
      },
      {
        title: '沙漠日落',
        prompt: 'vast Sahara desert at golden sunset, dramatic sand dunes with long shadows, camel caravan silhouette, vivid orange and red sky, wide panoramic shot',
        gradient: 'from-orange-600 via-amber-500 to-yellow-400',
        emoji: '🌅',
      },
      {
        title: '云海仙境',
        prompt: 'mystical mountain peaks rising above sea of clouds at sunrise, ancient Chinese temple on cliff, pink and golden sky, ink painting meets photography, dreamlike',
        gradient: 'from-sky-300 via-blue-200 to-indigo-300',
        emoji: '⛰️',
      },
      {
        title: '深海世界',
        prompt: 'magical underwater deep ocean scene, glowing jellyfish, colorful coral reef, shafts of sunlight piercing blue water, sea turtles, ultra detailed, cinematic',
        gradient: 'from-blue-700 via-cyan-500 to-teal-400',
        emoji: '🌊',
      },
    ],
  },
  {
    id: 'anime',
    label: '动漫插画',
    emoji: '🎌',
    templates: [
      {
        title: '魔法少女',
        prompt: 'magical girl anime style, sparkling transformation, pastel colors, star and heart motifs, big expressive eyes, flowing dress, Sailor Moon inspired, high quality illustration',
        gradient: 'from-pink-400 via-purple-400 to-blue-400',
        emoji: '✨',
      },
      {
        title: '侦探学院',
        prompt: 'anime style high school detective club, group of students in uniform, mysterious old library background, autumn evening light, slice of life anime, Studio Ghibli inspired',
        gradient: 'from-amber-400 via-orange-400 to-red-400',
        emoji: '🔍',
      },
      {
        title: '龙与少年',
        prompt: 'anime boy with friendly dragon companion, flying over fantasy village, sunset sky with clouds, adventure anime style, vibrant colors, detailed background, epic composition',
        gradient: 'from-sky-400 via-blue-500 to-indigo-500',
        emoji: '🐉',
      },
      {
        title: '街头少年',
        prompt: 'cool anime teenager in streetwear, Tokyo night cityscape, neon reflections on wet street, hip hop style, urban anime aesthetic, detailed illustration',
        gradient: 'from-violet-500 via-purple-500 to-pink-500',
        emoji: '🎵',
      },
      {
        title: '神明少女',
        prompt: 'divine shrine maiden anime style, white and red traditional miko outfit, torii gate, cherry blossoms, spiritual fox companion, ethereal glow, beautiful detailed art',
        gradient: 'from-red-400 via-rose-400 to-pink-300',
        emoji: '🦊',
      },
      {
        title: '废土勇者',
        prompt: 'post-apocalyptic anime hero, ruined city background, scavenged mechanical armor, determined expression, orange dusty sky, dark fantasy anime, dynamic pose',
        gradient: 'from-orange-500 via-red-600 to-gray-700',
        emoji: '🤖',
      },
    ],
  },
  {
    id: 'fantasy',
    label: '奇幻魔法',
    emoji: '🔮',
    templates: [
      {
        title: '魔法图书馆',
        prompt: 'infinite magical library, floating books and glowing manuscripts, spiral staircases, warm candlelight mixed with blue magical glow, dust motes in air, highly detailed fantasy art',
        gradient: 'from-amber-600 via-orange-500 to-yellow-400',
        emoji: '📚',
      },
      {
        title: '龙族宝窟',
        prompt: 'massive dragon sleeping on mountain of gold and jewels in ancient cave, shafts of light from ceiling crack, treasure coins reflecting light, epic fantasy illustration, cinematic',
        gradient: 'from-yellow-500 via-amber-500 to-orange-600',
        emoji: '💎',
      },
      {
        title: '精灵圣树',
        prompt: 'colossal ancient tree home to elves, glowing windows carved into bark, rope bridges between branches, luminescent mushrooms below, enchanted forest, fantasy art',
        gradient: 'from-green-500 via-emerald-400 to-teal-500',
        emoji: '🌳',
      },
      {
        title: '水晶宫殿',
        prompt: 'crystalline ice palace interior, rainbow refractions on walls, frozen throne, aurora colors through crystal ceiling, ice sculptures, ultra detailed fantasy concept art',
        gradient: 'from-cyan-300 via-sky-400 to-blue-500',
        emoji: '❄️',
      },
      {
        title: '炼金工坊',
        prompt: 'fantasy alchemist laboratory, bubbling colorful potions, ancient spell books, mystical symbols floating in air, magical ingredients, dramatic lighting, detailed illustration',
        gradient: 'from-purple-600 via-violet-500 to-indigo-500',
        emoji: '⚗️',
      },
      {
        title: '星际神殿',
        prompt: 'ancient cosmic temple floating in nebula, stone pillars with glowing runes, portal to another dimension, starfield background, gods realm, epic scale, digital art',
        gradient: 'from-indigo-600 via-purple-600 to-pink-600',
        emoji: '🌠',
      },
    ],
  },
  {
    id: 'scifi',
    label: '科技未来',
    emoji: '🤖',
    templates: [
      {
        title: '太空城市',
        prompt: 'massive futuristic space station orbiting earth, detailed exterior with docking bays and solar panels, stars and earth below, hard science fiction, photorealistic rendering',
        gradient: 'from-slate-700 via-blue-800 to-indigo-900',
        emoji: '🛸',
      },
      {
        title: '霓虹都市',
        prompt: 'blade runner style cyberpunk megacity, flying cars between skyscrapers, neon signs in Chinese and English, rain-slicked streets, ultra detailed, cinematic noir lighting',
        gradient: 'from-cyan-500 via-blue-600 to-purple-700',
        emoji: '🌃',
      },
      {
        title: '机甲战争',
        prompt: 'colossal mech robot standing in destroyed urban battlefield, dramatic sunset, battle damage with sparks, heroic pose, Pacific Rim inspired, photorealistic CGI quality',
        gradient: 'from-orange-600 via-red-700 to-gray-800',
        emoji: '⚡',
      },
      {
        title: '量子实验室',
        prompt: 'futuristic quantum computing laboratory, glowing blue holographic interfaces, scientist examining data streams, clean white environment, soft blue ambient lighting, sci-fi concept art',
        gradient: 'from-blue-400 via-cyan-400 to-teal-500',
        emoji: '🔬',
      },
      {
        title: '星际探索',
        prompt: 'astronaut standing on alien planet surface, two suns in sky, exotic blue vegetation, huge gas giant visible on horizon, exploration rover nearby, photorealistic',
        gradient: 'from-purple-500 via-blue-500 to-teal-500',
        emoji: '🪐',
      },
      {
        title: '仿生人类',
        prompt: 'hyper-realistic android face half exposed showing mechanical components, emotional expression, studio photography, deep depth of field, dramatic lighting, concept art',
        gradient: 'from-gray-500 via-slate-600 to-zinc-700',
        emoji: '🦾',
      },
    ],
  },
  {
    id: 'food',
    label: '美食饮品',
    emoji: '🍜',
    templates: [
      {
        title: '日式拉面',
        prompt: 'perfect Japanese ramen bowl, rich tonkotsu broth, chashu pork, soft-boiled egg, nori, bamboo shoots, steam rising, dark moody restaurant lighting, professional food photography',
        gradient: 'from-amber-500 via-orange-400 to-yellow-400',
        emoji: '🍜',
      },
      {
        title: '精致甜点',
        prompt: 'exquisite French patisserie dessert, multiple layers of mousse cake, mirror glaze, edible gold leaf, fresh berries, marble surface, soft diffused natural light, luxury food styling',
        gradient: 'from-pink-400 via-rose-300 to-purple-400',
        emoji: '🎂',
      },
      {
        title: '精品咖啡',
        prompt: 'specialty latte art in ceramic cup, perfect rosetta pattern in milk foam, coffee beans and cinnamon nearby, wooden table, warm morning light, artisan cafe atmosphere',
        gradient: 'from-amber-700 via-amber-600 to-yellow-500',
        emoji: '☕',
      },
      {
        title: '寿司盛宴',
        prompt: 'premium omakase sushi platter, fresh nigiri and maki, tuna, salmon, sea urchin, elegant black slate presentation, water droplets, restaurant quality photography',
        gradient: 'from-red-500 via-orange-400 to-yellow-300',
        emoji: '🍣',
      },
      {
        title: '热带水果',
        prompt: 'vibrant tropical fruit arrangement, dragon fruit, mango, passion fruit, papaya, bright colors, overhead flat lay, white background, fresh and juicy, commercial photography',
        gradient: 'from-yellow-400 via-orange-400 to-red-400',
        emoji: '🍓',
      },
      {
        title: '调酒鸡尾酒',
        prompt: 'colorful craft cocktails on bar counter, vibrant tropical colors, citrus garnishes, smoke effect, bokeh bar lights background, luxury hotel bar aesthetic, moody photography',
        gradient: 'from-blue-400 via-purple-400 to-pink-500',
        emoji: '🍹',
      },
    ],
  },
  {
    id: 'architecture',
    label: '建筑空间',
    emoji: '🏛️',
    templates: [
      {
        title: '极简住宅',
        prompt: 'minimalist modern house exterior, white concrete and glass, surrounded by zen garden, reflecting pool, golden hour lighting, architectural photography, clean lines',
        gradient: 'from-gray-300 via-slate-400 to-gray-500',
        emoji: '🏠',
      },
      {
        title: '哥特教堂',
        prompt: 'interior of Gothic cathedral, soaring stone arches, vibrant stained glass windows casting colorful light, dramatic perspective, ancient atmosphere, ultra detailed',
        gradient: 'from-violet-700 via-purple-600 to-indigo-700',
        emoji: '⛪',
      },
      {
        title: '日式茶室',
        prompt: 'serene Japanese tea house interior, shoji screens with soft diffused light, tatami floors, ikebana flower arrangement, bamboo garden view, zen simplicity, architectural photo',
        gradient: 'from-stone-400 via-amber-300 to-green-400',
        emoji: '🎋',
      },
      {
        title: '未来博物馆',
        prompt: 'futuristic museum architecture, parametric curved walls, massive glass atrium, natural light flooding interior, visitors as tiny silhouettes, Zaha Hadid inspired, render',
        gradient: 'from-sky-300 via-blue-400 to-indigo-500',
        emoji: '🏗️',
      },
      {
        title: '水上别墅',
        prompt: 'overwater bungalow in Maldives turquoise lagoon, clear blue water, tropical palm trees, sunrise reflection, luxury resort photography, travel magazine quality',
        gradient: 'from-cyan-400 via-teal-400 to-blue-500',
        emoji: '🏝️',
      },
      {
        title: '废墟遗迹',
        prompt: 'ancient Mayan pyramid ruins reclaimed by jungle, vines and trees growing through stone, golden afternoon light, archaeological discovery atmosphere, cinematic wide shot',
        gradient: 'from-green-600 via-emerald-700 to-stone-600',
        emoji: '🏚️',
      },
    ],
  },
  {
    id: 'animals',
    label: '动物萌宠',
    emoji: '🐾',
    templates: [
      {
        title: '雪狐之灵',
        prompt: 'majestic arctic fox in snowy tundra, thick white fur, piercing blue eyes, snowflakes falling, soft winter light, close-up portrait, wildlife photography, 8k',
        gradient: 'from-blue-200 via-sky-300 to-indigo-300',
        emoji: '🦊',
      },
      {
        title: '丛林猛虎',
        prompt: 'Bengal tiger emerging from dense jungle foliage, intense orange and black stripes, amber eyes, water droplets on fur, dramatic backlight, National Geographic style',
        gradient: 'from-orange-500 via-amber-600 to-yellow-500',
        emoji: '🐯',
      },
      {
        title: '深海巨鲸',
        prompt: 'humpback whale breaching ocean surface, dramatic sunset sky, water cascading off body, aerial drone perspective, epic wildlife moment, photorealistic',
        gradient: 'from-blue-600 via-teal-500 to-cyan-400',
        emoji: '🐋',
      },
      {
        title: '猫咪物语',
        prompt: 'fluffy British shorthair cat with round eyes, sitting on Japanese window sill, cherry blossoms outside, warm afternoon light, cozy lifestyle photography, adorable',
        gradient: 'from-orange-300 via-amber-300 to-yellow-300',
        emoji: '🐱',
      },
      {
        title: '鹰击长空',
        prompt: 'bald eagle in mid-flight, wings fully spread, blue sky with white clouds, sunlight through feathers, American symbol, wildlife photography, dramatic upward angle',
        gradient: 'from-sky-500 via-blue-600 to-indigo-600',
        emoji: '🦅',
      },
      {
        title: '玻璃蛙',
        prompt: 'transparent glass frog on tropical leaf, internal organs visible through skin, macro photography, water droplets, vibrant green, shallow depth of field, stunning nature photo',
        gradient: 'from-green-400 via-teal-400 to-emerald-500',
        emoji: '🐸',
      },
    ],
  },
];

const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: '1:1', label: '1:1' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '4:3', label: '4:3' },
];

const POLL_INTERVAL = 3000;
const MAX_POLL_DURATION = 3 * 60 * 1000;

const NO_ASPECT_RATIO_MODELS = [
  'imagen-4', 'imagen-4-ultra', 'imagen-4-fast',
  'gemini-2.5-flash-image', 'gemini-3-pro-image', 'gemini-3.1-flash-image',
];

export default function ImagePage() {
  const { models, loading: modelsLoading } = useModels('image');

  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [imageModel, setImageModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<TaskRecord[]>([]);
  const [activeCategory, setActiveCategory] = useState(TEMPLATE_CATEGORIES[0].id);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollStartRef = useRef<number>(0);
  const formRef = useRef<HTMLDivElement>(null);

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
    if (!prompt.trim()) { toast.error('请输入描述词'); return; }
    setLoading(true);
    setError(null);
    setGeneratedImage(null);
    try {
      const res = await fetch('/api/ai/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), aspect_ratio: aspectRatio, model: imageModel }),
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

  const handleTemplateClick = (template: Template) => {
    setPrompt(template.prompt);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast.success(`已填入「${template.title}」模板`);
  };

  const activeTemplates = TEMPLATE_CATEGORIES.find((c) => c.id === activeCategory)?.templates ?? [];

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
        <h1 className="text-2xl font-semibold mb-2">AI 图像生成</h1>
        <p className="text-muted-foreground">暂无可用的图像模型，请在管理后台配置 FAL_KEY 或 GOOGLE_API_KEY。</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="size-6 text-primary" />
            AI 图像生成
          </h1>
          <p className="text-muted-foreground text-sm mt-1">从模版快速开始，或直接输入描述词创作独特图像</p>
        </div>
      </div>

      {/* Template Gallery */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Wand2 className="size-4 text-primary" />
          <h2 className="font-semibold text-sm">创作模版</h2>
          <Badge variant="secondary" className="text-xs">{TEMPLATE_CATEGORIES.reduce((s, c) => s + c.templates.length, 0)} 个模版</Badge>
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

        {/* Template cards grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {activeTemplates.map((template) => (
            <button
              key={template.title}
              onClick={() => handleTemplateClick(template)}
              className="group relative overflow-hidden rounded-xl text-left transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
            >
              {/* Gradient background */}
              <div className={`bg-gradient-to-br ${template.gradient} aspect-[4/3] w-full flex items-end p-2`}>
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
                <span className="absolute top-2 right-2 text-lg">{template.emoji}</span>
                <div className="relative">
                  <ChevronRight className="size-3 text-white/70 absolute -right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="p-2 bg-card border border-t-0 rounded-b-xl">
                <p className="text-xs font-medium truncate">{template.title}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Generation Form */}
      <div ref={formRef} className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <ImageIcon className="size-4 text-primary" />
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
                  onClick={() => setImageModel(m.id)}
                  disabled={loading}
                  className={`rounded-lg border p-2.5 text-left transition-colors ${
                    imageModel === m.id
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

        {/* Prompt */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">描述词 Prompt</label>
            <span className="text-xs text-muted-foreground">{prompt.length}/1000</span>
          </div>
          <Textarea
            placeholder="描述你想要生成的图像，例如：a serene mountain lake at sunset, photorealistic, 8k..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, 1000))}
            rows={4}
            disabled={loading}
            className="resize-none text-sm"
          />
        </div>

        {/* Aspect Ratio */}
        {!NO_ASPECT_RATIO_MODELS.includes(imageModel) && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">宽高比</label>
            <div className="flex gap-2">
              {ASPECT_RATIOS.map((ratio) => (
                <Button
                  key={ratio.value}
                  variant={aspectRatio === ratio.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAspectRatio(ratio.value)}
                  disabled={loading}
                  className="min-w-16 text-xs"
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
              正在生成图像，请稍候...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              生成图像 · {creditCost} 积分
            </>
          )}
        </Button>

        {error && (
          <p className="text-sm text-destructive text-center bg-destructive/5 rounded-lg px-3 py-2">{error}</p>
        )}
      </div>

      {/* Result */}
      {(loading || generatedImage) && (
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="font-semibold text-sm">生成结果</h2>
          {loading && !generatedImage && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <div className="relative">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <Sparkles className="h-4 w-4 absolute -top-1 -right-1 text-primary animate-pulse" />
              </div>
              <p className="text-sm">AI 正在创作中，请稍候...</p>
            </div>
          )}
          {generatedImage && (
            <div className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={generatedImage}
                alt="Generated"
                className="w-full rounded-lg object-contain max-h-[600px]"
              />
              <Button variant="outline" size="sm" onClick={() => handleDownload(generatedImage)} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                下载图像
              </Button>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground">最近生成</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="group relative cursor-pointer"
                onClick={() => item.output_url && setGeneratedImage(item.output_url)}
              >
                <div className="relative aspect-square bg-muted rounded-xl overflow-hidden">
                  {item.output_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.output_url}
                      alt={item.prompt}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      {item.status === 'failed' ? (
                        <span className="text-xs text-destructive">失败</span>
                      ) : (
                        <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                      )}
                    </div>
                  )}
                  {item.output_url && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownload(item.output_url!); }}
                        className="bg-white/20 hover:bg-white/30 rounded-full p-1.5 transition-colors"
                      >
                        <Download className="size-3.5 text-white" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1 px-0.5">{item.prompt}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
