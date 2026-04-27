'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { CREDIT_COSTS } from '@/lib/pricing';
import { Send, Plus, Loader2, Paperclip, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useModels } from '@/lib/hooks/useModels';
import { useAuthGate } from '@/lib/auth-gate';

type ChatModel = 'gpt-4o' | 'deepseek-chat' | 'deepseek-reasoner' | 'claude-sonnet-4-6' | 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-2.0-flash' | 'gemini-2.0-flash-lite' | 'gemini-1.5-pro' | 'gemini-1.5-flash' | 'qwen-max' | 'qwen-plus' | 'qwen-turbo' | 'qwq-plus' | 'glm-4-plus' | 'glm-4-flash' | 'glm-z1-plus' | 'kimi-latest' | 'kimi-thinking-preview';
type Message = { role: 'user' | 'assistant'; content: string; image?: string };

interface Conversation {
  id: string;
  model: string;
  messages: Message[];
  created_at: string;
}

export function ChatWindow() {
  const { models, loading: modelsLoading } = useModels('chat');

  const [model, setModel] = useState<ChatModel>('deepseek-chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [credits, setCredits] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = useMemo(() => createClient(), []);
  const { require } = useAuthGate();

  // Once models load, default to the first available one
  useEffect(() => {
    if (models.length > 0 && !models.find((m) => m.id === model)) {
      setModel(models[0].id as ChatModel);
    }
  }, [models, model]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = useCallback(async () => {
    const { data } = await supabase
      .from('conversations')
      .select('id, model, messages, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) setConversations(data as Conversation[]);
  }, [supabase]);

  const loadCredits = useCallback(async () => {
    const res = await fetch('/api/credits/balance');
    if (res.ok) {
      const data = await res.json();
      setCredits(data.balance);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    loadCredits();
  }, [loadConversations, loadCredits]);

  const loadConversation = (conv: Conversation) => {
    setConversationId(conv.id);
    setModel(conv.model as ChatModel);
    setMessages(conv.messages);
  };

  const newConversation = () => {
    setConversationId(undefined);
    setMessages([]);
    setPendingImage(null);
  };

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

  const sendMessage = async () => {
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
          if (payload === '[DONE]') {
            loadConversations();
            loadCredits();
            break;
          }
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
  };

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

  return (
    <div className="flex h-full gap-4">
      {/* Sidebar - 移动端隐藏 */}
      <div className="hidden md:flex w-52 flex-shrink-0 flex-col gap-2">
        <Button variant="outline" className="w-full justify-start gap-2" onClick={newConversation}>
          <Plus className="size-4" />
          New Conversation
        </Button>

        {credits !== null && (
          <div className="rounded-lg border p-3 text-center text-sm">
            <div className="text-muted-foreground">Credits</div>
            <div className="text-lg font-semibold">{credits}</div>
          </div>
        )}

        {conversations.length > 0 && (
          <div className="flex flex-col gap-1">
            <div className="px-1 text-xs font-medium text-muted-foreground uppercase">Recent</div>
            {conversations.map((conv) => {
              const firstMsg = conv.messages?.[0];
              const preview = firstMsg?.content?.slice(0, 30) ?? 'Conversation';
              const convModelInfo = models.find((m) => m.id === conv.model);
              return (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv)}
                  className={cn(
                    'rounded-lg px-3 py-2 text-left text-sm hover:bg-muted transition-colors',
                    conversationId === conv.id && 'bg-muted font-medium'
                  )}
                >
                  <div className="truncate">{preview}</div>
                  <div className="text-xs text-muted-foreground">
                    {convModelInfo?.label ?? conv.model}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border bg-background">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-6 px-4">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl">💬</div>
                <p className="font-medium">{currentModelInfo?.label ?? model}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {supportsVision ? '支持文字 · 图片理解' : '智能对话助手'}
                </p>
              </div>
              <div className="grid w-full max-w-sm gap-2">
                {['帮我写一封商务邮件', '解释一下量子计算', '推荐一个周末旅行计划'].map(s => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="rounded-xl border bg-muted/40 px-4 py-2.5 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((msg, i) => (
                <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                      msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
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
          )}
        </div>

        {/* Pending image preview */}
        {pendingImage && (
          <div className="border-t px-4 pt-3 flex items-start gap-2">
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

        {/* Input area */}
        <div className="border-t px-3 py-3">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          {/* 模型 + 附件 工具栏 */}
          <div className="mb-2 flex items-center gap-2">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as ChatModel)}
              disabled={isStreaming}
              className="flex-1 rounded-lg border border-input bg-muted/40 px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} · {m.credits}c{m.vision ? ' 👁' : ''}
                </option>
              ))}
            </select>
            {supportsVision && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                disabled={isStreaming}
                onClick={() => fileInputRef.current?.click()}
                title="上传图片"
              >
                <Paperclip className="size-3.5" />
              </Button>
            )}
          </div>
          {/* 输入行 */}
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="发送消息…"
              className="min-h-[44px] max-h-32 resize-none"
              disabled={isStreaming}
            />
            <Button
              onClick={sendMessage}
              disabled={(!input.trim() && !pendingImage) || isStreaming}
              size="icon"
              className="h-10 w-10 shrink-0"
            >
              {isStreaming ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
