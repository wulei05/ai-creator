import type { LucideIcon } from 'lucide-react';
import { Expand, Eraser, Scissors, ZoomIn } from 'lucide-react';

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3';

export interface TaskRecord {
  id: string;
  prompt: string;
  status: string;
  output_url: string | null;
  created_at: string;
}

export interface Template {
  title: string;
  prompt: string;
  gradient: string;
  emoji: string;
  imageUrl?: string;
}

export interface TemplateCategory {
  id: string;
  label: string;
  emoji: string;
  templates: Template[];
}

export interface PhotoTool {
  title: string;
  desc: string;
  prompt: string;
  imageUrl: string;
  aspect: string;
  emoji: string;
}

export interface AiTool {
  icon: LucideIcon;
  label: string;
  desc: string;
  gradient: string;
  soon: boolean;
}

export const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: '1:1', label: '1:1' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '4:3', label: '4:3' },
];

// 不显示宽高比选择器的模型（Imagen / Gemini image 类）
export const NO_ASPECT_RATIO_MODELS = [
  'imagen-4', 'imagen-4-ultra', 'imagen-4-fast',
  'gemini-2.5-flash-image', 'gemini-3-pro-image', 'gemini-3.1-flash-image',
];

// 支持参考图上传（图生图）的模型 —— Gemini content image 类
export const REFERENCE_IMAGE_MODELS = [
  'gemini-2.5-flash-image', 'gemini-3-pro-image', 'gemini-3.1-flash-image',
];

export const AI_TOOLS: AiTool[] = [
  { icon: Expand,   label: '扩图',    desc: '智能延伸画面边界',  gradient: 'from-blue-500 to-cyan-400',    soon: false },
  { icon: Eraser,   label: '移除物体', desc: '一键抹去多余元素',  gradient: 'from-violet-500 to-purple-400', soon: true  },
  { icon: Scissors, label: '移除背景', desc: '自动抠图留主体',    gradient: 'from-rose-500 to-pink-400',    soon: true  },
  { icon: ZoomIn,   label: '高清放大', desc: 'AI 超分辨率增强',  gradient: 'from-amber-500 to-orange-400', soon: true  },
];

