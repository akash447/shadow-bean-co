import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useCartStore } from '../stores/cartStore';
import { createOrder, ensureProfile, getPaymentStatus, getAddresses, createAddress } from '../services/api';
import type { Address } from '../services/api';
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
    label: string;
    fullName: string; phone: string;
    addressLine1: string; addressLine2: string;
    city: string; state: string; pincode: string;
}

const EMPTY_ADDR: ShippingAddress = { label: '', fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' };

const UPI_ID = '8765280251@ybl';
const UPI_NAME = encodeURIComponent('Shadow Bean Co');
const upiUri = (amount: number) =>
    `upi://pay?pa=${UPI_ID}&pn=${UPI_NAME}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Shadow Bean Co Order')}`;

export default function CheckoutPage() {
    const nav = useNavigate();
    const { user, loading, profile } = useAuth();
    const { items, getSubtotal, getDiscountAmount, getTotal, discount, clearCart } = useCartStore();
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [ordId, setOrdId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [focus, setFocus] = useState<string | null>(null);
    const [upiPolling, setUpiPolling] = useState(false);
    const [upiStatus, setUpiStatus] = useState<string>('pending');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [saveAddress, setSaveAddress] = useState(true);

    // Saved addresses
    const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
    const [selectedAddrId, setSelectedAddrId] = useState<string | null>(null);
    const [showNewAddrForm, setShowNewAddrForm] = useState(false);

    const dbUserId = profile?.id || user?.id;

    const [addr, setAddr] = useState<ShippingAddress>(EMPTY_ADDR);

    // Store total at order time for UPI polling screen (cart gets cleared)
    const orderTotalRef = useRef<number>(0);
    const orderPhoneRef = useRef<string>('');

    // Load saved addresses
    useEffect(() => {
        if (!dbUserId) return;
        getAddresses(dbUserId).then(addrs => {
            setSavedAddresses(addrs);
            // Auto-select default if available
            const def = addrs.find(a => a.is_default);
            if (def) {
                setSelectedAddrId(def.id);
                populateFromSaved(def);
            } else if (addrs.length > 0) {
                setSelectedAddrId(addrs[0].id);
                populateFromSaved(addrs[0]);
            } else {
                setShowNewAddrForm(true);
            }
        }).catch(() => { setShowNewAddrForm(true); });
    }, [dbUserId]);

    const populateFromSaved = (a: Address) => {
        setAddr({
            label: a.label || '',
            fullName: a.full_name,
            phone: a.phone,
            addressLine1: a.address_line,
            addressLine2: '',
            city: a.city,
            state: a.state,
            pincode: a.pincode,
        });
    };

    const selectSavedAddress = (a: Address) => {
        setSelectedAddrId(a.id);
        setShowNewAddrForm(false);
        populateFromSaved(a);
    };

    const startNewAddress = () => {
        setSelectedAddrId(null);
        setShowNewAddrForm(true);
        setAddr(EMPTY_ADDR);
    };

    // UPI payment polling
    useEffect(() => {
        if (!upiPolling || !ordId) return;
        let cancelled = false;
        const startTime = Date.now();
        const TIMEOUT = 30 * 60 * 1000;

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

    const subtotal = getSubtotal();
    const discountAmount = getDiscountAmount();
    const total = getTotal();

    const isAddrValid = () => {
        if (selectedAddrId) return true; // saved address selected
        return addr.fullName.trim() && addr.phone.trim() && addr.addressLine1.trim() && addr.city.trim() && addr.state.trim() && addr.pincode.trim();
    };

    /* ── Empty ── */
    if (items.length === 0 && !success && !upiPolling) {
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
        const amt = orderTotalRef.current;
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
                                {upiStatus === 'detected' ? 'Payment Detected!' : 'Verifying UPI Payment...'}
                            </h2>
                            <p style={{ color: MUTED, fontSize: 14, marginBottom: 16 }}>Order ID: <strong style={{ color: OLIVE }}>{ordId?.slice(0, 8)}</strong></p>

                            {upiStatus === 'pending' && (
                                <>
                                    <div style={{ background: '#fff', padding: 14, borderRadius: 16, border: `1.5px solid ${BORDER}`, display: 'inline-block', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                                        <QRCodeSVG value={upiUri(amt)} size={180} level="M" bgColor="#ffffff" fgColor="#1c0d02" />
                                    </div>

                                    <div style={{ background: CARD, border: `1.5px solid ${BORDER}`, borderRadius: 16, padding: '20px 24px', marginBottom: 20, textAlign: 'left' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                            <div>
                                                <div style={{ fontSize: 12, color: MUTED, marginBottom: 2 }}>Pay to UPI ID</div>
                                                <div style={{ fontSize: 16, fontWeight: 700, color: DARK, fontFamily: 'monospace', wordBreak: 'break-all' }}>{UPI_ID}</div>
                                            </div>
                                            <button onClick={() => { navigator.clipboard.writeText(UPI_ID); }}
                                                style={{ background: OLIVE, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                                                Copy
                                            </button>
                                        </div>
                                        <div style={{ fontSize: 13, color: MUTED, marginBottom: 4 }}>Amount</div>
                                        <div style={{ fontSize: 24, fontWeight: 800, color: DARK }}>₹{amt}</div>
                                    </div>

                                    <div style={{ background: '#fefce8', border: '1.5px solid #fde68a', borderRadius: 12, padding: '12px 16px', marginBottom: 16, textAlign: 'left' }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>How to pay</div>
                                        <div style={{ fontSize: 12, color: '#78716c', lineHeight: 1.7 }}>
                                            1. Scan QR code or copy UPI ID above<br />
                                            2. Pay <strong>₹{amt}</strong> from any UPI app (GPay, PhonePe, Paytm)<br />
                                            3. We'll auto-verify via HDFC bank alert — please wait
                                        </div>
                                    </div>
                                </>
                            )}

                            <p style={{ color: '#aaa', fontSize: 12 }}>
                                {upiStatus === 'detected' ? 'Confirming your payment...' : 'Waiting for HDFC bank payment alert. This may take up to a minute.'}
                            </p>
                        </>
                    )}
                </motion.div>
            </div>
        );
    }

    /* ── Success ── */
    if (success) {
        return (
            <div style={{ minHeight: '100dvh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Montserrat', sans-serif", padding: 24 }}>
                <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 16 }} style={{ textAlign: 'center', maxWidth: 440 }}>
                    <div style={{ width: 90, height: 90, borderRadius: '50%', background: `linear-gradient(135deg, ${OLIVE}, #3a3c22)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 8px 32px rgba(79,81,48,0.3)' }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <h2 style={{ fontFamily: "'Agdasima', sans-serif", fontSize: 30, color: DARK, margin: '0 0 8px' }}>Order Placed Successfully!</h2>
                    <p style={{ color: '#666', fontSize: 14 }}>Order ID: <strong style={{ color: OLIVE }}>{ordId}</strong></p>
                    <p style={{ color: MUTED, fontSize: 13, marginTop: 4, marginBottom: 32 }}>We'll contact you at <strong>{orderPhoneRef.current}</strong> for delivery updates.</p>
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
        if (!agreedToTerms) { setError('Please accept the Terms & Conditions to place your order.'); return; }
        if (!user || !user.id?.trim()) { nav('/login?redirect=/checkout&message=login_required'); return; }
        if (!isAddrValid()) { setError('Please fill in all required address fields.'); return; }
        setSubmitting(true);
        try {
            if (user.email) await ensureProfile(user.id, user.email, user.fullName || '');

            // Save new address for future use
            if (!selectedAddrId && saveAddress && dbUserId && addr.fullName && addr.phone && addr.addressLine1) {
                try {
                    await createAddress({
                        user_id: dbUserId,
                        label: addr.label || 'Home',
                        full_name: addr.fullName,
                        phone: addr.phone,
                        address_line: addr.addressLine1 + (addr.addressLine2 ? ', ' + addr.addressLine2 : ''),
                        city: addr.city,
                        state: addr.state,
                        pincode: addr.pincode,
                        country: 'India',
                        is_default: savedAddresses.length === 0,
                    });
                } catch { /* ignore save failure */ }
            }

            // Store total and phone before clearing cart
            orderTotalRef.current = total;
            orderPhoneRef.current = addr.phone;

            const order = await createOrder({
                user_id: user.id, total_amount: total,
                payment_method: 'upi',
                shipping_address: addr,
                items: items.map(it => ({
                    taste_profile_id: it.profile.id && /^[0-9a-f-]{36}$/i.test(it.profile.id) ? it.profile.id : undefined,
                    taste_profile_name: it.profile.name, quantity: it.quantity, unit_price: 799,
                })),
            });
            setOrdId(order?.id || 'N/A');
            clearCart();
            // Go to UPI payment verification screen
            setUpiPolling(true);
        } catch (err: any) {
            setError(err?.response?.data?.error || err?.message || 'Something went wrong');
        } finally { setSubmitting(false); }
    };

    const canSubmit = agreedToTerms && !submitting && isAddrValid();

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

            <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 16px 80px' }}>
                <form onSubmit={submit}>
                    <div className="checkout-layout" style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

                        {/* ─── Left: Form ─── */}
                        <div className="checkout-form-col" style={{ flex: '1 1 500px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>

                            {/* Delivery Address Section */}
                            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                style={{ background: CARD, borderRadius: 18, border: `1.5px solid ${BORDER}`, padding: '22px 22px', boxShadow: '0 2px 12px rgba(28,13,2,0.05)' }}>
                                <h2 style={{ fontFamily: "'Agdasima', sans-serif", fontSize: 18, fontWeight: 700, color: DARK, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ width: 28, height: 28, borderRadius: '50%', background: OLIVE, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>1</span>
                                    Delivery Address
                                </h2>

                                {/* Saved addresses */}
                                {savedAddresses.length > 0 && (
                                    <>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                                            {savedAddresses.map(a => (
                                                <div
                                                    key={a.id}
                                                    onClick={() => selectSavedAddress(a)}
                                                    style={{
                                                        padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                                                        border: `2px solid ${selectedAddrId === a.id ? OLIVE : BORDER}`,
                                                        background: selectedAddrId === a.id ? '#f5efe8' : '#fafafa',
                                                        transition: 'border-color 0.15s, background 0.15s',
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontWeight: 700, fontSize: 13, color: DARK }}>{a.label || a.full_name}</span>
                                                        {selectedAddrId === a.id && (
                                                            <div style={{ width: 18, height: 18, borderRadius: '50%', background: OLIVE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
                                                        {a.address_line}, {a.city}, {a.state} - {a.pincode}
                                                    </div>
                                                    <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{a.phone}</div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Toggle new address form */}
                                        {!showNewAddrForm ? (
                                            <button type="button" onClick={startNewAddress}
                                                style={{ background: 'none', border: `1.5px dashed ${BORDER}`, borderRadius: 12, padding: '12px', width: '100%', cursor: 'pointer', color: OLIVE, fontWeight: 600, fontSize: 13, transition: 'border-color 0.15s' }}
                                                onMouseEnter={e => (e.currentTarget.style.borderColor = OLIVE)}
                                                onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
                                            >
                                                + Fill New Address
                                            </button>
                                        ) : (
                                            <button type="button" onClick={() => { setShowNewAddrForm(false); if (savedAddresses.length > 0) { selectSavedAddress(savedAddresses[0]); } }}
                                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: MUTED, fontWeight: 600, fontSize: 12, marginBottom: 8 }}>
                                                ← Use saved address
                                            </button>
                                        )}
                                    </>
                                )}

                                {/* New address form — shown if no saved addresses or user clicked "Fill New Address" */}
                                {(showNewAddrForm || savedAddresses.length === 0) && (
                                    <div style={{ marginTop: savedAddresses.length > 0 ? 12 : 0 }}>
                                        <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <label style={lbl}>Label <span style={{ fontWeight: 400, textTransform: 'none' as const, letterSpacing: 0 }}>(e.g. Home, Office)</span></label>
                                                <input name="label" value={addr.label} onChange={set} placeholder="Home"
                                                    style={inp('label')} onFocus={() => setFocus('label')} onBlur={() => setFocus(null)} />
                                            </div>
                                            <div>
                                                <label style={lbl}>Full Name *</label>
                                                <input name="fullName" value={addr.fullName} onChange={set} required={showNewAddrForm || savedAddresses.length === 0} placeholder="Your full name"
                                                    style={inp('fullName')} onFocus={() => setFocus('fullName')} onBlur={() => setFocus(null)} />
                                            </div>
                                            <div>
                                                <label style={lbl}>Phone *</label>
                                                <input name="phone" type="tel" value={addr.phone} onChange={set} required={showNewAddrForm || savedAddresses.length === 0} pattern="[0-9]{10}" placeholder="10-digit number"
                                                    style={inp('phone')} onFocus={() => setFocus('phone')} onBlur={() => setFocus(null)} />
                                            </div>
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <label style={lbl}>Address Line 1 *</label>
                                                <input name="addressLine1" value={addr.addressLine1} onChange={set} required={showNewAddrForm || savedAddresses.length === 0} placeholder="House/Flat No., Street"
                                                    style={inp('addressLine1')} onFocus={() => setFocus('addressLine1')} onBlur={() => setFocus(null)} />
                                            </div>
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <label style={lbl}>Address Line 2 <span style={{ fontWeight: 400, textTransform: 'none' as const, letterSpacing: 0 }}>(optional)</span></label>
                                                <input name="addressLine2" value={addr.addressLine2} onChange={set} placeholder="Landmark, Area"
                                                    style={inp('addressLine2')} onFocus={() => setFocus('addressLine2')} onBlur={() => setFocus(null)} />
                                            </div>
                                            <div>
                                                <label style={lbl}>City *</label>
                                                <input name="city" value={addr.city} onChange={set} required={showNewAddrForm || savedAddresses.length === 0} placeholder="City"
                                                    style={inp('city')} onFocus={() => setFocus('city')} onBlur={() => setFocus(null)} />
                                            </div>
                                            <div>
                                                <label style={lbl}>State *</label>
                                                <input name="state" value={addr.state} onChange={set} required={showNewAddrForm || savedAddresses.length === 0} placeholder="State"
                                                    style={inp('state')} onFocus={() => setFocus('state')} onBlur={() => setFocus(null)} />
                                            </div>
                                            <div>
                                                <label style={lbl}>Pincode *</label>
                                                <input name="pincode" value={addr.pincode} onChange={set} required={showNewAddrForm || savedAddresses.length === 0} pattern="[0-9]{6}" placeholder="6-digit"
                                                    style={inp('pincode')} onFocus={() => setFocus('pincode')} onBlur={() => setFocus(null)} />
                                            </div>
                                        </div>

                                        {/* Save address checkbox */}
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, cursor: 'pointer', fontSize: 13, color: MUTED }}>
                                            <input type="checkbox" checked={saveAddress} onChange={e => setSaveAddress(e.target.checked)}
                                                style={{ width: 16, height: 16, accentColor: OLIVE, cursor: 'pointer' }} />
                                            Save this address for future orders
                                        </label>
                                    </div>
                                )}
                            </motion.section>

                            {/* Payment Info (UPI only) */}
                            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                style={{ background: CARD, borderRadius: 18, border: `1.5px solid ${BORDER}`, padding: '22px 22px', boxShadow: '0 2px 12px rgba(28,13,2,0.05)' }}>
                                <h2 style={{ fontFamily: "'Agdasima', sans-serif", fontSize: 18, fontWeight: 700, color: DARK, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ width: 28, height: 28, borderRadius: '50%', background: OLIVE, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>2</span>
                                    Payment
                                </h2>

                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 14,
                                    background: '#f5efe8', border: `2px solid ${OLIVE}`, borderRadius: 14, padding: '14px 18px',
                                }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: OLIVE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: DARK }}>UPI Payment</div>
                                        <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Pay via any UPI app — GPay, PhonePe, Paytm</div>
                                    </div>
                                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: OLIVE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                    </div>
                                </div>

                                <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.7, marginTop: 12, background: INPUT_BG, borderRadius: 10, padding: '10px 14px', border: `1px solid ${BORDER}` }}>
                                    After clicking "Pay via UPI", you'll see a QR code and UPI ID.<br />
                                    Pay the amount and we'll auto-verify your payment via HDFC bank alert.
                                </div>
                            </motion.section>

                            {/* Error */}
                            {error && (
                                <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 14, padding: '14px 18px', color: '#dc2626', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ fontSize: 18 }}>⚠</span> {error}
                                </div>
                            )}
                        </div>

                        {/* ─── Right: Summary ─── */}
                        <div className="checkout-summary-col" style={{ flex: '0 0 320px', position: 'sticky', top: 88 }}>
                            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                                style={{ background: CARD, borderRadius: 20, border: `1.5px solid ${BORDER}`, padding: '24px 22px', boxShadow: '0 4px 20px rgba(28,13,2,0.07)' }}>
                                <h2 style={{ fontFamily: "'Agdasima', sans-serif", fontSize: 20, fontWeight: 700, color: DARK, margin: '0 0 16px' }}>Order Summary</h2>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {items.map(it => (
                                        <div key={it.profile.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                            <span style={{ color: '#666', flex: 1, marginRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {it.profile.name} <span style={{ color: '#aaa' }}>x{it.quantity}</span>
                                            </span>
                                            <span style={{ fontWeight: 600, color: DARK }}>₹{799 * it.quantity}</span>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ borderTop: `1px solid ${BORDER}`, margin: '14px 0', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: MUTED }}>
                                        <span>Subtotal</span><span style={{ fontWeight: 600 }}>₹{subtotal}</span>
                                    </div>
                                    {discount && discountAmount > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                                            <span>Discount ({discount.code})</span>
                                            <span style={{ fontWeight: 600 }}>-₹{discountAmount}</span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: MUTED }}>
                                        <span>Shipping</span><span style={{ fontWeight: 700, color: OLIVE }}>FREE</span>
                                    </div>
                                </div>

                                <div style={{ borderTop: `1.5px solid ${BORDER}`, paddingTop: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 800, color: DARK }}>
                                        <span>Total</span><span>₹{total}</span>
                                    </div>
                                </div>

                                {/* T&C Checkbox */}
                                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 16, cursor: 'pointer', fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
                                    <input
                                        type="checkbox"
                                        checked={agreedToTerms}
                                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                                        style={{ marginTop: 3, width: 16, height: 16, accentColor: OLIVE, cursor: 'pointer', flexShrink: 0 }}
                                    />
                                    <span>
                                        I agree to the{' '}
                                        <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: OLIVE, fontWeight: 600, textDecoration: 'underline' }}>
                                            Terms & Conditions
                                        </a>
                                    </span>
                                </label>

                                <motion.button whileHover={{ scale: canSubmit ? 1.02 : 1 }} whileTap={{ scale: canSubmit ? 0.97 : 1 }}
                                    type="submit" disabled={!canSubmit}
                                    style={{
                                        width: '100%', marginTop: 12, padding: '15px 0',
                                        background: !canSubmit ? '#aaa' : `linear-gradient(135deg, ${OLIVE}, #3a3c22)`,
                                        color: '#fff', border: 'none', borderRadius: 14,
                                        fontWeight: 800, fontSize: 15, cursor: !canSubmit ? 'not-allowed' : 'pointer',
                                        letterSpacing: '0.06em', textTransform: 'uppercase',
                                        boxShadow: !canSubmit ? 'none' : '0 6px 20px rgba(79,81,48,0.3)',
                                    }}
                                >{submitting ? 'Processing...' : 'Pay via UPI →'}</motion.button>

                                <p style={{ textAlign: 'center', fontSize: 12, color: '#bbb', marginTop: 12 }}>Secure & encrypted checkout</p>
                            </motion.div>
                        </div>
                    </div>
                </form>
            </div>

            <style>{`
                @media(max-width:860px) {
                    .checkout-layout { flex-direction: column !important; }
                    .checkout-summary-col { flex: 1 1 100% !important; position: static !important; }
                    .checkout-form-col { flex: 1 1 100% !important; }
                    .checkout-grid { grid-template-columns: 1fr !important; }
                }
                input:focus { outline: none; }
            `}</style>
        </div>
    );
}
