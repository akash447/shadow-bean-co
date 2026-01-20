import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { createOrder } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import './CheckoutPage.css';

interface ShippingAddress {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
}

export default function CheckoutPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { items, getTotal, clearCart } = useCartStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [address, setAddress] = useState<ShippingAddress>({
        fullName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
    });

    if (items.length === 0 && !orderSuccess) {
        return (
            <div className="checkout-container">
                <div className="empty-checkout">
                    <h2>Your cart is empty</h2>
                    <button onClick={() => navigate('/shop')}>Go to Shop</button>
                </div>
            </div>
        );
    }

    if (orderSuccess) {
        return (
            <div className="checkout-container">
                <div className="order-success">
                    <span className="success-icon">✅</span>
                    <h2>Order Placed Successfully!</h2>
                    <p>Your order ID: <strong>{orderId}</strong></p>
                    <p>We'll contact you at <strong>{address.phone}</strong> for delivery updates.</p>
                    <button onClick={() => navigate('/')}>Back to Home</button>
                </div>
            </div>
        );
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setAddress(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const orderData = {
                user_id: user?.id || '',
                total_amount: getTotal(),
                razorpay_payment_id: 'COD-' + Date.now(), // Cash on Delivery placeholder
                shipping_address: address,
                items: items.map(item => ({
                    taste_profile_id: item.profile.id,
                    taste_profile_name: item.profile.name,
                    quantity: item.quantity,
                    unit_price: 799,
                })),
            };

            const result = await createOrder(orderData);

            if (result.error) {
                throw result.error;
            }

            setOrderId(result.order?.id || 'N/A');
            setOrderSuccess(true);
            clearCart();
        } catch (error) {
            console.error('Order failed:', error);
            alert('Failed to place order. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="checkout-container">
            <header className="checkout-header">
                <button className="back-button" onClick={() => navigate('/cart')}>
                    ← Back to Cart
                </button>
                <h1>Checkout</h1>
            </header>

            <form onSubmit={handleSubmit} className="checkout-form">
                <div className="form-section">
                    <h2>Shipping Address</h2>
                    <div className="form-grid">
                        <input
                            type="text"
                            name="fullName"
                            placeholder="Full Name *"
                            value={address.fullName}
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            type="tel"
                            name="phone"
                            placeholder="Phone Number *"
                            value={address.phone}
                            onChange={handleInputChange}
                            required
                            pattern="[0-9]{10}"
                        />
                        <input
                            type="text"
                            name="addressLine1"
                            placeholder="Address Line 1 *"
                            value={address.addressLine1}
                            onChange={handleInputChange}
                            required
                            className="full-width"
                        />
                        <input
                            type="text"
                            name="addressLine2"
                            placeholder="Address Line 2 (Optional)"
                            value={address.addressLine2}
                            onChange={handleInputChange}
                            className="full-width"
                        />
                        <input
                            type="text"
                            name="city"
                            placeholder="City *"
                            value={address.city}
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            type="text"
                            name="state"
                            placeholder="State *"
                            value={address.state}
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            type="text"
                            name="pincode"
                            placeholder="Pincode *"
                            value={address.pincode}
                            onChange={handleInputChange}
                            required
                            pattern="[0-9]{6}"
                        />
                    </div>
                </div>

                <div className="order-summary-section">
                    <h2>Order Summary</h2>
                    <div className="summary-items">
                        {items.map(item => (
                            <div key={item.profile.id} className="summary-item">
                                <span>{item.profile.name} x {item.quantity}</span>
                                <span>₹{799 * item.quantity}</span>
                            </div>
                        ))}
                    </div>
                    <div className="summary-total">
                        <span>Total</span>
                        <span>₹{getTotal()}</span>
                    </div>
                </div>

                <div className="payment-section">
                    <h2>Payment Method</h2>
                    <div className="payment-option selected">
                        <span>💵 Cash on Delivery (COD)</span>
                    </div>
                </div>

                <button
                    type="submit"
                    className="place-order-button"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Placing Order...' : 'PLACE ORDER'}
                </button>
            </form>
        </div>
    );
}
