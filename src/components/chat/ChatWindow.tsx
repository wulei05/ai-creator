'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { ArrowUp, Loader2, Paperclip, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useModels } from '@/lib/hooks/useModels';
import { useAuthGate } from '@/lib/auth-gate';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ChatModel = string;
type Message = { role: 'user' | 'assistant'; content: string; image?: string };

export function ChatWindow() {
  const { models, loading: modelsLoading } = useModels('chat');

  const [model, setModel] = useState<ChatModel>('deepseek-chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [greetingName, setGreetingName] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = useMemo(() => createClient(), []);
  const { require } = useAuthGate();

  useEffect(() => {
    if (models.length === 0) return;
    const current = models.find((m) => m.id === model);
    if (!current || !current.available) {
      const firstAvailable = models.find((m) => m.available);
      if (firstAvailable) setModel(firstAvailable.id);
    }
  }, [models, model]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const name = user.user_metadata?.full_name
        ?? user.user_metadata?.name
        ?? user.email?.split('@')[0]
        ?? '';
      setGreetingName(name);
    });
  }, [supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      alert('Image must be smaller than 4MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setPendingImage(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const sendMessage = useCallback(async () => {
    if (!require()) return;
    if ((!input.trim() && !pendingImage) || isStreaming) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      ...(pendingImage ? { image: pendingImage } : {}),
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setPendingImage(null);
    setIsStreaming(true);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ model, messages: newMessages, conversation_id: conversationId }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Request failed' }));
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Error: ${err.error ?? 'Request failed'}` },
        ]);
        return;
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') break;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.conversation_id) setConversationId(parsed.conversation_id);
            if (parsed.delta) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: last.content + parsed.delta };
                }
                return updated;
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Error: Failed to connect to server.' },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }, [require, input, pendingImage, isStreaming, messages, model, conversationId, supabase]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const currentModelInfo = models.find((m) => m.id === model);
  const supportsVision = currentModelInfo?.vision ?? false;

  if (modelsLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin mr-2" />
        <span>加载模型列表...</span>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">暂无可用的聊天模型</p>
          <p className="text-sm text-muted-foreground">
            请在管理后台配置 API Key（OpenAI / DeepSeek / Anthropic / Google）
          </p>
        </div>
      </div>
    );
  }

  const inputBox = (
    <div className="rounded-3xl bg-card/80 border border-border/60 px-4 py-3 shadow-sm">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
      {pendingImage && (
        <div className="mb-2 flex items-start gap-2">
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pendingImage} alt="pending" className="h-16 w-16 rounded-lg object-cover border" />
            <button
              onClick={() => setPendingImage(null)}
              className="absolute -top-1.5 -right-1.5 rounded-full bg-background border p-0.5 hover:bg-muted"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="随便问问…"
        className="min-h-[44px] max-h-40 resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
        disabled={isStreaming}
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={isStreaming}
              className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background/40 px-3 py-1 text-xs font-medium text-foreground hover:bg-background transition-colors disabled:opacity-50"
            >
              <span className="inline-block size-4 rounded-full bg-gradient-to-br from-violet-400 to-cyan-400" />
              {currentModelInfo?.label ?? model}
              <ChevronDown className="size-3 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-[60vh] overflow-y-auto">
              {models.map((m) => (
                <DropdownMenuItem
                  key={m.id}
                  onClick={() => m.available && setModel(m.id)}
                  disabled={!m.available}
                  className={`flex items-center gap-2 ${m.available ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                >
                  <span className="flex-1">{m.label}</span>
                  {m.available ? (
                    <span className="text-xs text-muted-foreground">{m.credits}c</span>
                  ) : (
                    <span className="text-[10px] rounded bg-muted px-1.5 py-0.5 text-muted-foreground">暂未支持</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {supportsVision && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              disabled={isStreaming}
              onClick={() => fileInputRef.current?.click()}
              title="上传图片"
            >
              <Paperclip className="size-3.5" />
            </Button>
          )}
        </div>
        <Button
          onClick={sendMessage}
          disabled={(!input.trim() && !pendingImage) || isStreaming}
          size="icon"
          className="rounded-full size-9"
        >
          {isStreaming ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
        </Button>
      </div>
    </div>
  );

  // Empty state — centered greeting + input
  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 px-4 pb-8 sm:gap-8 sm:pb-12">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          嗨{greetingName ? `, ${greetingName}` : ''}. 准备好开始了吗?
        </h1>
        <div className="w-full max-w-2xl">{inputBox}</div>
      </div>
    );
  }

  // Active conversation — messages stream above, input pinned bottom
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
          {messages.map((msg, i) => (
            <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                  msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground'
                )}
              >
                {msg.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={msg.image} alt="attached" className="max-w-xs rounded-lg mb-2 object-contain" />
                )}
                {msg.content ? (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : (
                  <Loader2 className="size-4 animate-spin" />
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="border-t bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3">{inputBox}</div>
      </div>
    </div>
  );
}
