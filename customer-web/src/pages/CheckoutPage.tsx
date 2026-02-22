import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCartStore } from '../stores/cartStore';
import { createOrder, ensureProfile, getPaymentStatus } from '../services/api';
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
const UPI_ID = 'shadowbeanco@hdfcbank';

export default function CheckoutPage() {
    const nav = useNavigate();
    const { user, loading } = useAuth();
    const { items, getTotal, clearCart } = useCartStore();
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [ordId, setOrdId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [focus, setFocus] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi'>('cod');
    const [upiPolling, setUpiPolling] = useState(false);
    const [upiStatus, setUpiStatus] = useState<string>('pending');

    const init = (): ShippingAddress => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || ''); } catch { return { fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' }; }
    };

    const [addr, setAddr] = useState<ShippingAddress>(init);
    useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(addr)); }, [addr]);

    // UPI payment polling
    useEffect(() => {
        if (!upiPolling || !ordId) return;
        let cancelled = false;
        const startTime = Date.now();
        const TIMEOUT = 30 * 60 * 1000; // 30 minutes

        const poll = async () => {
            if (cancelled) return;
            if (Date.now() - startTime > TIMEOUT) {
                setUpiStatus('timeout');
                setUpiPolling(false);
                return;
            }
            try {
                const res = await getPaymentStatus(ordId);
                if (cancelled) return;
                setUpiStatus(res.payment_status);
                if (res.payment_status === 'confirmed') {
                    setUpiPolling(false);
                    setSuccess(true);
                } else if (res.payment_status === 'detected') {
                    // Keep polling until confirmed
                    setTimeout(poll, 5000);
                } else {
                    setTimeout(poll, 5000);
                }
            } catch {
                if (!cancelled) setTimeout(poll, 5000);
            }
        };
        poll();
        return () => { cancelled = true; };
    }, [upiPolling, ordId]);

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

    /* ── UPI Polling Screen ── */
    if (upiPolling || (upiStatus === 'timeout')) {
        return (
            <div style={{ minHeight: '100dvh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Montserrat', sans-serif", padding: 24 }}>
                <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 16 }} style={{ textAlign: 'center', maxWidth: 440 }}>
                    {upiStatus === 'timeout' ? (
                        <>
                            <div style={{ width: 90, height: 90, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                            </div>
                            <h2 style={{ fontFamily: "'Agdasima', sans-serif", fontSize: 26, color: DARK, margin: '0 0 8px' }}>Payment Not Received</h2>
                            <p style={{ color: MUTED, fontSize: 14, marginBottom: 24 }}>We didn't detect your UPI payment within 30 minutes.</p>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                    onClick={() => { setUpiStatus('pending'); setUpiPolling(true); }}
                                    style={{ padding: '14px 28px', background: OLIVE, color: '#fff', border: 'none', borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Retry</motion.button>
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                    onClick={() => nav('/')}
                                    style={{ padding: '14px 28px', background: '#e5e0d8', color: DARK, border: 'none', borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Back to Home</motion.button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ width: 90, height: 90, borderRadius: '50%', background: upiStatus === 'detected' ? '#d1fae5' : '#f5efe8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                {upiStatus === 'detected' ? (
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                ) : (
                                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                                        style={{ width: 40, height: 40, border: `3px solid ${BORDER}`, borderTopColor: OLIVE, borderRadius: '50%' }} />
                                )}
                            </div>
                            <h2 style={{ fontFamily: "'Agdasima', sans-serif", fontSize: 26, color: DARK, margin: '0 0 8px' }}>
                                {upiStatus === 'detected' ? 'Payment Detected!' : 'Waiting for Payment...'}
                            </h2>
                            <p style={{ color: MUTED, fontSize: 14, marginBottom: 8 }}>Order ID: <strong style={{ color: OLIVE }}>{ordId?.slice(0, 8)}</strong></p>
                            <div style={{ background: CARD, border: `1.5px solid ${BORDER}`, borderRadius: 16, padding: '20px 24px', marginBottom: 24, textAlign: 'left' }}>
                                <div style={{ fontSize: 13, color: MUTED, marginBottom: 4 }}>Pay to UPI ID</div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: DARK, marginBottom: 12, fontFamily: 'monospace', wordBreak: 'break-all' }}>{UPI_ID}</div>
                                <div style={{ fontSize: 13, color: MUTED, marginBottom: 4 }}>Amount</div>
                                <div style={{ fontSize: 22, fontWeight: 800, color: DARK }}>₹{getTotal()}</div>
                            </div>
                            <p style={{ color: '#aaa', fontSize: 12 }}>
                                {upiStatus === 'detected' ? 'Confirming your payment...' : 'We\'ll auto-detect your payment. This may take a few minutes.'}
                            </p>
                        </>
                    )}
                </motion.div>
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
                payment_method: paymentMethod,
                razorpay_payment_id: paymentMethod === 'cod' ? 'COD-' + Date.now() : undefined,
                shipping_address: addr,
                items: items.map(it => ({
                    taste_profile_id: it.profile.id && /^[0-9a-f-]{36}$/i.test(it.profile.id) ? it.profile.id : undefined,
                    taste_profile_name: it.profile.name, quantity: it.quantity, unit_price: 799,
                })),
            });
            setOrdId(order?.id || 'N/A');
            clearCart();
            if (paymentMethod === 'upi') {
                setUpiPolling(true);
            } else {
                setSuccess(true);
            }
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
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {/* COD Option */}
                                    <div onClick={() => setPaymentMethod('cod')} style={{
                                        display: 'flex', alignItems: 'center', gap: 16, background: paymentMethod === 'cod' ? '#f5efe8' : '#fafafa',
                                        border: `2px solid ${paymentMethod === 'cod' ? OLIVE : BORDER}`, borderRadius: 16, padding: '16px 20px', cursor: 'pointer',
                                        transition: 'border-color .15s',
                                    }}>
                                        <div style={{ width: 44, height: 44, borderRadius: 12, background: paymentMethod === 'cod' ? OLIVE : '#e5e0d8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .15s' }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 15, color: DARK }}>Cash on Delivery</div>
                                            <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>Pay when your order arrives</div>
                                        </div>
                                        {paymentMethod === 'cod' && (
                                            <div style={{ marginLeft: 'auto', width: 22, height: 22, borderRadius: '50%', background: OLIVE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                            </div>
                                        )}
                                    </div>

                                    {/* UPI Option */}
                                    <div onClick={() => setPaymentMethod('upi')} style={{
                                        display: 'flex', alignItems: 'center', gap: 16, background: paymentMethod === 'upi' ? '#f5efe8' : '#fafafa',
                                        border: `2px solid ${paymentMethod === 'upi' ? OLIVE : BORDER}`, borderRadius: 16, padding: '16px 20px', cursor: 'pointer',
                                        transition: 'border-color .15s',
                                    }}>
                                        <div style={{ width: 44, height: 44, borderRadius: 12, background: paymentMethod === 'upi' ? OLIVE : '#e5e0d8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .15s' }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 15, color: DARK }}>UPI Payment</div>
                                            <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>Pay via any UPI app</div>
                                        </div>
                                        {paymentMethod === 'upi' && (
                                            <div style={{ marginLeft: 'auto', width: 22, height: 22, borderRadius: '50%', background: OLIVE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                            </div>
                                        )}
                                    </div>

                                    {/* UPI Details (shown when UPI selected) */}
                                    {paymentMethod === 'upi' && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.2 }}
                                            style={{ background: '#faf7f3', border: `1.5px solid ${BORDER}`, borderRadius: 14, padding: '18px 20px' }}>
                                            <div style={{ fontSize: 12, color: MUTED, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Pay to UPI ID</div>
                                            <div style={{ fontSize: 16, fontWeight: 700, color: DARK, fontFamily: 'monospace', marginBottom: 14, wordBreak: 'break-all' }}>{UPI_ID}</div>
                                            <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.6 }}>
                                                1. Open any UPI app (GPay, PhonePe, Paytm, etc.)<br />
                                                2. Send ₹{getTotal()} to the UPI ID above<br />
                                                3. Place the order - we'll auto-detect your payment
                                            </div>
                                        </motion.div>
                                    )}
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
