import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import './CartPage.css';

export default function CartPage() {
    const navigate = useNavigate();
    const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();

    if (items.length === 0) {
        return (
            <div className="cart-container">
                <header className="cart-header">
                    <button className="back-button" onClick={() => navigate('/shop')}>
                        ← Back to Shop
                    </button>
                    <h1>Your Cart</h1>
                </header>
                <div className="empty-cart">
                    <span className="empty-icon">🛒</span>
                    <h2>Your cart is empty</h2>
                    <p>Add some custom coffee blends to get started!</p>
                    <button className="shop-button" onClick={() => navigate('/shop')}>
                        Start Shopping
                    </button>
                </div>
            </div>
        );
    }

    const handleCheckout = () => {
        // Navigate to internal checkout page
        navigate('/checkout');
    };

    return (
        <div className="cart-container">
            <header className="cart-header">
                <button className="back-button" onClick={() => navigate('/shop')}>
                    ← Back to Shop
                </button>
                <h1>Your Cart</h1>
            </header>

            <div className="cart-layout">
                {/* ... existing cart items code ... */}
                <div className="cart-items">
                    {items.map(item => (
                        <div key={item.profile.id} className="cart-item">
                            <div className="item-info">
                                <h3>{item.profile.name}</h3>
                                <div className="item-meta">
                                    {item.profile.roastLevel} • {item.profile.grindType} • 250g
                                </div>
                                <div className="taste-tags">
                                    <span className="taste-tag">Bitter: {item.profile.bitterness}/5</span>
                                    <span className="taste-tag">Acid: {item.profile.acidity}/5</span>
                                    <span className="taste-tag">Flavor: {item.profile.flavour}/5</span>
                                </div>
                            </div>
                            <div className="item-actions">
                                <span className="item-price">₹{799 * item.quantity}</span>
                                <div className="quantity-wrapper">
                                    <div className="quantity-controls">
                                        <button
                                            onClick={() => updateQuantity(item.profile.id, Math.max(1, item.quantity - 1))}
                                            disabled={item.quantity <= 1}
                                        >
                                            −
                                        </button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.profile.id, item.quantity + 1)}>
                                            +
                                        </button>
                                    </div>
                                </div>
                                <button className="remove-button" onClick={() => removeItem(item.profile.id)}>
                                    <span>Remove</span> 🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="cart-summary">
                    <h2 className="summary-title">Order Summary</h2>
                    <div className="summary-line">
                        <span>Subtotal</span>
                        <strong>₹{getTotal()}</strong>
                    </div>
                    <div className="summary-line">
                        <span>Shipping</span>
                        <strong style={{ color: '#4f5130' }}>Free</strong>
                    </div>
                    <div className="summary-line total">
                        <span>Total</span>
                        <span>₹{getTotal()}</span>
                    </div>
                    <button className="checkout-button" onClick={handleCheckout}>
                        PROCEED TO CHECKOUT
                    </button>
                    <button className="clear-button" onClick={clearCart}>
                        Clear Cart
                    </button>
                </div>
            </div>
        </div>
    );
}
