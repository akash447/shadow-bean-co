import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAsset } from '../contexts/AssetContext';
import { getOrders, getTasteProfiles, getReviews, createReview } from '../services/api';
import type { Order, TasteProfile as ApiTasteProfile, Review } from '../services/api';
import { useShopStore } from '../stores/shopStore';
import Header from '../components/Header';
import './ProfilePage.css';

export default function ProfilePage() {
    const navigate = useNavigate();
    const { user, profile, loading, logout } = useAuth();
    const logoBird = useAsset('logo_bird.png');
    const { setTaste, setRoastLevel, setGrindType } = useShopStore();

    const [orders, setOrders] = useState<Order[]>([]);
    const [savedBlends, setSavedBlends] = useState<ApiTasteProfile[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [dataLoading, setDataLoading] = useState(false);

    // Review modal state
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    const dbUserId = profile?.id || user?.id;

    useEffect(() => {
        if (!dbUserId) return;
        loadData();
    }, [dbUserId]);

    const loadData = () => {
        if (!dbUserId) return;
        setDataLoading(true);
        Promise.all([
            getOrders(dbUserId).catch(() => []),
            getTasteProfiles(dbUserId).catch(() => []),
            getReviews(50).catch(() => []),
        ]).then(([ordersData, blendsData, reviewsData]) => {
            setOrders(ordersData);
            setSavedBlends(blendsData);
            // Filter reviews to only show the user's reviews
            setReviews(reviewsData.filter(r => r.user_id === dbUserId));
        }).finally(() => setDataLoading(false));
    };

    const loadBlendIntoShop = (blend: ApiTasteProfile) => {
        setTaste('bitterness', blend.bitterness);
        setTaste('acidity', blend.acidity);
        setTaste('flavour', blend.flavour);
        if (blend.roast_level) setRoastLevel(blend.roast_level as any);
        if (blend.grind_type) setGrindType(blend.grind_type as any);
        navigate('/shop');
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const openReviewModal = (orderId: string) => {
        setReviewOrderId(orderId);
        setReviewRating(5);
        setReviewComment('');
        setReviewModalOpen(true);
    };

    const handleSubmitReview = async () => {
        if (!dbUserId || !reviewOrderId) return;
        if (!reviewComment.trim()) {
            alert('Please write a comment for your review');
            return;
        }
        setSubmittingReview(true);
        try {
            await createReview({
                user_id: dbUserId,
                order_id: reviewOrderId,
                rating: reviewRating,
                comment: reviewComment.trim(),
            });
            setReviewModalOpen(false);
            setReviewOrderId(null);
            setReviewComment('');
            setReviewRating(5);
            alert('Thank you for your review! It will appear on the website once approved.');
            loadData();
        } catch (err: any) {
            alert('Failed to submit review: ' + (err.message || 'Unknown error'));
        } finally {
            setSubmittingReview(false);
        }
    };

    const hasReviewedOrder = (orderId: string) => {
        return reviews.some(r => r.order_id === orderId);
    };

    if (loading) {
        return (
            <div className="profile-container">
                <Header variant="light" />
                <main className="profile-main">
                    <div className="loading-spinner">Loading...</div>
                </main>
            </div>
        );
    }

    // Not logged in - show login prompt
    if (!user) {
        return (
            <div className="profile-container">
                <Header variant="light" />
                <main className="profile-main">
                    <div className="login-prompt">
                        <img src={logoBird} alt="Shadow Bean Co" className="prompt-logo" />
                        <h1>Welcome to Shadow Bean Co.</h1>
                        <p>Sign in to view your profile, saved blends, and order history.</p>
                        <div className="prompt-buttons">
                            <button className="primary-btn" onClick={() => navigate('/login')}>
                                Sign In
                            </button>
                            <button className="secondary-btn" onClick={() => navigate('/register')}>
                                Create Account
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // Logged in - show profile
    return (
        <div className="profile-container">
            <Header variant="light" />
            <main className="profile-main">
                <div className="profile-card">
                    <div className="profile-header">
                        <div className="profile-avatar">
                            {profile?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="profile-info">
                            <h1>{profile?.full_name || 'Coffee Lover'}</h1>
                            <p>{user.email}</p>
                        </div>
                    </div>

                    <div className="profile-stats">
                        <div className="stat-item">
                            <span className="stat-value">{dataLoading ? '...' : orders.length}</span>
                            <span className="stat-label">Orders</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{dataLoading ? '...' : savedBlends.length}</span>
                            <span className="stat-label">Saved Blends</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{dataLoading ? '...' : reviews.length}</span>
                            <span className="stat-label">Reviews</span>
                        </div>
                    </div>

                    <div className="profile-sections">
                        <div className="section">
                            <h2>Your Saved Blends</h2>
                            {savedBlends.length === 0 ? (
                                <p className="empty-state">No saved blends yet. Create your first custom blend!</p>
                            ) : (
                                <div className="blends-list">
                                    {savedBlends.map(blend => (
                                        <div key={blend.id} className="blend-item" onClick={() => loadBlendIntoShop(blend)}>
                                            <div className="blend-name">{blend.name}</div>
                                            <div className="blend-details">{blend.roast_level} &bull; {blend.grind_type}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <button className="section-btn" onClick={() => navigate('/shop')}>
                                Create Blend
                            </button>
                        </div>

                        <div className="section">
                            <h2>Order History</h2>
                            {orders.length === 0 ? (
                                <p className="empty-state">No orders yet. Start your coffee journey!</p>
                            ) : (
                                <div className="orders-list">
                                    {orders.map(order => (
                                        <div key={order.id} className="order-item">
                                            <div className="order-row">
                                                <span className="order-id">#{order.id.slice(0, 8)}</span>
                                                <span className={`order-status status-${order.status}`}>{order.status}</span>
                                            </div>
                                            <div className="order-row">
                                                <span className="order-date">{new Date(order.created_at).toLocaleDateString()}</span>
                                                <span className="order-total">&#8377;{order.total_amount}</span>
                                            </div>
                                            {order.status === 'delivered' && !hasReviewedOrder(order.id) && (
                                                <button
                                                    className="review-btn"
                                                    onClick={() => openReviewModal(order.id)}
                                                >
                                                    ⭐ Write a Review
                                                </button>
                                            )}
                                            {order.status === 'delivered' && hasReviewedOrder(order.id) && (
                                                <span className="review-done">✅ Review submitted</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            <button className="section-btn" onClick={() => navigate('/shop')}>
                                Shop Now
                            </button>
                        </div>
                    </div>

                    <button className="logout-btn" onClick={handleLogout}>
                        Sign Out
                    </button>
                </div>
            </main>

            {/* Review Modal */}
            {reviewModalOpen && (
                <div className="review-modal-overlay" onClick={() => setReviewModalOpen(false)}>
                    <div className="review-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Write a Review</h3>
                        <p className="review-modal-subtitle">
                            Share your experience with your coffee order
                        </p>

                        <div className="rating-picker">
                            <label>Rating</label>
                            <div className="stars">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        className={`star-btn ${star <= reviewRating ? 'active' : ''}`}
                                        onClick={() => setReviewRating(star)}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="comment-field">
                            <label>Your Review</label>
                            <textarea
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                placeholder="Tell us about your experience with Shadow Bean Co. coffee..."
                                rows={4}
                            />
                        </div>

                        <div className="review-modal-actions">
                            <button
                                className="secondary-btn"
                                onClick={() => setReviewModalOpen(false)}
                                disabled={submittingReview}
                            >
                                Cancel
                            </button>
                            <button
                                className="primary-btn"
                                onClick={handleSubmitReview}
                                disabled={submittingReview || !reviewComment.trim()}
                            >
                                {submittingReview ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
