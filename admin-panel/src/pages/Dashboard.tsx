import React, { useEffect, useState } from 'react';
import { getDashboardStats } from '../lib/admin-api';
import { Users, ShoppingCart, DollarSign, Star, Clock } from 'lucide-react';

export const Dashboard: React.FC = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalReviews: 0,
        pendingOrders: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await getDashboardStats();
            setStats(data);
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div>Loading dashboard...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '12px', background: '#e8f5e9', borderRadius: '12px' }}>
                            <Users size={24} color="#4a5d4a" />
                        </div>
                        <div>
                            <div className="stat-label">Total Users</div>
                            <div className="stat-value">{stats.totalUsers}</div>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '12px', background: '#fff3e0', borderRadius: '12px' }}>
                            <ShoppingCart size={24} color="#e65100" />
                        </div>
                        <div>
                            <div className="stat-label">Total Orders</div>
                            <div className="stat-value">{stats.totalOrders}</div>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '12px', background: '#e3f2fd', borderRadius: '12px' }}>
                            <DollarSign size={24} color="#1976d2" />
                        </div>
                        <div>
                            <div className="stat-label">Total Revenue</div>
                            <div className="stat-value">₹{stats.totalRevenue.toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '12px', background: '#fce4ec', borderRadius: '12px' }}>
                            <Star size={24} color="#c2185b" />
                        </div>
                        <div>
                            <div className="stat-label">Reviews</div>
                            <div className="stat-value">{stats.totalReviews}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Quick Stats</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <Clock size={32} color="#ffc107" style={{ marginBottom: '8px' }} />
                        <div style={{ fontSize: '24px', fontWeight: '700' }}>{stats.pendingOrders}</div>
                        <div style={{ color: '#8b7355' }}>Pending Orders</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <ShoppingCart size={32} color="#4a5d4a" style={{ marginBottom: '8px' }} />
                        <div style={{ fontSize: '24px', fontWeight: '700' }}>
                            ₹{Math.round(stats.totalRevenue / (stats.totalOrders || 1)).toLocaleString()}
                        </div>
                        <div style={{ color: '#8b7355' }}>Avg Order Value</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <Star size={32} color="#c2185b" style={{ marginBottom: '8px' }} />
                        <div style={{ fontSize: '24px', fontWeight: '700' }}>4.8</div>
                        <div style={{ color: '#8b7355' }}>Avg Rating</div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Welcome to Shadow Bean Co. Admin</h3>
                </div>
                <p style={{ color: '#8b7355', lineHeight: '1.8' }}>
                    Manage your coffee business from here. Use the sidebar to navigate between different sections:
                </p>
                <ul style={{ marginTop: '16px', paddingLeft: '24px', color: '#8b7355', lineHeight: '2' }}>
                    <li><strong>Users</strong> - View and manage registered customers</li>
                    <li><strong>Orders</strong> - Track and update order statuses</li>
                    <li><strong>Products</strong> - Manage coffee products and variants</li>
                    <li><strong>Reviews</strong> - Moderate customer reviews</li>
                    <li><strong>Pricing</strong> - Update product pricing and discounts</li>
                    <li><strong>Terms</strong> - Edit Terms & Conditions</li>
                    <li><strong>Media</strong> - Upload and manage images</li>
                </ul>
            </div>
        </div>
    );
};
