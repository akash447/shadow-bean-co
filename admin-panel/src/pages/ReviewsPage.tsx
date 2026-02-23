import React, { useEffect, useState } from 'react';
import { getReviews, deleteReview, updateReview } from '../lib/admin-api';
import { Star, Trash2, CheckCircle, XCircle, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 15;

interface ReviewGroup {
    userName: string;
    userId: string;
    reviews: any[];
    topReview: any;
}

export const ReviewsPage: React.FC = () => {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(1);

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

    // Group reviews by user, sort: approved first, then highest rated
    const grouped: ReviewGroup[] = (() => {
        const userMap = new Map<string, any[]>();
        reviews.forEach(r => {
            const key = r.user_id || r.id;
            if (!userMap.has(key)) userMap.set(key, []);
            userMap.get(key)!.push(r);
        });

        const groups: ReviewGroup[] = [];
        userMap.forEach((userReviews, userId) => {
            // Sort within user: approved first, then highest rated, then newest
            userReviews.sort((a: any, b: any) => {
                if (a.is_approved !== b.is_approved) return a.is_approved ? -1 : 1;
                if (a.rating !== b.rating) return b.rating - a.rating;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
            groups.push({
                userName: userReviews[0].user_name || 'Anonymous',
                userId,
                reviews: userReviews,
                topReview: userReviews[0],
            });
        });

        // Sort groups: those with approved reviews first, then by highest rating of top review
        groups.sort((a, b) => {
            const aApproved = a.reviews.some((r: any) => r.is_approved);
            const bApproved = b.reviews.some((r: any) => r.is_approved);
            if (aApproved !== bApproved) return aApproved ? -1 : 1;
            return b.topReview.rating - a.topReview.rating;
        });

        return groups;
    })();

    const totalPages = Math.ceil(grouped.length / PAGE_SIZE);
    const pagedGroups = grouped.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const toggleExpand = (userId: string) => {
        setExpandedUsers(prev => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    };

    if (loading) {
        return <div>Loading reviews...</div>;
    }

    const totalApproved = reviews.filter(r => r.is_approved).length;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Reviews</h1>
                <span style={{ color: '#8b7355' }}>
                    {reviews.length} total &middot; {totalApproved} approved &middot; {grouped.length} users
                </span>
            </div>

            {reviews.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <Star size={48} color="#ddd" style={{ marginBottom: '16px' }} />
                    <p style={{ color: '#8b7355' }}>No reviews yet</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                    {pagedGroups.map((group) => {
                        const isExpanded = expandedUsers.has(group.userId);
                        const hasMultiple = group.reviews.length > 1;
                        const approvedCount = group.reviews.filter((r: any) => r.is_approved).length;

                        return (
                            <div key={group.userId} className="card" style={{
                                marginBottom: 0,
                                borderLeft: `4px solid ${approvedCount > 0 ? '#16a34a' : '#f59e0b'}`,
                            }}>
                                {/* Top review (always visible) */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                            <strong>{group.userName}</strong>
                                            <div style={{ display: 'flex', gap: '2px' }}>
                                                {renderStars(group.topReview.rating)}
                                            </div>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                                                background: group.topReview.is_approved ? '#dcfce7' : '#fef3c7',
                                                color: group.topReview.is_approved ? '#16a34a' : '#d97706',
                                            }}>
                                                {group.topReview.is_approved ? 'Approved' : 'Pending'}
                                            </span>
                                            {hasMultiple && (
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                                                    background: '#e0e7ff', color: '#4338ca',
                                                }}>
                                                    {group.reviews.length} reviews
                                                </span>
                                            )}
                                            <span style={{ color: '#8b7355', fontSize: '13px' }}>
                                                {new Date(group.topReview.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <p style={{ color: '#555', lineHeight: '1.6', margin: 0 }}>
                                            {group.topReview.comment || 'No comment provided'}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', marginLeft: '16px', flexShrink: 0 }}>
                                        <button
                                            className={`btn btn-sm ${group.topReview.is_approved ? 'btn-outline' : 'btn-secondary'}`}
                                            onClick={() => handleToggleApproval(group.topReview.id, group.topReview.is_approved)}
                                            title={group.topReview.is_approved ? 'Unapprove' : 'Approve'}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '4px',
                                                color: group.topReview.is_approved ? '#d97706' : '#16a34a',
                                                borderColor: group.topReview.is_approved ? '#fbbf24' : '#86efac',
                                            }}
                                        >
                                            {group.topReview.is_approved ? <XCircle size={14} /> : <CheckCircle size={14} />}
                                            {group.topReview.is_approved ? 'Unapprove' : 'Approve'}
                                        </button>
                                        <button
                                            className="btn btn-sm btn-danger"
                                            onClick={() => handleDelete(group.topReview.id)}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Expand/collapse for multiple reviews */}
                                {hasMultiple && (
                                    <>
                                        <button
                                            onClick={() => toggleExpand(group.userId)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 6,
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                fontSize: 12, fontWeight: 600, color: '#4f5130',
                                                padding: '8px 0 0', marginTop: 8,
                                            }}
                                        >
                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            {isExpanded ? 'Hide' : 'View all'} {group.reviews.length - 1} more review{group.reviews.length - 1 > 1 ? 's' : ''}
                                        </button>

                                        {isExpanded && (
                                            <div style={{
                                                marginTop: 12, paddingTop: 12,
                                                borderTop: '1px solid #e5e0d8',
                                                display: 'flex', flexDirection: 'column', gap: 10,
                                            }}>
                                                {group.reviews.slice(1).map((review: any) => (
                                                    <div key={review.id} style={{
                                                        padding: '12px 14px', borderRadius: 10,
                                                        background: '#faf8f5', border: '1px solid #e5e0d8',
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                                                                    <div style={{ display: 'flex', gap: '2px' }}>
                                                                        {renderStars(review.rating)}
                                                                    </div>
                                                                    <span style={{
                                                                        padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600,
                                                                        background: review.is_approved ? '#dcfce7' : '#fef3c7',
                                                                        color: review.is_approved ? '#16a34a' : '#d97706',
                                                                    }}>
                                                                        {review.is_approved ? 'Approved' : 'Pending'}
                                                                    </span>
                                                                    <span style={{ color: '#8b7355', fontSize: 12 }}>
                                                                        {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                    </span>
                                                                </div>
                                                                <p style={{ color: '#555', lineHeight: '1.5', margin: 0, fontSize: 13 }}>
                                                                    {review.comment || 'No comment'}
                                                                </p>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: 6, marginLeft: 12, flexShrink: 0 }}>
                                                                <button
                                                                    className={`btn btn-sm ${review.is_approved ? 'btn-outline' : 'btn-secondary'}`}
                                                                    onClick={() => handleToggleApproval(review.id, review.is_approved)}
                                                                    style={{
                                                                        display: 'flex', alignItems: 'center', gap: 4,
                                                                        color: review.is_approved ? '#d97706' : '#16a34a',
                                                                        borderColor: review.is_approved ? '#fbbf24' : '#86efac',
                                                                        fontSize: 11, padding: '4px 8px',
                                                                    }}
                                                                >
                                                                    {review.is_approved ? <XCircle size={12} /> : <CheckCircle size={12} />}
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-danger"
                                                                    onClick={() => handleDelete(review.id)}
                                                                    style={{ padding: '4px 8px' }}
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 0', marginTop: 8,
                }}>
                    <span style={{ fontSize: 13, color: '#8b7355' }}>
                        Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, grouped.length)} of {grouped.length} users
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
                                background: page === 1 ? '#f0f0f0' : '#fff', border: '1px solid #e5e0d8',
                                borderRadius: 6, cursor: page === 1 ? 'not-allowed' : 'pointer',
                                color: page === 1 ? '#ccc' : '#2c1810', fontSize: 13,
                            }}
                        >
                            <ChevronLeft size={14} /> Prev
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                style={{
                                    padding: '6px 10px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
                                    background: p === page ? '#4f5130' : '#fff',
                                    color: p === page ? '#fff' : '#2c1810',
                                    border: `1px solid ${p === page ? '#4f5130' : '#e5e0d8'}`,
                                    fontWeight: p === page ? 700 : 400,
                                }}
                            >{p}</button>
                        ))}
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
                                background: page === totalPages ? '#f0f0f0' : '#fff', border: '1px solid #e5e0d8',
                                borderRadius: 6, cursor: page === totalPages ? 'not-allowed' : 'pointer',
                                color: page === totalPages ? '#ccc' : '#2c1810', fontSize: 13,
                            }}
                        >
                            Next <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
