import React, { useEffect, useState } from 'react';
import { getReviews, deleteReview, updateReview } from '../lib/admin-api';
import { Star, Trash2, CheckCircle, XCircle } from 'lucide-react';

export const ReviewsPage: React.FC = () => {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReviews();
    }, []);

    const loadReviews = async () => {
        const { data, error } = await getReviews();
        if (!error && data) {
            setReviews(data);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this review?')) {
            await deleteReview(id);
            loadReviews();
        }
    };

    const handleToggleApproval = async (id: string, currentlyApproved: boolean) => {
        await updateReview(id, { is_approved: !currentlyApproved });
        loadReviews();
    };

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }).map((_, i) => (
            <Star
                key={i}
                size={14}
                fill={i < rating ? '#ffc107' : 'none'}
                color={i < rating ? '#ffc107' : '#ddd'}
            />
        ));
    };

    if (loading) {
        return <div>Loading reviews...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Reviews</h1>
                <span style={{ color: '#8b7355' }}>
                    {reviews.length} total &middot; {reviews.filter(r => r.is_approved).length} approved
                </span>
            </div>

            {reviews.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <Star size={48} color="#ddd" style={{ marginBottom: '16px' }} />
                    <p style={{ color: '#8b7355' }}>No reviews yet</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {reviews.map((review) => (
                        <div key={review.id} className="card" style={{
                            marginBottom: 0,
                            borderLeft: `4px solid ${review.is_approved ? '#16a34a' : '#f59e0b'}`,
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                        <strong>{review.user_name || 'Anonymous'}</strong>
                                        <div style={{ display: 'flex', gap: '2px' }}>
                                            {renderStars(review.rating)}
                                        </div>
                                        <span style={{
                                            padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                                            background: review.is_approved ? '#dcfce7' : '#fef3c7',
                                            color: review.is_approved ? '#16a34a' : '#d97706',
                                        }}>
                                            {review.is_approved ? 'Approved' : 'Pending'}
                                        </span>
                                        <span style={{ color: '#8b7355', fontSize: '13px' }}>
                                            {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <p style={{ color: '#555', lineHeight: '1.6', margin: 0 }}>
                                        {review.comment || 'No comment provided'}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginLeft: '16px', flexShrink: 0 }}>
                                    <button
                                        className={`btn btn-sm ${review.is_approved ? 'btn-outline' : 'btn-secondary'}`}
                                        onClick={() => handleToggleApproval(review.id, review.is_approved)}
                                        title={review.is_approved ? 'Unapprove — hide from website' : 'Approve — show on website'}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '4px',
                                            color: review.is_approved ? '#d97706' : '#16a34a',
                                            borderColor: review.is_approved ? '#fbbf24' : '#86efac',
                                        }}
                                    >
                                        {review.is_approved ? <XCircle size={14} /> : <CheckCircle size={14} />}
                                        {review.is_approved ? 'Unapprove' : 'Approve'}
                                    </button>
                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => handleDelete(review.id)}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
