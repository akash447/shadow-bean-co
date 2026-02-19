import React, { useEffect, useState } from 'react';
import { getOrders, getOrderDetail, updateOrderStatus, cancelOrder, subscribeToOrders } from '../lib/admin-api';
import { Search, XCircle, AlertTriangle, ChevronRight, Package, MapPin, Phone, Mail, User, Clock, CreditCard, X } from 'lucide-react';

const statusOptions = [
    { value: 'pending', label: 'Pending', color: '#f59e0b', bg: '#fef3c7' },
    { value: 'confirmed', label: 'Confirmed', color: '#3b82f6', bg: '#dbeafe' },
    { value: 'processing', label: 'Processing', color: '#8b5cf6', bg: '#ede9fe' },
    { value: 'shipped', label: 'Shipped', color: '#10b981', bg: '#d1fae5' },
    { value: 'delivered', label: 'Delivered', color: '#059669', bg: '#a7f3d0' },
    { value: 'cancelled', label: 'Cancelled', color: '#ef4444', bg: '#fee2e2' },
];

export const OrdersPage: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');

    // Detail panel
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [orderDetail, setOrderDetail] = useState<any>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Cancel modal state
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        loadOrders();
        const unsubscribe = subscribeToOrders(() => {
            console.log('Orders updated, reloading...');
            loadOrders();
        });
        return () => { unsubscribe(); };
    }, []);

    const loadOrders = async () => {
        const { data, error } = await getOrders();
        if (error) {
            console.error('Failed to load orders:', error);
            alert('Failed to load orders: ' + error.message);
        }
        if (!error && data) setOrders(data);
        setLoading(false);
    };

    const loadOrderDetail = async (orderId: string) => {
        setDetailLoading(true);
        setSelectedOrderId(orderId);
        const { data, error } = await getOrderDetail(orderId);
        if (error) {
            console.error('Failed to load order detail:', error);
            alert('Failed to load order details: ' + error.message);
            setDetailLoading(false);
            return;
        }
        setOrderDetail(data);
        setDetailLoading(false);
    };

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        if (newStatus === 'cancelled') {
            const order = orders.find(o => o.id === orderId);
            setSelectedOrder(order);
            setCancelModalOpen(true);
            return;
        }
        const { data, error } = await updateOrderStatus(orderId, newStatus);
        if (error) {
            console.error('Status update failed:', error);
            alert('Failed to update status: ' + error.message);
            return;
        }
        console.log('Status updated:', data);
        loadOrders();
        // Refresh detail if open
        if (selectedOrderId === orderId) loadOrderDetail(orderId);
    };

    const handleCancelOrder = async () => {
        if (!selectedOrder || !cancelReason.trim()) {
            alert('Please provide a reason for cancellation');
            return;
        }
        setCancelling(true);
        const { data, error } = await cancelOrder(selectedOrder.id, cancelReason);
        if (error) {
            console.error('Cancel failed:', error);
            alert('Failed to cancel order: ' + error.message);
            setCancelling(false);
            return;
        }
        console.log('Order cancelled:', data);
        setCancelModalOpen(false);
        setSelectedOrder(null);
        setCancelReason('');
        loadOrders();
        if (selectedOrderId === selectedOrder.id) loadOrderDetail(selectedOrder.id);
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
        const opt = statusOptions.find(s => s.value === status);
        return (
            <span style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                color: opt?.color || '#666', background: opt?.bg || '#f0f0f0',
            }}>
                {opt?.label || status}
            </span>
        );
    };

    const formatDate = (d: string) => {
        if (!d) return '—';
        const date = new Date(d);
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            + ' ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    const parseAddress = (addr: any) => {
        if (!addr) return null;
        if (typeof addr === 'string') {
            try { return JSON.parse(addr); } catch { return null; }
        }
        return addr;
    };

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading orders...</div>;

    return (
        <div style={{ display: 'flex', gap: 0, height: '100%' }}>
            {/* Orders List */}
            <div style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
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
                                    <tr
                                        key={order.id}
                                        onClick={() => loadOrderDetail(order.id)}
                                        style={{
                                            cursor: 'pointer',
                                            ...(order.status === 'cancelled' ? { opacity: 0.6, background: '#fff5f5' } : {}),
                                            ...(selectedOrderId === order.id ? { background: '#f0f7ff', borderLeft: '3px solid #3b82f6' } : {}),
                                        }}
                                    >
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <code style={{ background: '#f0f0f0', padding: '4px 8px', borderRadius: '4px', fontSize: 12 }}>
                                                    {order.id?.slice(0, 8)}...
                                                </code>
                                                <ChevronRight size={14} color="#999" />
                                            </div>
                                        </td>
                                        <td>
                                            <div>{order.user_name || 'Unknown'}</div>
                                            <div style={{ fontSize: '12px', color: '#666' }}>{order.user_email}</div>
                                        </td>
                                        <td style={{ fontWeight: '600' }}>₹{order.total_amount?.toLocaleString() || 0}</td>
                                        <td>{getStatusBadge(order.status)}</td>
                                        <td style={{ fontSize: 13 }}>{formatDate(order.created_at)}</td>
                                        <td onClick={(e) => e.stopPropagation()}>
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
                                                            background: '#dc3545', color: 'white', border: 'none',
                                                            padding: '6px 12px', borderRadius: '4px', cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px'
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
            </div>

            {/* Order Detail Slide Panel */}
            {selectedOrderId && (
                <div style={{
                    width: 420, minWidth: 420, borderLeft: '1px solid #e5e0d8',
                    background: '#faf8f5', overflow: 'auto', padding: 0,
                }}>
                    {detailLoading ? (
                        <div style={{ padding: 40, textAlign: 'center', color: '#8b7355' }}>Loading details...</div>
                    ) : orderDetail ? (
                        <div>
                            {/* Header */}
                            <div style={{
                                padding: '20px 24px', borderBottom: '1px solid #e5e0d8',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                background: '#fff', position: 'sticky', top: 0, zIndex: 1,
                            }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 16, color: '#2c1810' }}>
                                        Order #{orderDetail.id?.slice(0, 8)}
                                    </h3>
                                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#8b7355' }}>
                                        {formatDate(orderDetail.created_at)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setSelectedOrderId(null); setOrderDetail(null); }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                                >
                                    <X size={20} color="#666" />
                                </button>
                            </div>

                            {/* Status */}
                            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e0d8', background: '#fff' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: 13, color: '#666', fontWeight: 500 }}>Status</span>
                                    {getStatusBadge(orderDetail.status)}
                                </div>
                                {orderDetail.cancellation_reason && (
                                    <div style={{
                                        marginTop: 10, padding: '10px 12px', background: '#fee2e2',
                                        borderRadius: 8, fontSize: 13, color: '#991b1b'
                                    }}>
                                        <strong>Reason:</strong> {orderDetail.cancellation_reason}
                                    </div>
                                )}
                            </div>

                            {/* Customer Info */}
                            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e0d8', background: '#fff' }}>
                                <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#2c1810', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <User size={16} /> Customer
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#444' }}>
                                        <User size={14} color="#8b7355" />
                                        {orderDetail.user_name || 'Unknown'}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#444' }}>
                                        <Mail size={14} color="#8b7355" />
                                        {orderDetail.user_email || '—'}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#444' }}>
                                        <Phone size={14} color="#8b7355" />
                                        {orderDetail.user_phone || '—'}
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Address */}
                            {(() => {
                                const addr = parseAddress(orderDetail.shipping_address);
                                if (!addr) return null;
                                return (
                                    <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e0d8', background: '#fff' }}>
                                        <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#2c1810', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <MapPin size={16} /> Delivery Address
                                        </h4>
                                        <div style={{ fontSize: 13, color: '#444', lineHeight: 1.6 }}>
                                            {addr.name && <div style={{ fontWeight: 600 }}>{addr.name}</div>}
                                            {addr.line1 && <div>{addr.line1}</div>}
                                            {addr.line2 && <div>{addr.line2}</div>}
                                            {addr.address && <div>{addr.address}</div>}
                                            {addr.street && <div>{addr.street}</div>}
                                            <div>
                                                {[addr.city, addr.state, addr.pincode || addr.zip || addr.postal_code].filter(Boolean).join(', ')}
                                            </div>
                                            {addr.phone && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                                    <Phone size={12} color="#8b7355" />
                                                    {addr.phone}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Payment */}
                            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e0d8', background: '#fff' }}>
                                <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#2c1810', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <CreditCard size={16} /> Payment
                                </h4>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                    <span style={{ color: '#666' }}>Total Amount</span>
                                    <span style={{ fontWeight: 700, fontSize: 16, color: '#2c1810' }}>
                                        ₹{orderDetail.total_amount?.toLocaleString() || 0}
                                    </span>
                                </div>
                                {orderDetail.razorpay_payment_id && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 6, color: '#888' }}>
                                        <span>Payment ID</span>
                                        <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: 3 }}>
                                            {orderDetail.razorpay_payment_id}
                                        </code>
                                    </div>
                                )}
                            </div>

                            {/* Order Items */}
                            <div style={{ padding: '16px 24px', background: '#fff' }}>
                                <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#2c1810', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Package size={16} /> Items ({orderDetail.items?.length || 0})
                                </h4>
                                {orderDetail.items?.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {orderDetail.items.map((item: any, idx: number) => (
                                            <div key={idx} style={{
                                                padding: '12px 14px', borderRadius: 10,
                                                background: '#faf8f5', border: '1px solid #e5e0d8',
                                            }}>
                                                <div style={{ fontWeight: 600, fontSize: 13, color: '#2c1810', marginBottom: 4 }}>
                                                    {item.taste_profile_name || item.profile_name || `Item ${idx + 1}`}
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666' }}>
                                                    <span>Qty: {item.quantity}</span>
                                                    <span>₹{item.unit_price?.toLocaleString() || 0}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ fontSize: 13, color: '#999' }}>No item details available</p>
                                )}
                            </div>

                            {/* Status Timeline */}
                            <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e0d8', background: '#fff' }}>
                                <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#2c1810', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Clock size={16} /> Timeline
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                    {[
                                        { key: 'created_at', label: 'Order Placed', always: true },
                                        { key: 'confirmed', label: 'Confirmed', status: 'confirmed' },
                                        { key: 'processing', label: 'Processing', status: 'processing' },
                                        { key: 'shipped', label: 'Shipped', status: 'shipped' },
                                        { key: 'delivered', label: 'Delivered', status: 'delivered' },
                                        { key: 'cancelled_at', label: 'Cancelled', status: 'cancelled' },
                                    ].map((step, i) => {
                                        const currentIdx = statusOptions.findIndex(s => s.value === orderDetail.status);
                                        const stepIdx = statusOptions.findIndex(s => s.value === step.status);
                                        const isActive = step.always || (step.status === 'cancelled' ? orderDetail.status === 'cancelled' : stepIdx <= currentIdx);
                                        const date = step.key === 'created_at' ? orderDetail.created_at :
                                            step.key === 'cancelled_at' ? orderDetail.cancelled_at : null;
                                        return (
                                            <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 12 }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <div style={{
                                                        width: 10, height: 10, borderRadius: '50%',
                                                        background: isActive ? '#10b981' : '#ddd', flexShrink: 0
                                                    }} />
                                                    {i < 5 && <div style={{ width: 2, flex: 1, background: '#eee', marginTop: 2 }} />}
                                                </div>
                                                <div style={{ paddingBottom: 4 }}>
                                                    <div style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? '#2c1810' : '#bbb' }}>
                                                        {step.label}
                                                    </div>
                                                    {date && <div style={{ fontSize: 11, color: '#999' }}>{formatDate(date)}</div>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
                            Select an order to view details
                        </div>
                    )}
                </div>
            )}

            {/* Cancel Order Modal */}
            {cancelModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: 'white', borderRadius: '12px', padding: '24px',
                        maxWidth: '450px', width: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
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
                            background: '#fff3cd', padding: '12px', borderRadius: '8px',
                            marginBottom: '20px', fontSize: '13px', color: '#856404'
                        }}>
                            <strong>Note:</strong> The customer will be notified about this cancellation.
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => {
                                    setCancelModalOpen(false);
                                    setSelectedOrder(null);
                                    setCancelReason('');
                                }}
                                style={{
                                    padding: '10px 20px', background: '#e0e0e0', border: 'none',
                                    borderRadius: '6px', cursor: 'pointer'
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
                                    color: 'white', border: 'none', borderRadius: '6px',
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
