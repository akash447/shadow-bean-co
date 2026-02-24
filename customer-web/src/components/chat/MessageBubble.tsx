import type { ChatCard, ProductCardData, OrderSummaryData } from './types';
import ProductCard from './ProductCard';
import OrderSummary from './OrderSummary';

interface Props {
    role: 'user' | 'assistant';
    content: string;
    card?: ChatCard | null;
    onChipAction?: (action: string) => void;
}

export default function MessageBubble({ role, content, card, onChipAction }: Props) {
    const isUser = role === 'user';

    return (
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            <div
                className={`max-w-[80%] px-3.5 py-2.5 text-sm leading-relaxed ${isUser ? 'rounded-2xl rounded-br-sm bg-gray-800 text-white' : 'rounded-2xl rounded-bl-sm bg-gray-100 text-gray-800'}`}
                style={{ fontFamily: "'DM Sans', sans-serif", wordBreak: 'break-word' }}
            >
                {content}
            </div>

            {card?.type === 'product' && (
                <ProductCard
                    data={card.data as ProductCardData}
                    onAddToCart={() => onChipAction?.('Add to cart')}
                />
            )}

            {card?.type === 'summary' && (
                <OrderSummary data={card.data as OrderSummaryData} />
            )}
        </div>
    );
}
