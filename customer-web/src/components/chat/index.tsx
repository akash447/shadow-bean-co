import { useState, useEffect, useCallback } from 'react';
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

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [showPulse, setShowPulse] = useState(true);
    const isMobile = useIsMobile();

    useEffect(() => {
        const timer = setTimeout(() => setShowPulse(false), 5000);
        return () => clearTimeout(timer);
    }, []);

    const handleOpen = useCallback(() => { setIsOpen(true); setShowPulse(false); }, []);
    const handleClose = useCallback(() => setIsOpen(false), []);

    return (
        <>
            <style>{`
                @keyframes chatPulse {
                    0% { box-shadow: 0 0 0 0 rgba(0,0,0,0.25); }
                    70% { box-shadow: 0 0 0 14px rgba(0,0,0,0); }
                    100% { box-shadow: 0 0 0 0 rgba(0,0,0,0); }
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
            `}</style>

            {isOpen && <ChatPanel isMobile={isMobile} onClose={handleClose} onMinimize={handleClose} />}

            {!isOpen && (
                <button
                    onClick={handleOpen}
                    aria-label="Open chat"
                    className="fixed z-[10001] flex items-center justify-center cursor-pointer border-none transition-transform duration-200 hover:scale-110"
                    style={{
                        bottom: 20, right: 20,
                        width: 56, height: 56,
                        borderRadius: '50%',
                        background: '#1c1c1c',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                        animation: showPulse ? 'chatPulse 2s infinite' : 'none',
                    }}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="10" rx="2" />
                        <circle cx="12" cy="5" r="4" />
                        <circle cx="9" cy="16" r="1" fill="white" />
                        <circle cx="15" cy="16" r="1" fill="white" />
                    </svg>
                </button>
            )}
        </>
    );
}
