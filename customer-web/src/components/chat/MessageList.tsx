import { useEffect, useRef } from 'react';
import type { ChatMessage } from './types';
import MessageBubble from './MessageBubble';
import QuickChips from './QuickChips';
import TypingIndicator from './TypingIndicator';

interface Props {
    messages: ChatMessage[];
    isTyping: boolean;
    onChipSelect: (chip: string) => void;
    onNavigate: (path: string) => void;
}

export default function MessageList({ messages, isTyping, onChipSelect }: Props) {
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const lastBotIdx = [...messages].reverse().findIndex(m => m.role === 'assistant');
    const lastBotMsgIdx = lastBotIdx >= 0 ? messages.length - 1 - lastBotIdx : -1;

    return (
        <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-4">
            {messages.map((msg, i) => (
                <div key={i} className="flex flex-col gap-2">
                    <MessageBubble
                        role={msg.role}
                        content={msg.content}
                        card={msg.card}
                        onChipAction={onChipSelect}
                    />
                    {i === lastBotMsgIdx && msg.chips && msg.chips.length > 0 && !isTyping && (
                        <div className="mx-3">
                            <QuickChips chips={msg.chips} onSelect={onChipSelect} />
                        </div>
                    )}
                </div>
            ))}
            {isTyping && <div className="mx-2"><TypingIndicator /></div>}
            <div ref={endRef} />
        </div>
    );
}
