import type { OrderConfirmedData } from './types';

interface Props {
    data: OrderConfirmedData;
    onViewOrder?: () => void;
}

export default function OrderConfirmed({ data, onViewOrder }: Props) {
    return (
        <div
            className="rounded-xl overflow-hidden mt-2 max-w-[300px] text-center"
            style={{
                background: 'linear-gradient(135deg, rgba(74,222,128,0.1), rgba(34,197,94,0.05))',
                border: '1px solid rgba(74,222,128,0.2)',
            }}
        >
            <div className="p-5">
                <div className="text-3xl mb-2">&#10003;</div>
                <h4
                    className="text-base font-semibold mb-1"
                    style={{ fontFamily: "'Playfair Display', serif", color: '#4ade80' }}
                >
                    Order Confirmed!
                </h4>
                <p className="text-xs mb-1" style={{ color: 'rgba(245,240,232,0.6)' }}>
                    Order ID
                </p>
                <p className="text-sm font-bold mb-2" style={{ color: '#F5F0E8' }}>
                    {data.orderId}
                </p>
                <p className="text-sm font-semibold" style={{ color: '#E8A94A' }}>
                    Total: ₹{data.total}
                </p>

                {onViewOrder && (
                    <button
                        onClick={onViewOrder}
                        className="mt-3 px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-opacity hover:opacity-90"
                        style={{
                            background: 'rgba(245,240,232,0.1)',
                            color: '#F5F0E8',
                            border: '1px solid rgba(245,240,232,0.15)',
                        }}
                    >
                        View Order
                    </button>
                )}
            </div>
        </div>
    );
}
