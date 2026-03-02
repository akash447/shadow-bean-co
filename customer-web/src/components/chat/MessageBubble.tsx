import type { ChatCard, ProductCardData, OrderSummaryData } from './types';
import ProductCard from './ProductCard';
import OrderSummary from './OrderSummary';

interface Props {
    role: 'user' | 'assistant';
    content: string;
    card?: ChatCard | null;
    onChipAction?: (action: string) => void;
}

function BotAvatar() {
    return (
        <div
            className="shrink-0 flex items-center justify-center"
            style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
            }}
        >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <circle cx="12" cy="5" r="4" />
                <circle cx="9" cy="16" r="1" fill="white" />
                <circle cx="15" cy="16" r="1" fill="white" />
            </svg>
        </div>
    );
}

function getTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function MessageBubble({ role, content, card, onChipAction }: Props) {
    const isUser = role === 'user';

    return (
        <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2.5 mx-2`}>
            {/* Avatar for bot only */}
            {!isUser && <BotAvatar />}

            <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`} style={{ maxWidth: '72%' }}>
                <div
                    style={{
                        fontFamily: "'DM Sans', sans-serif",
                        wordBreak: 'break-word',
                        fontSize: '14.5px',
                        lineHeight: '1.55',
                        padding: '12px 16px',
                        borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                        background: isUser
                            ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                            : '#ffffff',
                        color: isUser ? '#ffffff' : '#1e293b',
                        boxShadow: isUser
                            ? '0 2px 8px rgba(59,130,246,0.25)'
                            : '0 1px 4px rgba(0,0,0,0.06)',
                    }}
                >
                    {content}
                </div>

                {/* Timestamp */}
                <span
                    style={{
                        fontSize: '10px',
                        fontFamily: "'DM Sans', sans-serif",
                        color: '#94a3b8',
                        marginTop: 4,
                        paddingLeft: 6,
                        paddingRight: 6,
                    }}
                >
                    {getTimestamp()}
                </span>

                {card?.type === 'product' && (
                    <div className="mt-2" style={{ maxWidth: '100%' }}>
                        <ProductCard
                            data={card.data as ProductCardData}
                            onAddToCart={() => onChipAction?.('Add to cart')}
                        />
                    </div>
                )}

                {card?.type === 'summary' && (
                    <div className="mt-2" style={{ maxWidth: '100%' }}>
                        <OrderSummary data={card.data as OrderSummaryData} />
                    </div>
                )}
            </div>
        </div>
    );
}
