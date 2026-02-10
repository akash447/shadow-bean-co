import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCartStore } from '../stores/cartStore';
import { createOrder, ensureProfile } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useYeti } from '../components/YetiMascot';
import Yeti from '../components/Yeti';

interface ShippingAddress {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
}

const SHIPPING_STORAGE_KEY = 'shadow_bean_shipping_address';

export default function CheckoutPage() {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const { items, getTotal, clearCart } = useCartStore();
    const { setYetiState } = useYeti();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);

    const getSavedAddress = (): ShippingAddress => {
        const saved = localStorage.getItem(SHIPPING_STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch { /* ignore */ }
        }
        return { fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' };
    };

    const [address, setAddress] = useState<ShippingAddress>(getSavedAddress());

    useEffect(() => {
        localStorage.setItem(SHIPPING_STORAGE_KEY, JSON.stringify(address));
    }, [address]);

    useEffect(() => {
        setYetiState('idle');
        return () => setYetiState('idle');
    }, [setYetiState]);

    // Empty cart guard
    if (items.length === 0 && !orderSuccess) {
        return (
            <div className="min-h-[100dvh] bg-[#FAF8F5] flex flex-col items-center justify-center p-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                <Yeti state="sad" size="small" />
                <h2 className="text-xl font-bold text-[#1c0d02] mt-3 mb-1" style={{ fontFamily: "'Agdasima', sans-serif" }}>
                    Your cart is empty
                </h2>
                <p className="text-gray-500 text-sm mb-4">Nothing to check out yet.</p>
                <button
                    onClick={() => navigate('/shop')}
                    className="px-8 py-2.5 bg-[#4f5130] text-white rounded-xl font-semibold hover:bg-[#3a3c22] transition-colors"
                >
                    Go to Shop
                </button>
            </div>
        );
    }

    // Success state
    if (orderSuccess) {
        localStorage.removeItem(SHIPPING_STORAGE_KEY);
        return (
            <div className="min-h-[100dvh] bg-[#FAF8F5] flex flex-col items-center justify-center p-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="text-center"
                >
                    <Yeti state="happy" size="large" />

                    {/* Confetti-like particles */}
                    <div className="relative">
                        {[...Array(8)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-2 h-2 rounded-full"
                                style={{
                                    backgroundColor: ['#4f5130', '#d4a574', '#1c0d02', '#f5e6d3'][i % 4],
                                    left: '50%',
                                    top: 0,
                                }}
                                initial={{ x: 0, y: 0, opacity: 1 }}
                                animate={{
                                    x: (Math.random() - 0.5) * 200,
                                    y: Math.random() * -100 - 20,
                                    opacity: 0,
                                    scale: [1, 1.5, 0],
                                }}
                                transition={{ duration: 1.5, delay: 0.2 + i * 0.1, ease: 'easeOut' }}
                            />
                        ))}
                    </div>

                    <h2
                        className="text-2xl md:text-3xl font-bold text-[#1c0d02] mt-4 mb-1"
                        style={{ fontFamily: "'Agdasima', sans-serif" }}
                    >
                        Order Placed Successfully!
                    </h2>
                    <p className="text-gray-600 text-sm">
                        Order ID: <strong className="text-[#4f5130]">{orderId}</strong>
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                        We'll contact you at <strong>{address.phone}</strong> for delivery updates.
                    </p>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/')}
                        className="mt-6 px-8 py-2.5 bg-[#4f5130] text-white rounded-xl font-semibold hover:bg-[#3a3c22] transition-colors"
                    >
                        Back to Home
                    </motion.button>
                </motion.div>
            </div>
        );
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setAddress(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (loading) return;

        if (!user || !user.id || user.id.trim() === '') {
            navigate('/login?redirect=/checkout&message=login_required');
            return;
        }

        setIsSubmitting(true);
        setYetiState('watching');

        try {
            if (user.email) {
                await ensureProfile(user.id, user.email, user.fullName || '');
            }

            const orderData = {
                user_id: user.id,
                total_amount: getTotal(),
                razorpay_payment_id: 'COD-' + Date.now(),
                shipping_address: address,
                items: items.map(item => ({
                    taste_profile_id: item.profile.id && /^[0-9a-f-]{36}$/i.test(item.profile.id) ? item.profile.id : undefined,
                    taste_profile_name: item.profile.name,
                    quantity: item.quantity,
                    unit_price: 799,
                })),
            };

            const order = await createOrder(orderData);

            setOrderId(order?.id || 'N/A');
            setOrderSuccess(true);
            setYetiState('happy');
            clearCart();
        } catch (error) {
            console.error('Order failed:', error);
            setYetiState('sad');
            const errMessage = (error as any)?.response?.data?.error || (error as any)?.message || 'Unknown error';
            alert(`Failed to place order. Error: ${errMessage}`);
            setTimeout(() => setYetiState('idle'), 2000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f5130]/40 focus:border-[#4f5130] transition-shadow bg-white";
    const labelClass = "block text-xs font-semibold text-gray-500 uppercase mb-1";

    return (
        <div className="min-h-[100dvh] bg-[#FAF8F5]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            {/* Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-4">
                        <button
                            onClick={() => navigate('/cart')}
                            className="text-sm text-[#4f5130] hover:text-[#1c0d02] flex items-center gap-1 transition-colors"
                        >
                            <span>←</span> Cart
                        </button>
                        <h1
                            className="text-xl md:text-3xl font-bold text-[#1c0d02]"
                            style={{ fontFamily: "'Agdasima', sans-serif" }}
                        >
                            Checkout
                        </h1>
                    </div>
                    <div className="hidden md:block">
                        <Yeti state={isSubmitting ? 'watching' : 'idle'} size="small" />
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-4 md:py-8">
                <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                    {/* Shipping Address Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100"
                    >
                        <h2
                            className="text-base md:text-lg font-bold text-[#1c0d02] mb-3"
                            style={{ fontFamily: "'Agdasima', sans-serif" }}
                        >
                            Shipping Address
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-4">
                            <div>
                                <label className={labelClass}>Full Name *</label>
                                <input type="text" name="fullName" value={address.fullName} onChange={handleInputChange} required placeholder="Full Name" className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Phone *</label>
                                <input type="tel" name="phone" value={address.phone} onChange={handleInputChange} required pattern="[0-9]{10}" placeholder="10-digit number" className={inputClass} />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClass}>Address Line 1 *</label>
                                <input type="text" name="addressLine1" value={address.addressLine1} onChange={handleInputChange} required placeholder="House/Flat No., Street" className={inputClass} />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClass}>Address Line 2</label>
                                <input type="text" name="addressLine2" value={address.addressLine2} onChange={handleInputChange} placeholder="Landmark, Area (optional)" className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>City *</label>
                                <input type="text" name="city" value={address.city} onChange={handleInputChange} required placeholder="City" className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>State *</label>
                                <input type="text" name="state" value={address.state} onChange={handleInputChange} required placeholder="State" className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Pincode *</label>
                                <input type="text" name="pincode" value={address.pincode} onChange={handleInputChange} required pattern="[0-9]{6}" placeholder="6-digit pincode" className={inputClass} />
                            </div>
                        </div>
                    </motion.div>

                    {/* Order Summary Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100"
                    >
                        <h2
                            className="text-base md:text-lg font-bold text-[#1c0d02] mb-2"
                            style={{ fontFamily: "'Agdasima', sans-serif" }}
                        >
                            Order Summary
                        </h2>

                        <div className="space-y-2">
                            {items.map(item => (
                                <div key={item.profile.id} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-700">
                                        {item.profile.name} <span className="text-gray-400">x{item.quantity}</span>
                                    </span>
                                    <span className="font-semibold text-[#1c0d02]">₹{799 * item.quantity}</span>
                                </div>
                            ))}
                            <div className="border-t border-gray-100 pt-2">
                                <div className="flex justify-between text-base">
                                    <span className="font-bold text-[#1c0d02]">Total</span>
                                    <span className="font-bold text-[#1c0d02]">₹{getTotal()}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Payment Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100"
                    >
                        <h2
                            className="text-base md:text-lg font-bold text-[#1c0d02] mb-2"
                            style={{ fontFamily: "'Agdasima', sans-serif" }}
                        >
                            Payment Method
                        </h2>
                        <div className="flex items-center gap-3 bg-[#f7f3ed] rounded-xl px-3 py-2.5 border-2 border-[#4f5130]">
                            <div className="w-7 h-7 bg-[#4f5130] rounded-full flex items-center justify-center shrink-0">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-semibold text-[#1c0d02] text-sm">Cash on Delivery (COD)</p>
                                <p className="text-xs text-gray-500">Pay when your order arrives</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Place Order Button */}
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 md:py-4 bg-[#1c0d02] text-white rounded-xl font-bold text-sm md:text-base hover:bg-[#2a1a0a] transition-colors disabled:opacity-50 uppercase tracking-wider shadow-md"
                    >
                        {isSubmitting ? 'Placing Order...' : 'Place Order'}
                    </motion.button>
                </form>
            </div>
        </div>
    );
}
