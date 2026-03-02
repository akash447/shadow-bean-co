import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ChatMessage } from './types';
import type { TasteProfile } from '../../stores/cartStore';
import { useCartStore } from '../../stores/cartStore';
import { createConversation } from './api';
import MessageList from './MessageList';

interface Props {
    isMobile: boolean;
    onClose: () => void;
    onMinimize?: () => void;
}

function HeaderBotAvatar() {
    return (
        <div
            className="shrink-0 flex items-center justify-center"
            style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
            }}
        >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <circle cx="12" cy="5" r="4" />
                <circle cx="9" cy="16" r="1" fill="white" />
                <circle cx="15" cy="16" r="1" fill="white" />
            </svg>
        </div>
    );
}

export default function ChatPanel({ isMobile, onClose, onMinimize }: Props) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const conversationRef = useRef(createConversation());
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const addItem = useCartStore(s => s.addItem);

    // Greeting on mount
    useEffect(() => {
        const greeting = conversationRef.current.getGreeting();
        setIsTyping(true);
        const timer = setTimeout(() => {
            setMessages([{ role: 'assistant', content: greeting.message, chips: greeting.chips, card: greeting.card }]);
            setIsTyping(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!isTyping) inputRef.current?.focus();
    }, [isTyping]);

    const handleAddToCart = useCallback((taste: { bitterness?: number; flavour?: number; roast?: string; grind?: string; qty?: number }) => {
        const b = taste.bitterness || 3;
        const f = taste.flavour || 3;
        const r = taste.roast || 'Medium';
        const g = taste.grind || 'Whole Bean';
        const qty = taste.qty || 1;

        const profile: TasteProfile = {
            id: `chat-${Date.now()}`,
            name: `CR-${b}${f}-${r.charAt(0).toUpperCase()}${g.charAt(0).toUpperCase()}`,
            bitterness: b,
            acidity: 3,
            body: 3,
            flavour: f,
            roastLevel: r as 'Light' | 'Medium' | 'Balanced',
            grindType: g,
        };

        for (let i = 0; i < qty; i++) {
            addItem(profile);
        }

        // Navigate to order page after short delay
        setTimeout(() => {
            navigate('/checkout');
            onClose();
        }, 1500);
    }, [addItem, navigate, onClose]);

    const handleSend = useCallback((text?: string) => {
        const msg = (text || input).trim();
        if (!msg) return;

        setMessages(prev => [...prev, { role: 'user', content: msg }]);
        setInput('');
        setIsTyping(true);

        setTimeout(() => {
            const response = conversationRef.current.respond(msg);

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.message,
                chips: response.chips,
                card: response.card,
            }]);
            setIsTyping(false);

            // Handle actions
            if (response.action?.type === 'add_to_cart') {
                handleAddToCart(response.action.taste);
            }
        }, 400 + Math.random() * 400);
    }, [input, handleAddToCart]);

    const handleChipSelect = useCallback((chip: string) => {
        setMessages(prev => prev.map((m, i) =>
            i === prev.length - 1 && m.role === 'assistant' ? { ...m, chips: [] } : m
        ));
        handleSend(chip);
    }, [handleSend]);

    const handleNavigate = useCallback((path: string) => {
        navigate(path);
        onClose();
    }, [navigate, onClose]);

    const panelStyle: React.CSSProperties = isMobile
        ? {
            position: 'fixed', inset: 0, zIndex: 10000,
            display: 'flex', flexDirection: 'column',
            background: '#e8ecf1',
            animation: 'chatSlideUp 0.3s ease-out',
        }
        : {
            position: 'fixed', top: 0, right: 0, bottom: 0,
            width: 400, zIndex: 10000,
            display: 'flex', flexDirection: 'column',
            background: '#e8ecf1',
            boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
            animation: 'chatSlideIn 0.3s ease-out',
        };

    return (
        <div style={panelStyle}>
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 shrink-0"
                style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    paddingTop: isMobile ? 12 : 14,
                    paddingBottom: isMobile ? 12 : 14,
                }}
            >
                <div className="flex items-center gap-3">
                    <HeaderBotAvatar />
                    <div>
                        <div
                            style={{
                                fontSize: '11px',
                                color: 'rgba(255,255,255,0.55)',
                                fontFamily: "'DM Sans', sans-serif",
                                letterSpacing: '0.5px',
                                textTransform: 'uppercase' as const,
                            }}
                        >
                            Chat with
                        </div>
                        <div
                            style={{
                                fontSize: '15px',
                                fontWeight: 700,
                                color: '#ffffff',
                                fontFamily: "'DM Sans', sans-serif",
                                marginTop: 1,
                            }}
                        >
                            Shadow Bean Co
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {!isMobile && onMinimize && (
                        <button
                            onClick={onMinimize}
                            className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer bg-transparent border-none text-lg"
                            style={{ color: 'rgba(255,255,255,0.5)' }}
                            aria-label="Minimize"
                            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                        >
                            &mdash;
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer bg-transparent border-none"
                        style={{ color: 'rgba(255,255,255,0.5)' }}
                        aria-label="Close chat"
                        onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Messages */}
            <MessageList messages={messages} isTyping={isTyping} onChipSelect={handleChipSelect} onNavigate={handleNavigate} />

            {/* Input */}
            <div
                className="flex items-center gap-2 px-3 shrink-0"
                style={{
                    background: '#ffffff',
                    borderTop: '1px solid rgba(0,0,0,0.06)',
                    paddingTop: 10,
                    paddingBottom: isMobile ? 16 : 10,
                }}
            >
                <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    disabled={isTyping}
                    className="flex-1 py-2.5 px-4 text-sm outline-none"
                    style={{
                        fontFamily: "'DM Sans', sans-serif",
                        borderRadius: 24,
                        border: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        color: '#1e293b',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={e => {
                        e.currentTarget.style.borderColor = '#93c5fd';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                    }}
                    onBlur={e => {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                />
                <button
                    onClick={() => handleSend()}
                    disabled={isTyping || !input.trim()}
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-all border-none text-white"
                    style={{
                        background: input.trim()
                            ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                            : '#cbd5e1',
                        opacity: input.trim() ? 1 : 0.6,
                        boxShadow: input.trim() ? '0 2px 8px rgba(59,130,246,0.3)' : 'none',
                    }}
                    aria-label="Send"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
