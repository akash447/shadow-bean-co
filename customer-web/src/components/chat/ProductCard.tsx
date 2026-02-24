import type { ProductCardData } from './types';

const PRODUCT_IMG = 'https://media.shadowbeanco.net/product_bag.png';

interface Props {
    data: ProductCardData;
    onAddToCart?: () => void;
}

export default function ProductCard({ data, onAddToCart }: Props) {
    return (
        <div className="mt-2 rounded-xl overflow-hidden border border-gray-200 bg-white max-w-[280px] shadow-sm">
            <img src={PRODUCT_IMG} alt="Custom Coffee Blend" className="w-full h-36 object-cover bg-amber-50" />
            <div className="p-3">
                <div className="text-xs font-bold tracking-wider text-amber-800 mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {data.name}
                </div>

                <div className="grid grid-cols-2 gap-1.5 mb-3">
                    <div className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        Bitterness <strong>{data.bitterness}/5</strong>
                    </div>
                    <div className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        Flavour <strong>{data.flavour}/5</strong>
                    </div>
                    <div className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        Roast <strong>{data.roast}</strong>
                    </div>
                    <div className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        Grind <strong>{data.grind}</strong>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-amber-800">₹{data.price}</span>
                    <span className="text-xs text-gray-400">250g bag</span>
                </div>

                {onAddToCart && (
                    <button
                        onClick={onAddToCart}
                        className="w-full py-2 text-xs font-semibold rounded-lg cursor-pointer bg-amber-800 text-white hover:bg-amber-900 transition-colors border-none"
                    >
                        Add to Cart
                    </button>
                )}
            </div>
        </div>
    );
}
