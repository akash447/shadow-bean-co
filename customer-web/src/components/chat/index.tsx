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
    const [navOpen, setNavOpen] = useState(false);
    const isMobile = useIsMobile();
    const navigate = useNavigate();

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

    const handleOpenChat = useCallback(() => { setIsOpen(true); setNavOpen(false); }, []);
    const handleClose = useCallback(() => setIsOpen(false), []);
    const handleNav = useCallback((path: string) => { navigate(path); setNavOpen(false); }, [navigate]);

    // Only render on mobile
    if (!isMobile) return null;

    return (
        <>
            <style>{`
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
                <div className="nav-popup-container" style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 10001 }}>
                    {/* Nav popup with chatbot option */}
                    {navOpen && (
                        <div style={{
                            position: 'absolute', bottom: 60, right: 0,
                            background: '#fff', borderRadius: 14, padding: '6px 0',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.18)', border: '1px solid #e5e7eb',
                            minWidth: 160, animation: 'navPopIn 0.2s ease-out',
                        }}>
                            {NAV_LINKS.map(link => (
                                <button
                                    key={link.path}
                                    onClick={() => handleNav(link.path)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        width: '100%', padding: '12px 18px',
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

                            {/* Divider */}
                            <div style={{ height: 1, background: '#e5e7eb', margin: '4px 0' }} />

                            {/* Chat with us option */}
                            <button
                                onClick={handleOpenChat}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    width: '100%', padding: '12px 18px',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    fontSize: 14, fontWeight: 600, color: '#3b82f6',
                                    textAlign: 'left', fontFamily: "'DM Sans', sans-serif",
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                                Chat with us
                            </button>
                        </div>
                    )}

                    {/* Three-dots button — bottom-right, mobile only */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setNavOpen(p => !p); }}
                        aria-label="Menu"
                        style={{
                            width: 50, height: 50, borderRadius: '50%',
                            background: '#1c1c1c', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                            transition: 'transform 0.2s',
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                            <circle cx="12" cy="5" r="2.5" />
                            <circle cx="12" cy="12" r="2.5" />
                            <circle cx="12" cy="19" r="2.5" />
                        </svg>
                    </button>
                </div>
            )}
        </>
    );
}
