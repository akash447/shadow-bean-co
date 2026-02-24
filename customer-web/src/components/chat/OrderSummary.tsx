import type { OrderSummaryData } from './types';

interface Props {
    data: OrderSummaryData;
}

export default function OrderSummary({ data }: Props) {
    return (
        <div className="mt-2 rounded-xl overflow-hidden border border-green-200 bg-green-50 max-w-[280px]">
            <div className="p-3">
                <h4 className="text-sm font-semibold text-green-800 mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    Added to Cart
                </h4>

                {data.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center mb-1 text-xs text-gray-700">
                        <span>{item.name} x{item.qty}</span>
                        <span>₹{item.price * item.qty}</span>
                    </div>
                ))}

                {data.discount > 0 && (
                    <div className="flex justify-between items-center mb-1 text-xs text-green-600">
                        <span>Discount</span>
                        <span>-₹{data.discount}</span>
                    </div>
                )}

                <div className="flex justify-between items-center pt-2 mt-1 text-sm font-bold text-gray-900 border-t border-green-200">
                    <span>Total</span>
                    <span>₹{data.total}</span>
                </div>

                <div className="text-xs mt-1 text-gray-500">Grind: {data.grind}</div>
            </div>
        </div>
    );
}
