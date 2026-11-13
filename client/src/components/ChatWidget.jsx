import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Sparkles, Bot } from 'lucide-react';
import { sendChatMessage } from '../api/chat';
import { classNames } from '../utils/formatters';

const SUGGESTIONS = [
  'How much did I spend in October 2026?',
  'Maine October me kitna kharcha kiya?',
  'What is my biggest expense?',
  'Sabse zyada kharcha kis cheez me hua?',
  'How can I save more money?'
];

const WELCOME = "Hi! 👋 I'm your FinanceAI Expendature assistant. Ask me in English or Hinglish about your uploaded bank statement (e.g. 'How much did I spend?' ya 'Maine kitna kharcha kiya?').";

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, loading]);

  const send = async (text) => {
    const message = (text ?? input).trim();
    if (!message || loading) return;

    const userMessage = { role: 'user', content: message };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const history = nextMessages
        .filter(m => m.content !== WELCOME)
        .map(m => ({ role: m.role, content: m.content }));
      const data = await sendChatMessage(message, history);
      setMessages(prev => [...prev, { role: 'assistant', content: data?.reply || 'Sorry, I could not find an answer.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={classNames(
          'fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-all',
          open ? 'bg-gray-800 hover:bg-gray-900' : 'bg-indigo-600 hover:bg-indigo-700'
        )}
        aria-label={open ? 'Close chat' : 'Open AI chat'}
      >
        {open ? <X className="h-6 w-6 text-white" /> : <MessageCircle className="h-6 w-6 text-white" />}
        {!open && (
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-green-500 border-2 border-white rounded-full" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[380px] max-w-[calc(100vw-2.5rem)] h-[560px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold leading-tight">FinanceAI Expandature Assistant</p>
              <p className="text-indigo-100 text-xs">Powered by Gemini AI & Real Data</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
            {messages.map((m, idx) => (
              <div key={idx} className={classNames('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={classNames(
                  'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words',
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'
                )}>
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                  <span className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="px-3 pt-2 pb-1 bg-white border-t border-gray-100 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-2.5 py-1.5 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100 flex items-end gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Ask about your spending..."
              className="flex-1 resize-none max-h-28 px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="h-10 w-10 flex-shrink-0 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Sparkles className="h-5 w-5 animate-pulse" /> : <Send className="h-5 w-5" />}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
