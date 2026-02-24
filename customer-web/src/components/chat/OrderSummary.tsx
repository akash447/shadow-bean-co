import type { OrderSummaryData } from './types';

interface Props {
    data: OrderSummaryData;
    onCheckout?: () => void;
}

export default function OrderSummary({ data, onCheckout }: Props) {
    return (
        <div
            className="rounded-xl overflow-hidden mt-2 max-w-[300px]"
            style={{
                background: 'rgba(245,240,232,0.06)',
                border: '1px solid rgba(245,240,232,0.12)',
            }}
        >
            <div className="p-4">
                <h4
                    className="text-sm font-semibold mb-3"
                    style={{ fontFamily: "'Playfair Display', serif", color: '#E8A94A' }}
                >
                    Order Summary
                </h4>

                {data.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center mb-2 text-xs" style={{ color: '#F5F0E8' }}>
                        <span>{item.name} x{item.qty}</span>
                        <span>₹{item.price * item.qty}</span>
                    </div>
                ))}

                {data.discount > 0 && (
                    <div className="flex justify-between items-center mb-2 text-xs" style={{ color: '#4ade80' }}>
                        <span>Discount</span>
                        <span>-₹{data.discount}</span>
                    </div>
                )}

                <div
                    className="flex justify-between items-center pt-2 mt-2 text-sm font-bold"
                    style={{ borderTop: '1px solid rgba(245,240,232,0.1)', color: '#E8A94A' }}
                >
                    <span>Total</span>
                    <span>₹{data.total}</span>
                </div>

                <div className="text-xs mt-2" style={{ color: 'rgba(245,240,232,0.5)' }}>
                    Grind: {data.grind}
                </div>

                {onCheckout && (
                    <button
                        onClick={onCheckout}
                        className="w-full mt-3 py-2.5 text-xs font-semibold rounded-lg cursor-pointer transition-opacity hover:opacity-90"
                        style={{
                            background: 'linear-gradient(135deg, #C97B2A, #A05A10)',
                            color: '#F5F0E8',
                            border: 'none',
                        }}
                    >
                        Proceed to Checkout
                    </button>
                )}
            </div>
        </div>
    );
}
