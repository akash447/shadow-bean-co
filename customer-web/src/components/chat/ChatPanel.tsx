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
        ? { position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', flexDirection: 'column', background: '#FAF8F5', animation: 'chatSlideUp 0.3s ease-out' }
        : { position: 'fixed', top: 0, right: 0, bottom: 0, width: 380, zIndex: 10000, display: 'flex', flexDirection: 'column', background: '#FAF8F5', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', animation: 'chatSlideIn 0.3s ease-out' };

    return (
        <div style={panelStyle}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-gray-200" style={{ background: '#fff' }}>
                {isMobile ? (
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 cursor-pointer bg-transparent border-none text-gray-700 text-sm"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                        aria-label="Close chat"
                    >
                        <span className="text-lg">&larr;</span>
                        <span>Back</span>
                    </button>
                ) : (
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-sm">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="10" rx="2" />
                                <circle cx="12" cy="5" r="4" />
                                <circle cx="9" cy="16" r="1" fill="currentColor" />
                                <circle cx="15" cy="16" r="1" fill="currentColor" />
                            </svg>
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>Shadow Bean Co</div>
                            <div className="text-xs text-gray-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>Coffee Assistant</div>
                        </div>
                    </div>
                )}
                <div className="flex items-center gap-1">
                    {!isMobile && onMinimize && (
                        <button onClick={onMinimize} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer bg-transparent border-none text-gray-400 hover:text-gray-700 text-lg" aria-label="Minimize">&mdash;</button>
                    )}
                    {!isMobile && (
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer bg-transparent border-none text-gray-400 hover:text-gray-700 text-lg" aria-label="Close">&times;</button>
                    )}
                </div>
            </div>

            {/* Messages */}
            <MessageList messages={messages} isTyping={isTyping} onChipSelect={handleChipSelect} onNavigate={handleNavigate} />

            {/* Input */}
            <div className="flex items-center gap-2 px-3 py-2.5 shrink-0 border-t border-gray-200" style={{ background: '#fff' }}>
                <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    disabled={isTyping}
                    className="flex-1 py-2.5 px-4 text-sm rounded-full outline-none border border-gray-200 bg-white text-gray-800"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                />
                <button
                    onClick={() => handleSend()}
                    disabled={isTyping || !input.trim()}
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-opacity border-none text-white"
                    style={{ background: input.trim() ? '#1f2937' : '#d1d5db', opacity: input.trim() ? 1 : 0.6 }}
                    aria-label="Send"
                >
                    &#10148;
                </button>
            </div>
        </div>
    );
}
