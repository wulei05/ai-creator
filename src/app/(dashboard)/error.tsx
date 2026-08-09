'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-4">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">页面出错了</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          {error.message || '发生了一个意外错误，请重试。'}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60">错误码: {error.digest}</p>
        )}
      </div>
      <Button onClick={reset} size="sm">
        重新加载
      </Button>
    </div>
  );
}
