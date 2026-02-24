import type { ChatCard, ProductCardData, OrderSummaryData, OrderConfirmedData } from './types';
import ProductCard from './ProductCard';
import OrderSummary from './OrderSummary';
import OrderConfirmed from './OrderConfirmed';

interface Props {
    role: 'user' | 'assistant';
    content: string;
    card?: ChatCard | null;
    onChipAction?: (action: string) => void;
    onNavigate?: (path: string) => void;
}

export default function MessageBubble({ role, content, card, onChipAction, onNavigate }: Props) {
    const isUser = role === 'user';

    return (
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            <div
                className={`max-w-[82%] px-4 py-2.5 text-sm leading-relaxed ${isUser ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm'}`}
                style={{
                    fontFamily: "'DM Sans', sans-serif",
                    color: '#F5F0E8',
                    ...(isUser
                        ? { background: 'linear-gradient(135deg, #C97B2A, #A05A10)' }
                        : { background: 'rgba(245,240,232,0.08)', border: '1px solid rgba(245,240,232,0.1)' }
                    ),
                    wordBreak: 'break-word',
                }}
            >
                {content}
            </div>

            {card && card.type === 'product' && (
                <ProductCard
                    data={card.data as ProductCardData}
                    onAddToCart={() => onChipAction?.('Add to cart')}
                    onTellMore={() => onChipAction?.('Tell me more')}
                    onShowAnother={() => onChipAction?.('Show another')}
                />
            )}

            {card && card.type === 'summary' && (
                <OrderSummary
                    data={card.data as OrderSummaryData}
                    onCheckout={() => onNavigate?.('/checkout')}
                />
            )}

            {card && card.type === 'confirmed' && (
                <OrderConfirmed
                    data={card.data as OrderConfirmedData}
                    onViewOrder={() => onNavigate?.('/profile')}
                />
            )}
        </div>
    );
}
