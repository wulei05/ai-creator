'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Search, TrendingUp, Sparkles, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Post {
  id: string;
  author: { name: string; avatar: string; initials: string };
  imageUrl: string;
  gradient: string;
  prompt: string;
  model: string;
  likes: number;
  comments: number;
  liked: boolean;
  bookmarked: boolean;
  createdAt: string;
  tags: string[];
}

const MOCK_POSTS: Post[] = [
  {
    id: '1',
    author: { name: '星空画师', avatar: '', initials: '星' },
    imageUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=500&q=80',
    gradient: 'from-indigo-600 via-purple-600 to-pink-500',
    prompt: 'cyberpunk city at night, neon lights reflecting on wet streets, flying cars, ultra detailed, 8k',
    model: 'Flux Pro',
    likes: 342,
    comments: 28,
    liked: false,
    bookmarked: false,
    createdAt: '2小时前',
    tags: ['赛博朋克', '城市', '夜景'],
  },
  {
    id: '2',
    author: { name: '梦境旅人', avatar: '', initials: '梦' },
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=500&q=80',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-400',
    prompt: '古风山水画，云雾缭绕的仙境，远处有飞瀑，意境深远，水墨风格',
    model: 'Gemini 3 Pro Image',
    likes: 218,
    comments: 15,
    liked: true,
    bookmarked: true,
    createdAt: '5小时前',
    tags: ['古风', '山水', '水墨'],
  },
  {
    id: '3',
    author: { name: 'AI艺术家_Leon', avatar: '', initials: 'LE' },
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=500&q=80',
    gradient: 'from-orange-500 via-rose-500 to-pink-600',
    prompt: 'ethereal elf queen in enchanted forest, glowing magical aura, silver hair, fantasy art, highly detailed',
    model: 'Imagen 4 Ultra',
    likes: 567,
    comments: 43,
    liked: false,
    bookmarked: false,
    createdAt: '昨天',
    tags: ['奇幻', '精灵', '魔法'],
  },
  {
    id: '4',
    author: { name: '创意工坊', avatar: '', initials: '创' },
    imageUrl: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=500&q=80',
    gradient: 'from-yellow-400 via-amber-500 to-orange-600',
    prompt: 'Japanese ramen bowl, steaming broth, chashu pork, soft egg, dark moody lighting, professional food photography',
    model: 'Flux Dev',
    likes: 189,
    comments: 12,
    liked: false,
    bookmarked: false,
    createdAt: '昨天',
    tags: ['美食', '日式', '摄影'],
  },
  {
    id: '5',
    author: { name: '银河探索者', avatar: '', initials: '银' },
    imageUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=500&q=80',
    gradient: 'from-blue-700 via-indigo-700 to-violet-800',
    prompt: 'astronaut floating in deep space, colorful nebula background, photorealistic, cinematic lighting',
    model: 'Imagen 4',
    likes: 892,
    comments: 67,
    liked: true,
    bookmarked: false,
    createdAt: '2天前',
    tags: ['太空', '宇宙', '科幻'],
  },
  {
    id: '6',
    author: { name: '像素诗人', avatar: '', initials: '像' },
    imageUrl: 'https://images.unsplash.com/photo-1522383225753-aa6857c2b0e7?w=500&q=80',
    gradient: 'from-pink-400 via-fuchsia-500 to-purple-600',
    prompt: 'magical girl transformation anime style, sparkling effects, pastel colors, Studio Trigger inspired',
    model: 'Flux Schnell',
    likes: 445,
    comments: 38,
    liked: false,
    bookmarked: true,
    createdAt: '3天前',
    tags: ['动漫', '魔法少女', '插画'],
  },
  {
    id: '7',
    author: { name: '光影捕手', avatar: '', initials: '光' },
    imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=500&q=80',
    gradient: 'from-slate-600 via-gray-700 to-zinc-800',
    prompt: 'hyper-realistic android face, half-mechanical, emotional expression, dramatic studio lighting, sci-fi concept art',
    model: 'Flux Pro',
    likes: 731,
    comments: 52,
    liked: false,
    bookmarked: false,
    createdAt: '4天前',
    tags: ['机器人', '科幻', '写实'],
  },
  {
    id: '8',
    author: { name: '自然之声', avatar: '', initials: '自' },
    imageUrl: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=500&q=80',
    gradient: 'from-green-500 via-emerald-600 to-teal-700',
    prompt: 'Bengal tiger in dense jungle, intense eyes, water droplets on fur, dramatic backlight, National Geographic style',
    model: 'Gemini 3.1 Flash Img',
    likes: 623,
    comments: 41,
    liked: false,
    bookmarked: false,
    createdAt: '5天前',
    tags: ['野生动物', '老虎', '摄影'],
  },
];

