import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../stores/cartStore';
import { useState } from 'react';
import { validateOffer } from '../services/api';
import { useAsset } from '../contexts/AssetContext';

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
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();
  const productBag = useAsset('product_bag.png');
  const [coupon, setCoupon] = useState('');
  const [couponStatus, setCouponStatus] = useState<null | 'loading' | 'success' | 'error'>(null);
  const [discount, setDiscount] = useState<{ code: string; type: string; value: number } | null>(null);

  const subtotal = getTotal();
  const discountAmount = discount
    ? discount.type === 'percentage'
      ? Math.round(subtotal * discount.value / 100)
      : Math.min(discount.value, subtotal)
    : 0;
  const total = subtotal - discountAmount;

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponStatus('loading');
    try {
      const res = await validateOffer(coupon.trim(), subtotal);
      if (res?.valid) {
        setDiscount({ code: coupon.trim().toUpperCase(), type: res.type || 'percentage', value: res.value || 0 });
        setCouponStatus('success');
      } else {
        setCouponStatus('error');
        setDiscount(null);
      }
    } catch {
      setCouponStatus('error');
      setDiscount(null);
    }
  };

  const removeCoupon = () => {
    setDiscount(null);
    setCoupon('');
    setCouponStatus(null);
  };

  /* ───────── Empty state ───────── */
  if (items.length === 0) {
    return (
      <div style={{ minHeight: '100dvh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Montserrat', sans-serif", padding: 24 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
          <div style={{ width: 100, height: 100, borderRadius: 24, background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, margin: '0 auto 24px' }}>🛒</div>
          <h2 style={{ fontFamily: "'Agdasima', sans-serif", fontSize: 28, color: DARK, margin: '0 0 8px' }}>Your cart is empty</h2>
          <p style={{ color: MUTED, fontSize: 15, marginBottom: 32, maxWidth: 320 }}>
            Head to the shop and craft your perfect coffee blend!
          </p>
          <button onClick={() => nav('/shop')} style={{ padding: '14px 40px', background: OLIVE, color: '#fff', border: 'none', borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: 'pointer', letterSpacing: '0.04em' }}>
            Browse Blends
          </button>
        </motion.div>
      </div>
    );
  }

  /* ───────── Cart with items ───────── */
  return (
    <div style={{ minHeight: '100dvh', background: BG, fontFamily: "'Montserrat', sans-serif" }}>
      {/* Header */}
      <header style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 16 }}>
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

      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* ─── Left: Items ─── */}
          <div style={{ flex: '1 1 600px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <AnimatePresence>
              {items.map((item, i) => (
                <motion.div
                  key={item.profile.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40, height: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  style={{
                    background: CARD,
                    borderRadius: 18,
                    border: `1.5px solid ${BORDER}`,
                    padding: '24px 28px',
                    boxShadow: '0 2px 12px rgba(28,13,2,0.05)',
                    display: 'flex',
                    gap: 20,
                    alignItems: 'center',
                  }}
                >
                  {/* Product image */}
                  <div style={{
                    width: 72, height: 72, borderRadius: 18,
                    background: `linear-gradient(135deg, ${ACCENT}, #ede5d8)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, overflow: 'hidden',
                  }}>
                    <img src={productBag} alt="Coffee" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: DARK, margin: '0 0 4px' }}>{item.profile.name}</h3>
                    <p style={{ fontSize: 13, color: MUTED, margin: '0 0 10px' }}>
                      {item.profile.roastLevel} · {item.profile.grindType} · 250g
                    </p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {[
                        { l: 'Bitter', v: item.profile.bitterness },
                        { l: 'Flavor', v: item.profile.flavour },
                      ].map(t => (
                        <span key={t.l} style={{
                          fontSize: 11, fontWeight: 600, color: OLIVE, background: ACCENT,
                          padding: '3px 10px', borderRadius: 20,
                        }}>{t.l} {t.v}/5</span>
                      ))}
                    </div>
                  </div>

                  {/* Price + Qty */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 14, flexShrink: 0 }}>
                    <span style={{ fontWeight: 800, fontSize: 20, color: DARK }}>₹{799 * item.quantity}</span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* Stepper */}
                      <div style={{ display: 'flex', border: `1.5px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
                        <button
                          onClick={() => updateQuantity(item.profile.id, Math.max(1, item.quantity - 1))}
                          disabled={item.quantity <= 1}
                          style={{ width: 36, height: 36, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#666', opacity: item.quantity <= 1 ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >−</button>
                        <span style={{ width: 40, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, color: DARK, borderLeft: `1.5px solid ${BORDER}`, borderRight: `1.5px solid ${BORDER}` }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.profile.id, item.quantity + 1)}
                          style={{ width: 36, height: 36, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >+</button>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeItem(item.profile.id)}
                        title="Remove"
                        style={{ width: 36, height: 36, borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* ─── Right: Order Summary ─── */}
          <div style={{ flex: '0 0 360px', position: 'sticky', top: 88 }}>
            <div style={{
              background: CARD, borderRadius: 22,
              border: `1.5px solid ${BORDER}`,
              boxShadow: '0 4px 20px rgba(28,13,2,0.07)',
              padding: '28px 26px',
            }}>
              <h2 style={{ fontFamily: "'Agdasima', sans-serif", fontSize: 22, fontWeight: 700, color: DARK, margin: '0 0 20px' }}>
                Order Summary
              </h2>

              {/* Line items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {items.map(item => (
                  <div key={item.profile.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: '#666', flex: 1, marginRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.profile.name} <span style={{ color: '#aaa' }}>×{item.quantity}</span>
                    </span>
                    <span style={{ fontWeight: 600, color: DARK }}>₹{799 * item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div style={{ marginTop: 20, padding: '16px 0', borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
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
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={coupon}
                      onChange={e => { setCoupon(e.target.value); setCouponStatus(null); }}
                      placeholder="Coupon code"
                      style={{
                        flex: 1, padding: '10px 14px', borderRadius: 10,
                        border: `1.5px solid ${couponStatus === 'error' ? '#fca5a5' : BORDER}`,
                        fontSize: 13, fontFamily: "'Montserrat', sans-serif",
                        background: ACCENT, outline: 'none',
                      }}
                    />
                    <button
                      onClick={applyCoupon}
                      disabled={couponStatus === 'loading'}
                      style={{ padding: '10px 18px', background: OLIVE, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', opacity: couponStatus === 'loading' ? 0.6 : 1 }}
                    >
                      {couponStatus === 'loading' ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
                {couponStatus === 'error' && (
                  <p style={{ color: '#ef4444', fontSize: 12, margin: '6px 0 0' }}>Invalid or expired coupon</p>
                )}
              </div>

              {/* Totals */}
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: MUTED }}>
                  <span>Subtotal</span>
                  <span style={{ fontWeight: 600 }}>₹{subtotal}</span>
                </div>
                {discount && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                    <span>Discount</span>
                    <span style={{ fontWeight: 600 }}>−₹{discountAmount}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: MUTED }}>
                  <span>Shipping</span>
                  <span style={{ fontWeight: 700, color: OLIVE }}>FREE</span>
                </div>
              </div>

              <div style={{ borderTop: `1.5px solid ${BORDER}`, margin: '14px 0 0', paddingTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 800, color: DARK }}>
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => nav('/checkout')}
                style={{
                  width: '100%', marginTop: 22, padding: '16px 0',
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

      <style>{`@media(max-width:900px){div[style*="flex: 0 0 360px"]{flex:1 1 100%!important;position:static!important;}}`}</style>
    </div>
  );
}