export const PHOTO_TOOLS: PhotoTool[] = [
  {
    title: '证件照',
    desc: '白/蓝/红底，职业证件',
    prompt: 'professional ID photo portrait, clean white background, formal attire, sharp focus on face, even studio lighting, high resolution, photorealistic',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80',
    aspect: '9:16',
    emoji: '🪪',
  },
  {
    title: '结婚照',
    desc: '唯美浪漫婚纱写真',
    prompt: 'romantic wedding couple portrait, elegant wedding dress, soft bokeh background with flowers, golden hour lighting, cinematic film style, ultra realistic',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=300&q=80',
    aspect: '16:9',
    emoji: '💍',
  },
  {
    title: '职业写真',
    desc: '商务形象，简历用照',
    prompt: 'professional business portrait, confident smile, smart attire, modern office background, soft natural lighting, sharp and clean, photorealistic headshot',
    imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&q=80',
    aspect: '9:16',
    emoji: '💼',
  },
  {
    title: '艺术写真',
    desc: '时尚大片，个人品牌',
    prompt: 'artistic fashion portrait, editorial style, dramatic moody lighting, high fashion outfit, professional makeup, magazine cover quality, ultra detailed',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
    aspect: '9:16',
    emoji: '🎨',
  },
  {
    title: '儿童写真',
    desc: '萌娃百天、周岁纪念',
    prompt: 'adorable baby portrait, soft pastel background, natural smile, warm gentle lighting, shallow depth of field, heartwarming, professional studio photo',
    imageUrl: 'https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?w=300&q=80',
    aspect: '1:1',
    emoji: '👶',
  },
  {
    title: '全家福',
    desc: '家庭合影，节日纪念',
    prompt: 'happy family portrait, warm golden hour light, outdoor park setting, natural candid smiles, professional photography, sharp focus, heartwarming composition',
    imageUrl: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=300&q=80',
    aspect: '16:9',
    emoji: '👨‍👩‍👧‍👦',
  },
  {
    title: '毕业照',
    desc: '学士服，纪念留影',
    prompt: 'graduation portrait, academic gown and cap, university campus background, proud confident smile, professional photography, clear and sharp, celebratory atmosphere',
    imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=300&q=80',
    aspect: '9:16',
    emoji: '🎓',
  },
  {
    title: '旅行纪念',
    desc: '风景人物，旅途记忆',
    prompt: 'travel portrait at scenic location, person in foreground with stunning landscape background, natural light, candid joyful expression, travel photography style',
    imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300&q=80',
    aspect: '16:9',
    emoji: '✈️',
  },
];

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
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
        imageUrl: 'https://images.unsplash.com/photo-1616588589676-62b3bd4ff6d2?w=300&q=80',
      },
      {
        title: '古风仕女',
        prompt: 'beautiful Chinese ancient style woman, traditional hanfu clothing, ink painting background, delicate features, flowing hair with jade ornaments, soft lighting',
        gradient: 'from-rose-400 via-pink-300 to-orange-200',
        emoji: '🌸',
        imageUrl: 'https://images.unsplash.com/photo-1490718720478-364a07a997cd?w=300&q=80',
      },
      {
        title: '精灵女王',
        prompt: 'ethereal elf queen, silver flowing hair, emerald forest background, glowing magical aura, intricate crown with gemstones, fantasy art style, highly detailed',
        gradient: 'from-emerald-400 via-teal-400 to-cyan-300',
        emoji: '🧝',
        imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=300&q=80',
      },
      {
        title: '武士战士',
        prompt: 'Japanese samurai warrior, detailed armor with dragon motifs, cherry blossom petals falling, dramatic side lighting, cinematic, hyperrealistic',
        gradient: 'from-orange-500 via-red-500 to-rose-600',
        emoji: '⚔️',
        imageUrl: 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=300&q=80',
      },
      {
        title: '蒸汽朋克',
        prompt: 'steampunk inventor woman, Victorian-era goggles, mechanical arm prosthetic, gears and brass pipes, sepia-toned workshop, dramatic lighting, oil painting style',
        gradient: 'from-amber-500 via-yellow-400 to-orange-400',
        emoji: '⚙️',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&q=80',
      },
      {
        title: '宇航员',
        prompt: 'female astronaut floating in space, reflective helmet visor showing galaxy reflection, earth in background, photorealistic, NASA suit, dramatic lighting',
        gradient: 'from-blue-600 via-indigo-500 to-purple-600',
        emoji: '🚀',
        imageUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=300&q=80',
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
        imageUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=300&q=80',
      },
      {
        title: '樱花古道',
        prompt: 'ancient Japanese stone path through tunnel of blooming cherry blossoms, soft pink petals falling, golden hour light, peaceful, ultra detailed',
        gradient: 'from-pink-300 via-rose-300 to-pink-400',
        emoji: '🌸',
        imageUrl: 'https://images.unsplash.com/photo-1522383225753-aa6857c2b0e7?w=300&q=80',
      },
      {
        title: '热带雨林',
        prompt: 'lush tropical rainforest with ancient waterfall, bioluminescent plants glowing blue and green, misty atmosphere, exotic birds, national geographic style photography',
        gradient: 'from-green-600 via-emerald-500 to-teal-400',
        emoji: '🌿',
        imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&q=80',
      },
      {
        title: '沙漠日落',
        prompt: 'vast Sahara desert at golden sunset, dramatic sand dunes with long shadows, camel caravan silhouette, vivid orange and red sky, wide panoramic shot',
        gradient: 'from-orange-600 via-amber-500 to-yellow-400',
        emoji: '🌅',
        imageUrl: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=300&q=80',
      },
      {
        title: '云海仙境',
        prompt: 'mystical mountain peaks rising above sea of clouds at sunrise, ancient Chinese temple on cliff, pink and golden sky, ink painting meets photography, dreamlike',
        gradient: 'from-sky-300 via-blue-200 to-indigo-300',
        emoji: '⛰️',
        imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=300&q=80',
      },
      {
        title: '深海世界',
        prompt: 'magical underwater deep ocean scene, glowing jellyfish, colorful coral reef, shafts of sunlight piercing blue water, sea turtles, ultra detailed, cinematic',
        gradient: 'from-blue-700 via-cyan-500 to-teal-400',
        emoji: '🌊',
        imageUrl: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=300&q=80',
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
        imageUrl: 'https://images.unsplash.com/photo-1616588589676-62b3bd4ff6d2?w=300&q=80',
      },
      {
        title: '侦探学院',
        prompt: 'anime style high school detective club, group of students in uniform, mysterious old library background, autumn evening light, slice of life anime, Studio Ghibli inspired',
        gradient: 'from-amber-400 via-orange-400 to-red-400',
        emoji: '🔍',
        imageUrl: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=300&q=80',
      },
      {
        title: '龙与少年',
        prompt: 'anime boy with friendly dragon companion, flying over fantasy village, sunset sky with clouds, adventure anime style, vibrant colors, detailed background, epic composition',
        gradient: 'from-sky-400 via-blue-500 to-indigo-500',
        emoji: '🐉',
        imageUrl: 'https://images.unsplash.com/photo-1518710843675-2540dd79065c?w=300&q=80',
      },
      {
        title: '街头少年',
        prompt: 'cool anime teenager in streetwear, Tokyo night cityscape, neon reflections on wet street, hip hop style, urban anime aesthetic, detailed illustration',
        gradient: 'from-violet-500 via-purple-500 to-pink-500',
        emoji: '🎵',
        imageUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=300&q=80',
      },
      {
        title: '神明少女',
        prompt: 'divine shrine maiden anime style, white and red traditional miko outfit, torii gate, cherry blossoms, spiritual fox companion, ethereal glow, beautiful detailed art',
        gradient: 'from-red-400 via-rose-400 to-pink-300',
        emoji: '🦊',
        imageUrl: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=300&q=80',
      },
      {
        title: '废土勇者',
        prompt: 'post-apocalyptic anime hero, ruined city background, scavenged mechanical armor, determined expression, orange dusty sky, dark fantasy anime, dynamic pose',
        gradient: 'from-orange-500 via-red-600 to-gray-700',
        emoji: '🤖',
        imageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=300&q=80',
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
        imageUrl: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=300&q=80',
      },
      {
        title: '龙族宝窟',
        prompt: 'massive dragon sleeping on mountain of gold and jewels in ancient cave, shafts of light from ceiling crack, treasure coins reflecting light, epic fantasy illustration, cinematic',
        gradient: 'from-yellow-500 via-amber-500 to-orange-600',
        emoji: '💎',
        imageUrl: 'https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?w=300&q=80',
      },
      {
        title: '精灵圣树',
        prompt: 'colossal ancient tree home to elves, glowing windows carved into bark, rope bridges between branches, luminescent mushrooms below, enchanted forest, fantasy art',
        gradient: 'from-green-500 via-emerald-400 to-teal-500',
        emoji: '🌳',
        imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=300&q=80',
      },
      {
        title: '水晶宫殿',
        prompt: 'crystalline ice palace interior, rainbow refractions on walls, frozen throne, aurora colors through crystal ceiling, ice sculptures, ultra detailed fantasy concept art',
        gradient: 'from-cyan-300 via-sky-400 to-blue-500',
        emoji: '❄️',
        imageUrl: 'https://images.unsplash.com/photo-1476611338391-6f395a0ebc7b?w=300&q=80',
      },
      {
        title: '炼金工坊',
        prompt: 'fantasy alchemist laboratory, bubbling colorful potions, ancient spell books, mystical symbols floating in air, magical ingredients, dramatic lighting, detailed illustration',
        gradient: 'from-purple-600 via-violet-500 to-indigo-500',
        emoji: '⚗️',
        imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=300&q=80',
      },
      {
        title: '星际神殿',
        prompt: 'ancient cosmic temple floating in nebula, stone pillars with glowing runes, portal to another dimension, starfield background, gods realm, epic scale, digital art',
        gradient: 'from-indigo-600 via-purple-600 to-pink-600',
        emoji: '🌠',
        imageUrl: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=300&q=80',
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
        imageUrl: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=300&q=80',
      },
      {
        title: '霓虹都市',
        prompt: 'blade runner style cyberpunk megacity, flying cars between skyscrapers, neon signs in Chinese and English, rain-slicked streets, ultra detailed, cinematic noir lighting',
        gradient: 'from-cyan-500 via-blue-600 to-purple-700',
        emoji: '🌃',
        imageUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=300&q=80',
      },
      {
        title: '机甲战争',
        prompt: 'colossal mech robot standing in destroyed urban battlefield, dramatic sunset, battle damage with sparks, heroic pose, Pacific Rim inspired, photorealistic CGI quality',
        gradient: 'from-orange-600 via-red-700 to-gray-800',
        emoji: '⚡',
        imageUrl: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=300&q=80',
      },
      {
        title: '量子实验室',
        prompt: 'futuristic quantum computing laboratory, glowing blue holographic interfaces, scientist examining data streams, clean white environment, soft blue ambient lighting, sci-fi concept art',
        gradient: 'from-blue-400 via-cyan-400 to-teal-500',
        emoji: '🔬',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&q=80',
      },
      {
        title: '星际探索',
        prompt: 'astronaut standing on alien planet surface, two suns in sky, exotic blue vegetation, huge gas giant visible on horizon, exploration rover nearby, photorealistic',
        gradient: 'from-purple-500 via-blue-500 to-teal-500',
        emoji: '🪐',
        imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&q=80',
      },
      {
        title: '仿生人类',
        prompt: 'hyper-realistic android face half exposed showing mechanical components, emotional expression, studio photography, deep depth of field, dramatic lighting, concept art',
        gradient: 'from-gray-500 via-slate-600 to-zinc-700',
        emoji: '🦾',
        imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=300&q=80',
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
        imageUrl: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=300&q=80',
      },
      {
        title: '精致甜点',
        prompt: 'exquisite French patisserie dessert, multiple layers of mousse cake, mirror glaze, edible gold leaf, fresh berries, marble surface, soft diffused natural light, luxury food styling',
        gradient: 'from-pink-400 via-rose-300 to-purple-400',
        emoji: '🎂',
        imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&q=80',
      },
      {
        title: '精品咖啡',
        prompt: 'specialty latte art in ceramic cup, perfect rosetta pattern in milk foam, coffee beans and cinnamon nearby, wooden table, warm morning light, artisan cafe atmosphere',
        gradient: 'from-amber-700 via-amber-600 to-yellow-500',
        emoji: '☕',
        imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&q=80',
      },
      {
        title: '寿司盛宴',
        prompt: 'premium omakase sushi platter, fresh nigiri and maki, tuna, salmon, sea urchin, elegant black slate presentation, water droplets, restaurant quality photography',
        gradient: 'from-red-500 via-orange-400 to-yellow-300',
        emoji: '🍣',
        imageUrl: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=300&q=80',
      },
      {
        title: '热带水果',
        prompt: 'vibrant tropical fruit arrangement, dragon fruit, mango, passion fruit, papaya, bright colors, overhead flat lay, white background, fresh and juicy, commercial photography',
        gradient: 'from-yellow-400 via-orange-400 to-red-400',
        emoji: '🍓',
        imageUrl: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=300&q=80',
      },
      {
        title: '调酒鸡尾酒',
        prompt: 'colorful craft cocktails on bar counter, vibrant tropical colors, citrus garnishes, smoke effect, bokeh bar lights background, luxury hotel bar aesthetic, moody photography',
        gradient: 'from-blue-400 via-purple-400 to-pink-500',
        emoji: '🍹',
        imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=300&q=80',
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
        imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300&q=80',
      },
      {
        title: '哥特教堂',
        prompt: 'interior of Gothic cathedral, soaring stone arches, vibrant stained glass windows casting colorful light, dramatic perspective, ancient atmosphere, ultra detailed',
        gradient: 'from-violet-700 via-purple-600 to-indigo-700',
        emoji: '⛪',
        imageUrl: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=300&q=80',
      },
      {
        title: '日式茶室',
        prompt: 'serene Japanese tea house interior, shoji screens with soft diffused light, tatami floors, ikebana flower arrangement, bamboo garden view, zen simplicity, architectural photo',
        gradient: 'from-stone-400 via-amber-300 to-green-400',
        emoji: '🎋',
        imageUrl: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=300&q=80',
      },
      {
        title: '未来博物馆',
        prompt: 'futuristic museum architecture, parametric curved walls, massive glass atrium, natural light flooding interior, visitors as tiny silhouettes, Zaha Hadid inspired, render',
        gradient: 'from-sky-300 via-blue-400 to-indigo-500',
        emoji: '🏗️',
        imageUrl: 'https://images.unsplash.com/photo-1501426026826-31c667bdf23d?w=300&q=80',
      },
      {
        title: '水上别墅',
        prompt: 'overwater bungalow in Maldives turquoise lagoon, clear blue water, tropical palm trees, sunrise reflection, luxury resort photography, travel magazine quality',
        gradient: 'from-cyan-400 via-teal-400 to-blue-500',
        emoji: '🏝️',
        imageUrl: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=300&q=80',
      },
      {
        title: '废墟遗迹',
        prompt: 'ancient Mayan pyramid ruins reclaimed by jungle, vines and trees growing through stone, golden afternoon light, archaeological discovery atmosphere, cinematic wide shot',
        gradient: 'from-green-600 via-emerald-700 to-stone-600',
        emoji: '🏚️',
        imageUrl: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=300&q=80',
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
        imageUrl: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=300&q=80',
      },
      {
        title: '丛林猛虎',
        prompt: 'Bengal tiger emerging from dense jungle foliage, intense orange and black stripes, amber eyes, water droplets on fur, dramatic backlight, National Geographic style',
        gradient: 'from-orange-500 via-amber-600 to-yellow-500',
        emoji: '🐯',
        imageUrl: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=300&q=80',
      },
      {
        title: '深海巨鲸',
        prompt: 'humpback whale breaching ocean surface, dramatic sunset sky, water cascading off body, aerial drone perspective, epic wildlife moment, photorealistic',
        gradient: 'from-blue-600 via-teal-500 to-cyan-400',
        emoji: '🐋',
        imageUrl: 'https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=300&q=80',
      },
      {
        title: '猫咪物语',
        prompt: 'fluffy British shorthair cat with round eyes, sitting on Japanese window sill, cherry blossoms outside, warm afternoon light, cozy lifestyle photography, adorable',
        gradient: 'from-orange-300 via-amber-300 to-yellow-300',
        emoji: '🐱',
        imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&q=80',
      },
      {
        title: '鹰击长空',
        prompt: 'bald eagle in mid-flight, wings fully spread, blue sky with white clouds, sunlight through feathers, American symbol, wildlife photography, dramatic upward angle',
        gradient: 'from-sky-500 via-blue-600 to-indigo-600',
        emoji: '🦅',
        imageUrl: 'https://images.unsplash.com/photo-1611689342806-0863700ea78a?w=300&q=80',
      },
      {
        title: '玻璃蛙',
        prompt: 'transparent glass frog on tropical leaf, internal organs visible through skin, macro photography, water droplets, vibrant green, shallow depth of field, stunning nature photo',
        gradient: 'from-green-400 via-teal-400 to-emerald-500',
        emoji: '🐸',
        imageUrl: 'https://images.unsplash.com/photo-1516934024742-b461fba47600?w=300&q=80',
      },
    ],
  },
];

export const TOTAL_TEMPLATE_COUNT = TEMPLATE_CATEGORIES.reduce(
  (s, c) => s + c.templates.length, 0,
);
