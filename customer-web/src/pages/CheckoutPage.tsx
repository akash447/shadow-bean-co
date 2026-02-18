import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCartStore } from '../stores/cartStore';
import { createOrder, ensureProfile } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

/* ───────── colours ───────── */
const BG = '#FAF8F5';
const CARD = '#ffffff';
const BORDER = '#e0d6cc';
const OLIVE = '#4f5130';
const DARK = '#1c0d02';
const MUTED = '#98918a';
const INPUT_BG = '#faf7f3';

interface ShippingAddress {
    fullName: string; phone: string;
    addressLine1: string; addressLine2: string;
    city: string; state: string; pincode: string;
}

const STORAGE_KEY = 'shadow_bean_shipping_address';

export default function CheckoutPage() {
    const nav = useNavigate();
    const { user, loading } = useAuth();
    const { items, getTotal, clearCart } = useCartStore();
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [ordId, setOrdId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [focus, setFocus] = useState<string | null>(null);

    const init = (): ShippingAddress => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || ''); } catch { return { fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' }; }
    };

    const [addr, setAddr] = useState<ShippingAddress>(init);
    useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(addr)); }, [addr]);

    const set = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAddr(p => ({ ...p, [e.target.name]: e.target.value }));
    };

    const inp = (name: string): React.CSSProperties => ({
        width: '100%', padding: '13px 16px',
        border: `1.5px solid ${focus === name ? OLIVE : BORDER}`,
        borderRadius: 12, fontSize: 14, color: DARK,
        background: INPUT_BG, outline: 'none',
        boxSizing: 'border-box' as const,
        boxShadow: focus === name ? `0 0 0 3px rgba(79,81,48,0.12)` : 'none',
        transition: 'border-color .15s, box-shadow .15s',
        fontFamily: "'Montserrat', sans-serif",
    });

    const lbl: React.CSSProperties = {
        display: 'block', fontSize: 12, fontWeight: 700,
        color: MUTED, textTransform: 'uppercase',
        letterSpacing: '0.05em', marginBottom: 6,
    };

    /* ── Empty ── */
    if (items.length === 0 && !success) {
        return (
            <div style={{ minHeight: '100dvh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Montserrat', sans-serif", padding: 24 }}>
                <div style={{ width: 80, height: 80, borderRadius: 20, background: '#f5efe8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, marginBottom: 20 }}>🛒</div>
                <h2 style={{ fontFamily: "'Agdasima', sans-serif", fontSize: 26, color: DARK, margin: '0 0 8px' }}>Nothing to check out</h2>
                <p style={{ color: MUTED, fontSize: 14, marginBottom: 28 }}>Add items to your cart first.</p>
                <button onClick={() => nav('/shop')} style={{ padding: '14px 36px', background: OLIVE, color: '#fff', border: 'none', borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Go to Shop</button>
            </div>
        );
    }

    /* ── Success ── */
    if (success) {
        localStorage.removeItem(STORAGE_KEY);
        return (
            <div style={{ minHeight: '100dvh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Montserrat', sans-serif", padding: 24 }}>
                <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 16 }} style={{ textAlign: 'center', maxWidth: 440 }}>
                    <div style={{ width: 90, height: 90, borderRadius: '50%', background: `linear-gradient(135deg, ${OLIVE}, #3a3c22)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 8px 32px rgba(79,81,48,0.3)' }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <h2 style={{ fontFamily: "'Agdasima', sans-serif", fontSize: 30, color: DARK, margin: '0 0 8px' }}>Order Placed Successfully!</h2>
                    <p style={{ color: '#666', fontSize: 14 }}>Order ID: <strong style={{ color: OLIVE }}>{ordId}</strong></p>
                    <p style={{ color: MUTED, fontSize: 13, marginTop: 4, marginBottom: 32 }}>We'll contact you at <strong>{addr.phone}</strong> for delivery updates.</p>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => nav('/')}
                        style={{ padding: '14px 40px', background: `linear-gradient(135deg, ${OLIVE}, #3a3c22)`, color: '#fff', border: 'none', borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 16px rgba(79,81,48,0.3)' }}
                    >Back to Home</motion.button>
                </motion.div>
            </div>
        );
    }

    /* ── Submit ── */
    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (loading) return;
        if (!user || !user.id?.trim()) { nav('/login?redirect=/checkout&message=login_required'); return; }
        setSubmitting(true);
        try {
            if (user.email) await ensureProfile(user.id, user.email, user.fullName || '');
            const order = await createOrder({
                user_id: user.id, total_amount: getTotal(),
                razorpay_payment_id: 'COD-' + Date.now(),
                shipping_address: addr,
                items: items.map(it => ({
                    taste_profile_id: it.profile.id && /^[0-9a-f-]{36}$/i.test(it.profile.id) ? it.profile.id : undefined,
                    taste_profile_name: it.profile.name, quantity: it.quantity, unit_price: 799,
                })),
            });
            setOrdId(order?.id || 'N/A');
            setSuccess(true);
            clearCart();
        } catch (err: any) {
            setError(err?.response?.data?.error || err?.message || 'Something went wrong');
        } finally { setSubmitting(false); }
    };

    return (
        <div style={{ minHeight: '100dvh', background: BG, fontFamily: "'Montserrat', sans-serif" }}>
            {/* Header */}
            <header style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, position: 'sticky', top: 0, zIndex: 20 }}>
                <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={() => nav('/cart')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: OLIVE, fontWeight: 600, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer' }}>← Cart</button>
                    <div style={{ width: 1, height: 22, background: BORDER }} />
                    <h1 style={{ fontFamily: "'Agdasima', sans-serif", fontSize: 24, fontWeight: 700, color: DARK, margin: 0 }}>Checkout</h1>
                </div>
            </header>

            <div style={{ maxWidth: 960, margin: '0 auto', padding: '36px 24px 80px' }}>
                <form onSubmit={submit}>
                    <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>

                        {/* ─── Left: Form ─── */}
                        <div style={{ flex: '1 1 500px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>

                            {/* Shipping */}
                            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                style={{ background: CARD, borderRadius: 20, border: `1.5px solid ${BORDER}`, padding: '28px 28px', boxShadow: '0 2px 12px rgba(28,13,2,0.05)' }}>
                                <h2 style={{ fontFamily: "'Agdasima', sans-serif", fontSize: 20, fontWeight: 700, color: DARK, margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ width: 30, height: 30, borderRadius: '50%', background: OLIVE, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>1</span>
                                    Shipping Address
                                </h2>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div>
                                        <label style={lbl}>Full Name *</label>
                                        <input name="fullName" value={addr.fullName} onChange={set} required placeholder="Your full name"
                                            style={inp('fullName')} onFocus={() => setFocus('fullName')} onBlur={() => setFocus(null)} />
                                    </div>
                                    <div>
                                        <label style={lbl}>Phone *</label>
                                        <input name="phone" type="tel" value={addr.phone} onChange={set} required pattern="[0-9]{10}" placeholder="10-digit number"
                                            style={inp('phone')} onFocus={() => setFocus('phone')} onBlur={() => setFocus(null)} />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={lbl}>Address Line 1 *</label>
                                        <input name="addressLine1" value={addr.addressLine1} onChange={set} required placeholder="House/Flat No., Street"
                                            style={inp('addressLine1')} onFocus={() => setFocus('addressLine1')} onBlur={() => setFocus(null)} />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={lbl}>Address Line 2 <span style={{ fontWeight: 400, textTransform: 'none' as const, letterSpacing: 0 }}>(optional)</span></label>
                                        <input name="addressLine2" value={addr.addressLine2} onChange={set} placeholder="Landmark, Area"
                                            style={inp('addressLine2')} onFocus={() => setFocus('addressLine2')} onBlur={() => setFocus(null)} />
                                    </div>
                                    <div>
                                        <label style={lbl}>City *</label>
                                        <input name="city" value={addr.city} onChange={set} required placeholder="City"
                                            style={inp('city')} onFocus={() => setFocus('city')} onBlur={() => setFocus(null)} />
                                    </div>
                                    <div>
                                        <label style={lbl}>State *</label>
                                        <input name="state" value={addr.state} onChange={set} required placeholder="State"
                                            style={inp('state')} onFocus={() => setFocus('state')} onBlur={() => setFocus(null)} />
                                    </div>
                                    <div>
                                        <label style={lbl}>Pincode *</label>
                                        <input name="pincode" value={addr.pincode} onChange={set} required pattern="[0-9]{6}" placeholder="6-digit"
                                            style={inp('pincode')} onFocus={() => setFocus('pincode')} onBlur={() => setFocus(null)} />
                                    </div>
                                </div>
                            </motion.section>

                            {/* Payment */}
                            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                style={{ background: CARD, borderRadius: 20, border: `1.5px solid ${BORDER}`, padding: '28px 28px', boxShadow: '0 2px 12px rgba(28,13,2,0.05)' }}>
                                <h2 style={{ fontFamily: "'Agdasima', sans-serif", fontSize: 20, fontWeight: 700, color: DARK, margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ width: 30, height: 30, borderRadius: '50%', background: OLIVE, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>2</span>
                                    Payment Method
                                </h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#f5efe8', border: `2px solid ${OLIVE}`, borderRadius: 16, padding: '16px 20px' }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: OLIVE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 15, color: DARK }}>Cash on Delivery</div>
                                        <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>Pay when your order arrives</div>
                                    </div>
                                    <div style={{ marginLeft: 'auto', width: 22, height: 22, borderRadius: '50%', background: OLIVE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                    </div>
                                </div>
                            </motion.section>

                            {/* Error */}
                            {error && (
                                <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 14, padding: '14px 18px', color: '#dc2626', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ fontSize: 18 }}>⚠️</span> {error}
                                </div>
                            )}
                        </div>

                        {/* ─── Right: Summary ─── */}
                        <div style={{ flex: '0 0 320px', position: 'sticky', top: 88 }}>
                            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                                style={{ background: CARD, borderRadius: 22, border: `1.5px solid ${BORDER}`, padding: '28px 24px', boxShadow: '0 4px 20px rgba(28,13,2,0.07)' }}>
                                <h2 style={{ fontFamily: "'Agdasima', sans-serif", fontSize: 20, fontWeight: 700, color: DARK, margin: '0 0 18px' }}>Order Summary</h2>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {items.map(it => (
                                        <div key={it.profile.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                                            <span style={{ color: '#666', flex: 1, marginRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {it.profile.name} <span style={{ color: '#aaa' }}>×{it.quantity}</span>
                                            </span>
                                            <span style={{ fontWeight: 600, color: DARK }}>₹{799 * it.quantity}</span>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ borderTop: `1px solid ${BORDER}`, margin: '16px 0', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: MUTED }}>
                                        <span>Shipping</span><span style={{ fontWeight: 700, color: OLIVE }}>FREE</span>
                                    </div>
                                </div>

                                <div style={{ borderTop: `1.5px solid ${BORDER}`, paddingTop: 14 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 800, color: DARK }}>
                                        <span>Total</span><span>₹{getTotal()}</span>
                                    </div>
                                </div>

                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                    type="submit" disabled={submitting}
                                    style={{
                                        width: '100%', marginTop: 22, padding: '16px 0',
                                        background: submitting ? '#aaa' : `linear-gradient(135deg, ${DARK}, #3a1a08)`,
                                        color: '#fff', border: 'none', borderRadius: 14,
                                        fontWeight: 800, fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer',
                                        letterSpacing: '0.06em', textTransform: 'uppercase',
                                        boxShadow: submitting ? 'none' : '0 6px 20px rgba(28,13,2,0.25)',
                                    }}
                                >{submitting ? '⏳ Placing Order...' : 'Place Order →'}</motion.button>

                                <p style={{ textAlign: 'center', fontSize: 12, color: '#bbb', marginTop: 14 }}>🔒 Secure & encrypted checkout</p>
                            </motion.div>
                        </div>
                    </div>
                </form>
            </div>

            <style>{`@media(max-width:860px){div[style*="flex: 0 0 320px"]{flex:1 1 100%!important;position:static!important;}div[style*="gridTemplateColumns: '1fr 1fr'"]{grid-template-columns:1fr!important;}}input:focus{outline:none;}`}</style>
        </div>
    );
}
