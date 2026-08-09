export type ModelCategory = 'chat' | 'image' | 'video';

export interface ModelContent {
  id: string;
  label: string;
  category: ModelCategory;
  provider: string;
  providerUrl?: string;
  tagline: string;
  description: string;
  credits: number;
  badge?: string; // 'NEW' | 'HOT' | 'PRO'
  color: string;       // dot / accent color
  features: { icon: string; title: string; desc: string }[];
  specs: { label: string; value: string }[];
  useCases: { title: string; prompt: string }[];
  faqs: { q: string; a: string }[];
}

// ─── Chat ───────────────────────────────────────────────────────────────────

const CHAT_MODELS: ModelContent[] = [
  {
    id: 'deepseek-chat',
    label: 'DeepSeek V3',
    category: 'chat',
    provider: 'DeepSeek',
    tagline: '性价比之王，中文最强对话模型',
    description: 'DeepSeek V3 是深度求索最新一代通用对话大模型，在代码生成、数学推理、中文理解等方面性能卓越，以极低的推理成本实现接近 GPT-4o 的效果，是日常使用和开发场景的首选。',
    credits: 2,
    badge: 'HOT',
    color: '#67e8f9',
    features: [
      { icon: '💬', title: '中文理解', desc: '原生中文预训练，语义理解准确，表达流畅自然' },
      { icon: '💻', title: '代码生成', desc: '支持 Python、JS、SQL 等主流语言，逻辑严谨' },
      { icon: '📐', title: '数学推理', desc: '复杂数学题求解，步骤清晰、答案准确' },
      { icon: '⚡', title: '响应极快', desc: '推理速度业界领先，对话流畅无延迟感' },
    ],
    specs: [
      { label: '上下文窗口', value: '128K tokens' },
      { label: '支持视觉', value: '否' },
      { label: '积分消耗', value: '2 积分 / 次' },
      { label: '响应速度', value: '极快' },
      { label: '开发商', value: 'DeepSeek（深度求索）' },
    ],
    useCases: [
      { title: '写作助手', prompt: '帮我写一篇关于 AI 对创意产业影响的 800 字文章，要有具体数据和案例' },
      { title: '代码调试', prompt: '我的 Python 爬虫遇到了 SSL 证书错误，帮我诊断并给出修复方案' },
      { title: '方案策划', prompt: '为一个面向 25-35 岁白领的健身 App 设计 3 种差异化的商业化策略' },
    ],
    faqs: [
      { q: 'DeepSeek V3 和 R1 有什么区别？', a: 'V3 是通用对话模型，响应快、适合日常任务；R1 是推理模型，擅长数学/科学/逻辑推理，但速度稍慢。' },
      { q: '支持多轮对话吗？', a: '支持，会自动携带上下文，最多支持 128K tokens 的对话历史。' },
      { q: '能处理中文吗？', a: '非常擅长，DeepSeek 在中文数据集上进行了专项训练，效果优于大多数国际模型。' },
    ],
  },
  {
    id: 'deepseek-reasoner',
    label: 'DeepSeek R1',
    category: 'chat',
    provider: 'DeepSeek',
    tagline: '开源最强推理模型，数学代码科学三冠王',
    description: 'DeepSeek R1 是深度求索开源的推理专用模型，在数学竞赛、科学推理、代码生成等任务上与 OpenAI o1 旗鼓相当，却以极低成本提供服务。推理过程透明，思维链可见。',
    credits: 5,
    badge: 'HOT',
    color: '#67e8f9',
    features: [
      { icon: '🧮', title: '数学推理', desc: 'AMC、AIME 竞赛级数学能力，解题过程完整清晰' },
      { icon: '🔬', title: '科学问答', desc: '物理、化学、生物等领域复杂问题的系统性分析' },
      { icon: '🔍', title: '透明思维链', desc: '推理过程可见，便于验证和学习解题逻辑' },
      { icon: '💻', title: '算法编程', desc: 'LeetCode Hard 级别问题解决，代码质量高' },
    ],
    specs: [
      { label: '上下文窗口', value: '64K tokens' },
      { label: '支持视觉', value: '否' },
      { label: '积分消耗', value: '5 积分 / 次' },
      { label: '推理速度', value: '中等（含思维链）' },
      { label: '开发商', value: 'DeepSeek（深度求索）' },
    ],
    useCases: [
      { title: '数学题求解', prompt: '证明：对于任意正整数 n，n(n+1)(n+2) 能被 6 整除' },
      { title: '算法设计', prompt: '设计一个 O(n log n) 时间复杂度的算法，找出数组中所有满足 a+b+c=0 的三元组' },
      { title: '逻辑推理', prompt: '5 个人各说了一句话，根据以下条件推断谁说了真话...' },
    ],
    faqs: [
      { q: 'R1 比 V3 慢多少？', a: '由于 R1 会生成完整思维链，响应时间通常是 V3 的 2-4 倍，但问题解决质量更高。' },
      { q: '适合日常对话吗？', a: '日常聊天用 V3 更合适，R1 更适合需要精确推理的任务（数学、逻辑、复杂代码）。' },
      { q: '思维链内容会计入积分吗？', a: '思维链生成的 token 会计入，但平台已在定价中进行了综合考量。' },
    ],
  },
  {
    id: 'gpt-4o',
    label: 'GPT-4o',
    category: 'chat',
    provider: 'OpenAI',
    tagline: 'OpenAI 旗舰模型，视觉 + 文字双栖全能',
    description: 'GPT-4o（omni）是 OpenAI 最强的多模态旗舰模型，支持文字、图像、文件输入，在创意写作、代码、分析、角色扮演等几乎所有任务上均表现卓越，是综合能力最全面的对话模型之一。',
    credits: 10,
    badge: 'PRO',
    color: '#10b981',
    features: [
      { icon: '👁️', title: '视觉理解', desc: '上传图片、截图、图表，模型可精准分析和描述' },
      { icon: '✍️', title: '创意写作', desc: '小说、文案、诗歌、剧本，风格多样，质量出色' },
      { icon: '🌐', title: '多语言', desc: '100+ 种语言流畅对话，翻译质量接近专业级' },
      { icon: '🧠', title: '复杂推理', desc: '长文档理解、多步骤分析，逻辑严密' },
    ],
    specs: [
      { label: '上下文窗口', value: '128K tokens' },
      { label: '支持视觉', value: '是（图片/截图）' },
      { label: '积分消耗', value: '10 积分 / 次' },
      { label: '响应速度', value: '快' },
      { label: '开发商', value: 'OpenAI' },
    ],
    useCases: [
      { title: '图片分析', prompt: '（上传一张产品图）分析这张图片的构图、配色，并给出改进建议' },
      { title: '商业文案', prompt: '为一款面向职场人士的咖啡品牌写 3 条不同风格的广告语，要有记忆点' },
      { title: '代码审查', prompt: '审查以下 TypeScript 代码，找出潜在的性能问题和类型安全漏洞...' },
    ],
    faqs: [
      { q: 'GPT-4o 和 GPT-4 有什么区别？', a: 'GPT-4o 是 GPT-4 的升级版，速度更快、成本更低，且原生支持多模态输入，综合能力更强。' },
      { q: '可以上传文件吗？', a: '目前支持图片上传，文件（PDF/Word）分析功能正在接入中。' },
      { q: '每次对话有长度限制吗？', a: '单次对话上下文最长 128K tokens，约等于 10 万个中文字符，足以处理长文档。' },
    ],
  },
  {
    id: 'claude-sonnet-4-6',
    label: 'Claude Sonnet',
    category: 'chat',
    provider: 'Anthropic',
    tagline: 'Anthropic 旗舰，超长上下文，创作与推理双强',
    description: 'Claude Sonnet 4.6 是 Anthropic 最新旗舰对话模型，在长文档处理、创意写作、复杂推理和代码生成方面表现卓越。以安全性和无害性著称，特别适合需要深度思考和细腻表达的场景。',
    credits: 12,
    badge: 'PRO',
    color: '#f59e0b',
    features: [
      { icon: '📚', title: '超长上下文', value: '200K tokens 上下文，可处理整本书或超长代码库' },
      { icon: '🎭', title: '创意写作', desc: '叙事风格细腻、情感丰富，长篇创作质量出众' },
      { icon: '🛡️', title: '安全无害', desc: 'Anthropic Constitutional AI 训练，拒绝有害请求更可靠' },
      { icon: '💡', title: '深度推理', desc: '复杂问题分析全面，逻辑链条完整，结论有据可查' },
    ].map(f => ({ icon: f.icon, title: f.title, desc: f.desc ?? (f as {icon:string;title:string;value:string}).value })),
    specs: [
      { label: '上下文窗口', value: '200K tokens' },
      { label: '支持视觉', value: '是' },
      { label: '积分消耗', value: '12 积分 / 次' },
      { label: '响应速度', value: '中等' },
      { label: '开发商', value: 'Anthropic' },
    ],
    useCases: [
      { title: '长文档分析', prompt: '（粘贴一份 50 页的合同）分析这份合同中对乙方不利的条款，并给出修改建议' },
      { title: '创意小说', prompt: '写一个赛博朋克风格的短篇小说开头（约 1000 字），主角是一名记忆黑客' },
      { title: '架构设计', prompt: '设计一个支持 10 万日活的实时聊天系统，给出技术选型、数据库设计和扩展方案' },
    ],
    faqs: [
      { q: 'Claude 和 GPT-4o 怎么选？', a: '创意写作和长文档首选 Claude；代码调试和快速问答首选 GPT-4o；数学推理首选 DeepSeek R1。' },
      { q: 'Claude 会拒绝哪些请求？', a: 'Claude 对明显有害内容（暴力、违法等）会拒绝，但对正常创作、专业分析等均可正常处理。' },
      { q: '支持中文吗？', a: '支持，中文理解和表达质量较好，但最佳表现仍是英文场景。' },
    ],
  },
];

