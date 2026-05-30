'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ConfigItem = {
  key: string;
  description: string | null;
  masked_value: string;
  has_value: boolean;
  updated_at: string;
};

type BrandingField = {
  key: string;
  label: string;
  placeholder: string;
  hint?: string;
  type?: 'text' | 'url';
};

const FIELDS: BrandingField[] = [
  {
    key: 'SITE_NAME',
    label: '站点名称',
    placeholder: 'IHuiToken',
    hint: '出现在浏览器标签、顶部导航品牌区。留空使用默认值。',
    type: 'text',
  },
  {
    key: 'SITE_LOGO_URL',
    label: '站点 Logo',
    placeholder: '/logo.png 或 https://...',
    hint: '支持外链或站内路径（如 /logo.png）。建议高度 ≥ 64px 的 PNG/SVG。',
    type: 'url',
  },
  {
    key: 'SITE_FAVICON_URL',
    label: 'Favicon',
    placeholder: '/favicon.ico 或 https://...',
    hint: '浏览器标签页图标。推荐 32×32 或 64×64 ICO/PNG。',
    type: 'url',
  },
];

export default function AdminBrandingPage() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  async function fetchConfigs() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/config');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json() as { configs: ConfigItem[] };
      setConfigs(data.configs);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchConfigs();
  }, []);

  function getItem(key: string): ConfigItem {
    return configs.find((c) => c.key === key) ?? {
      key,
      description: null,
      masked_value: '',
      has_value: false,
      updated_at: '',
    };
  }

  function currentValue(key: string): string {
    const item = getItem(key);
    return edits[key] ?? (item.has_value ? item.masked_value : '');
  }

  async function handleSave(key: string) {
    setSavingKey(key);
    setError(null);
    setSavedKey(null);
    try {
      const value = edits[key] ?? '';
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'Save failed');
      }
      setEdits((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setSavedKey(key);
      await fetchConfigs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">站点品牌</h2>
      <p className="text-sm text-muted-foreground mb-6">
        设置站点名称、Logo 与 Favicon。修改后需要等待最长 5 分钟配置缓存刷新或重启进程才能在前台生效。
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>品牌配置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {FIELDS.map((field) => {
              const item = getItem(field.key);
              const isEditing = edits[field.key] !== undefined;
              const value = currentValue(field.key);
              return (
                <div key={field.key} className="space-y-2 border-b last:border-0 pb-5 last:pb-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <label className="text-sm font-medium">{field.label}</label>
                    <span className="font-mono text-[11px] text-muted-foreground">{field.key}</span>
                  </div>
                  {field.hint && (
                    <p className="text-xs text-muted-foreground">{field.hint}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={value}
                      placeholder={field.placeholder}
                      onChange={(e) => setEdits((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className="flex-1 font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSave(field.key)}
                      disabled={!isEditing || savingKey === field.key}
                    >
                      {savingKey === field.key ? 'Saving…' : 'Save'}
                    </Button>
                  </div>
                  {(field.key === 'SITE_LOGO_URL' || field.key === 'SITE_FAVICON_URL') && item.has_value && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs text-muted-foreground">预览：</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.masked_value}
                        alt="preview"
                        className="h-8 w-auto rounded bg-muted/40 object-contain"
                      />
                    </div>
                  )}
                  {savedKey === field.key && (
                    <p className="text-xs text-emerald-600">已保存</p>
                  )}
                </div>
              );
            })}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
