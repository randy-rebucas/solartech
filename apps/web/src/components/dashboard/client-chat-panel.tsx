'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, X, Bot, Loader2, ChevronUp } from 'lucide-react';
import api from '@/lib/api';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

type Props = {
  systemSummary?: object;
  recentAlerts?: string[];
};

export function ClientChatPanel({ systemSummary, recentAlerts }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hi! I’m SolarBot. Ask about your production, bills, maintenance, or how to save more on energy.',
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput('');
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content }];
    setMessages(nextMessages);
    setLoading(true);
    try {
      const { data } = await api.post<{ reply: string }>('/api/v1/ai/chat', {
        messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        context: { systemSummary, recentAlerts },
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Support is temporarily unavailable. Try again in a moment.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-card border-t border-border shadow-2xl md:inset-x-auto md:right-6 md:bottom-6 md:w-[380px] md:max-h-[min(520px,85dvh)] md:rounded-2xl md:border"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-solar-500" />
                <span className="font-semibold text-sm">Chat support</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-accent"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px] max-h-[50dvh] md:max-h-[340px]">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`text-sm rounded-xl px-3 py-2 max-w-[90%] ${
                    m.role === 'user'
                      ? 'ml-auto bg-solar-500 text-white'
                      : 'bg-accent text-foreground'
                  }`}
                >
                  {m.content}
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" /> Thinking…
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <form
              className="p-3 border-t border-border flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your system…"
                className="flex-1 px-3 py-2.5 rounded-xl bg-accent border border-border text-sm focus:outline-none focus:ring-2 focus:ring-solar-500/40"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2.5 rounded-xl bg-solar-500 text-white disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-[4.5rem] right-4 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-solar-500 text-white shadow-lg shadow-solar-500/30 md:bottom-6 md:right-6"
      >
        {open ? <ChevronUp className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        <span className="text-sm font-medium">{open ? 'Hide' : 'Support'}</span>
      </button>
    </>
  );
}
