import { streamChat, type ChatModel, type Message } from '@/lib/ai/chat';

export type WebTemplate = 'math' | 'physics' | 'chart' | 'game' | 'tool' | 'free';

const BASE_SYSTEM = `你是顶级前端工程师。生成一个完整的单文件 HTML，内嵌所有 CSS 和 JavaScript。
要求：
- 不依赖本地文件，可以使用 CDN（如 cdnjs、unpkg、jsdelivr）
- 视觉精美，有交互性，界面设计现代
- 代码简洁，注释清晰
- 只输出 HTML 代码，不要任何解释文字，不要 markdown 代码块包裹`;

const TEMPLATE_SYSTEM: Record<WebTemplate, string> = {
  math: `${BASE_SYSTEM}
专注于数学可视化：用 Canvas 或 SVG 绘制图形；提供参数调节滑块（range input）；如需渲染公式可引入 MathJax CDN。`,
  physics: `${BASE_SYSTEM}
专注于物理模拟：使用 requestAnimationFrame 实现流畅动画；支持鼠标/触摸交互改变物理状态；有重置按钮。`,
  chart: `${BASE_SYSTEM}
专注于数据图表：引入 Chart.js CDN（https://cdn.jsdelivr.net/npm/chart.js）；图表支持点击/悬停交互；配色美观，有图例。`,
  game: `${BASE_SYSTEM}
专注于浏览器小游戏：键盘（WASD/方向键）或鼠标控制；有开始、重置按钮；显示分数或游戏状态。`,
  tool: `${BASE_SYSTEM}
专注于实用工具：输入即时反馈；界面清晰直观；有输入校验和友好的错误提示。`,
  free: BASE_SYSTEM,
};

/** 去除 AI 可能输出的 markdown 代码块包裹 */
export function stripCodeBlock(text: string): string {
  return text.replace(/^```(?:html)?\n?/i, '').replace(/\n?```\s*$/i, '').trim();
}

export async function* streamWebHTML(
  model: ChatModel,
  prompt: string,
  template: WebTemplate,
  imageData?: string | null,
): AsyncGenerator<string> {
  const message: Message = {
    role: 'user',
    content: prompt,
    ...(imageData ? { image: imageData } : {}),
  };
  yield* streamChat(model, [message], {
    system: TEMPLATE_SYSTEM[template],
    maxTokens: 8192,
  });
}
