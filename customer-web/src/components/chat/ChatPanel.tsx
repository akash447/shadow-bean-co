import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ChatMessage } from './types';
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

    // Send greeting on mount
    useEffect(() => {
        const greeting = conversationRef.current.getGreeting();
        setIsTyping(true);
        const timer = setTimeout(() => {
            setMessages([{
                role: 'assistant',
                content: greeting.message,
                chips: greeting.chips,
                card: greeting.card,
            }]);
            setIsTyping(false);
        }, 600);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!isTyping) inputRef.current?.focus();
    }, [isTyping]);

    const handleSend = useCallback((text?: string) => {
        const msg = (text || input).trim();
        if (!msg) return;

        const userMessage: ChatMessage = { role: 'user', content: msg };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        // Simulate typing delay
        setTimeout(() => {
            const response = conversationRef.current.respond(msg);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.message,
                chips: response.chips,
                card: response.card,
            }]);
            setIsTyping(false);
        }, 400 + Math.random() * 600);
    }, [input]);

    const handleChipSelect = useCallback((chip: string) => {
        // Remove chips from the last message
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
            position: 'fixed', inset: 0,
            zIndex: 10000,
            display: 'flex', flexDirection: 'column',
            background: '#1A0F00',
            animation: 'chatSlideUp 0.3s ease-out',
        }
        : {
            position: 'fixed', top: 0, right: 0, bottom: 0,
            width: 380,
            zIndex: 10000,
            display: 'flex', flexDirection: 'column',
            background: '#1A0F00',
            boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
            animation: 'chatSlideIn 0.3s ease-out',
        };

    return (
        <div style={panelStyle}>
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-3 shrink-0"
                style={{ borderBottom: '1px solid rgba(245,240,232,0.08)' }}
            >
                {isMobile ? (
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 cursor-pointer"
                        style={{ background: 'none', border: 'none', color: '#F5F0E8', fontSize: 15, fontFamily: "'DM Sans', sans-serif" }}
                        aria-label="Close chat"
                    >
                        <span style={{ fontSize: 20 }}>&larr;</span>
                        <span>Back</span>
                    </button>
                ) : (
                    <div className="flex items-center gap-2.5">
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                            style={{ background: 'linear-gradient(135deg, #C97B2A, #A05A10)' }}
                        >
                            &#9749;
                        </div>
                        <div>
                            <div className="text-sm font-semibold" style={{ color: '#F5F0E8', fontFamily: "'Playfair Display', serif" }}>
                                Shadow Bean Co
                            </div>
                            <div className="text-xs" style={{ color: 'rgba(245,240,232,0.5)', fontFamily: "'DM Sans', sans-serif" }}>
                                Your coffee assistant
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-1">
                    {!isMobile && onMinimize && (
                        <button
                            onClick={onMinimize}
                            className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors"
                            style={{ background: 'transparent', border: 'none', color: 'rgba(245,240,232,0.5)', fontSize: 18 }}
                            aria-label="Minimize chat"
                            onMouseEnter={e => e.currentTarget.style.color = '#F5F0E8'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.5)'}
                        >
                            &mdash;
                        </button>
                    )}
                    {!isMobile && (
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors"
                            style={{ background: 'transparent', border: 'none', color: 'rgba(245,240,232,0.5)', fontSize: 18 }}
                            aria-label="Close chat"
                            onMouseEnter={e => e.currentTarget.style.color = '#F5F0E8'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.5)'}
                        >
                            &times;
                        </button>
                    )}
                </div>
            </div>

            {/* Messages */}
            <MessageList
                messages={messages}
                isTyping={isTyping}
                onChipSelect={handleChipSelect}
                onNavigate={handleNavigate}
            />

            {/* Input */}
            <div
                className="flex items-center gap-2 px-3 py-2.5 shrink-0"
                style={{ borderTop: '1px solid rgba(245,240,232,0.08)', background: 'rgba(0,0,0,0.2)' }}
            >
                <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    disabled={isTyping}
                    className="flex-1 py-2.5 px-4 text-sm rounded-full outline-none"
                    style={{
                        background: 'rgba(245,240,232,0.06)',
                        border: '1px solid rgba(245,240,232,0.1)',
                        color: '#F5F0E8',
                        fontFamily: "'DM Sans', sans-serif",
                    }}
                />
                <button
                    onClick={() => handleSend()}
                    disabled={isTyping || !input.trim()}
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-opacity"
                    style={{
                        background: input.trim() ? 'linear-gradient(135deg, #C97B2A, #A05A10)' : 'rgba(245,240,232,0.08)',
                        border: 'none',
                        color: '#F5F0E8',
                        fontSize: 16,
                        opacity: input.trim() ? 1 : 0.5,
                    }}
                    aria-label="Send message"
                >
                    &#10148;
                </button>
            </div>
        </div>
    );
}
