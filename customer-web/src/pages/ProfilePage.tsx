import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAsset } from '../contexts/AssetContext';
import { getOrders, getTasteProfiles, getMyReviews, createReview, getAddresses, createAddress, deleteAddress, updateProfile, getOrderTracking } from '../services/api';
import type { Order, TasteProfile as ApiTasteProfile, Review, Address } from '../services/api';
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
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [dataLoading, setDataLoading] = useState(false);

    // Expand toggles
    const [showAllOrders, setShowAllOrders] = useState(false);
    const [showAllBlends, setShowAllBlends] = useState(false);

    // Address form
    const [showAddrForm, setShowAddrForm] = useState(false);
    const [addrForm, setAddrForm] = useState({ label: '', full_name: '', phone: '', address_line: '', city: '', state: '', pincode: '', country: 'India' });
    const [savingAddr, setSavingAddr] = useState(false);

    // Name editing
    const [editingName, setEditingName] = useState(false);
    const [nameInput, setNameInput] = useState('');
    const [savingName, setSavingName] = useState(false);

    // Review modal state
    // Review modal state
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    // Tracking state
    const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
    const [trackingData, setTrackingData] = useState<any>(null);
    const [trackingLoading, setTrackingLoading] = useState(false);

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
            getMyReviews().catch(() => []),
            getAddresses(dbUserId).catch(() => []),
        ]).then(([ordersData, blendsData, reviewsData, addrsData]) => {
            setOrders(ordersData);
            setSavedBlends(blendsData);
            setReviews(reviewsData);
            setAddresses(addrsData);
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

    const startEditName = () => {
        setNameInput(profile?.full_name || '');
        setEditingName(true);
    };

    const handleSaveName = async () => {
        if (!dbUserId || !nameInput.trim()) return;
        setSavingName(true);
        try {
            await updateProfile(dbUserId, { full_name: nameInput.trim() });
            window.location.reload();
        } catch { /* ignore */ }
        finally { setSavingName(false); }
    };

    const handleSaveAddress = async () => {
        if (!dbUserId || !addrForm.full_name || !addrForm.phone || !addrForm.address_line || !addrForm.city || !addrForm.state || !addrForm.pincode) return;
        setSavingAddr(true);
        try {
            await createAddress({ ...addrForm, user_id: dbUserId, is_default: addresses.length === 0 });
            setAddrForm({ label: '', full_name: '', phone: '', address_line: '', city: '', state: '', pincode: '', country: 'India' });
            setShowAddrForm(false);
            loadData();
        } catch { /* ignore */ }
        finally { setSavingAddr(false); }
    };

    const handleDeleteAddress = async (id: string) => {
        try {
            await deleteAddress(id);
            setAddresses(prev => prev.filter(a => a.id !== id));
        } catch { /* ignore */ }
    };

    const openReviewModal = (orderId: string) => {
        setReviewOrderId(orderId);
        setReviewRating(5);
        setReviewComment('');
        setReviewModalOpen(true);
    };

    const handleSubmitReview = async () => {
        if (!dbUserId || !reviewOrderId) return;
        if (!reviewComment.trim()) return;
        setSubmittingReview(true);
        try {
            await createReview({
                user_id: dbUserId,
                order_id: reviewOrderId,
                rating: reviewRating,
                comment: reviewComment.trim(),
            });
            setReviewModalOpen(false);
            setReviewComment('');
            loadData();
        } catch { /* ignore */ }
        finally { setSubmittingReview(false); }
    };

    const hasReviewedOrder = (orderId: string) => reviews.some(r => r.order_id === orderId);

    const handleTrackOrder = async (orderId: string) => {
        if (trackingOrderId === orderId) { setTrackingOrderId(null); setTrackingData(null); return; }
        setTrackingOrderId(orderId);
        setTrackingLoading(true);
        setTrackingData(null);
        try {
            const data = await getOrderTracking(orderId);
            setTrackingData(data);
            // If tracking has a URL, open it
            const url = data?.tracking?.track_url || data?.tracking_url;
            if (url) window.open(url, '_blank');
        } catch { setTrackingData({ error: true }); }
        finally { setTrackingLoading(false); }
    };

    const statusColor = (s: string) => {
        const map: Record<string, { bg: string; fg: string }> = {
            delivered: { bg: '#d1fae5', fg: '#059669' },
            shipped: { bg: '#d1fae5', fg: '#10b981' },
            processing: { bg: '#ede9fe', fg: '#8b5cf6' },
            confirmed: { bg: '#dbeafe', fg: '#3b82f6' },
            pending: { bg: '#fef3c7', fg: '#f59e0b' },
            cancelled: { bg: '#fee2e2', fg: '#ef4444' },
        };
        return map[s] || { bg: '#F5F0EB', fg: '#5D4037' };
    };

    if (loading) {
        return (
            <div className="profile-container">
                <Header variant="light" />
                <main className="profile-main"><div className="loading-spinner">Loading...</div></main>
            </div>
        );
    }

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
                            <button className="primary-btn" onClick={() => navigate('/login')}>Sign In</button>
                            <button className="secondary-btn" onClick={() => navigate('/register')}>Create Account</button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    const paidOrders = orders.filter(o => o.status !== 'pending');
    const displayOrders = showAllOrders ? paidOrders : paidOrders.slice(0, 2);
    const displayBlends = showAllBlends ? savedBlends : savedBlends.slice(0, 3);

    return (
        <div className="profile-container">
            <Header variant="light" />
            <main className="profile-main dashboard">
                <div className="dashboard-content">

                    {/* ── Profile Header ── */}
                    <div className="dash-header">
                        <div className="profile-avatar">
                            {profile?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="profile-info">
                            {editingName ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <input
                                        value={nameInput}
                                        onChange={e => setNameInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                                        autoFocus
                                        style={{ fontFamily: "'Agdasima', sans-serif", fontSize: 22, fontWeight: 700, color: '#1c0d02', border: '1.5px solid #4f5130', borderRadius: 8, padding: '4px 10px', outline: 'none', width: 180 }}
                                    />
                                    <button onClick={handleSaveName} disabled={savingName} style={{ background: '#4f5130', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                        {savingName ? '...' : 'Save'}
                                    </button>
                                    <button onClick={() => setEditingName(false)} style={{ background: 'none', border: 'none', color: '#98918a', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                                </div>
                            ) : (
                                <h1 style={{ cursor: 'pointer' }} onClick={startEditName} title="Click to edit name">
                                    {profile?.full_name || 'Coffee Lover'} <span style={{ fontSize: 14, color: '#98918a', fontFamily: 'Montserrat', fontWeight: 400 }}>✎</span>
                                </h1>
                            )}
                            <p>{user.email}</p>
                        </div>
                    </div>

                    {/* ── Quick Stats ── */}
                    <div className="profile-stats">
                        <div className="stat-item">
                            <span className="stat-value">{dataLoading ? '...' : paidOrders.length}</span>
                            <span className="stat-label">Orders</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{dataLoading ? '...' : savedBlends.length}</span>
                            <span className="stat-label">Blends</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{dataLoading ? '...' : addresses.length}</span>
                            <span className="stat-label">Addresses</span>
                        </div>
                    </div>

                    {/* ── Dashboard Grid ── */}
                    <div className="dash-grid">

                        {/* Orders Section */}
                        <div className="dash-card">
                            <div className="dash-card-header">
                                <h2>Orders</h2>
                                {paidOrders.length > 2 && (
                                    <button className="toggle-btn" onClick={() => setShowAllOrders(!showAllOrders)}>
                                        {showAllOrders ? 'Show less' : `View all ${paidOrders.length}`}
                                    </button>
                                )}
                            </div>
                            {paidOrders.length === 0 ? (
                                <p className="empty-state">No orders yet. Start your coffee journey!</p>
                            ) : (
                                <div className="orders-list">
                                    {displayOrders.map(order => {
                                        const sc = statusColor(order.status);
                                        return (
                                            <div key={order.id} className="order-item">
                                                <div className="order-row">
                                                    <span className="order-id">#{order.id.slice(0, 8)}</span>
                                                    <span className="order-status" style={{ background: sc.bg, color: sc.fg }}>{order.status}</span>
                                                </div>
                                                <div className="order-row">
                                                    <span className="order-date">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                    <span className="order-total">₹{order.total_amount}</span>
                                                </div>
                                                {order.order_items && order.order_items.filter(Boolean).length > 0 && (
                                                    <div className="order-items-preview">
                                                        {order.order_items.filter(Boolean).map((oi, idx) => (
                                                            <span key={idx} className="order-item-tag">{oi.taste_profile_name} ×{oi.quantity}</span>
                                                        ))}
                                                    </div>
                                                )}
                                                {/* Track Order button for active orders */}
                                                {['confirmed', 'processing', 'shipped'].includes(order.status) && (
                                                    <button
                                                        className="review-btn"
                                                        onClick={() => handleTrackOrder(order.id)}
                                                        style={{ background: '#dbeafe', color: '#2563eb', border: 'none', marginBottom: 4 }}
                                                    >
                                                        {trackingLoading && trackingOrderId === order.id ? 'Loading...' : 'Track Order'}
                                                    </button>
                                                )}
                                                {/* Inline tracking info */}
                                                {trackingOrderId === order.id && trackingData && !trackingLoading && (
                                                    <div style={{ background: '#f0f7ff', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#333', marginBottom: 4 }}>
                                                        {trackingData.tracking?.shipment_track?.[0] ? (() => {
                                                            const t = trackingData.tracking.shipment_track[0];
                                                            return (
                                                                <>
                                                                    <div><strong>Status:</strong> {t.current_status || 'Processing'}</div>
                                                                    {t.courier_name && <div><strong>Courier:</strong> {t.courier_name}</div>}
                                                                    {t.awb_code && <div><strong>AWB:</strong> {t.awb_code}</div>}
                                                                    {t.edd && <div><strong>Est. Delivery:</strong> {new Date(t.edd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>}
                                                                </>
                                                            );
                                                        })() : trackingData.tracking?.track_url ? (
                                                            <div>Tracking available — <a href={trackingData.tracking.track_url} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>View Details</a></div>
                                                        ) : trackingData.message ? (
                                                            <div>{trackingData.message}</div>
                                                        ) : (
                                                            <div>Tracking info will be available once shipped.</div>
                                                        )}
                                                    </div>
                                                )}
                                                {order.status === 'delivered' && !hasReviewedOrder(order.id) && (
                                                    <button className="review-btn" onClick={() => openReviewModal(order.id)}>Write a Review</button>
                                                )}
                                                {order.status === 'delivered' && hasReviewedOrder(order.id) && (
                                                    <span className="review-done">Review submitted</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            <button className="section-btn" onClick={() => navigate('/shop')}>Shop Now</button>
                        </div>

                        {/* Blends Section */}
                        <div className="dash-card">
                            <div className="dash-card-header">
                                <h2>Your Blends</h2>
                                {savedBlends.length > 3 && (
                                    <button className="toggle-btn" onClick={() => setShowAllBlends(!showAllBlends)}>
                                        {showAllBlends ? 'Show less' : `View all ${savedBlends.length}`}
                                    </button>
                                )}
                            </div>
                            {savedBlends.length === 0 ? (
                                <p className="empty-state">No saved blends yet.</p>
                            ) : (
                                <div className="blends-list">
                                    {displayBlends.map(blend => (
                                        <div key={blend.id} className="blend-item" onClick={() => loadBlendIntoShop(blend)}>
                                            <div>
                                                <div className="blend-name">{blend.name}</div>
                                                <div className="blend-details">{blend.roast_level} · {blend.grind_type}</div>
                                            </div>
                                            <span className="blend-reorder">Reorder →</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <button className="section-btn" onClick={() => navigate('/shop')}>Create Blend</button>
                        </div>

                        {/* Addresses Section */}
                        <div className="dash-card dash-card-full">
                            <div className="dash-card-header">
                                <h2>Saved Addresses</h2>
                                <button className="toggle-btn" onClick={() => setShowAddrForm(!showAddrForm)}>
                                    {showAddrForm ? 'Cancel' : '+ Add New'}
                                </button>
                            </div>
                            {showAddrForm && (
                                <div className="addr-form">
                                    <div className="addr-form-grid">
                                        <input placeholder="Label (e.g. Home, Office)" value={addrForm.label} onChange={e => setAddrForm(p => ({ ...p, label: e.target.value }))} />
                                        <input placeholder="Full Name *" value={addrForm.full_name} onChange={e => setAddrForm(p => ({ ...p, full_name: e.target.value }))} />
                                        <input placeholder="Phone *" type="tel" value={addrForm.phone} onChange={e => setAddrForm(p => ({ ...p, phone: e.target.value }))} />
                                        <input placeholder="Address *" value={addrForm.address_line} onChange={e => setAddrForm(p => ({ ...p, address_line: e.target.value }))} style={{ gridColumn: '1 / -1' }} />
                                        <input placeholder="City *" value={addrForm.city} onChange={e => setAddrForm(p => ({ ...p, city: e.target.value }))} />
                                        <input placeholder="State *" value={addrForm.state} onChange={e => setAddrForm(p => ({ ...p, state: e.target.value }))} />
                                        <input placeholder="Pincode *" value={addrForm.pincode} onChange={e => setAddrForm(p => ({ ...p, pincode: e.target.value }))} />
                                    </div>
                                    <button className="primary-btn addr-save-btn" onClick={handleSaveAddress} disabled={savingAddr}>
                                        {savingAddr ? 'Saving...' : 'Save Address'}
                                    </button>
                                </div>
                            )}
                            {addresses.length === 0 && !showAddrForm ? (
                                <p className="empty-state">No saved addresses. Add one to speed up checkout!</p>
                            ) : (
                                <div className="addr-list">
                                    {addresses.map(a => (
                                        <div key={a.id} className="addr-card">
                                            <div className="addr-info">
                                                <div className="addr-label">{a.label || a.full_name}{a.is_default && <span className="addr-default">Default</span>}</div>
                                                <div className="addr-detail">{a.address_line}, {a.city}, {a.state} - {a.pincode}</div>
                                                <div className="addr-phone">{a.phone}</div>
                                            </div>
                                            <button className="addr-delete" onClick={() => handleDeleteAddress(a.id)} title="Delete">×</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <button className="logout-btn" onClick={handleLogout}>Sign Out</button>
                </div>
            </main>

            {/* Review Modal */}
            {reviewModalOpen && (
                <div className="review-modal-overlay" onClick={() => setReviewModalOpen(false)}>
                    <div className="review-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Write a Review</h3>
                        <p className="review-modal-subtitle">Share your experience with your coffee order</p>
                        <div className="rating-picker">
                            <label>Rating</label>
                            <div className="stars">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button key={star} className={`star-btn ${star <= reviewRating ? 'active' : ''}`} onClick={() => setReviewRating(star)}>★</button>
                                ))}
                            </div>
                        </div>
                        <div className="comment-field">
                            <label>Your Review</label>
                            <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                                placeholder="Tell us about your experience..." rows={4} />
                        </div>
                        <div className="review-modal-actions">
                            <button className="secondary-btn" onClick={() => setReviewModalOpen(false)} disabled={submittingReview}>Cancel</button>
                            <button className="primary-btn" onClick={handleSubmitReview} disabled={submittingReview || !reviewComment.trim()}>
                                {submittingReview ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