const TABS = [
  { id: 'hot',     label: '热门',   icon: TrendingUp },
  { id: 'latest',  label: '最新',   icon: Clock },
  { id: 'picks',   label: '精选',   icon: Sparkles },
];

const TAG_FILTERS = ['全部', '赛博朋克', '古风', '奇幻', '动漫', '美食', '科幻', '自然'];

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [activeTab, setActiveTab] = useState('hot');
  const [activeTag, setActiveTag] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleLike = (id: string) => {
    setPosts(prev => prev.map(p =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ));
  };

  const toggleBookmark = (id: string) => {
    setPosts(prev => prev.map(p =>
      p.id === id ? { ...p, bookmarked: !p.bookmarked } : p
    ));
    const post = posts.find(p => p.id === id);
    if (post) toast.success(post.bookmarked ? '已取消收藏' : '已收藏');
  };

  const filtered = posts.filter(p => {
    const matchTag = activeTag === '全部' || p.tags.includes(activeTag);
    const matchSearch = !searchQuery || p.prompt.includes(searchQuery) || p.author.name.includes(searchQuery);
    return matchTag && matchSearch;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>🌐</span> 创作社区
        </h1>
        <p className="text-sm text-muted-foreground mt-1">发现来自全球创作者的 AI 艺术作品</p>
      </div>

      {/* Search + Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索作品或作者..."
            className="w-full rounded-lg border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex gap-1 rounded-lg border bg-muted/30 p-1 shrink-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                activeTab === id
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tag filters */}
      <div className="flex gap-2 flex-wrap">
        {TAG_FILTERS.map(tag => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors border',
              activeTag === tag
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground hover:text-foreground hover:border-primary/40'
            )}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map(post => (
          <div key={post.id} className="group flex flex-col rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-all">
            {/* Image area */}
            <div className={`relative aspect-square bg-gradient-to-br ${post.gradient} overflow-hidden`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.imageUrl}
                alt={post.prompt.slice(0, 30)}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                <p className="text-white text-[10px] line-clamp-3 leading-relaxed">{post.prompt}</p>
              </div>
              {/* Model badge */}
              <div className="absolute top-2 left-2 rounded-full bg-black/50 backdrop-blur px-2 py-0.5 text-[9px] text-white font-medium">
                {post.model}
              </div>
            </div>

            {/* Info */}
            <div className="p-2.5 space-y-2">
              {/* Author */}
              <div className="flex items-center gap-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[9px] font-bold text-primary shrink-0">
                  {post.author.initials}
                </div>
                <span className="text-xs text-muted-foreground truncate">{post.author.name}</span>
                <span className="ml-auto text-[10px] text-muted-foreground shrink-0">{post.createdAt}</span>
              </div>

              {/* Tags */}
              <div className="flex gap-1 flex-wrap">
                {post.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-0.5">
                <button
                  onClick={() => toggleLike(post.id)}
                  className={cn('flex items-center gap-1 text-xs transition-colors', post.liked ? 'text-rose-500' : 'text-muted-foreground hover:text-rose-500')}
                >
                  <Heart className={cn('size-3.5', post.liked && 'fill-current')} />
                  {post.likes}
                </button>
                <button
                  onClick={() => toast.info('评论功能即将上线')}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MessageCircle className="size-3.5" />
                  {post.comments}
                </button>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => toggleBookmark(post.id)}
                    className={cn('transition-colors', post.bookmarked ? 'text-primary' : 'text-muted-foreground hover:text-primary')}
                  >
                    <Bookmark className={cn('size-3.5', post.bookmarked && 'fill-current')} />
                  </button>
                  <button
                    onClick={() => { navigator.clipboard.writeText(post.prompt); toast.success('Prompt 已复制'); }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="复制 Prompt"
                  >
                    <Share2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
          <span className="text-4xl">🔍</span>
          <p className="text-sm">没有找到相关作品</p>
        </div>
      )}
    </div>
  );
}
