'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, LayoutDashboard, Sparkles, FolderPlus } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  updatedAt: string;
  thumbnail?: string;
}

// 示例项目数据（后续可接后端）
const DEMO_PROJECTS: Project[] = [];

export default function StudioPage() {
  const [prompt, setPrompt] = useState('');
  const [projects] = useState<Project[]>(DEMO_PROJECTS);

  const handleCreate = () => {
    if (!prompt.trim()) {
      toast.info('请先描述你想要创作的内容');
      return;
    }
    // 跳转到图像生成页并带入 prompt
    const params = new URLSearchParams({ prompt });
    window.location.href = `/image?${params}`;
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">

      {/* 欢迎区 */}
      <div className="flex flex-col items-center text-center pt-8 gap-2">
        <div className="flex items-center gap-3 text-2xl font-bold">
          <LayoutDashboard className="size-7 text-primary" />
          欢迎来到创作室
        </div>
        <p className="text-sm text-muted-foreground">描述你的创意，AI 帮你实现</p>
      </div>

      {/* 创作输入框 */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="请描述您想要生成的图片，例如：一只在星空下奔跑的独角兽..."
          className="min-h-[100px] resize-none border-0 text-base focus-visible:ring-0 rounded-none px-5 pt-4"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleCreate();
          }}
        />
        <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => toast.info('更多功能即将上线')}
              title="添加参考图"
            >
              <Plus className="size-4" />
            </Button>
            <Link
              href="/image"
              className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Sparkles className="size-3" />
              AI 图像
            </Link>
            <Link
              href="/video"
              className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Sparkles className="size-3" />
              AI 视频
            </Link>
          </div>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={!prompt.trim()}
            className="rounded-full px-5"
          >
            <Sparkles className="size-3.5 mr-1.5" />
            开始创作
          </Button>
        </div>
      </div>

      {/* 项目区 */}
      <div className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">我的项目</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {/* 新建项目卡片 */}
          <button
            onClick={() => toast.info('项目管理功能即将上线')}
            className="group flex flex-col items-center justify-center gap-2 aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            <FolderPlus className="size-8 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">新建项目</span>
          </button>

          {/* 已有项目 */}
          {projects.map((proj) => (
            <button
              key={proj.id}
              className="group flex flex-col overflow-hidden rounded-xl border hover:shadow-md transition-all text-left"
            >
              <div className="aspect-square bg-muted flex items-center justify-center">
                {proj.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={proj.thumbnail} alt={proj.name} className="w-full h-full object-cover" />
                ) : (
                  <LayoutDashboard className="size-8 text-muted-foreground" />
                )}
              </div>
              <div className="px-2 py-1.5">
                <p className="text-xs font-medium truncate">{proj.name}</p>
                <p className="text-[10px] text-muted-foreground">{proj.updatedAt}</p>
              </div>
            </button>
          ))}
        </div>

        {projects.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            还没有项目，从上方输入框开始你的第一次创作吧
          </p>
        )}
      </div>
    </div>
  );
}
