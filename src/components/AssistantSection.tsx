/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Bot, User, Loader2, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';
import { ChatMessage } from '../types.js';

export default function AssistantSection() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Greetings, fellow cinephile! I am **MovieMind AI Pro Assistant**, your digital film historian and recommendations guide. Ask me anything about directors, cinematography, cast details, or request hyper-specific genre cross-sections.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const starterQuestions = [
    'Recommend a dark sci-fi thriller',
    'Explain the Ending of Interstellar',
    'Who directed Inception?',
    'Best psychological horror movies of the 2010s'
  ];

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Map entire history for Groq multi-turn memory
      const historyPayload = [...messages, userMsg].map((msg) => ({
        role: msg.role,
        content: msg.content
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historyPayload })
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: ChatMessage = {
          id: Math.random().toString(36).substr(2, 9),
          role: 'assistant',
          content: data.message || 'Apologies, I encountered a cinematic transmission error.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Server error');
      }
    } catch (err: any) {
      console.error('Chat bot error:', err);
      const errorMsg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        content: `**System Error:** ${err.message || 'Could not communicate with the LLM API. Please check your credentials.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  // Convert custom Markdown blocks like bolding into inline simple HTML tags safely
  const formatText = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Process bold tags **bold** -> <strong>bold</strong>
      let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-extrabold">$1</strong>');
      // Process italic tags *italic* -> <em>italic</em>
      processed = processed.replace(/\*(.*?)\*/g, '<em class="text-gray-300">$1</em>');
      
      // Process simple list tags
      if (processed.trim().startsWith('- ')) {
        return (
          <li key={i} className="ml-4 list-disc text-xs md:text-sm text-gray-300 py-0.5" dangerouslySetInnerHTML={{ __html: processed.replace(/^- /, '') }} />
        );
      }

      return (
        <p key={i} className="text-xs md:text-sm text-gray-300 leading-relaxed min-h-[1rem]" dangerouslySetInnerHTML={{ __html: processed }} />
      );
    });
  };

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 items-start animate-fade-in" id="chat-section-container">
      {/* Left panel suggestions */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-[#1a1a1a] p-5 rounded-2xl border border-white/5 space-y-3">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-red-500" />
            Cinephile Prompts
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Unsure what to ask? Click any pre-packaged prompt below to interrogate our cinematic intelligence:
          </p>
          <div className="space-y-2 pt-1 flex flex-col">
            {starterQuestions.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="text-left px-3 py-2 bg-white/5 hover:bg-white/10 text-[11px] text-gray-300 rounded-lg hover:text-white transition-all cursor-pointer border border-white/5"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-white/5 text-[11px] text-gray-500 leading-relaxed flex gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500/50 shrink-0" />
          <span>
            Answers are backed by real-time metadata. Mentioning movie titles like 'Arrival' prompts live factual retrieval behind the scenes.
          </span>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="lg:col-span-3 bg-[#1a1a1a] border border-white/5 rounded-3xl overflow-hidden flex flex-col h-[500px] shadow-2xl relative">
        {/* Header bar */}
        <div className="px-6 py-4 border-b border-white/5 bg-black/40 flex items-center gap-3">
          <div className="p-2 bg-red-600/10 border border-red-500/20 text-red-500 rounded-xl">
            <Bot className="h-4 w-4 animate-bounce" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">AI Cinema Companion</h3>
            <p className="text-[10px] text-green-400 font-mono flex items-center gap-1 mt-0.5">
              <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-ping" />
              Llama-3.3-70b Online
            </p>
          </div>
        </div>

        {/* Message Panel */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {messages.map((msg) => {
            const isBot = msg.role === 'assistant';
            return (
              <div
                key={msg.id}
                className={`flex gap-4 max-w-[85%] ${
                  isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'
                }`}
              >
                {/* Icon */}
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center border shrink-0 ${
                  isBot
                    ? 'bg-red-600/10 border-red-500/20 text-red-500'
                    : 'bg-white/10 border-white/10 text-white'
                }`}>
                  {isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>

                {/* Bubble contents */}
                <div className={`space-y-2 rounded-2xl p-4 shadow-md ${
                  isBot
                    ? 'bg-[#222222]/80 text-gray-300 border border-white/5'
                    : 'bg-red-600 text-white font-medium'
                }`}>
                  <div className="space-y-1.5">{formatText(msg.content)}</div>
                  <span className={`text-[9px] block text-right font-mono ${
                    isBot ? 'text-gray-500' : 'text-red-200'
                  }`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-4 max-w-[85%] mr-auto items-center">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center border bg-red-600/10 border-red-500/20 text-red-500 shrink-0">
                <Bot className="h-4 w-4 animate-spin" />
              </div>
              <div className="bg-[#222222]/80 border border-white/5 rounded-2xl px-4 py-3 text-gray-400 text-xs flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-red-500" />
                <span>Interrogating archives...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Form Inputs footer */}
        <form onSubmit={handleFormSubmit} className="p-4 border-t border-white/5 bg-black/20 flex items-center gap-3">
          <input
            id="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Interrogate MovieMind AI (e.g. Tell me about Christopher Nolan's style)..."
            className="flex-1 bg-[#141414] border border-white/5 focus:border-red-600/50 outline-none rounded-xl px-4 py-3 text-xs md:text-sm text-white placeholder-gray-500 transition-all"
            disabled={loading}
            required
            autoComplete="off"
          />
          <button
            id="chat-submit"
            type="submit"
            disabled={loading || !input.trim()}
            className="p-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-lg shadow-red-600/25"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