// ─── Image ──────────────────────────────────────────────────────────────────

const IMAGE_MODELS: ModelContent[] = [
  {
    id: 'flux-pro',
    label: 'Flux Pro',
    category: 'image',
    provider: 'Black Forest Labs',
    tagline: '商业级图像旗舰，细节与真实感业界顶尖',
    description: 'Flux Pro 是 Black Forest Labs 的旗舰图像生成模型，在人像真实感、文字渲染、复杂场景还原方面均处于业界前列。生成图像无水印，可直接用于商业项目。',
    credits: 10,
    badge: 'PRO',
    color: '#f59e0b',
    features: [
      { icon: '📸', title: '照片级真实', desc: '人像、产品、风景照片级输出，细节丰富' },
      { icon: '✍️', title: '文字渲染', desc: '图中文字清晰可读，海报、Logo 设计首选' },
      { icon: '🎨', title: '风格多样', desc: '写实、油画、插画、概念艺术无缝切换' },
      { icon: '💼', title: '商业授权', desc: '生成图像商业可用，无水印，版权归用户' },
    ],
    specs: [
      { label: '最高分辨率', value: '2048×2048' },
      { label: '支持参考图', value: '否' },
      { label: '积分消耗', value: '10 积分 / 张' },
      { label: '生成速度', value: '约 15-25 秒' },
      { label: '开发商', value: 'Black Forest Labs' },
    ],
    useCases: [
      { title: '产品宣传图', prompt: 'A luxury perfume bottle on black marble, soft golden light, professional product photography, 8k' },
      { title: '人像艺术', prompt: 'Portrait of an elegant woman in traditional Chinese qipao, cherry blossoms background, cinematic lighting, hyperrealistic' },
      { title: '概念场景', prompt: 'Futuristic Tokyo street at night, neon reflections on wet pavement, cyberpunk atmosphere, ultra detailed' },
    ],
    faqs: [
      { q: 'Flux Pro 和 Flux Schnell 有什么区别？', a: 'Pro 质量更高、细节更丰富，适合最终成品；Schnell 速度更快（约 3 秒），适合快速迭代和草稿测试。' },
      { q: '支持中文提示词吗？', a: '建议使用英文提示词，效果最佳。可用平台的「AI 翻译」功能一键转换。' },
      { q: '生成的图片可以商用吗？', a: '可以，Flux Pro 生成的图片商业授权归用户所有，无版权限制。' },
    ],
  },
  {
    id: 'imagen-4-ultra',
    label: 'Imagen 4 Ultra',
    category: 'image',
    provider: 'Google',
    tagline: 'Google 顶级图像模型，科学可信度最高',
    description: 'Imagen 4 Ultra 是 Google DeepMind 最强图像生成模型，在科学可视化、精准文字渲染、色彩保真度方面业界领先。特别擅长医学、教育、技术类专业图像生成。',
    credits: 20,
    badge: 'NEW',
    color: '#4285f4',
    features: [
      { icon: '🔬', title: '科学可视化', desc: '分子结构、医学图像、数据可视化精准还原' },
      { icon: '📝', title: '文字精准', desc: '图中任意位置文字清晰、字体一致、拼写准确' },
      { icon: '🎨', title: '色彩保真', desc: '色彩饱和度和准确度超越竞品，品牌色复现精准' },
      { icon: '🌐', title: '多语言文字', desc: '支持中文、日文等多语言文字在图像中的精准渲染' },
    ],
    specs: [
      { label: '最高分辨率', value: '2048×2048' },
      { label: '支持参考图', value: '是（Gemini 系列）' },
      { label: '积分消耗', value: '20 积分 / 张' },
      { label: '生成速度', value: '约 20-35 秒' },
      { label: '开发商', value: 'Google DeepMind' },
    ],
    useCases: [
      { title: '品牌设计', prompt: 'Minimalist logo for a tech startup called "Nova", clean geometric shapes, deep blue and white, professional' },
      { title: '教育插图', prompt: 'Detailed cross-section diagram of human heart, medical illustration style, labeled anatomy, white background' },
      { title: '中文海报', prompt: '春节主题海报，包含"新春快乐"四个大字，红金配色，灯笼和梅花装饰，现代简约风格' },
    ],
    faqs: [
      { q: 'Ultra 和普通 Imagen 4 有何区别？', a: 'Ultra 提供更高分辨率、更精确的文字渲染和更细腻的细节处理，适合最终成品；Fast 版速度更快适合草稿。' },
      { q: '为什么积分消耗较高？', a: 'Imagen 4 Ultra 调用 Google 顶级 API，计算成本较高，积分定价对应其卓越质量。' },
      { q: '有内容安全过滤吗？', a: '有，Google 有严格的内容安全策略，会过滤暴力、色情等违规内容。' },
    ],
  },
  {
    id: 'gemini-2.5-flash-image',
    label: 'Nano Banana',
    category: 'image',
    provider: 'Google',
    tagline: '快速图像生成，支持参考图输入',
    description: 'Nano Banana（基于 Gemini Flash 图像能力）是平台速度最快的图像生成模型之一，支持参考图输入进行风格转换或图像编辑，适合快速迭代和参考图驱动的创作。',
    credits: 5,
    badge: undefined,
    color: '#fbbf24',
    features: [
      { icon: '⚡', title: '极速生成', desc: '平均 5-10 秒完成生成，快速迭代' },
      { icon: '🖼️', title: '参考图输入', desc: '上传参考图，模型理解风格和内容进行再创作' },
      { icon: '💰', title: '性价比高', desc: '5 积分/张，低成本高频使用' },
      { icon: '🔄', title: '图像编辑', desc: '基于原图进行修改、风格转换、局部调整' },
    ],
    specs: [
      { label: '最高分辨率', value: '1024×1024' },
      { label: '支持参考图', value: '是' },
      { label: '积分消耗', value: '5 积分 / 张' },
      { label: '生成速度', value: '约 5-10 秒' },
      { label: '开发商', value: 'Google' },
    ],
    useCases: [
      { title: '风格转换', prompt: '（上传照片）将这张照片转为水彩插画风格，保留人物轮廓' },
      { title: '快速草图', prompt: 'Simple sketch of a mountain cabin at sunset, cozy atmosphere' },
      { title: '产品变体', prompt: '（上传产品图）将产品背景替换为纯白色高光环境' },
    ],
    faqs: [
      { q: '参考图如何影响生成结果？', a: '参考图会作为构图、风格和内容的参考，模型会在理解参考图的基础上结合文字提示词进行创作。' },
      { q: '分辨率比 Flux Pro 低，质量有差距吗？', a: '对于草稿验证和快速创作场景已完全足够；追求最终商业质量时建议使用 Flux Pro 或 Imagen 4 Ultra。' },
    ],
  },
];

