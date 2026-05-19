export type AspectRatio = '16:9' | '9:16' | '1:1';
export type Duration = 5 | 10;

export interface TaskRecord {
  id: string;
  prompt: string;
  status: string;
  output_url: string | null;
  created_at: string;
}

export interface Template {
  title: string;
  desc: string;
  prompt: string;
  gradient: string;
  emoji: string;
}

export interface TemplateCategory {
  id: string;
  label: string;
  emoji: string;
  templates: Template[];
}

export const ASPECT_RATIOS: { value: AspectRatio; label: string; icon: string }[] = [
  { value: '16:9', label: '16:9', icon: '▬' },
  { value: '9:16', label: '9:16', icon: '▮' },
  { value: '1:1', label: '1:1', icon: '■' },
];

export const DURATIONS: { value: Duration; label: string; desc: string }[] = [
  { value: 5, label: '5秒', desc: '快速预览' },
  { value: 10, label: '10秒', desc: '完整呈现' },
];

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
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

export const TOTAL_TEMPLATE_COUNT = TEMPLATE_CATEGORIES.reduce(
  (s, c) => s + c.templates.length, 0,
);
