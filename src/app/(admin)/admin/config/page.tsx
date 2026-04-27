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

const AI_KEYS = [
  'FAL_KEY',
  'KLING_API_KEY',
  'OPENAI_API_KEY',
  'DEEPSEEK_API_KEY',
  'ANTHROPIC_API_KEY',
  'GOOGLE_API_KEY',
  'XAI_API_KEY',
  'QWEN_API_KEY',
  'ZHIPU_API_KEY',
  'MOONSHOT_API_KEY',
];

const PAYMENT_KEYS = ['XUNHU_APPID', 'XUNHU_KEY'];
const DEPLOY_KEYS = ['GITHUB_TOKEN'];

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

  function startEdit(item: ConfigItem) {
    setEditingKey(item.key);
    setEditValue('');
    setSaveError(null);
  }

  function cancelEdit() {
    setEditingKey(null);
    setEditValue('');
    setSaveError(null);
  }

  function renderGroup(title: string, keys: string[]) {
    const items = keys.map((key) => configs.find((c) => c.key === key) ?? {
      key,
      description: null,
      masked_value: '',
      has_value: false,
      updated_at: '',
    });
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.key}
                  className="flex flex-col gap-2 rounded-lg border p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-semibold">{item.key}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.description}
                        </p>
                      )}
                      {item.has_value && (
                        <p className="font-mono text-xs text-muted-foreground mt-1">
                          {item.masked_value}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={item.has_value ? 'default' : 'outline'}>
                        {item.has_value ? '✅ Configured' : '⚠️ Not set'}
                      </Badge>
                      {editingKey !== item.key && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(item)}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                  {editingKey === item.key && (
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="password"
                        placeholder={`Enter new value for ${item.key}`}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 font-mono text-sm"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSave(item.key)}
                        disabled={saving || !editValue}
                      >
                        {saving ? 'Saving…' : 'Save'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                  {editingKey === item.key && saveError && (
                    <p className="text-xs text-destructive">{saveError}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">API Key Management</h2>
      {renderGroup('AI APIs', AI_KEYS)}
      {renderGroup('Payment', PAYMENT_KEYS)}
      {renderGroup('GitHub / 部署', DEPLOY_KEYS)}
    </div>
  );
}
