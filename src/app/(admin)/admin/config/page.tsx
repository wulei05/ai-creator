'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ConfigItem = {
  key: string;
  description: string | null;
  masked_value: string;
  has_value: boolean;
  updated_at: string;
};

type Provider = {
  name: string;
  description?: string;
  keyName: string;
  baseUrlName?: string;
};

const AI_PROVIDERS: Provider[] = [
  { name: 'OpenAI',    description: 'GPT 系列对话',           keyName: 'OPENAI_API_KEY',    baseUrlName: 'OPENAI_BASE_URL' },
  { name: 'Anthropic', description: 'Claude 系列对话',         keyName: 'ANTHROPIC_API_KEY', baseUrlName: 'ANTHROPIC_BASE_URL' },
  { name: 'Google',    description: 'Gemini 对话 + 图像生成',  keyName: 'GOOGLE_API_KEY',    baseUrlName: 'GOOGLE_BASE_URL' },
  { name: 'DeepSeek',  description: 'DeepSeek 对话',           keyName: 'DEEPSEEK_API_KEY',  baseUrlName: 'DEEPSEEK_BASE_URL' },
  { name: 'xAI',       description: 'Grok 对话',               keyName: 'XAI_API_KEY',       baseUrlName: 'XAI_BASE_URL' },
  { name: 'Qwen',      description: '通义千问',                keyName: 'QWEN_API_KEY',      baseUrlName: 'QWEN_BASE_URL' },
  { name: 'Zhipu',     description: '智谱 GLM',                keyName: 'ZHIPU_API_KEY',     baseUrlName: 'ZHIPU_BASE_URL' },
  { name: 'Moonshot',  description: 'Kimi 对话',               keyName: 'MOONSHOT_API_KEY',  baseUrlName: 'MOONSHOT_BASE_URL' },
  { name: 'fal.ai',    description: '图像生成（直连）',         keyName: 'FAL_KEY' },
  { name: 'Kling',     description: '视频生成（直连）',         keyName: 'KLING_API_KEY' },
];

const PAYMENT_KEYS = ['XUNHU_APPID', 'XUNHU_KEY'];
const DEPLOY_KEYS = ['GITHUB_TOKEN'];

function isBaseUrlKey(key: string) {
  return key.endsWith('_BASE_URL');
}

export default function AdminPage() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function fetchConfigs() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/config');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json() as { configs: ConfigItem[] };
      setConfigs(data.configs);
    } catch {
      // silently fail; show empty list
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchConfigs();
  }, []);

  async function handleSave(key: string) {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: editValue }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'Save failed');
      }
      setEditingKey(null);
      setEditValue('');
      await fetchConfigs();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(key: string) {
    setEditingKey(key);
    setEditValue('');
    setSaveError(null);
  }

  function cancelEdit() {
    setEditingKey(null);
    setEditValue('');
    setSaveError(null);
  }

  function getItem(key: string): ConfigItem {
    return configs.find((c) => c.key === key) ?? {
      key,
      description: null,
      masked_value: '',
      has_value: false,
      updated_at: '',
    };
  }

  function renderField(key: string, label: string) {
    const item = getItem(key);
    const isBaseUrl = isBaseUrlKey(key);
    return (
      <div className="flex flex-col gap-2 rounded-lg border p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            <p className="font-mono text-xs text-muted-foreground mt-0.5">{key}</p>
            {item.has_value && (
              <p className="font-mono text-xs mt-1 break-all">
                {item.masked_value}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={item.has_value ? 'default' : 'outline'}>
              {item.has_value ? '✅' : '⚠️'}
            </Badge>
            {editingKey !== key && (
              <Button size="sm" variant="outline" onClick={() => startEdit(key)}>
                Edit
              </Button>
            )}
          </div>
        </div>
        {editingKey === key && (
          <>
            <div className="flex items-center gap-2 mt-1">
              <Input
                type={isBaseUrl ? 'text' : 'password'}
                placeholder={
                  isBaseUrl
                    ? 'e.g. https://tokens.ihuitoken.com/v1 (留空走官方)'
                    : `Enter new value for ${key} (留空清除)`
                }
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1 font-mono text-sm"
                autoFocus
              />
              <Button size="sm" onClick={() => handleSave(key)} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
              <Button size="sm" variant="outline" onClick={cancelEdit} disabled={saving}>
                Cancel
              </Button>
            </div>
            {saveError && <p className="text-xs text-destructive">{saveError}</p>}
          </>
        )}
      </div>
    );
  }

  function renderProvider(p: Provider) {
    return (
      <Card key={p.keyName} className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-baseline gap-3">
            <span>{p.name}</span>
            {p.description && (
              <span className="text-xs font-normal text-muted-foreground">
                {p.description}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {renderField(p.keyName, 'API Key')}
          {p.baseUrlName && renderField(p.baseUrlName, 'Base URL (可选)')}
        </CardContent>
      </Card>
    );
  }

  function renderSimpleGroup(title: string, keys: string[]) {
    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {keys.map((k) => (
            <div key={k}>{renderField(k, k)}</div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">API Key Management</h2>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <>
          <h3 className="text-lg font-semibold mb-3 mt-2">AI Providers</h3>
          {AI_PROVIDERS.map(renderProvider)}
          {renderSimpleGroup('Payment', PAYMENT_KEYS)}
          {renderSimpleGroup('GitHub / 部署', DEPLOY_KEYS)}
        </>
      )}
    </div>
  );
}
