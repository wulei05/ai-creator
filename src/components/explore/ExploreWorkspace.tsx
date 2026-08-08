'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Bot, ImageIcon, Play, Sparkles, Video,
} from 'lucide-react';
import { useModels, type ModelInfo } from '@/lib/hooks/useModels';
import { TEMPLATE_CATEGORIES as IMAGE_CAT } from '@/components/image/templates';
import { TEMPLATE_CATEGORIES as VIDEO_CAT } from '@/components/video/video-templates';
import {
  COMMUNITY_POSTS, buildTemplateCards, shuffleMix,
  type CommunityPost, type TemplateCard,
} from './explore-data';

type TopTab = 'inspire' | 'theme' | 'prompt';
type SortKey = 'category' | 'detail' | 'work' | 'popular';

const TOP_TABS: { id: TopTab; label: string }[] = [
  { id: 'inspire', label: '灵感' },
  { id: 'theme',   label: '主题' },
  { id: 'prompt',  label: '提示词' },
];

const SORT_TABS: { id: SortKey; label: string }[] = [
  { id: 'category', label: '分类' },
  { id: 'detail',   label: '提示详情' },
  { id: 'work',     label: '作品' },
  { id: 'popular',  label: '流行度' },
];

export function ExploreWorkspace() {
  const { models: imageModels } = useModels('image');
  const { models: videoModels } = useModels('video');

  const [topTab, setTopTab] = useState<TopTab>('inspire');
  const [sortTab, setSortTab] = useState<SortKey>('category');
  const [activeCategory, setActiveCategory] = useState<string>('全部');

  // 顶部模型横幅 —— 图像模型在前，视频模型在后
  const marqueeModels: Array<ModelInfo & { kind: 'image' | 'video' }> = useMemo(
    () => [
      ...imageModels.map((m) => ({ ...m, kind: 'image' as const })),
      ...videoModels.map((m) => ({ ...m, kind: 'video' as const })),
    ],
    [imageModels, videoModels],
  );

  // 瀑布流数据
  const templateCards = useMemo(() => buildTemplateCards(IMAGE_CAT, VIDEO_CAT), []);
  const allCategories = useMemo(() => {
    const set = new Set<string>(['全部']);
    templateCards.forEach((t) => set.add(t.category));
    COMMUNITY_POSTS.forEach((p) => p.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [templateCards]);

  const items = useMemo(() => {
    let pool: Array<CommunityPost | TemplateCard>;
    if (topTab === 'inspire') pool = shuffleMix(COMMUNITY_POSTS, templateCards);
    else if (topTab === 'theme') pool = templateCards;
    else pool = templateCards.filter((t) => t.type === 'image'); // 提示词：以图像模板为主

    if (activeCategory !== '全部') {
      pool = pool.filter((it) =>
        it.kind === 'template' ? it.category === activeCategory : it.tags.includes(activeCategory),
      );
    }
    return pool;
  }, [topTab, activeCategory, templateCards]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* 1) 顶部模型横向横幅 */}
      <section className="-mx-4 px-4 md:-mx-6 md:px-6">
        <div
          className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {marqueeModels.length === 0 ? (
            <div className="flex gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[80px] w-[220px] shrink-0 animate-pulse rounded-2xl bg-card/60" />
              ))}
            </div>
          ) : (
            marqueeModels.map((m) => <ModelChip key={`${m.kind}-${m.id}`} model={m} />)
          )}
        </div>
      </section>

      {/* 2) 4 个工具大入口卡 */}
      <section className="flex flex-col gap-3 md:flex-row">
        <ToolEntry
          href="/image" emphasis label="图片生成"
          desc="一句话生成精美图像 · 支持参考图"
          gradient="from-blue-500/30 via-cyan-500/20 to-teal-500/20"
          emoji="🖼️"
        />
        <ToolEntry
          href="/video" label="视频创作"
          desc="文本/图片生成短视频"
          gradient="from-rose-500/30 via-pink-500/20 to-fuchsia-500/20"
          emoji="🎬"
        />
        <ToolEntry
          href="/image?mode=edit" label="精细编辑" badge="NEW"
          desc="扩图 / 抠图 / 移除物体"
          gradient="from-amber-500/30 via-orange-500/20 to-red-500/20"
          emoji="✂️"
        />
        <ToolEntry
          href="/studio" label="AI 工具"
          desc="创作室 · 灵感画廊"
          gradient="from-violet-500/30 via-purple-500/20 to-indigo-500/20"
          emoji="🧰"
        />
      </section>

      {/* 3) 三级筛选 tab */}
      <section className="space-y-3">
        {/* 一级 pill tabs */}
        <div className="flex items-center gap-1.5">
          {TOP_TABS.map((t) => {
            const active = topTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setTopTab(t.id); setActiveCategory('全部'); }}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* 二级 secondary tabs */}
        <div className="flex items-center gap-4 border-b border-border/60 pb-1.5 text-sm">
          {SORT_TABS.map((s) => {
            const active = sortTab === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSortTab(s.id)}
                className={`relative pb-1.5 transition-colors ${
                  active ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {s.label}
                {active && (
                  <span className="absolute -bottom-[7px] left-0 right-0 h-[2px] rounded-full bg-foreground" />
                )}
              </button>
            );
          })}
        </div>

        {/* 三级 category chips */}
        <div className="flex flex-wrap gap-2">
          {allCategories.map((c) => {
            const active = activeCategory === c;
            return (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-foreground text-background'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </section>

      {/* 4) 瀑布流网格 */}
      <section>
        {items.length === 0 ? (
          <div className="py-24 text-center text-sm text-muted-foreground">
            该分类下暂无内容
          </div>
        ) : (
          <div className="columns-2 gap-3 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 2xl:columns-7">
            {items.map((it) => (
              <div key={it.id} className="mb-3 break-inside-avoid">
                {it.kind === 'post' ? <PostCardView post={it} /> : <TemplateCardView card={it} />}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ---------- 顶部模型条目 ---------- */
function ModelChip({ model }: { model: ModelInfo & { kind: 'image' | 'video' } }) {
  const Icon = model.kind === 'video' ? Video : ImageIcon;
  const href = model.kind === 'video'
    ? `/video?model=${model.id}`
    : `/image?model=${model.id}`;
  return (
    <Link
      href={href}
      className="group relative flex h-[80px] w-[220px] shrink-0 items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-3 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-white/20"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
        <Icon className="size-5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{model.label}</p>
        <p className="mt-0.5 text-xs text-white/60">{model.credits} 积分</p>
      </div>
      <Bot className="absolute -bottom-2 -right-2 size-12 text-white/5 transition-transform duration-300 group-hover:scale-110" />
    </Link>
  );
}

/* ---------- 4 工具大入口卡 ---------- */
function ToolEntry({
  href, label, desc, emoji, gradient, emphasis, badge,
}: {
  href: string; label: string; desc: string; emoji: string;
  gradient: string; emphasis?: boolean; badge?: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex h-[120px] overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br ${gradient} transition-all hover:-translate-y-0.5 hover:shadow-xl ${
        emphasis ? 'md:flex-[1.5]' : 'md:flex-1'
      }`}
    >
      <div className="relative z-10 flex flex-1 flex-col justify-between p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{label}</span>
          {badge && (
            <span className="rounded-md bg-red-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{desc}</p>
        <div className="flex items-center gap-1 text-xs text-foreground/80 transition-all group-hover:gap-2">
          进入 <ArrowRight className="size-3" />
        </div>
      </div>
      <div className="relative flex w-[40%] items-center justify-center text-5xl transition-transform duration-500 group-hover:scale-110">
        {emoji}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/10" />
    </Link>
  );
}

/* ---------- 瀑布流：社区作品卡 ---------- */
function PostCardView({ post }: { post: CommunityPost }) {
  return (
    <Link
      href={`/image?prompt=${encodeURIComponent(post.prompt)}`}
      className="group relative block overflow-hidden rounded-2xl border border-border/40 bg-card"
    >
      <div className="relative w-full" style={{ aspectRatio: post.aspect.replace('/', ' / ') }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.imageUrl}
          alt={post.prompt}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* 渐隐底部信息条 */}
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2.5 opacity-100">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] font-semibold text-white backdrop-blur-sm">
            {post.author.initials}
          </span>
          <span className="truncate text-xs text-white/90">{post.author.name}</span>
        </div>
        {/* hover 顶部标签 */}
        <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap gap-1">
          {post.tags.slice(0, 1).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

/* ---------- 瀑布流：模板卡 ---------- */
function TemplateCardView({ card }: { card: TemplateCard }) {
  const href = card.type === 'video'
    ? `/video?prompt=${encodeURIComponent(card.prompt)}`
    : `/image?prompt=${encodeURIComponent(card.prompt)}`;
  const TypeIcon = card.type === 'video' ? Play : Sparkles;
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-2xl border border-border/40"
    >
      <div
        className={`relative flex w-full items-center justify-center bg-gradient-to-br ${card.gradient}`}
        style={{ aspectRatio: card.aspect.replace('/', ' / ') }}
      >
        <div className="absolute inset-0 bg-black/15 transition-colors group-hover:bg-black/5" />
        <span className="relative z-10 text-5xl drop-shadow-md">{card.emoji}</span>
        {/* 左上：类别 chip */}
        <span className="absolute left-2 top-2 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          {card.category}
        </span>
        {/* 右上：类型 chip */}
        <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          <TypeIcon className="size-2.5" />
          {card.type === 'video' ? '视频' : '图像'}
        </span>
        {/* 底部信息条 */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2.5">
          <p className="truncate text-xs font-medium text-white">{card.title}</p>
          {card.desc && (
            <p className="mt-0.5 truncate text-[10px] text-white/70">{card.desc}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

