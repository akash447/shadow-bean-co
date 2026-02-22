import React, { useEffect, useState } from 'react';
import {
    getUPIPayments, matchUPIPayment, confirmUPIPayment, ignoreUPIPayment,
    checkGmailNow, getOrders
} from '../lib/admin-api';
import { CheckCircle, XCircle, Link, RefreshCw, X, Mail } from 'lucide-react';

const statusColors: Record<string, { color: string; bg: string }> = {
    unmatched: { color: '#f59e0b', bg: '#fef3c7' },
    matched: { color: '#3b82f6', bg: '#dbeafe' },
    confirmed: { color: '#059669', bg: '#d1fae5' },
    ignored: { color: '#6b7280', bg: '#f3f4f6' },
};

export const UPIPaymentsPage: React.FC = () => {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [checking, setChecking] = useState(false);
    const [lastCheck, setLastCheck] = useState<string | null>(null);

    // Match modal
    const [matchModal, setMatchModal] = useState<any>(null);
    const [pendingOrders, setPendingOrders] = useState<any[]>([]);
    const [selectedOrderId, setSelectedOrderId] = useState('');
    const [matching, setMatching] = useState(false);

    useEffect(() => { loadPayments(); }, [filter]);

    const loadPayments = async () => {
        const { data } = await getUPIPayments(filter);
        if (data) setPayments(data);
        setLoading(false);
    };

    const handleCheckGmail = async () => {
        setChecking(true);
        const { data, error } = await checkGmailNow();
        if (error) { alert('Gmail check failed: ' + error.message); setChecking(false); return; }
        setLastCheck(`Checked ${data?.checked || 0} emails, ${data?.processed || 0} new payments found`);
        setChecking(false);
        loadPayments();
    };

    const openMatchModal = async (payment: any) => {
        setMatchModal(payment);
        setSelectedOrderId('');
        const { data } = await getOrders();
        if (data) {
            const upiPending = data.filter((o: any) =>
                o.payment_method === 'upi' && (!o.payment_status || o.payment_status === 'pending')
            );
            setPendingOrders(upiPending);
        }
    };

    const handleMatch = async () => {
        if (!matchModal || !selectedOrderId) return;
        setMatching(true);
        const { error } = await matchUPIPayment(matchModal.id, selectedOrderId);
        if (error) { alert('Failed to match: ' + error.message); setMatching(false); return; }
        setMatchModal(null);
        setMatching(false);
        loadPayments();
    };

    const handleConfirm = async (id: string) => {
        if (!confirm('Confirm this payment?')) return;
        const { error } = await confirmUPIPayment(id);
        if (error) { alert('Failed: ' + error.message); return; }
        loadPayments();
    };

    const handleIgnore = async (id: string) => {
        if (!confirm('Mark this payment as ignored?')) return;
        const { error } = await ignoreUPIPayment(id);
        if (error) { alert('Failed: ' + error.message); return; }
        loadPayments();
    };

    const formatDate = (d: string) => {
        if (!d) return '-';
        const date = new Date(d);
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            + ' ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusBadge = (status: string) => {
        const s = statusColors[status] || statusColors.unmatched;
        return (
            <span style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                color: s.color, background: s.bg,
            }}>
                {status}
            </span>
        );
    };

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading UPI payments...</div>;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">UPI Payments</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                        onClick={handleCheckGmail}
                        disabled={checking}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: checking ? 0.7 : 1 }}
                    >
                        {checking ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Mail size={16} />}
                        {checking ? 'Checking...' : 'Check Gmail'}
                    </button>
                    <button
                        onClick={loadPayments}
                        className="btn"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#e5e0d8', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                    <select
                        className="form-input"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={{ width: 150 }}
                    >
                        <option value="all">All Status</option>
                        <option value="unmatched">Unmatched</option>
                        <option value="matched">Matched</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="ignored">Ignored</option>
                    </select>
                </div>
            </div>

            {lastCheck && (
                <div style={{ fontSize: 12, color: '#059669', marginBottom: 16, background: '#d1fae5', padding: '8px 14px', borderRadius: 8, display: 'inline-block' }}>
                    {lastCheck}
                </div>
            )}

            <div style={{ fontSize: 12, color: '#8b7355', marginBottom: 16 }}>
                Gmail is checked automatically when customers poll for payment status. Use "Check Gmail" to manually scan for payments.
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Sender</th>
                                <th>Amount</th>
                                <th>UPI Ref</th>
                                <th>Status</th>
                                <th>Matched Order</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((p) => (
                                <tr key={p.id}>
                                    <td style={{ fontSize: 13 }}>{formatDate(p.received_at || p.created_at)}</td>
                                    <td>{p.sender_name || '-'}</td>
                                    <td style={{ fontWeight: 600 }}>₹{p.amount?.toLocaleString() || 0}</td>
                                    <td>
                                        <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: 3, fontSize: 12 }}>
                                            {p.upi_ref || '-'}
                                        </code>
                                    </td>
                                    <td>{getStatusBadge(p.status)}</td>
                                    <td>
                                        {p.matched_order_id ? (
                                            <code style={{ background: '#dbeafe', padding: '2px 6px', borderRadius: 3, fontSize: 12, color: '#1d4ed8' }}>
                                                {p.matched_order_id.slice(0, 8)}...
                                            </code>
                                        ) : '-'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            {p.status === 'unmatched' && (
                                                <>
                                                    <button onClick={() => openMatchModal(p)}
                                                        style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <Link size={12} /> Match
                                                    </button>
                                                    <button onClick={() => handleIgnore(p.id)}
                                                        style={{ background: '#e5e7eb', color: '#374151', border: 'none', padding: '5px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <XCircle size={12} /> Ignore
                                                    </button>
                                                </>
                                            )}
                                            {p.status === 'matched' && (
                                                <button onClick={() => handleConfirm(p.id)}
                                                    style={{ background: '#059669', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <CheckCircle size={12} /> Confirm
                                                </button>
                                            )}
                                            {(p.status === 'confirmed' || p.status === 'ignored') && (
                                                <span style={{ fontSize: 12, color: '#999' }}>-</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {payments.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 40, color: '#8b7355' }}>
                        No UPI payments found
                    </div>
                )}
            </div>

            {/* Match Modal */}
            {matchModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }}>
                    <div style={{
                        background: 'white', borderRadius: 12, padding: 24,
                        maxWidth: 500, width: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ margin: 0, color: '#2c1810' }}>Match Payment to Order</h3>
                            <button onClick={() => setMatchModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={20} color="#666" />
                            </button>
                        </div>

                        <div style={{ background: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
                            <div><strong>Amount:</strong> ₹{matchModal.amount}</div>
                            <div><strong>Sender:</strong> {matchModal.sender_name || 'Unknown'}</div>
                            <div><strong>UPI Ref:</strong> {matchModal.upi_ref || 'N/A'}</div>
                        </div>

                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                            Select pending UPI order to match:
                        </label>
                        <select
                            className="form-input"
                            value={selectedOrderId}
                            onChange={(e) => setSelectedOrderId(e.target.value)}
                            style={{ width: '100%', marginBottom: 16 }}
                        >
                            <option value="">-- Select Order --</option>
                            {pendingOrders.map((o: any) => (
                                <option key={o.id} value={o.id}>
                                    {o.id.slice(0, 8)}... | ₹{o.total_amount} | {o.user_name || o.user_email || 'Unknown'}
                                </option>
                            ))}
                        </select>

                        {pendingOrders.length === 0 && (
                            <p style={{ color: '#ef4444', fontSize: 13 }}>No pending UPI orders found.</p>
                        )}

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setMatchModal(null)}
                                style={{ padding: '10px 20px', background: '#e0e0e0', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                            >Cancel</button>
                            <button
                                onClick={handleMatch}
                                disabled={matching || !selectedOrderId}
                                style={{
                                    padding: '10px 20px',
                                    background: matching || !selectedOrderId ? '#ccc' : '#3b82f6',
                                    color: '#fff', border: 'none', borderRadius: 6,
                                    cursor: matching || !selectedOrderId ? 'not-allowed' : 'pointer',
                                }}
                            >{matching ? 'Matching...' : 'Match Payment'}</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};
