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

    const handleOpen = useCallback(() => {
        setIsOpen(true);
        setShowPulse(false);
    }, []);

    const handleClose = useCallback(() => setIsOpen(false), []);

    return (
        <>
            {/* CSS animations */}
            <style>{`
                @keyframes chatPulse {
                    0% { box-shadow: 0 0 0 0 rgba(201,123,42,0.5); }
                    70% { box-shadow: 0 0 0 18px rgba(201,123,42,0); }
                    100% { box-shadow: 0 0 0 0 rgba(201,123,42,0); }
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

            {/* Chat panel */}
            {isOpen && (
                <ChatPanel
                    isMobile={isMobile}
                    onClose={handleClose}
                    onMinimize={handleClose}
                />
            )}

            {/* Floating button */}
            {!isOpen && (
                <button
                    onClick={handleOpen}
                    aria-label="Open chat"
                    className="fixed z-[10001] flex items-center justify-center cursor-pointer border-none transition-transform duration-200 hover:scale-110"
                    style={{
                        bottom: 20,
                        right: 20,
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #C97B2A, #A05A10)',
                        boxShadow: '0 4px 16px rgba(201,123,42,0.35)',
                        fontSize: 28,
                        animation: showPulse ? 'chatPulse 2s infinite' : 'none',
                    }}
                >
                    <span role="img" aria-label="chat">&#9749;</span>
                </button>
            )}
        </>
    );
}
