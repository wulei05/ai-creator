// 探索页瀑布流的混合数据源：社区作品 (Unsplash 真实图) + 模板 (gradient + emoji)
// 与 community/page.tsx 同步保持视觉一致。

export interface CommunityPost {
  kind: 'post';
  id: string;
  author: { name: string; initials: string };
  imageUrl: string;
  gradient: string;
  prompt: string;
  model: string;
  tags: string[];
  // 给瀑布流一个稳定的纵横比，避免依赖图片实际比例
  aspect: '1/1' | '3/4' | '4/5' | '9/16';
}

export interface TemplateCard {
  kind: 'template';
  id: string;
  type: 'image' | 'video';
  title: string;
  desc?: string;
  prompt: string;
  gradient: string;
  emoji: string;
  category: string;
  aspect: '1/1' | '4/5' | '3/4' | '16/9' | '9/16';
  imageUrl?: string;
}

export const COMMUNITY_POSTS: CommunityPost[] = [
  {
    kind: 'post', id: 'p1',
    author: { name: '星空画师', initials: '星' },
    imageUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600&q=80',
    gradient: 'from-indigo-600 via-purple-600 to-pink-500',
    prompt: 'cyberpunk city at night, neon lights reflecting on wet streets, flying cars, ultra detailed, 8k',
    model: 'Flux Pro', tags: ['赛博朋克', '城市', '夜景'], aspect: '3/4',
  },
  {
    kind: 'post', id: 'p2',
    author: { name: '梦境旅人', initials: '梦' },
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-400',
    prompt: '古风山水画，云雾缭绕的仙境，远处有飞瀑，意境深远，水墨风格',
    model: 'Gemini 3 Pro Image', tags: ['古风', '山水', '水墨'], aspect: '4/5',
  },
  {
    kind: 'post', id: 'p3',
    author: { name: 'AI 艺术家', initials: 'AI' },
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=80',
    gradient: 'from-orange-500 via-rose-500 to-pink-600',
    prompt: 'ethereal elf queen in enchanted forest, glowing magical aura, silver hair, fantasy art',
    model: 'Imagen 4 Ultra', tags: ['奇幻', '精灵', '魔法'], aspect: '3/4',
  },
  {
    kind: 'post', id: 'p4',
    author: { name: '创意工坊', initials: '创' },
    imageUrl: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&q=80',
    gradient: 'from-yellow-400 via-amber-500 to-orange-600',
    prompt: 'Japanese ramen bowl, steaming broth, chashu pork, soft egg, dark moody lighting',
    model: 'Flux Dev', tags: ['美食', '日式', '摄影'], aspect: '1/1',
  },
  {
    kind: 'post', id: 'p5',
    author: { name: '光影捕手', initials: '光' },
    imageUrl: 'https://images.unsplash.com/photo-1418065460487-3956c3ff017d?w=600&q=80',
    gradient: 'from-sky-500 via-blue-600 to-indigo-700',
    prompt: 'majestic mountain landscape at golden hour, dramatic clouds, snow peaks, cinematic',
    model: 'Imagen 4', tags: ['风景', '山脉', '日落'], aspect: '4/5',
  },
  {
    kind: 'post', id: 'p6',
    author: { name: '萌宠日记', initials: '萌' },
    imageUrl: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=600&q=80',
    gradient: 'from-rose-400 via-pink-400 to-fuchsia-500',
    prompt: 'cute fluffy kitten playing with yarn ball, soft natural light, adorable, high detail',
    model: 'Gemini 2.5 Flash Image', tags: ['动物', '猫咪', '可爱'], aspect: '3/4',
  },
  {
    kind: 'post', id: 'p7',
    author: { name: '次元穿越', initials: '次' },
    imageUrl: 'https://images.unsplash.com/photo-1535392432937-a27c36ec07b5?w=600&q=80',
    gradient: 'from-violet-600 via-purple-700 to-indigo-900',
    prompt: 'anime style girl with cherry blossoms, dreamy pastel colors, soft lighting, studio ghibli inspired',
    model: 'Grok Image', tags: ['动漫', '少女', '樱花'], aspect: '9/16',
  },
  {
    kind: 'post', id: 'p8',
    author: { name: '未来设计', initials: '未' },
    imageUrl: 'https://images.unsplash.com/photo-1518972559570-7cc1309f3229?w=600&q=80',
    gradient: 'from-slate-700 via-zinc-800 to-neutral-900',
    prompt: 'minimalist modern living room, scandinavian design, natural light, plants, photorealistic',
    model: 'Flux Pro', tags: ['建筑', '室内', '极简'], aspect: '1/1',
  },
  {
    kind: 'post', id: 'p9',
    author: { name: '海洋之声', initials: '海' },
    imageUrl: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=600&q=80',
    gradient: 'from-cyan-400 via-blue-500 to-teal-600',
    prompt: 'underwater coral reef with tropical fish, sunbeams piercing through water, vibrant colors',
    model: 'Imagen 4 Ultra', tags: ['海洋', '珊瑚', '自然'], aspect: '4/5',
  },
  {
    kind: 'post', id: 'p10',
    author: { name: '复古胶片', initials: '复' },
    imageUrl: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&q=80',
    gradient: 'from-amber-600 via-orange-700 to-red-800',
    prompt: 'vintage film photo of autumn forest, warm tones, leaves falling, nostalgic mood',
    model: 'Flux Dev', tags: ['复古', '秋天', '森林'], aspect: '3/4',
  },
  {
    kind: 'post', id: 'p11',
    author: { name: '抽象主义', initials: '抽' },
    imageUrl: 'https://images.unsplash.com/photo-1573521193826-58c7dc2e13e3?w=600&q=80',
    gradient: 'from-fuchsia-500 via-pink-500 to-rose-500',
    prompt: 'abstract fluid art, swirling colors, vibrant rainbow palette, modern artistic composition',
    model: 'Gemini 3 Pro Image', tags: ['抽象', '艺术', '色彩'], aspect: '1/1',
  },
  {
    kind: 'post', id: 'p12',
    author: { name: '极地探险', initials: '极' },
    imageUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=600&q=80',
    gradient: 'from-green-400 via-teal-400 to-indigo-600',
    prompt: 'northern lights aurora borealis over frozen tundra, reflection in ice, breathtaking landscape',
    model: 'Flux Pro', tags: ['极光', '风景', '自然'], aspect: '4/5',
  },
  {
    kind: 'post', id: 'p13',
    author: { name: '茶道禅意', initials: '茶' },
    imageUrl: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&q=80',
    gradient: 'from-stone-400 via-amber-300 to-green-400',
    prompt: 'traditional Japanese tea ceremony, zen garden view, shoji screen soft light, wabi-sabi aesthetic',
    model: 'Imagen 4', tags: ['日式', '禅意', '建筑'], aspect: '3/4',
  },
  {
    kind: 'post', id: 'p14',
    author: { name: '数字游民', initials: '数' },
    imageUrl: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=600&q=80',
    gradient: 'from-orange-600 via-red-700 to-gray-800',
    prompt: 'giant mech robot in destroyed urban battlefield, sunset silhouette, sparks flying, Pacific Rim style',
    model: 'Flux Dev', tags: ['科幻', '机甲', '战争'], aspect: '9/16',
  },
  {
    kind: 'post', id: 'p15',
    author: { name: '糖果工坊', initials: '糖' },
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80',
    gradient: 'from-pink-400 via-rose-300 to-purple-400',
    prompt: 'dreamy pastel cake with edible flowers, mirror glaze, luxury patisserie photography, soft light',
    model: 'Gemini 2.5 Flash Image', tags: ['美食', '甜品', '摄影'], aspect: '1/1',
  },
  {
    kind: 'post', id: 'p16',
    author: { name: '星际旅者', initials: '宇' },
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80',
    gradient: 'from-indigo-800 via-purple-800 to-blue-900',
    prompt: 'astronaut floating in deep space, earth below, milky way background, photorealistic NASA style',
    model: 'Imagen 4 Ultra', tags: ['宇宙', '太空', '科幻'], aspect: '4/5',
  },
  {
    kind: 'post', id: 'p17',
    author: { name: '雨林记者', initials: '雨' },
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80',
    gradient: 'from-green-600 via-emerald-500 to-teal-400',
    prompt: 'ancient tropical rainforest, massive tree roots, dappled sunlight, bioluminescent plants, ethereal',
    model: 'Flux Pro', tags: ['自然', '森林', '热带'], aspect: '3/4',
  },
  {
    kind: 'post', id: 'p18',
    author: { name: '武侠江湖', initials: '武' },
    imageUrl: 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=600&q=80',
    gradient: 'from-orange-500 via-red-500 to-rose-600',
    prompt: 'Chinese samurai warrior, bamboo forest, cherry blossoms, dramatic lighting, wuxia style illustration',
    model: 'Grok Image', tags: ['武侠', '古风', '人物'], aspect: '9/16',
  },
];

