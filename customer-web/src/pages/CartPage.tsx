import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../stores/cartStore';
import { useState, useEffect } from 'react';
import { validateOffer, getActiveOffers } from '../services/api';
import type { OfferSummary } from '../services/api';
import { useAsset } from '../contexts/AssetContext';
import { useAuth } from '../contexts/AuthContext';
import { trackViewCart, trackBeginCheckout } from '../utils/analytics';

const TASTE_MAP: Record<number, string> = { 1: 'Low', 2: 'Medium', 3: 'High' };
const tasteLabel = (v: number) => TASTE_MAP[v] ?? `${v}`;

/* ───────── shared colours ───────── */
const BG = '#FAF8F5';
const CARD = '#ffffff';
const BORDER = '#e0d6cc';
const OLIVE = '#4f5130';
const DARK = '#1c0d02';
const MUTED = '#98918a';
const ACCENT = '#f5efe8';

export default function CartPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { items, removeItem, updateQuantity, getSubtotal, getDiscountAmount, getTotal, clearCart, discount, setDiscount } = useCartStore();
  const productBag = useAsset('product_bag.png');
  const [coupon, setCoupon] = useState('');
  const [couponStatus, setCouponStatus] = useState<null | 'loading' | 'success' | 'error'>(null);
  const [couponError, setCouponError] = useState('');

  // Available offers
  const [offers, setOffers] = useState<OfferSummary[]>([]);
  const [showOffers, setShowOffers] = useState(false);

  const subtotal = getSubtotal();
  const discountAmount = getDiscountAmount();
  const total = getTotal();

  useEffect(() => {
    if (items.length > 0) trackViewCart(subtotal, items.length);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    getActiveOffers().then(setOffers).catch(() => {});
  }, []);

  const applyCoupon = async (code?: string) => {
    const c = (code || coupon).trim();
    if (!c) return;
    setCouponStatus('loading');
    setCouponError('');
    try {
      const res = await validateOffer(c, subtotal);
      if (res?.valid) {
        setDiscount({ code: c.toUpperCase(), type: res.type || 'percentage', value: res.value || 0 });
        setCoupon(c.toUpperCase());
        setCouponStatus('success');
        setShowOffers(false);
      } else {
        setCouponStatus('error');
        setCouponError(res?.reason || 'Invalid or expired coupon');
        setDiscount(null);
      }
    } catch {
      setCouponStatus('error');
      setCouponError('Invalid or expired coupon');
      setDiscount(null);
    }
  };

  const removeCoupon = () => {
    setDiscount(null);
    setCoupon('');
    setCouponStatus(null);
    setCouponError('');
  };

  const formatOfferLabel = (o: OfferSummary) => {
    if (o.type === 'percentage') return `${o.value}% off`;
    return `₹${o.value} off`;
  };

  /* ───────── Empty state ───────── */
  if (items.length === 0) {
    return (
      <div style={{ minHeight: '100dvh', background: BG, fontFamily: "'Montserrat', sans-serif" }}>
        {/* Header — same as filled cart */}
        <header style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, position: 'sticky', top: 0, zIndex: 20 }}>
          <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => nav('/shop')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: OLIVE, fontWeight: 600, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer' }}>
              ← Shop
            </button>
            <div style={{ width: 1, height: 22, background: BORDER }} />
            <h1 style={{ fontFamily: "'Agdasima', sans-serif", fontSize: 24, fontWeight: 700, color: DARK, margin: 0 }}>
              Your Cart
            </h1>
          </div>
        </header>

        {/* Centered empty content */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100dvh - 64px)', padding: '24px 24px 80px' }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', maxWidth: 400 }}
          >
            {/* Product bag image */}
            <div style={{
              width: 140, height: 140, borderRadius: 28, background: `linear-gradient(145deg, ${ACCENT}, #ede5d8)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 28px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(28,13,2,0.08)',
            }}>
              <img src={productBag} alt="Coffee bag" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
            </div>

            <h2 style={{ fontFamily: "'Agdasima', sans-serif", fontSize: 32, color: DARK, margin: '0 0 8px', letterSpacing: '0.02em' }}>
              Your cart is empty
            </h2>
            <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.6, margin: '0 0 32px', maxWidth: 300, marginInline: 'auto' }}>
              Craft your perfect custom blend — choose bitterness, flavour, roast &amp; grind, and we'll make it just for you.
            </p>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => nav('/shop')}
              style={{
                padding: '15px 48px', background: `linear-gradient(135deg, ${OLIVE}, #3a3c22)`,
                color: '#fff', border: 'none', borderRadius: 14, fontWeight: 800, fontSize: 15,
                cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase',
                boxShadow: '0 6px 20px rgba(79,81,48,0.3)',
              }}
            >
              Start Blending
            </motion.button>

          </motion.div>
        </div>
      </div>
    );
  }

  /* ───────── Cart with items ───────── */
  return (
    <div style={{ minHeight: '100dvh', background: BG, fontFamily: "'Montserrat', sans-serif" }}>
      {/* Header */}
      <header style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, position: 'sticky', top: 0, zIndex: 20 }}>
        <div className="cart-header-inner" style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => nav('/shop')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: OLIVE, fontWeight: 600, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer' }}>
            ← Shop
          </button>
          <div style={{ width: 1, height: 22, background: BORDER }} />
          <h1 style={{ fontFamily: "'Agdasima', sans-serif", fontSize: 24, fontWeight: 700, color: DARK, margin: 0 }}>
            Your Cart
          </h1>
          <span style={{ fontSize: 13, color: MUTED, fontWeight: 500 }}>
            ({items.length} item{items.length > 1 ? 's' : ''})
          </span>
        </div>
      </header>

      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '24px 16px 100px' }}>
        <div className="cart-layout" style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>

          {/* ─── Left: Items ─── */}
          <div className="cart-items-col" style={{ flex: '1 1 600px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <AnimatePresence>
              {items.map((item, i) => (
                <motion.div
                  key={item.profile.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40, height: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="cart-item-card"
                  style={{
                    background: CARD,
                    borderRadius: 16,
                    border: `1.5px solid ${BORDER}`,
                    padding: '18px 20px',
                    boxShadow: '0 2px 12px rgba(28,13,2,0.05)',
                    display: 'flex',
                    gap: 16,
                    alignItems: 'center',
                  }}
                >
                  {/* Product image */}
                  <div style={{
                    width: 64, height: 64, borderRadius: 14,
                    background: `linear-gradient(135deg, ${ACCENT}, #ede5d8)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, overflow: 'hidden',
                  }}>
                    <img src={productBag} alt="Coffee" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: DARK, margin: '0 0 3px' }}>{item.profile.name}</h3>
                    <p style={{ fontSize: 12, color: MUTED, margin: '0 0 8px' }}>
                      {item.profile.roastLevel} · {item.profile.grindType} · 250g
                    </p>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {[
                        { l: 'Bitter', v: item.profile.bitterness },
                        { l: 'Flavor', v: item.profile.flavour },
                      ].map(t => (
                        <span key={t.l} style={{
                          fontSize: 10, fontWeight: 600, color: OLIVE, background: ACCENT,
                          padding: '2px 8px', borderRadius: 20,
                        }}>{t.l} {tasteLabel(t.v)}</span>
                      ))}
                    </div>
                  </div>

                  {/* Price + Qty */}
                  <div className="cart-item-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
                    <span style={{ fontWeight: 800, fontSize: 18, color: DARK }}>₹{599 * item.quantity}</span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {/* Stepper */}
                      <div style={{ display: 'flex', border: `1.5px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
                        <button
                          onClick={() => updateQuantity(item.profile.id, Math.max(1, item.quantity - 1))}
                          disabled={item.quantity <= 1}
                          style={{ width: 32, height: 32, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#666', opacity: item.quantity <= 1 ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >−</button>
                        <span style={{ width: 34, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: DARK, borderLeft: `1.5px solid ${BORDER}`, borderRight: `1.5px solid ${BORDER}` }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.profile.id, item.quantity + 1)}
                          style={{ width: 32, height: 32, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >+</button>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeItem(item.profile.id)}
                        title="Remove"
                        style={{ width: 32, height: 32, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* ─── Right: Order Summary ─── */}
          <div className="cart-summary-col" style={{ flex: '0 0 360px', position: 'sticky', top: 88 }}>
            <div style={{
              background: CARD, borderRadius: 20,
              border: `1.5px solid ${BORDER}`,
              boxShadow: '0 4px 20px rgba(28,13,2,0.07)',
              padding: '24px 22px',
            }}>
              <h2 style={{ fontFamily: "'Agdasima', sans-serif", fontSize: 22, fontWeight: 700, color: DARK, margin: '0 0 18px' }}>
                Order Summary
              </h2>

              {/* Line items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map(item => (
                  <div key={item.profile.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#666', flex: 1, marginRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.profile.name} <span style={{ color: '#aaa' }}>×{item.quantity}</span>
                    </span>
                    <span style={{ fontWeight: 600, color: DARK }}>₹{599 * item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Coupon + Available Offers */}
              <div style={{ marginTop: 18, padding: '14px 0', borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
                {discount ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px' }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>✓ {discount.code}</span>
                      <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>
                        −₹{discountAmount} off
                      </span>
                    </div>
                    <button onClick={removeCoupon} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 16 }}>×</button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        value={coupon}
                        onChange={e => { setCoupon(e.target.value); setCouponStatus(null); setCouponError(''); }}
                        placeholder="Coupon code"
                        style={{
                          flex: 1, padding: '10px 14px', borderRadius: 10,
                          border: `1.5px solid ${couponStatus === 'error' ? '#fca5a5' : BORDER}`,
                          fontSize: 13, fontFamily: "'Montserrat', sans-serif",
                          background: ACCENT, outline: 'none',
                        }}
                      />
                      <button
                        onClick={() => applyCoupon()}
                        disabled={couponStatus === 'loading'}
                        style={{ padding: '10px 16px', background: OLIVE, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', opacity: couponStatus === 'loading' ? 0.6 : 1 }}
                      >
                        {couponStatus === 'loading' ? '...' : 'Apply'}
                      </button>
                    </div>

                    {/* Available Offers Dropdown */}
                    {offers.length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        <button
                          onClick={() => setShowOffers(!showOffers)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: 12, fontWeight: 600, color: OLIVE,
                            display: 'flex', alignItems: 'center', gap: 4, padding: 0,
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={OLIVE} strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                          {showOffers ? 'Hide offers' : `${offers.length} offer${offers.length > 1 ? 's' : ''} available`}
                          <span style={{ fontSize: 10, transition: 'transform 0.2s', display: 'inline-block', transform: showOffers ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
                        </button>

                        <AnimatePresence>
                          {showOffers && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              style={{ overflow: 'hidden', marginTop: 8 }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {offers.map(o => (
                                  <button
                                    key={o.code}
                                    onClick={() => { setCoupon(o.code); applyCoupon(o.code); }}
                                    style={{
                                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                      padding: '10px 12px', background: ACCENT, border: `1.5px solid ${BORDER}`,
                                      borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                                      transition: 'border-color 0.15s',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.borderColor = OLIVE)}
                                    onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
                                  >
                                    <div>
                                      <div style={{ fontSize: 13, fontWeight: 700, color: DARK, fontFamily: 'monospace' }}>{o.code}</div>
                                      <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                                        {o.description || formatOfferLabel(o)}
                                        {o.min_order > 0 && <span> · Min ₹{o.min_order}</span>}
                                      </div>
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', flexShrink: 0, marginLeft: 8 }}>
                                      {formatOfferLabel(o)}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </>
                )}
                {couponStatus === 'error' && (
                  <p style={{ color: '#ef4444', fontSize: 12, margin: '6px 0 0' }}>{couponError}</p>
                )}
              </div>

              {/* Totals */}
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: MUTED }}>
                  <span>Subtotal</span>
                  <span style={{ fontWeight: 600 }}>₹{subtotal}</span>
                </div>
                {discount && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                    <span>Discount ({discount.code})</span>
                    <span style={{ fontWeight: 600 }}>−₹{discountAmount}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: MUTED }}>
                  <span>Shipping</span>
                  <span style={{ fontWeight: 700, color: OLIVE }}>FREE</span>
                </div>
              </div>

              <div style={{ borderTop: `1.5px solid ${BORDER}`, margin: '12px 0 0', paddingTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 800, color: DARK }}>
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { trackBeginCheckout(total, items.length); user ? nav('/checkout') : nav('/login?redirect=/checkout'); }}
                style={{
                  width: '100%', marginTop: 18, padding: '15px 0',
                  background: `linear-gradient(135deg, ${OLIVE}, #3a3c22)`,
                  color: '#fff', border: 'none', borderRadius: 14,
                  fontWeight: 800, fontSize: 15, cursor: 'pointer',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  boxShadow: '0 6px 20px rgba(79,81,48,0.3)',
                }}
              >
                Proceed to Checkout →
              </motion.button>

              <button
                onClick={clearCart}
                style={{ width: '100%', marginTop: 8, padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', fontSize: 12 }}
              >
                Clear cart
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:900px) {
          .cart-layout { flex-direction: column !important; }
          .cart-summary-col { flex: 1 1 100% !important; width: 100% !important; max-width: 100% !important; position: static !important; }
          .cart-items-col { flex: 1 1 100% !important; }
          .cart-item-card { padding: 14px 14px !important; gap: 12px !important; }
          .cart-item-actions { gap: 8px !important; }
        }
      `}</style>
    </div>
  );
}
