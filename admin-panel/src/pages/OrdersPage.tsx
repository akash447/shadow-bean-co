import React, { useEffect, useState } from 'react';
import { getOrders, updateOrderStatus, cancelOrder, subscribeToOrders } from '../lib/supabase';
import { Search, XCircle, AlertTriangle } from 'lucide-react';

const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'warning' },
    { value: 'confirmed', label: 'Confirmed', color: 'info' },
    { value: 'processing', label: 'Processing', color: 'info' },
    { value: 'shipped', label: 'Shipped', color: 'success' },
    { value: 'delivered', label: 'Delivered', color: 'success' },
    { value: 'cancelled', label: 'Cancelled', color: 'danger' },
];

export const OrdersPage: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');

    // Cancel modal state
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        loadOrders();

        // Subscribe to real-time updates
        const unsubscribe = subscribeToOrders(() => {
            console.log('Orders updated, reloading...');
            loadOrders();
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const loadOrders = async () => {
        const { data, error } = await getOrders();
        if (!error && data) {
            setOrders(data);
        }
        setLoading(false);
    };

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        if (newStatus === 'cancelled') {
            // Open modal for cancellation
            const order = orders.find(o => o.id === orderId);
            setSelectedOrder(order);
            setCancelModalOpen(true);
            return;
        }
        await updateOrderStatus(orderId, newStatus);
        loadOrders();
    };

    const handleCancelOrder = async () => {
        if (!selectedOrder || !cancelReason.trim()) {
            alert('Please provide a reason for cancellation');
            return;
        }

        setCancelling(true);
        try {
            await cancelOrder(selectedOrder.id, cancelReason);

            // TODO: Trigger notification via Edge Function
            // This would send email/SMS/WhatsApp to customer
            console.log('Order cancelled. Notification to be sent to:', {
                email: selectedOrder.user_email,
                name: selectedOrder.user_name,
                orderId: selectedOrder.id,
                reason: cancelReason
            });

            setCancelModalOpen(false);
            setSelectedOrder(null);
            setCancelReason('');
            loadOrders();
        } catch (error) {
            console.error('Error cancelling order:', error);
            alert('Failed to cancel order. Please try again.');
        }
        setCancelling(false);
    };

    const openCancelModal = (order: any) => {
        setSelectedOrder(order);
        setCancelModalOpen(true);
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.id?.includes(search) ||
            order.user_name?.toLowerCase().includes(search.toLowerCase()) ||
            order.user_email?.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'all' || order.status === filter;
        return matchesSearch && matchesFilter;
    });

    const getStatusBadge = (status: string) => {
        const option = statusOptions.find(s => s.value === status);
        return <span className={`badge badge-${option?.color || 'info'}`}>{option?.label || status}</span>;
    };

    if (loading) {
        return <div>Loading orders...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Orders</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <select
                        className="form-input"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={{ width: '150px' }}
                    >
                        <option value="all">All Status</option>
                        {statusOptions.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8b7355' }} />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search orders..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: '40px', width: '250px' }}
                        />
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order) => (
                                <tr key={order.id} style={order.status === 'cancelled' ? { opacity: 0.6, background: '#fff5f5' } : {}}>
                                    <td>
                                        <code style={{ background: '#f0f0f0', padding: '4px 8px', borderRadius: '4px' }}>
                                            {order.id?.slice(0, 8)}...
                                        </code>
                                    </td>
                                    <td>
                                        <div>{order.user_name || 'Unknown'}</div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>{order.user_email}</div>
                                    </td>
                                    <td style={{ fontWeight: '600' }}>₹{order.total_amount?.toLocaleString() || 0}</td>
                                    <td>{getStatusBadge(order.status)}</td>
                                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <select
                                                className="form-input"
                                                value={order.status}
                                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                                disabled={order.status === 'cancelled' || order.status === 'delivered'}
                                            >
                                                {statusOptions.map(s => (
                                                    <option key={s.value} value={s.value}>{s.label}</option>
                                                ))}
                                            </select>
                                            {order.status !== 'cancelled' && order.status !== 'delivered' && (
                                                <button
                                                    onClick={() => openCancelModal(order)}
                                                    style={{
                                                        background: '#dc3545',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '6px 12px',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    <XCircle size={14} />
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredOrders.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#8b7355' }}>
                        No orders found
                    </div>
                )}
            </div>

            {/* Cancel Order Modal */}
            {cancelModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '24px',
                        maxWidth: '450px',
                        width: '90%',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <AlertTriangle size={24} color="#dc3545" />
                            <h3 style={{ margin: 0, color: '#2c1810' }}>Cancel Order</h3>
                        </div>

                        <p style={{ color: '#666', marginBottom: '16px' }}>
                            Are you sure you want to cancel order <strong>#{selectedOrder?.id?.slice(0, 8)}</strong> for <strong>{selectedOrder?.user_name}</strong>?
                        </p>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                Reason for cancellation *
                            </label>
                            <textarea
                                className="form-input"
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="e.g., Out of stock, Customer request, Payment issue..."
                                style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                            />
                        </div>

                        <div style={{
                            background: '#fff3cd',
                            padding: '12px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            fontSize: '13px',
                            color: '#856404'
                        }}>
                            <strong>Note:</strong> The customer will be notified via email and SMS about this cancellation.
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => {
                                    setCancelModalOpen(false);
                                    setSelectedOrder(null);
                                    setCancelReason('');
                                }}
                                style={{
                                    padding: '10px 20px',
                                    background: '#e0e0e0',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                Keep Order
                            </button>
                            <button
                                onClick={handleCancelOrder}
                                disabled={cancelling || !cancelReason.trim()}
                                style={{
                                    padding: '10px 20px',
                                    background: cancelling || !cancelReason.trim() ? '#ccc' : '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: cancelling || !cancelReason.trim() ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
