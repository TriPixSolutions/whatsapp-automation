'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  RotateCcw,
  Bot,
  User,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { FAQ_CHIPS } from '@/lib/gemini/systemPrompt';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSend = async (userText: string, chipId?: string) => {
    if (!userText.trim() || isStreaming) return;

    setHasInteracted(true);
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: userText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);

    const botMsgId = `bot_${Date.now()}`;
    const initialBotMsg: ChatMessage = {
      id: botMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...newMessages, initialBotMsg]);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          chipId,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error('Failed to connect to AI streaming service');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const rawChunk = decoder.decode(value, { stream: true });
        const lines = rawChunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulatedContent += parsed.text;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === botMsgId ? { ...msg, content: accumulatedContent } : msg
                  )
                );
              }
            } catch (e) {
              // Ignore partial JSON
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMsgId
            ? {
                ...msg,
                content:
                  '⚠️ Sorry, I could not complete that response. Please ensure your network is connected and try again.',
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleChipClick = (chip: (typeof FAQ_CHIPS)[0]) => {
    handleSend(chip.query, chip.id);
  };

  const handleReset = () => {
    setMessages([]);
    setHasInteracted(false);
  };

  // Render markdown-like simple formatting for messages
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Heading
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-bold text-sm text-[#0D0F2D] mt-2 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <p key={idx} className="font-bold text-xs text-[#0D0F2D] mt-1 mb-1">
            {line.slice(2, -2)}
          </p>
        );
      }
      // List items
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const clean = line.replace(/^[\s-*]+/, '');
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-slate-700 leading-relaxed my-0.5">
            {formatInlineCodeAndBold(clean)}
          </li>
        );
      }
      if (/^\d+\.\s/.test(line.trim())) {
        return (
          <li key={idx} className="ml-4 list-decimal text-xs text-slate-700 leading-relaxed my-0.5">
            {formatInlineCodeAndBold(line.replace(/^\d+\.\s/, ''))}
          </li>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p key={idx} className="text-xs text-slate-700 leading-relaxed my-0.5">
          {formatInlineCodeAndBold(line)}
        </p>
      );
    });
  };

  const formatInlineCodeAndBold = (text: string) => {
    // Process backticks and bold
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 mx-0.5 text-[11px] font-mono bg-purple-50 text-[#7C3AED] rounded border border-purple-100">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none font-sans">
      {/* Floating Chat Modal Window */}
      {isOpen && (
        <div
          className="mb-4 w-[380px] sm:w-[410px] h-[580px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
          style={{ boxShadow: '0 20px 40px -15px rgba(124, 58, 237, 0.25), 0 0 0 1px rgba(0,0,0,0.06)' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0D0F2D] via-[#1A1D4E] to-[#7C3AED] p-4 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                  <Sparkles className="w-4 h-4 text-purple-300 animate-pulse" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0D0F2D] rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold tracking-tight">Passion Fruit AI</h3>
                  <span className="text-[10px] bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full font-medium border border-purple-400/20">
                    Gemini 1.5
                  </span>
                </div>
                <p className="text-[11px] text-purple-200/80 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Online Concierge Assistant
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-purple-200">
              {messages.length > 0 && (
                <button
                  onClick={handleReset}
                  title="Reset conversation"
                  className="p-1.5 hover:bg-white/10 rounded-xl transition-colors text-xs"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize window"
                className="p-1.5 hover:bg-white/10 rounded-xl transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages & Onboarding Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {/* Onboarding Welcome Screen (If no user interaction yet) */}
            {!hasInteracted && messages.length === 0 && (
              <div className="space-y-4 pt-2">
                {/* Greeting Card */}
                <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-[#7C3AED] shrink-0 font-bold text-xs">
                      🍇
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#0D0F2D]">Welcome to Passion Fruit!</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        I am your dedicated AI guide for the **WhatsApp Automation & Shared Team Inbox** platform.
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Select a popular topic below or ask me any question directly:
                      </p>
                    </div>
                  </div>
                </div>

                {/* FAQ Clickable Chips */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                    Quick Assistance
                  </p>
                  <div className="flex flex-col gap-2">
                    {FAQ_CHIPS.map((chip) => (
                      <button
                        key={chip.id}
                        onClick={() => handleChipClick(chip)}
                        className="text-left px-3.5 py-2.5 rounded-xl bg-white border border-slate-200/80 hover:border-purple-300 hover:bg-purple-50/40 text-xs font-medium text-slate-700 hover:text-[#7C3AED] transition-all flex items-center justify-between group shadow-sm"
                      >
                        <span className="truncate pr-2">{chip.label}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#7C3AED] group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Meta Quick Status Card */}
                <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/60 p-3 rounded-xl border border-indigo-100 text-[11px] text-slate-600 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#7C3AED] shrink-0" />
                  <span>
                    Official Meta WhatsApp Cloud API v18.0 Verified Webhook Architecture.
                  </span>
                </div>
              </div>
            )}

            {/* Render conversation messages */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-purple-100 text-[#7C3AED] flex items-center justify-center shrink-0 text-xs font-bold mt-1">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs ${
                    msg.role === 'user'
                      ? 'bg-[#7C3AED] text-white rounded-br-none shadow-sm'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div>
                      {msg.content ? (
                        renderFormattedText(msg.content)
                      ) : (
                        <div className="flex items-center gap-1.5 py-1 text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-bounce" style={{ animationDelay: '300ms' }} />
                          <span className="text-[11px] ml-1 text-purple-600 font-medium">Formulating guide...</span>
                        </div>
                      )}
                    </div>
                  )}
                  <span
                    className={`block text-[9px] mt-1 text-right ${
                      msg.role === 'user' ? 'text-purple-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 text-xs mt-1">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick chip bar after messages are present */}
          {messages.length > 0 && !isStreaming && (
            <div className="px-3 py-1.5 bg-slate-100/70 border-t border-slate-200/60 overflow-x-auto flex gap-1.5 scrollbar-none">
              {FAQ_CHIPS.slice(0, 3).map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => handleChipClick(chip)}
                  className="whitespace-nowrap text-[10px] px-2.5 py-1 bg-white hover:bg-purple-50 text-slate-600 hover:text-[#7C3AED] rounded-full border border-slate-200/80 transition-colors font-medium shadow-2xs"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isStreaming ? 'AI is generating response...' : 'Ask Passion Fruit AI anything...'}
              disabled={isStreaming}
              className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] disabled:opacity-60 transition-all text-slate-800 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="w-9 h-9 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-slate-200 text-white disabled:text-slate-400 flex items-center justify-center transition-all shrink-0 shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Circular Launcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open AI Assistant"
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#7C3AED] via-[#8B5CF6] to-[#6366F1] text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center relative group border-2 border-white/40"
        style={{
          boxShadow: '0 8px 25px -4px rgba(124, 58, 237, 0.5), 0 0 0 1px rgba(124, 58, 237, 0.1)',
        }}
      >
        {isOpen ? (
          <X className="w-6 h-6 transition-transform duration-200" />
        ) : (
          <>
            <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            </span>
          </>
        )}
      </button>
    </div>
  );
}
