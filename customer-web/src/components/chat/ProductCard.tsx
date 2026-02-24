import type { ProductCardData } from './types';

interface Props {
    data: ProductCardData;
    onAddToCart?: () => void;
    onTellMore?: () => void;
    onShowAnother?: () => void;
}

export default function ProductCard({ data, onAddToCart, onTellMore, onShowAnother }: Props) {
    return (
        <div
            className="rounded-xl overflow-hidden mt-2 max-w-[300px]"
            style={{
                background: 'linear-gradient(135deg, rgba(201,123,42,0.15), rgba(160,90,16,0.1))',
                border: '1px solid rgba(232,169,74,0.2)',
            }}
        >
            <div className="p-4">
                <h4
                    className="text-base font-semibold mb-1"
                    style={{ fontFamily: "'Playfair Display', serif", color: '#E8A94A' }}
                >
                    {data.name}
                </h4>
                <p className="text-xs mb-3" style={{ color: 'rgba(245,240,232,0.7)', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
                    {data.description}
                </p>

                <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(232,169,74,0.15)', color: '#E8A94A' }}>
                        {data.tastingNotes}
                    </span>
                </div>

                {data.roast && (
                    <div className="flex gap-3 mb-3 text-xs" style={{ color: 'rgba(245,240,232,0.6)' }}>
                        <span>Roast: <strong style={{ color: '#F5F0E8' }}>{data.roast}</strong></span>
                        {data.grind && <span>Grind: <strong style={{ color: '#F5F0E8' }}>{data.grind}</strong></span>}
                    </div>
                )}

                <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold" style={{ color: '#E8A94A' }}>
                        ₹{data.price}
                    </span>
                    <span className="text-xs" style={{ color: 'rgba(245,240,232,0.5)' }}>250g bag</span>
                </div>

                {data.reason && (
                    <p className="text-xs italic mb-3" style={{ color: 'rgba(245,240,232,0.6)', fontFamily: "'DM Sans', sans-serif" }}>
                        "{data.reason}"
                    </p>
                )}

                <div className="flex gap-2">
                    {onAddToCart && (
                        <button
                            onClick={onAddToCart}
                            className="flex-1 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-opacity hover:opacity-90"
                            style={{
                                background: 'linear-gradient(135deg, #C97B2A, #A05A10)',
                                color: '#F5F0E8',
                                border: 'none',
                            }}
                        >
                            Add to Cart
                        </button>
                    )}
                    {onTellMore && (
                        <button
                            onClick={onTellMore}
                            className="py-2 px-3 text-xs rounded-lg cursor-pointer transition-opacity hover:opacity-80"
                            style={{
                                background: 'transparent',
                                color: '#E8A94A',
                                border: '1px solid rgba(232,169,74,0.3)',
                            }}
                        >
                            Tell me more
                        </button>
                    )}
                    {onShowAnother && (
                        <button
                            onClick={onShowAnother}
                            className="py-2 px-3 text-xs rounded-lg cursor-pointer transition-opacity hover:opacity-80"
                            style={{
                                background: 'transparent',
                                color: '#E8A94A',
                                border: '1px solid rgba(232,169,74,0.3)',
                            }}
                        >
                            Another
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
