'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePost } from '@/hooks/use-api';
import { PageContainer } from '@/components/layout/page-container';
import { Send, Bot, User, Zap, TrendingUp, AlertTriangle, Sparkles, Loader2, Mic, MicOff, Globe2, FileText } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const suggestions = [
  { icon: Zap, text: 'Why is my system underperforming today?' },
  { icon: TrendingUp, text: 'Forecast my energy production for next week' },
  { icon: AlertTriangle, text: 'Analyze recent anomalies in my devices' },
  { icon: Sparkles, text: 'How can I optimize my solar yield?' },
];

type LanguageCode = 'English' | 'Filipino' | 'Cebuano';
type Capability = 'qa' | 'proposal_explainer' | 'usage_analysis' | 'upgrade_recommendation' | 'issue_detection' | 'technician_assist';
type Audience = 'customer' | 'technician' | 'sales' | 'finance' | 'operator';

const languageToSpeech: Record<LanguageCode, string> = {
  English: 'en-PH',
  Filipino: 'fil-PH',
  Cebuano: 'ceb-PH',
};

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => any;
    SpeechRecognition?: new () => any;
  }
}

export function AiAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Hi! I'm **SolarBot**, your AI energy assistant. I can help you analyze your solar system performance, detect anomalies, forecast energy production, and answer questions about your installation. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [systemId, setSystemId] = useState('');
  const [language, setLanguage] = useState<LanguageCode>('English');
  const [audience, setAudience] = useState<Audience>('customer');
  const [capability, setCapability] = useState<Capability>('qa');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const speechRef = useRef<any>(null);
  const chatMutation = usePost<any, any>('/api/v1/ai/chat', []);
  const reportMutation = usePost<any, { report: string }>('/api/v1/ai/report', []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!voiceEnabled) return;
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = languageToSpeech[language] || 'en-PH';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event: any) => {
      const text = Array.from(event.results).map((r) => r[0]?.transcript ?? '').join(' ').trim();
      setInput(text);
    };
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    speechRef.current = recognition;
    return () => {
      recognition.stop();
      speechRef.current = null;
    };
  }, [voiceEnabled, language]);

  async function send(text?: string) {
    const content = text ?? input.trim();
    if (!content) return;
    setInput('');

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const transcriptSource = listening ? 'browser' : 'manual';
      const res = await chatMutation.mutateAsync({
        messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        context: {
          systemSummary: systemId ? { systemId } : undefined,
          language,
          audience,
          capability,
          voice: {
            enabled: voiceEnabled,
            transcriptSource,
          },
        },
      });
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.reply ?? res.message ?? 'I processed your request.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      }]);
    }
  }

  async function generateReport() {
    const recentDialogue = messages.slice(-8).map((m) => `${m.role}: ${m.content}`).join('\n');
    const res = await reportMutation.mutateAsync({
      type: 'assistant_summary',
      data: {
        language,
        audience,
        capability,
        systemId: systemId || null,
        recentDialogue,
      },
    });
    const botMsg: Message = {
      id: (Date.now() + 7).toString(),
      role: 'assistant',
      content: res.report || 'No report generated.',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, botMsg]);
  }

  return (
    <PageContainer className="flex flex-col gap-4 min-h-[calc(100dvh-5.5rem)] !space-y-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-6 h-6 text-solar-400" /> SolarBot AI Assistant
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Proposal explainer, usage analyst, issue detector, report generator</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <label className="text-xs text-muted-foreground">System ID:</label>
          <input value={systemId} onChange={(e) => setSystemId(e.target.value)}
            placeholder="Optional system ID"
            className="px-3 py-1.5 rounded-lg bg-accent border border-border text-xs focus:outline-none focus:ring-2 focus:ring-solar-500/40 w-44" />
          <label className="text-xs text-muted-foreground flex items-center gap-1"><Globe2 className="w-3.5 h-3.5" />Language</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value as LanguageCode)}
            className="px-2.5 py-1.5 rounded-lg bg-accent border border-border text-xs">
            <option>English</option>
            <option>Filipino</option>
            <option>Cebuano</option>
          </select>
          <select value={audience} onChange={(e) => setAudience(e.target.value as Audience)}
            className="px-2.5 py-1.5 rounded-lg bg-accent border border-border text-xs capitalize">
            <option value="customer">Customer</option>
            <option value="technician">Technician</option>
            <option value="sales">Sales</option>
            <option value="finance">Finance</option>
            <option value="operator">Operator</option>
          </select>
          <select value={capability} onChange={(e) => setCapability(e.target.value as Capability)}
            className="px-2.5 py-1.5 rounded-lg bg-accent border border-border text-xs">
            <option value="qa">Q&A</option>
            <option value="proposal_explainer">Explain Proposal</option>
            <option value="usage_analysis">Analyze Usage</option>
            <option value="upgrade_recommendation">Recommend Upgrades</option>
            <option value="issue_detection">Detect Issues</option>
            <option value="technician_assist">Assist Technician</option>
          </select>
        </div>
      </div>

      <div className="flex-1 panel-card overflow-hidden flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'bg-solar-500/20' : 'bg-blue-500/20'}`}>
                  {msg.role === 'assistant'
                    ? <Bot className="w-4 h-4 text-solar-400" />
                    : <User className="w-4 h-4 text-blue-400" />}
                </div>
                <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'assistant'
                    ? 'bg-accent/60 rounded-tl-sm'
                    : 'bg-solar-500/20 border border-solar-500/30 rounded-tr-sm'}`}>
                    <MarkdownText content={msg.content} />
                  </div>
                  <span className="text-xs text-muted-foreground px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {chatMutation.isPending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-solar-500/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-solar-400" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-accent/60 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-solar-400" />
                <span className="text-sm text-muted-foreground">Thinking…</span>
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="px-4 pb-3 grid grid-cols-2 gap-2">
            {suggestions.map((s) => (
              <button key={s.text} onClick={() => send(s.text)}
                className="flex items-center gap-2 p-3 rounded-xl bg-accent/40 hover:bg-accent/70 transition-colors text-left text-xs">
                <s.icon className="w-4 h-4 text-solar-400 shrink-0" />
                <span>{s.text}</span>
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border">
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask SolarBot about your solar system…"
              disabled={chatMutation.isPending}
              className="flex-1 px-4 py-2.5 rounded-xl bg-accent border border-border text-sm focus:outline-none focus:ring-2 focus:ring-solar-500/40 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => {
                if (!voiceEnabled) {
                  setVoiceEnabled(true);
                  return;
                }
                if (!speechRef.current) return;
                if (listening) speechRef.current.stop();
                else speechRef.current.start();
              }}
              className={`px-3 py-2.5 rounded-xl border border-border transition-colors ${listening ? 'bg-solar-500/20 text-solar-400' : 'hover:bg-accent'}`}
              title="Voice-ready input (browser speech recognition)"
            >
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              type="button"
              disabled={reportMutation.isPending}
              onClick={generateReport}
              className="px-3 py-2.5 rounded-xl border border-border hover:bg-accent disabled:opacity-50"
              title="Generate AI report from conversation"
            >
              {reportMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            </button>
            <button type="submit" disabled={chatMutation.isPending || !input.trim()}
              className="px-4 py-2.5 rounded-xl bg-gradient-solar text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </PageContainer>
  );
}

function MarkdownText({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i}>{part.slice(2, -2)}</strong>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}
