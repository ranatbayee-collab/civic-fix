import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Database,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function CivicCopilotModal({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      sender: 'ai',
      text: 'Hello! I am your AI Civic Copilot. I have live access to municipal sensor data, complaints database, department response times, and city health metrics. How can I assist you today?',
      suggestions: [
        'Which area has the most unresolved problems?',
        'How many potholes are unresolved?',
        'What is the slowest department?',
        'What is our City Health Score?'
      ]
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (queryText) => {
    const textToSend = queryText || inputPrompt;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setLoading(true);

    try {
      const res = await api.copilotChat(textToSend);
      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.answer,
        data: res.data,
        intent: res.intent,
        suggestions: res.suggestions || []
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          text: 'Apologies, I encountered an issue querying the civic data registry. Please try again.',
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl h-[620px] rounded-3xl bg-slate-900 border border-cyan-500/40 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Bot className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">CivicFix AI Copilot</h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                  <Database className="w-3 h-3" /> LIVE DB
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Natural language municipal data analytics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center flex-shrink-0 text-cyan-300">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm shadow-md'
                    : 'bg-slate-800/80 border border-slate-700/70 text-slate-200 rounded-tl-sm'
                }`}
              >
                <p className="whitespace-pre-line">{m.text}</p>

                {/* Structured Data Attachment (if available) */}
                {m.intent && (
                  <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center gap-2 text-[10px] text-cyan-400 font-mono">
                    <Database className="w-3 h-3" /> Safe query intent: {m.intent}
                  </div>
                )}

                {/* Prompt suggestions pills */}
                {m.suggestions && m.suggestions.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-700/60 space-y-1.5">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Suggested queries:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {m.suggestions.map((sugg, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(sugg)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-[11px] text-cyan-300 text-left transition-colors flex items-center gap-1"
                        >
                          <span>{sugg}</span>
                          <ArrowRight className="w-3 h-3 opacity-60" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {m.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center flex-shrink-0 text-blue-300">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-xs text-slate-400 animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                <Sparkles className="w-4 h-4 animate-spin-slow" />
              </div>
              <span>Querying database & computing municipal analytics...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask anything (e.g. 'How many potholes?', 'Slowest department?')..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || loading}
            className="p-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-cyan-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
