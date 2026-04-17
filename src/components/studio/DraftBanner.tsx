'use client';

import { RotateCcw, X } from 'lucide-react';
import type { WebDraft, ImageDraft } from '@/lib/studio-storage';

type Props =
  | { type: 'web';   draft: WebDraft;   onRestore: (d: WebDraft) => void;   onDismiss: () => void }
  | { type: 'image'; draft: ImageDraft; onRestore: (d: ImageDraft) => void; onDismiss: () => void };

export function DraftBanner(props: Props) {
  const time = new Date(props.draft.updated_at).toLocaleString('zh-CN', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm">
      <RotateCcw className="h-4 w-4 text-primary shrink-0" />
      <span className="text-muted-foreground flex-1">
        检测到 <span className="text-foreground font-medium">{time}</span> 未完成的编辑，是否恢复？
      </span>
      <button
        onClick={() => {
          if (props.type === 'web') props.onRestore(props.draft as WebDraft);
          else props.onRestore(props.draft as ImageDraft);
        }}
        className="text-primary font-medium hover:underline shrink-0"
      >
        恢复
      </button>
      <button onClick={props.onDismiss} className="text-muted-foreground hover:text-foreground shrink-0">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
