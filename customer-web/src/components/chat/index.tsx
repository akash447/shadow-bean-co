import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatPanel from './ChatPanel';

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);
    return isMobile;
}

const NAV_LINKS = [
    { label: 'Home', path: '/' },
    { label: 'Shop', path: '/shop' },
    { label: 'About', path: '/about' },
];

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [showPulse, setShowPulse] = useState(true);
    const [navOpen, setNavOpen] = useState(false);
    const isMobile = useIsMobile();
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => setShowPulse(false), 5000);
        return () => clearTimeout(timer);
    }, []);

    // Close nav popup when clicking outside
    useEffect(() => {
        if (!navOpen) return;
        const handler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.nav-popup-container')) setNavOpen(false);
        };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, [navOpen]);

    const handleOpen = useCallback(() => { setIsOpen(true); setShowPulse(false); setNavOpen(false); }, []);
    const handleClose = useCallback(() => setIsOpen(false), []);
    const handleNav = useCallback((path: string) => { navigate(path); setNavOpen(false); }, [navigate]);

    return (
        <>
            <style>{`
                @keyframes chatPulse {
                    0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.35); }
                    70% { box-shadow: 0 0 0 14px rgba(59,130,246,0); }
                    100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
                }
                @keyframes chatSlideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes chatSlideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes dotBounce {
                    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
                    40% { transform: scale(1); opacity: 1; }
                }
                @keyframes navPopIn {
                    from { transform: translateY(10px) scale(0.95); opacity: 0; }
                    to { transform: translateY(0) scale(1); opacity: 1; }
                }
            `}</style>

            {isOpen && <ChatPanel isMobile={isMobile} onClose={handleClose} onMinimize={handleClose} />}

            {!isOpen && (
                <>
                    {/* Mobile: Three-dots nav button (bottom-left) */}
                    {isMobile && (
                        <div className="nav-popup-container" style={{ position: 'fixed', bottom: 20, left: 20, zIndex: 10001 }}>
                            {/* Nav popup */}
                            {navOpen && (
                                <div style={{
                                    position: 'absolute', bottom: 64, left: 0,
                                    background: '#fff', borderRadius: 14, padding: '6px 0',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.18)', border: '1px solid #e5e7eb',
                                    minWidth: 140, animation: 'navPopIn 0.2s ease-out',
                                }}>
                                    {NAV_LINKS.map(link => (
                                        <button
                                            key={link.path}
                                            onClick={() => handleNav(link.path)}
                                            style={{
                                                display: 'block', width: '100%', padding: '12px 20px',
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                fontSize: 14, fontWeight: 600, color: '#1c0d02',
                                                textAlign: 'left', fontFamily: "'DM Sans', sans-serif",
                                                transition: 'background 0.15s',
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f4')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                        >
                                            {link.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Three-dots button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); setNavOpen(p => !p); }}
                                aria-label="Navigation menu"
                                style={{
                                    width: 48, height: 48, borderRadius: '50%',
                                    background: '#1c1c1c', border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                                    transition: 'transform 0.2s',
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                    <circle cx="12" cy="5" r="2.5"/>
                                    <circle cx="12" cy="12" r="2.5"/>
                                    <circle cx="12" cy="19" r="2.5"/>
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Chatbot button (bottom-right) — blue robot icon */}
                    <button
                        onClick={handleOpen}
                        aria-label="Open chat"
                        className="fixed z-[10001] flex items-center justify-center cursor-pointer border-none transition-transform duration-200 hover:scale-110"
                        style={{
                            bottom: 20, right: 20,
                            width: 56, height: 56,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            boxShadow: showPulse
                                ? undefined
                                : '0 4px 14px rgba(59,130,246,0.35)',
                            animation: showPulse ? 'chatPulse 2s infinite' : 'none',
                        }}
                    >
                        {/* Robot icon */}
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="4" y="8" width="16" height="12" rx="3"/>
                            <line x1="12" y1="4" x2="12" y2="8"/>
                            <circle cx="12" cy="3" r="1.5" fill="white" stroke="none"/>
                            <circle cx="9" cy="13.5" r="1.5" fill="white" stroke="none"/>
                            <circle cx="15" cy="13.5" r="1.5" fill="white" stroke="none"/>
                            <path d="M9.5 17.5 C10.5 18.5 13.5 18.5 14.5 17.5"/>
                            <line x1="1" y1="13" x2="4" y2="13"/>
                            <line x1="20" y1="13" x2="23" y2="13"/>
                        </svg>
                    </button>
                </>
            )}
        </>
    );
}