// 给瀑布流增加密度的随机纵横比池 (按图像 / 视频区分)
const IMAGE_ASPECTS = ['1/1', '4/5', '3/4', '9/16'] as const;
const VIDEO_ASPECTS = ['16/9', '4/5', '1/1'] as const;

function pickAspect<T extends readonly string[]>(pool: T, seed: number): T[number] {
  return pool[seed % pool.length];
}

// 从两个 TEMPLATE_CATEGORIES 抽取所有卡片
export function buildTemplateCards(
  imageCategories: Array<{ id: string; label: string; templates: Array<{ title: string; desc?: string; prompt: string; gradient: string; emoji: string; imageUrl?: string }> }>,
  videoCategories: Array<{ id: string; label: string; templates: Array<{ title: string; desc?: string; prompt: string; gradient: string; emoji: string }> }>,
): TemplateCard[] {
  const cards: TemplateCard[] = [];
  imageCategories.forEach((c, ci) =>
    c.templates.forEach((t, ti) =>
      cards.push({
        kind: 'template', id: `it-${c.id}-${ti}`, type: 'image',
        title: t.title, desc: t.desc, prompt: t.prompt, gradient: t.gradient, emoji: t.emoji,
        category: c.label, aspect: pickAspect(IMAGE_ASPECTS, ci * 3 + ti),
        imageUrl: t.imageUrl,
      }),
    ),
  );
  videoCategories.forEach((c, ci) =>
    c.templates.forEach((t, ti) =>
      cards.push({
        kind: 'template', id: `vt-${c.id}-${ti}`, type: 'video',
        title: t.title, desc: t.desc, prompt: t.prompt, gradient: t.gradient, emoji: t.emoji,
        category: c.label, aspect: pickAspect(VIDEO_ASPECTS, ci + ti + 1),
      }),
    ),
  );
  return cards;
}

// 灵感页：随机打散 (用稳定 seed) — 混合 posts + templates
export function shuffleMix(posts: CommunityPost[], templates: TemplateCard[]): Array<CommunityPost | TemplateCard> {
  // 用 id 字符序做稳定排序，避免每次 mount 顺序变化引发 hydration 不一致
  const mix: Array<CommunityPost | TemplateCard> = [...posts, ...templates];
  return mix.sort((a, b) => {
    const ha = hash(a.id), hb = hash(b.id);
    return ha - hb;
  });
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
