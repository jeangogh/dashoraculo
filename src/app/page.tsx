'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Message {
  role: 'user' | 'oracle';
  content: string;
  timestamp: Date;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('oraculo_api_key');
    if (saved) {
      setApiKey(saved);
    } else {
      setShowSetup(true);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  }, []);

  const saveKey = useCallback((key: string) => {
    const trimmed = key.trim();
    if (!trimmed) return;
    localStorage.setItem('oraculo_api_key', trimmed);
    setApiKey(trimmed);
    setShowSetup(false);
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading || !apiKey) return;

    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = 'auto';

    try {
      const res = await fetch('/api/oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-10).map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
          })),
          apiKey,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages(prev => [...prev, {
          role: 'oracle',
          content: `Erro: ${data.error}`,
          timestamp: new Date(),
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'oracle',
          content: data.response,
          timestamp: new Date(),
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'oracle',
        content: 'Erro de conexao. Tente novamente.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, apiKey, messages]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // Setup screen
  if (showSetup) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="text-4xl mb-2" style={{ color: 'var(--accent)' }}>&#9673;</div>
          <h1 className="text-xl font-medium">Oraculo</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Cole sua chave da Anthropic pra comecar.
          </p>
          <input
            type="password"
            placeholder="sk-ant-..."
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveKey((e.target as HTMLInputElement).value);
            }}
            autoFocus
          />
          <button
            onClick={() => {
              const input = document.querySelector('input') as HTMLInputElement;
              if (input) saveKey(input.value);
            }}
            className="w-full py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ maxHeight: '100dvh' }}>
      {/* Header minimalista */}
      <header
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg" style={{ color: 'var(--accent)' }}>&#9673;</span>
          <span className="text-sm font-medium">Oraculo</span>
        </div>
        <button
          onClick={() => setShowSetup(true)}
          className="text-xs px-2 py-1 rounded-lg transition-colors hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}
        >
          Config
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
            <span className="text-5xl" style={{ color: 'var(--accent)' }}>&#9673;</span>
            <p className="text-sm text-center max-w-xs" style={{ color: 'var(--text-muted)' }}>
              Pergunte qualquer coisa.<br/>
              Eu respondo com base nos seus dados.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {[
                'Qual meu padrao?',
                'Onde eu mais travo?',
                'Quando sou mais produtivo?',
                'Evolui em algo?',
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); inputRef.current?.focus(); }}
                  className="text-xs px-3 py-1.5 rounded-full transition-all hover:opacity-80"
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`message-enter flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className="max-w-[85%] sm:max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
              style={{
                background: msg.role === 'user' ? 'var(--user-bg)' : 'var(--oracle-bg)',
                border: msg.role === 'oracle' ? '1px solid var(--border)' : 'none',
                borderRadius: msg.role === 'user'
                  ? '20px 20px 4px 20px'
                  : '20px 20px 20px 4px',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="message-enter flex justify-start">
            <div
              className="px-4 py-3 rounded-2xl flex gap-1.5"
              style={{
                background: 'var(--oracle-bg)',
                border: '1px solid var(--border)',
                borderRadius: '20px 20px 20px 4px',
              }}
            >
              <span className="typing-dot w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
              <span className="typing-dot w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
              <span className="typing-dot w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 pb-4 pt-2">
        <div
          className="input-glow flex items-end gap-2 rounded-2xl px-4 py-3 transition-all"
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte ao Oraculo..."
            rows={1}
            className="flex-1 bg-transparent outline-none text-sm resize-none"
            style={{ color: 'var(--text)', maxHeight: 160 }}
            autoFocus
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-20"
            style={{ background: 'var(--accent)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
