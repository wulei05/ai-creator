'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { CREDIT_COSTS } from '@/lib/pricing';
import { Send, Plus, Loader2, Paperclip, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useModels } from '@/lib/hooks/useModels';

type ChatModel = 'gpt-4o' | 'deepseek-chat' | 'claude-sonnet-4-6' | 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-2.0-flash' | 'gemini-2.0-flash-lite' | 'gemini-1.5-pro' | 'gemini-1.5-flash';
type Message = { role: 'user' | 'assistant'; content: string; image?: string };

interface Conversation {
  id: string;
  model: string;
  messages: Message[];
  created_at: string;
}

export function ChatWindow() {
  const { models, loading: modelsLoading } = useModels('chat');

  const [model, setModel] = useState<ChatModel>('gpt-4o');
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
        {/* Model selector — only shows configured models */}
        <div className="flex items-center gap-1 border-b px-3 py-2 flex-wrap">
          {models.map((m) => (
            <button
              key={m.id}
              onClick={() => setModel(m.id as ChatModel)}
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs transition-colors',
                model === m.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {m.label}
              <span className="ml-1 opacity-60">{m.credits}c</span>
              {m.vision && <span className="ml-1 opacity-50">👁</span>}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-sm">Start a conversation with {currentModelInfo?.label ?? model}</p>
                {supportsVision && (
                  <p className="text-xs mt-1 opacity-60">支持图片理解 — 点击 📎 上传图片</p>
                )}
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
        <div className="border-t px-4 py-3">
          <div className="flex gap-2 items-end">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            {supportsVision && (
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 h-10 w-10"
                disabled={isStreaming}
                onClick={() => fileInputRef.current?.click()}
                title="上传图片"
              >
                <Paperclip className="size-4" />
              </Button>
            )}
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                supportsVision
                  ? 'Type a message or attach an image… (Enter to send)'
                  : 'Type a message… (Enter to send, Shift+Enter for newline)'
              }
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
