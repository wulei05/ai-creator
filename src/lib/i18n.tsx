'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Lang = 'zh' | 'en';

// ── 翻译字典 ─────────────────────────────────────────────────
const DICT = {
  zh: {
    // 导航
    nav_explore:   '探索',
    nav_chat:      '会话',
    nav_image:     '图像',
    nav_video:     '视频',
    nav_studio:    '创作室',
    nav_community: '社区',

    // 图像生成
    image_title:        '图片生成',
    image_model:        '模型',
    image_prompt:       '描述你想要的画面',
    image_ratio:        '比例',
    image_generate:     '生成图片',
    image_generating:   '生成中...',
    image_ref_image:    '参考图',
    image_translate:    'AI 翻译',
    image_optimize:     'AI 优化',
    image_discover:     '灵感发现',
    image_create:       '立即创作',

    // 视频生成
    video_title:        '视频生成',
    video_model:        '模型',
    video_prompt:       '描述视频内容',
    video_ratio:        '比例',
    video_duration:     '时长',
    video_generate:     '生成视频',
    video_generating:   '生成中...',
    video_ref_image:    '首帧参考图',
    video_discover:     '灵感发现',
    video_create:       '立即创作',

    // Chat
    chat_placeholder:   '随便问问…',
    chat_send:          '发送',
    chat_model:         '选择模型',
    chat_greeting:      '嗨',
    chat_greeting_ready:'准备好开始了吗?',
    chat_upload_img:    '上传图片',

    // 创作室
    studio_works:       '我的作品',
    studio_edit:        '图片编辑',
    studio_web:         '网页工具',
    studio_all:         '全部',
    studio_image:       '图像',
    studio_video:       '视频',
    studio_download:    '下载',
    studio_delete:      '删除',
    studio_select:      '批量选择',
    studio_exit_sel:    '退出选择',
    studio_select_all:  '全选',
    studio_search:      '搜索提示词...',
    studio_refresh:     '刷新',
    studio_load_more:   '加载更多',
    studio_empty:       '还没有作品',
    studio_empty_hint:  '去生图或视频页创作你的第一件作品',
    studio_count:       '共',
    studio_items:       '件',

    // 探索
    explore_inspire:    '灵感',
    explore_theme:      '主题',
    explore_prompt:     '提示词',
    explore_category:   '分类',
    explore_detail:     '提示详情',
    explore_work:       '作品',
    explore_popular:    '流行度',
    explore_all:        '全部',
    explore_empty:      '该分类下暂无内容',

    // 通用
    copy:               '复制',
    copy_prompt:        '复制提示词',
    use_prompt:         '去生图',
    details:            '详情',
    loading:            '加载中...',
    error:              '出错了',
    cancel:             '取消',
    confirm:            '确认',
    credits:            '积分',
    unavailable:        '暂未支持',
    no_model:           '暂无可用模型',
    back:               '返回',
    download:           '下载',
  },

  en: {
    // Nav
    nav_explore:   'Explore',
    nav_chat:      'Chat',
    nav_image:     'Image',
    nav_video:     'Video',
    nav_studio:    'Studio',
    nav_community: 'Community',

    // Image
    image_title:        'Image Generation',
    image_model:        'Model',
    image_prompt:       'Describe the image you want',
    image_ratio:        'Ratio',
    image_generate:     'Generate',
    image_generating:   'Generating...',
    image_ref_image:    'Reference Image',
    image_translate:    'Translate',
    image_optimize:     'AI Optimize',
    image_discover:     'Discover',
    image_create:       'Create Now',

    // Video
    video_title:        'Video Generation',
    video_model:        'Model',
    video_prompt:       'Describe the video content',
    video_ratio:        'Ratio',
    video_duration:     'Duration',
    video_generate:     'Generate',
    video_generating:   'Generating...',
    video_ref_image:    'Reference Frame',
    video_discover:     'Discover',
    video_create:       'Create Now',

    // Chat
    chat_placeholder:   'Ask anything…',
    chat_send:          'Send',
    chat_model:         'Select Model',
    chat_greeting:      'Hi',
    chat_greeting_ready:'Ready to get started?',
    chat_upload_img:    'Upload Image',

    // Studio
    studio_works:       'My Works',
    studio_edit:        'Edit Image',
    studio_web:         'Web Tools',
    studio_all:         'All',
    studio_image:       'Image',
    studio_video:       'Video',
    studio_download:    'Download',
    studio_delete:      'Delete',
    studio_select:      'Select',
    studio_exit_sel:    'Exit',
    studio_select_all:  'Select All',
    studio_search:      'Search prompts...',
    studio_refresh:     'Refresh',
    studio_load_more:   'Load More',
    studio_empty:       'No works yet',
    studio_empty_hint:  'Create your first work in Image or Video',
    studio_count:       'Total',
    studio_items:       'items',

    // Explore
    explore_inspire:    'Inspire',
    explore_theme:      'Theme',
    explore_prompt:     'Prompt',
    explore_category:   'Category',
    explore_detail:     'Detail',
    explore_work:       'Works',
    explore_popular:    'Popular',
    explore_all:        'All',
    explore_empty:      'Nothing in this category',

    // Common
    copy:               'Copy',
    copy_prompt:        'Copy Prompt',
    use_prompt:         'Use Prompt',
    details:            'Details',
    loading:            'Loading...',
    error:              'Error',
    cancel:             'Cancel',
    confirm:            'Confirm',
    credits:            'credits',
    unavailable:        'Unavailable',
    no_model:           'No models available',
    back:               'Back',
    download:           'Download',
  },
} as const;

export type TKey = keyof typeof DICT.zh;

// ── Context ──────────────────────────────────────────────────
interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey) => string;
}

const LangContext = createContext<LangContextValue>({
  lang: 'zh',
  setLang: () => {},
  t: (k) => DICT.zh[k],
});

const STORAGE_KEY = 'preferred_lang';

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('zh');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored === 'en' || stored === 'zh') setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  const t = (key: TKey): string => DICT[lang][key] as string;

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useT() {
  return useContext(LangContext);
}