// ─── Video ──────────────────────────────────────────────────────────────────

const VIDEO_MODELS: ModelContent[] = [
  {
    id: 'kling-v2-6',
    label: 'Kling 2.6',
    category: 'video',
    provider: '快手科技',
    tagline: '可灵旗舰视频模型，物理仿真与镜头运动行业领先',
    description: 'Kling v2.6 Omni 是快手科技最新旗舰视频生成模型，在物理世界仿真、人体运动自然度、镜头语言丰富性方面均处于业界前列。支持文生视频和图生视频两种模式。',
    credits: 50,
    badge: 'HOT',
    color: '#fb7185',
    features: [
      { icon: '🎬', title: '电影级运镜', desc: '推、拉、摇、移等专业镜头语言，媲美真实摄影' },
      { icon: '🏃', title: '人体运动', desc: '人物动作自然流畅，走路、跑步、舞蹈无抖动' },
      { icon: '🌊', title: '物理仿真', desc: '水、烟、布料等物质的物理特性高度真实' },
      { icon: '🖼️', title: '图生视频', desc: '上传参考图，让静态画面流动起来' },
    ],
    specs: [
      { label: '视频时长', value: '5 秒 / 10 秒' },
      { label: '最高分辨率', value: '1080P' },
      { label: '帧率', value: '24fps' },
      { label: '积分消耗', value: '50 积分（5s）/ 90 积分（10s）' },
      { label: '生成时间', value: '约 2-4 分钟' },
      { label: '开发商', value: '快手科技' },
    ],
    useCases: [
      { title: '产品展示', prompt: 'A luxury watch rotating slowly on black velvet, close-up macro shot, dramatic side lighting, cinematic quality' },
      { title: '自然风光', prompt: '黄山日出云海，镜头缓缓推进，云雾流动，宏大壮观，电影质感' },
      { title: '人物场景', prompt: 'A young woman walking through a flower field in slow motion, golden hour light, dreamy atmosphere' },
    ],
    faqs: [
      { q: 'Kling 2.6 和 2.5 有什么区别？', a: 'v2.6 在人物运动流畅度和物理仿真方面有显著提升，特别是人脸一致性更强，是目前最推荐的版本。' },
      { q: '支持声音/配乐吗？', a: '目前生成的视频无声音，建议在视频编辑软件中自行添加配乐。' },
      { q: '生成失败会退积分吗？', a: '会，服务端原因导致的失败积分自动返还，无需担心损失。' },
    ],
  },
  {
    id: 'seedance-2',
    label: 'Seedance 2',
    category: 'video',
    provider: '字节跳动',
    tagline: '字节跳动视听同步旗舰，电影级画质',
    description: 'Seedance 2 是字节跳动最新视频生成模型，在视觉细节丰富度、色彩层次和整体电影感方面表现突出，特别擅长风格化场景和戏剧性氛围的营造。',
    credits: 40,
    badge: 'NEW',
    color: '#f59e0b',
    features: [
      { icon: '🎨', title: '色彩层次', desc: '色调丰富、对比自然，色彩表现力业界顶尖' },
      { icon: '🌆', title: '场景氛围', desc: '夜景、烟雾、雨景等复杂氛围高度还原' },
      { icon: '🎭', title: '风格化强', desc: '动漫、油画、胶片等风格转化效果出色' },
      { icon: '🔀', title: '图生视频', desc: '静态图像转流畅视频，细节保留度高' },
    ],
    specs: [
      { label: '视频时长', value: '5 秒' },
      { label: '最高分辨率', value: '1080P' },
      { label: '帧率', value: '24fps' },
      { label: '积分消耗', value: '40 积分 / 次' },
      { label: '生成时间', value: '约 1-3 分钟' },
      { label: '开发商', value: '字节跳动' },
    ],
    useCases: [
      { title: '城市夜景', prompt: '霓虹灯下的上海外滩，雨后湿润的路面反光，电影感，慢速镜头' },
      { title: '艺术风格', prompt: '梵高星夜风格的夜空，星星流动，宏大宇宙感，艺术动画' },
      { title: '商品广告', prompt: 'Luxury skincare product floating in water with soft ripples, clean white background, commercial photography style' },
    ],
    faqs: [
      { q: 'Seedance 和 Kling 哪个更好？', a: '风格化和色彩场景选 Seedance；人物运动和物理仿真选 Kling。两者各有侧重。' },
      { q: '有没有时长更长的版本？', a: '目前 Seedance 2 支持 5 秒，更长时长版本在路线图中。' },
    ],
  },
  {
    id: 'veo-3.1',
    label: 'Veo 3.1',
    category: 'video',
    provider: 'Google DeepMind',
    tagline: 'Google 最新视频模型，叙事连贯性顶级',
    description: 'Veo 3.1 是 Google DeepMind 的最新视频生成模型，在镜头叙事连贯性、场景转换流畅度和长时间语义一致性方面业界领先，特别适合叙事型短片和广告制作。',
    credits: 60,
    badge: 'NEW',
    color: '#4285f4',
    features: [
      { icon: '📖', title: '叙事连贯', desc: '复杂场景描述精确执行，开头结尾逻辑连贯' },
      { icon: '🎞️', title: '场景转换', desc: '多场景视频流畅过渡，不出现跳帧和抖动' },
      { icon: '🧠', title: '语义理解', desc: '复杂提示词准确理解，多元素共存不混乱' },
      { icon: '🌍', title: '真实感', desc: '自然光影变化、环境细节高度拟真' },
    ],
    specs: [
      { label: '视频时长', value: '5 秒 / 8 秒' },
      { label: '最高分辨率', value: '1080P' },
      { label: '帧率', value: '24fps' },
      { label: '积分消耗', value: '60 积分 / 次' },
      { label: '生成时间', value: '约 3-5 分钟' },
      { label: '开发商', value: 'Google DeepMind' },
    ],
    useCases: [
      { title: '品牌叙事', prompt: 'A lone explorer discovers an ancient temple in a misty jungle, dramatic reveal shot, epic cinematic score implied' },
      { title: '自然纪录', prompt: 'Time-lapse of storm clouds forming over mountains, lightning in distance, ultra dramatic, BBC nature documentary style' },
      { title: '科幻场景', prompt: 'Spaceship emerging from hyperspace into a colorful nebula, scale and grandeur, realistic sci-fi visual effects' },
    ],
    faqs: [
      { q: 'Veo 3.1 和 Kling 2.6 哪个更好？', a: 'Veo 3.1 在叙事连贯性和场景描述执行上更强；Kling 在人物运动自然度上更优。视频类型决定选择。' },
      { q: '为什么积分消耗最高？', a: 'Veo 3.1 是目前平台最新、算力消耗最大的视频模型，积分定价对应其卓越质量。' },
    ],
  },
];

// ─── 全量索引 ────────────────────────────────────────────────────────────────

export const ALL_MODEL_CONTENT: ModelContent[] = [
  ...CHAT_MODELS,
  ...IMAGE_MODELS,
  ...VIDEO_MODELS,
];

export function getModelContent(id: string): ModelContent | undefined {
  return ALL_MODEL_CONTENT.find((m) => m.id === id);
}

// 用于 generateStaticParams
export const ALL_MODEL_IDS = ALL_MODEL_CONTENT.map((m) => m.id);
