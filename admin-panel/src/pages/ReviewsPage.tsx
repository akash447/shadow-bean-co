import React, { useEffect, useState } from 'react';
import { getReviews, deleteReview } from '../lib/admin-api';
import { Star, Trash2 } from 'lucide-react';

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
                <span style={{ color: '#8b7355' }}>{reviews.length} total reviews</span>
            </div>

            {reviews.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <Star size={48} color="#ddd" style={{ marginBottom: '16px' }} />
                    <p style={{ color: '#8b7355' }}>No reviews yet</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {reviews.map((review) => (
                        <div key={review.id} className="card" style={{ marginBottom: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                        <strong>{review.user_name || 'Anonymous'}</strong>
                                        <span style={{ color: '#6B8E23', fontSize: '12px' }}>{review.product_name}</span>
                                        <div style={{ display: 'flex', gap: '2px' }}>
                                            {renderStars(review.rating)}
                                        </div>
                                        <span style={{ color: '#8b7355', fontSize: '14px' }}>
                                            {new Date(review.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p style={{ color: '#555', lineHeight: '1.6' }}>
                                        {review.comment || 'No comment provided'}
                                    </p>
                                </div>
                                <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleDelete(review.id)}
                                    style={{ marginLeft: '16px' }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
