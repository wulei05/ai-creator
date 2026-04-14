'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { CREDIT_COSTS } from '@/lib/pricing';
import { Send, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ChatModel = 'gpt-4o' | 'deepseek-chat' | 'claude-sonnet-4-6';
type Message = { role: 'user' | 'assistant'; content: string };

interface Conversation {
  id: string;
  model: ChatModel;
  messages_json: Message[];
  created_at: string;
}

const MODEL_LABELS: Record<ChatModel, string> = {
  'gpt-4o': 'GPT-4o',
  'deepseek-chat': 'DeepSeek Chat',
  'claude-sonnet-4-6': 'Claude Sonnet 4.6',
};

const MODELS: ChatModel[] = ['gpt-4o', 'deepseek-chat', 'claude-sonnet-4-6'];

export function ChatWindow() {
  const [model, setModel] = useState<ChatModel>('gpt-4o');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [credits, setCredits] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Fix 4: Stable supabase reference — useMemo prevents new object on every render
  const supabase = useMemo(() => createClient(), []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = useCallback(async () => {
    const { data } = await supabase
      .from('conversations')
      .select('id, model, messages_json, created_at')
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
    setModel(conv.model);
    setMessages(conv.messages_json);
  };

  const newConversation = () => {
    setConversationId(undefined);
    setMessages([]);
    setInput('');
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);

    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          model,
          messages: newMessages,
          conversation_id: conversationId,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Request failed' }));
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Error: ${err.error ?? 'Request failed'}` },
        ]);
        return;
      }

      // Add empty assistant message
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
            // Reload conversations and credits after completion
            loadConversations();
            loadCredits();
            break;
          }
          try {
            const parsed = JSON.parse(payload);
            // Fix 1: capture conversation_id emitted by server so subsequent messages
            // update the same conversation row instead of creating a new one
            if (parsed.conversation_id) {
              setConversationId(parsed.conversation_id);
            }
            if (parsed.delta) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === 'assistant') {
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + parsed.delta,
                  };
                }
                return updated;
              });
            }
          } catch {
            // ignore parse errors
          }
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

  const creditCostPerK = CREDIT_COSTS[model];

  return (
    <div className="flex h-full gap-4">
      {/* Sidebar */}
      <div className="flex w-56 flex-shrink-0 flex-col gap-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={newConversation}
        >
          <Plus className="size-4" />
          New Conversation
        </Button>

        {/* Credits display */}
        {credits !== null && (
          <div className="rounded-lg border p-3 text-center text-sm">
            <div className="text-muted-foreground">Credits</div>
            <div className="text-lg font-semibold">{credits}</div>
          </div>
        )}

        {/* Recent conversations */}
        {conversations.length > 0 && (
          <div className="flex flex-col gap-1">
            <div className="px-1 text-xs font-medium text-muted-foreground uppercase">
              Recent
            </div>
            {conversations.map((conv) => {
              const firstMsg = conv.messages_json?.[0];
              const preview = firstMsg?.content?.slice(0, 30) ?? 'Conversation';
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
                    {MODEL_LABELS[conv.model]}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border bg-background">
        {/* Model selector */}
        <div className="flex items-center gap-2 border-b px-4 py-3">
          {MODELS.map((m) => (
            <button
              key={m}
              onClick={() => setModel(m)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm transition-colors',
                model === m
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {MODEL_LABELS[m]}
              <span className="ml-1 text-xs opacity-70">
                {CREDIT_COSTS[m]}c/1k
              </span>
            </button>
          ))}
          <div className="ml-auto text-xs text-muted-foreground">
            Cost: {creditCostPerK} credit/1k tokens
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-sm">Start a conversation with {MODEL_LABELS[model]}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    )}
                  >
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

        {/* Input area */}
        <div className="border-t px-4 py-3">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
              className="min-h-[44px] max-h-32 resize-none"
              disabled={isStreaming}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isStreaming}
              size="icon"
              className="h-auto self-end"
            >
              {isStreaming ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
