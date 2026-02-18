import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCartStore } from '../stores/cartStore';
import { createOrder, ensureProfile } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

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

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    border: '1.5px solid #E0D9CF',
    borderRadius: 10,
    fontSize: 14,
    color: '#1c0d02',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color .15s',
    fontFamily: "'Montserrat', sans-serif",
};

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 5,
};

export default function CheckoutPage() {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const { items, getTotal, clearCart } = useCartStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const getSavedAddress = (): ShippingAddress => {
        const saved = localStorage.getItem(SHIPPING_STORAGE_KEY);
        if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
        return { fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' };
    };

    const [address, setAddress] = useState<ShippingAddress>(getSavedAddress());

    useEffect(() => {
        localStorage.setItem(SHIPPING_STORAGE_KEY, JSON.stringify(address));
    }, [address]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setAddress(prev => ({ ...prev, [name]: value }));
    };

    const getInputStyle = (name: string): React.CSSProperties => ({
        ...inputStyle,
        borderColor: focusedField === name ? '#4f5130' : '#E0D9CF',
        boxShadow: focusedField === name ? '0 0 0 3px rgba(79,81,48,0.1)' : 'none',
    });

    // ── Empty cart ──
    if (items.length === 0 && !orderSuccess) {
        return (
            <div style={{ minHeight: '100dvh', background: '#F7F4F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Montserrat', sans-serif" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
                <h2 style={{ fontFamily: "'Agdasima', sans-serif", fontSize: 26, color: '#1c0d02', margin: '0 0 8px' }}>Nothing to check out</h2>
                <p style={{ color: '#888', fontSize: 14, marginBottom: 28 }}>Add items to your cart first.</p>
                <button onClick={() => navigate('/shop')} style={{ padding: '12px 32px', background: '#4f5130', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                    Go to Shop
                </button>
            </div>
        );
    }

    // ── Success ──
    if (orderSuccess) {
        localStorage.removeItem(SHIPPING_STORAGE_KEY);
        return (
            <div style={{ minHeight: '100dvh', background: '#F7F4F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Montserrat', sans-serif" }}>
                <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                    style={{ textAlign: 'center', maxWidth: 400 }}
                >
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #4f5130, #3a3c22)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 32px rgba(79,81,48,0.35)' }}>
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <h2 style={{ fontFamily: "'Agdasima', sans-serif", fontSize: 30, color: '#1c0d02', margin: '0 0 8px' }}>Order Placed!</h2>
                    <p style={{ color: '#666', fontSize: 14, marginBottom: 4 }}>
                        Order ID: <strong style={{ color: '#4f5130' }}>{orderId}</strong>
                    </p>
                    <p style={{ color: '#999', fontSize: 13, marginBottom: 32 }}>
                        We'll contact you at <strong>{address.phone}</strong> for delivery updates.
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/')}
                        style={{ padding: '13px 36px', background: 'linear-gradient(135deg, #4f5130, #3a3c22)', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 16px rgba(79,81,48,0.3)' }}
                    >
                        Back to Home
                    </motion.button>
                </motion.div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (loading) return;
        if (!user || !user.id || user.id.trim() === '') {
            navigate('/login?redirect=/checkout&message=login_required');
            return;
        }
        setIsSubmitting(true);
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
            clearCart();
        } catch (err) {
            console.error('Order failed:', err);
            const errMessage = (err as any)?.response?.data?.error
                || (err as any)?.response?.data?.message
                || (err as any)?.message
                || 'Unknown error';
            setError(`Failed to place order: ${errMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ minHeight: '100dvh', background: '#F7F4F0', fontFamily: "'Montserrat', sans-serif" }}>

            {/* ── Header ── */}
            <div style={{ background: '#fff', borderBottom: '1px solid #EDE8E1', position: 'sticky', top: 0, zIndex: 10 }}>
                <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button
                        onClick={() => navigate('/cart')}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4f5130', fontWeight: 600, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 8 }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
                        Cart
                    </button>
                    <div style={{ width: 1, height: 20, background: '#E0D9CF' }} />
                    <h1 style={{ fontFamily: "'Agdasima', sans-serif", fontSize: 22, fontWeight: 700, color: '#1c0d02', margin: 0 }}>Checkout</h1>

                    {/* Step indicator */}
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                        <span style={{ color: '#4f5130', fontWeight: 700 }}>1. Details</span>
                        <span style={{ color: '#ccc' }}>→</span>
                        <span style={{ color: '#bbb' }}>2. Confirm</span>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }} className="checkout-grid">

                        {/* ── Left: Form ── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                            {/* Shipping Address */}
                            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                style={{ background: '#fff', borderRadius: 20, border: '1px solid #EDE8E1', padding: '24px 24px' }}>
                                <h2 style={{ fontFamily: "'Agdasima', sans-serif", fontSize: 18, fontWeight: 700, color: '#1c0d02', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#4f5130', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>1</span>
                                    Shipping Address
                                </h2>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    <div>
                                        <label style={labelStyle}>Full Name *</label>
                                        <input name="fullName" value={address.fullName} onChange={handleInputChange} required placeholder="Your full name"
                                            style={getInputStyle('fullName')} onFocus={() => setFocusedField('fullName')} onBlur={() => setFocusedField(null)} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Phone *</label>
                                        <input name="phone" type="tel" value={address.phone} onChange={handleInputChange} required pattern="[0-9]{10}" placeholder="10-digit number"
                                            style={getInputStyle('phone')} onFocus={() => setFocusedField('phone')} onBlur={() => setFocusedField(null)} />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={labelStyle}>Address Line 1 *</label>
                                        <input name="addressLine1" value={address.addressLine1} onChange={handleInputChange} required placeholder="House/Flat No., Street"
                                            style={getInputStyle('addressLine1')} onFocus={() => setFocusedField('addressLine1')} onBlur={() => setFocusedField(null)} />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={labelStyle}>Address Line 2 <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                                        <input name="addressLine2" value={address.addressLine2} onChange={handleInputChange} placeholder="Landmark, Area"
                                            style={getInputStyle('addressLine2')} onFocus={() => setFocusedField('addressLine2')} onBlur={() => setFocusedField(null)} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>City *</label>
                                        <input name="city" value={address.city} onChange={handleInputChange} required placeholder="City"
                                            style={getInputStyle('city')} onFocus={() => setFocusedField('city')} onBlur={() => setFocusedField(null)} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>State *</label>
                                        <input name="state" value={address.state} onChange={handleInputChange} required placeholder="State"
                                            style={getInputStyle('state')} onFocus={() => setFocusedField('state')} onBlur={() => setFocusedField(null)} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Pincode *</label>
                                        <input name="pincode" value={address.pincode} onChange={handleInputChange} required pattern="[0-9]{6}" placeholder="6-digit pincode"
                                            style={getInputStyle('pincode')} onFocus={() => setFocusedField('pincode')} onBlur={() => setFocusedField(null)} />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Payment */}
                            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                style={{ background: '#fff', borderRadius: 20, border: '1px solid #EDE8E1', padding: '24px 24px' }}>
                                <h2 style={{ fontFamily: "'Agdasima', sans-serif", fontSize: 18, fontWeight: 700, color: '#1c0d02', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#4f5130', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>2</span>
                                    Payment Method
                                </h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#f7f3ed', border: '2px solid #4f5130', borderRadius: 14, padding: '14px 18px' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#4f5130', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: '#1c0d02' }}>Cash on Delivery (COD)</div>
                                        <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Pay when your order arrives at your door</div>
                                    </div>
                                    <div style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', background: '#4f5130', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Error */}
                            {error && (
                                <div style={{ background: '#fff5f5', border: '1.5px solid #fca5a5', borderRadius: 12, padding: '12px 16px', color: '#dc2626', fontSize: 13, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* ── Right: Order Summary ── */}
                        <div style={{ position: 'sticky', top: 76 }}>
                            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                                style={{ background: '#fff', borderRadius: 20, border: '1px solid #EDE8E1', padding: '24px 22px' }}>
                                <h2 style={{ fontFamily: "'Agdasima', sans-serif", fontSize: 18, fontWeight: 700, color: '#1c0d02', margin: '0 0 16px' }}>Order Summary</h2>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                                    {items.map(item => (
                                        <div key={item.profile.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                            <span style={{ color: '#666', flex: 1, marginRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {item.profile.name} <span style={{ color: '#aaa' }}>×{item.quantity}</span>
                                            </span>
                                            <span style={{ fontWeight: 600, color: '#1c0d02', flexShrink: 0 }}>₹{799 * item.quantity}</span>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ borderTop: '1px solid #EDE8E1', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#888' }}>
                                        <span>Shipping</span>
                                        <span style={{ color: '#4f5130', fontWeight: 700 }}>FREE</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 800, color: '#1c0d02' }}>
                                        <span>Total</span>
                                        <span>₹{getTotal()}</span>
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                    type="submit"
                                    disabled={isSubmitting}
                                    style={{
                                        width: '100%', marginTop: 20, padding: '14px 0',
                                        background: isSubmitting ? '#999' : 'linear-gradient(135deg, #1c0d02, #3a1a08)',
                                        color: '#fff', border: 'none', borderRadius: 14,
                                        fontWeight: 800, fontSize: 14, cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                        letterSpacing: '0.07em', textTransform: 'uppercase',
                                        boxShadow: isSubmitting ? 'none' : '0 4px 16px rgba(28,13,2,0.3)',
                                        transition: 'background .2s',
                                    }}
                                >
                                    {isSubmitting ? '⏳ Placing Order...' : 'Place Order →'}
                                </motion.button>

                                <p style={{ textAlign: 'center', fontSize: 11, color: '#bbb', marginTop: 12 }}>
                                    🔒 Secure & encrypted checkout
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </form>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .checkout-grid { grid-template-columns: 1fr !important; }
                }
                input:focus { outline: none; }
            `}</style>
        </div>
    );
}
