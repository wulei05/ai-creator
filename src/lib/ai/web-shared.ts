export type WebTemplate = 'math' | 'physics' | 'chart' | 'game' | 'tool' | 'free';

export function stripCodeBlock(text: string): string {
  return text.replace(/^```(?:html)?\n?/i, '').replace(/\n?```\s*$/i, '').trim();
}
