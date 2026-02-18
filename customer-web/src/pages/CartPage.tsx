import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../stores/cartStore';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();

  return (
    <div style={{ minHeight: '100dvh', background: '#F7F4F0', fontFamily: "'Montserrat', sans-serif" }}>

      {/* ── Top Nav Bar ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #EDE8E1', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => navigate('/shop')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4f5130', fontWeight: 600, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 8, transition: 'background .15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f0ede7')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            Shop
          </button>
          <div style={{ width: 1, height: 20, background: '#E0D9CF' }} />
          <h1 style={{ fontFamily: "'Agdasima', sans-serif", fontSize: 22, fontWeight: 700, color: '#1c0d02', margin: 0 }}>
            Your Cart {items.length > 0 && <span style={{ fontSize: 14, fontWeight: 500, color: '#888', marginLeft: 4 }}>({items.length} item{items.length > 1 ? 's' : ''})</span>}
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>

        {/* ── Empty State ── */}
        {items.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '80px 20px' }}
          >
            <div style={{ fontSize: 64, marginBottom: 16 }}>☕</div>
            <h2 style={{ fontFamily: "'Agdasima', sans-serif", fontSize: 26, color: '#1c0d02', margin: '0 0 8px' }}>Your cart is empty</h2>
            <p style={{ color: '#888', fontSize: 14, marginBottom: 28 }}>Add some custom coffee blends to get started!</p>
            <button
              onClick={() => navigate('/shop')}
              style={{ padding: '12px 32px', background: '#4f5130', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: '0.05em' }}
            >
              Browse Blends
            </button>
          </motion.div>
        )}

        {/* ── Cart Layout ── */}
        {items.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}
            className="cart-grid">
            {/* Left: Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <AnimatePresence>
                {items.map((item, i) => (
                  <motion.div
                    key={item.profile.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{
                      background: '#fff',
                      borderRadius: 16,
                      border: '1px solid #EDE8E1',
                      padding: '20px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 20,
                    }}
                  >
                    {/* Coffee icon */}
                    <div style={{
                      width: 56, height: 56, borderRadius: 14,
                      background: 'linear-gradient(135deg, #f7f3ed, #ede8df)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 26, flexShrink: 0,
                    }}>☕</div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#1c0d02', marginBottom: 4 }}>{item.profile.name}</div>
                      <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                        {item.profile.roastLevel} · {item.profile.grindType} · 250g
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {[
                          { label: 'Bitter', val: item.profile.bitterness },
                          { label: 'Acid', val: item.profile.acidity },
                          { label: 'Body', val: item.profile.body },
                          { label: 'Flavor', val: item.profile.flavour },
                        ].map(t => (
                          <span key={t.label} style={{
                            fontSize: 11, background: '#f0ede7', color: '#4f5130',
                            padding: '2px 8px', borderRadius: 20, fontWeight: 600,
                          }}>{t.label} {t.val}/5</span>
                        ))}
                      </div>
                    </div>

                    {/* Price + Controls */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12, flexShrink: 0 }}>
                      <span style={{ fontWeight: 800, fontSize: 18, color: '#1c0d02' }}>₹{799 * item.quantity}</span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* Qty stepper */}
                        <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #E0D9CF', borderRadius: 10, overflow: 'hidden', height: 34 }}>
                          <button
                            onClick={() => updateQuantity(item.profile.id, Math.max(1, item.quantity - 1))}
                            disabled={item.quantity <= 1}
                            style={{ width: 34, height: 34, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: item.quantity <= 1 ? 0.3 : 1 }}
                          >−</button>
                          <span style={{ minWidth: 32, textAlign: 'center', fontWeight: 700, fontSize: 14, color: '#1c0d02', borderLeft: '1.5px solid #E0D9CF', borderRight: '1.5px solid #E0D9CF', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.profile.id, item.quantity + 1)}
                            style={{ width: 34, height: 34, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >+</button>
                        </div>

                        <button
                          onClick={() => removeItem(item.profile.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'color .15s' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#e55')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#ccc')}
                          title="Remove"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Right: Order Summary */}
            <div style={{ position: 'sticky', top: 76 }}>
              <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #EDE8E1', padding: '28px 24px' }}>
                <h2 style={{ fontFamily: "'Agdasima', sans-serif", fontSize: 20, fontWeight: 700, color: '#1c0d02', margin: '0 0 20px' }}>Order Summary</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
                  {items.map(item => (
                    <div key={item.profile.id} style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                      <span style={{ flex: 1, marginRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.profile.name} <span style={{ color: '#aaa' }}>×{item.quantity}</span>
                      </span>
                      <span style={{ fontWeight: 600, color: '#1c0d02', flexShrink: 0 }}>₹{799 * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid #EDE8E1', margin: '16px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#888', marginBottom: 8 }}>
                  <span>Shipping</span>
                  <span style={{ color: '#4f5130', fontWeight: 700 }}>FREE</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 800, color: '#1c0d02', marginBottom: 24 }}>
                  <span>Total</span>
                  <span>₹{getTotal()}</span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/checkout')}
                  style={{
                    width: '100%', padding: '14px 0',
                    background: 'linear-gradient(135deg, #4f5130, #3a3c22)',
                    color: '#fff', border: 'none', borderRadius: 14,
                    fontWeight: 800, fontSize: 14, cursor: 'pointer',
                    letterSpacing: '0.07em', textTransform: 'uppercase',
                    boxShadow: '0 4px 16px rgba(79,81,48,0.3)',
                  }}
                >
                  Proceed to Checkout →
                </motion.button>

                <button
                  onClick={clearCart}
                  style={{ width: '100%', marginTop: 10, padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', fontSize: 12, transition: 'color .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#e55')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#bbb')}
                >
                  Clear cart
                </button>
              </div>

              {/* Trust badges */}
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { icon: '🚚', text: 'Free delivery on all orders' },
                  { icon: '🔒', text: 'Secure checkout' },
                  { icon: '☕', text: 'Freshly roasted to order' },
                ].map(b => (
                  <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#888' }}>
                    <span>{b.icon}</span>
                    <span>{b.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Responsive: stack on mobile */}
      <style>{`
        @media (max-width: 768px) {
          .cart-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
