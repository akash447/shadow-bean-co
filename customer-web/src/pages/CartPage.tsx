import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../stores/cartStore';
import { useYeti } from '../components/YetiMascot';
import Yeti from '../components/Yeti';
import { useEffect } from 'react';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();
  const { setYetiState } = useYeti();

  const hasItems = items.length > 0;

  useEffect(() => {
    setYetiState(hasItems ? 'happy' : 'sad');
    return () => setYetiState('idle');
  }, [hasItems, setYetiState]);

  const handleCheckout = () => {
    setYetiState('happy');
    setTimeout(() => navigate('/checkout'), 400);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/shop')}
              className="text-sm text-[#4f5130] hover:text-[#1c0d02] flex items-center gap-1 transition-colors"
            >
              <span>←</span> Back to Shop
            </button>
            <h1
              className="text-2xl md:text-3xl font-bold text-[#1c0d02]"
              style={{ fontFamily: "'Agdasima', sans-serif" }}
            >
              Your Cart
            </h1>
          </div>

          {/* Corner Yeti */}
          <div className="hidden md:block">
            <Yeti state={hasItems ? 'happy' : 'sad'} size="small" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 md:py-10">
        {/* Empty cart */}
        {!hasItems && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="flex justify-center mb-6 md:hidden">
              <Yeti state="sad" size="small" />
            </div>
            <h2 className="text-xl font-bold text-[#1c0d02] mb-2" style={{ fontFamily: "'Agdasima', sans-serif" }}>
              Your cart is empty
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Add some custom coffee blends to get started!
            </p>
            <button
              onClick={() => navigate('/shop')}
              className="px-8 py-3 bg-[#4f5130] text-white rounded-xl font-semibold hover:bg-[#3a3c22] transition-colors"
            >
              Start Shopping
            </button>
          </motion.div>
        )}

        {/* Cart with items */}
        {hasItems && (
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Items list */}
            <div className="flex-1 space-y-3">
              <AnimatePresence>
                {items.map((item, i) => (
                  <motion.div
                    key={item.profile.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-[#1c0d02] text-base">
                          {item.profile.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.profile.roastLevel} &bull; {item.profile.grindType} &bull; 250g
                        </p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs bg-[#f7f3ed] text-[#4f5130] px-2 py-0.5 rounded-full">
                            Bitter: {item.profile.bitterness}/5
                          </span>
                          <span className="text-xs bg-[#f7f3ed] text-[#4f5130] px-2 py-0.5 rounded-full">
                            Acid: {item.profile.acidity}/5
                          </span>
                          <span className="text-xs bg-[#f7f3ed] text-[#4f5130] px-2 py-0.5 rounded-full">
                            Flavor: {item.profile.flavour}/5
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-bold text-[#1c0d02] text-lg whitespace-nowrap">
                          ₹{799 * item.quantity}
                        </span>

                        {/* Quantity controls */}
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.profile.id, Math.max(1, item.quantity - 1))}
                            disabled={item.quantity <= 1}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                          >
                            −
                          </button>
                          <span className="w-8 h-8 flex items-center justify-center text-sm font-semibold border-x border-gray-200">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.profile.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.profile.id)}
                          className="text-red-400 hover:text-red-600 text-xs font-medium transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Order Summary - sticky on desktop */}
            <div className="lg:w-80">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 lg:sticky lg:top-6">
                <h2
                  className="text-lg font-bold text-[#1c0d02] mb-4"
                  style={{ fontFamily: "'Agdasima', sans-serif" }}
                >
                  Order Summary
                </h2>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-semibold text-[#1c0d02]">₹{getTotal()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shipping</span>
                    <span className="font-semibold text-[#4f5130]">Free</span>
                  </div>
                  <div className="border-t border-gray-100 pt-2 mt-2">
                    <div className="flex justify-between text-base">
                      <span className="font-bold text-[#1c0d02]">Total</span>
                      <span className="font-bold text-[#1c0d02]">₹{getTotal()}</span>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckout}
                  className="w-full mt-5 py-3 bg-[#4f5130] text-white rounded-xl font-semibold hover:bg-[#3a3c22] transition-colors uppercase tracking-wider text-sm"
                >
                  Proceed to Checkout
                </motion.button>

                <button
                  onClick={clearCart}
                  className="w-full mt-2 py-2 text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
