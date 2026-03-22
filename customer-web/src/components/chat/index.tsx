import { useState, useEffect } from 'react';
import ChatPanel from './ChatPanel';
import botMascot from '../../assets/icons/bot_mascot.webp';

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);
    return isMobile;
}

/**
 * ChatWidget:
 * - Desktop: Sticky bot mascot button (bottom-right) always visible
 * - Mobile: No floating button — bot is accessed from hamburger menu via custom event
 */
export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const isMobile = useIsMobile();

    // Listen for 'open-chat' event from mobile hamburger menu
    useEffect(() => {
        const handler = () => setIsOpen(true);
        window.addEventListener('open-chat', handler);
        return () => window.removeEventListener('open-chat', handler);
    }, []);

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
                @keyframes botBounceIn {
                    0% { transform: scale(0); opacity: 0; }
                    50% { transform: scale(1.15); }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>

            {isOpen && <ChatPanel isMobile={isMobile} onClose={() => setIsOpen(false)} onMinimize={() => setIsOpen(false)} />}

            {/* Desktop: Sticky bot mascot button — bottom-right */}
            {!isOpen && !isMobile && (
                <button
                    onClick={() => setIsOpen(true)}
                    aria-label="Open chat"
                    style={{
                        position: 'fixed',
                        bottom: 20,
                        right: 20,
                        zIndex: 10001,
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        border: 'none',
                        cursor: 'pointer',
                        background: 'transparent',
                        padding: 0,
                        transition: 'transform 0.2s',
                        animation: 'botBounceIn 0.5s ease-out',
                        filter: 'drop-shadow(0 4px 12px rgba(59,130,246,0.35))',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                    <img
                        src={botMascot}
                        alt="Chat with us"
                        style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }}
                    />
                </button>
            )}
        </>
    );
}
