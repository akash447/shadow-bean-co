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
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} mx-2`}>
            <div
                className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${isUser ? 'rounded-2xl rounded-br-sm bg-gray-800 text-white' : 'rounded-2xl rounded-bl-sm bg-white text-gray-800 shadow-sm'}`}
                style={{ fontFamily: "'DM Sans', sans-serif", wordBreak: 'break-word' }}
            >
                {content}
            </div>

            {card?.type === 'product' && (
                <div className="mx-1 mt-2">
                    <ProductCard
                        data={card.data as ProductCardData}
                        onAddToCart={() => onChipAction?.('Add to cart')}
                    />
                </div>
            )}

            {card?.type === 'summary' && (
                <div className="mx-1 mt-2">
                    <OrderSummary data={card.data as OrderSummaryData} />
                </div>
            )}
        </div>
    );
}
