import { useState, useEffect } from 'react';
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

/**
 * ChatWidget no longer shows any floating buttons.
 * It only listens for a custom 'open-chat' event (dispatched from the Header's hamburger menu)
 * and renders the ChatPanel when open.
 */
export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const isMobile = useIsMobile();

    useEffect(() => {
        const handler = () => setIsOpen(true);
        window.addEventListener('open-chat', handler);
        return () => window.removeEventListener('open-chat', handler);
    }, []);

    if (!isOpen) return null;

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
            `}</style>
            <ChatPanel isMobile={isMobile} onClose={() => setIsOpen(false)} onMinimize={() => setIsOpen(false)} />
        </>
    );
}
