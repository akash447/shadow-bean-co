import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import { UserPlus, Shield, Trash2, Mail, Key, Check, X, Users } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.shadowbeanco.net';
const api = axios.create({ baseURL: API_BASE_URL, timeout: 15000, headers: { 'Content-Type': 'application/json' } });
api.interceptors.request.use(async (config) => {
    try { const s = await fetchAuthSession(); const t = s.tokens?.idToken?.toString(); if (t) config.headers.Authorization = `Bearer ${t}`; } catch {} return config;
});

interface AdminUser {
    id: string;
    user_id: string;
    email: string;
    role: 'admin' | 'moderator';
    is_active: boolean;
    created_at: string;
}

export const AccessPage: React.FC = () => {
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newAdmin, setNewAdmin] = useState({
        user_id: '',
        email: '',
        role: 'admin' as 'admin' | 'moderator',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadAdmins();
    }, []);

    const loadAdmins = async () => {
        try {
            const { data } = await api.get('/admin/access');
            setAdmins(data || []);
        } catch (err) {
            console.error('Failed to load admins:', err);
        }
        setLoading(false);
    };

    const handleAddAdmin = async () => {
        if (!newAdmin.user_id || !newAdmin.email) {
            alert('Please fill in all fields');
            return;
        }

        setSaving(true);
        try {
            await api.post('/admin/access', {
                user_id: newAdmin.user_id,
                email: newAdmin.email,
                role: newAdmin.role,
                is_active: true,
            });
            setShowAddForm(false);
            setNewAdmin({ user_id: '', email: '', role: 'admin' });
            loadAdmins();
        } catch (err: any) {
            alert('Error adding admin: ' + (err.response?.data?.error || err.message));
        }
        setSaving(false);
    };

    const toggleActive = async (id: string, currentState: boolean) => {
        try {
            await api.put(`/admin/access/${id}`, { is_active: !currentState });
        } catch (err) {
            console.error('Toggle failed:', err);
        }
        loadAdmins();
    };

    const deleteAdmin = async (id: string) => {
        if (window.confirm('Are you sure you want to remove this admin?')) {
            try {
                await api.delete(`/admin/access/${id}`);
            } catch (err) {
                console.error('Delete failed:', err);
            }
            loadAdmins();
        }
    };

    const generateUserId = () => {
        const id = 'admin_' + Math.random().toString(36).substr(2, 9);
        setNewAdmin({ ...newAdmin, user_id: id });
    };

    if (loading) {
        return <div>Loading access settings...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Admin Access</h1>
                <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
                    <UserPlus size={18} />
                    Add Admin User
                </button>
            </div>

            {/* Add Admin Form */}
            {showAddForm && (
                <div className="card" style={{ marginBottom: '24px' }}>
                    <h3 className="card-title" style={{ marginBottom: '16px' }}>
                        <UserPlus size={20} style={{ marginRight: '8px' }} />
                        Add New Admin User
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">User ID</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newAdmin.user_id}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, user_id: e.target.value })}
                                    placeholder="admin_xyz123"
                                />
                                <button className="btn btn-outline btn-sm" onClick={generateUserId} title="Generate ID">
                                    <Key size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-input"
                                value={newAdmin.email}
                                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                placeholder="user@example.com"
                            />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Role</label>
                            <select
                                className="form-input"
                                value={newAdmin.role}
                                onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value as 'admin' | 'moderator' })}
                            >
                                <option value="admin">Admin (Full Access)</option>
                                <option value="moderator">Moderator (Limited)</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                        <button className="btn btn-primary" onClick={handleAddAdmin} disabled={saving}>
                            {saving ? 'Adding...' : 'Add Admin'}
                        </button>
                        <button className="btn btn-outline" onClick={() => setShowAddForm(false)}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Info Card */}
            <div className="card" style={{ marginBottom: '24px', background: '#e8f5e9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Shield size={24} color="#4a5d4a" />
                    <div>
                        <strong>Master Admin Access</strong>
                        <p style={{ color: '#555', marginTop: '4px', fontSize: '14px' }}>
                            Only the Master Admin (User ID: admin_master_001) can add or remove other admin users.
                            Admin users can login via User ID or Email with password.
                        </p>
                    </div>
                </div>
            </div>

            {/* Admin Users Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">
                        <Users size={20} style={{ marginRight: '8px' }} />
                        Admin Users ({admins.length})
                    </h3>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>User ID</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Added</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {admins.map((admin) => (
                                <tr key={admin.id}>
                                    <td>
                                        <code style={{ background: '#f0f0f0', padding: '4px 8px', borderRadius: '4px' }}>
                                            {admin.user_id}
                                        </code>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Mail size={14} color="#8b7355" />
                                            {admin.email}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${admin.role === 'admin' ? 'badge-info' : 'badge-warning'}`}>
                                            {admin.role}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${admin.is_active ? 'badge-success' : 'badge-danger'}`}>
                                            {admin.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>{new Date(admin.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                className={`btn btn-sm ${admin.is_active ? 'btn-outline' : 'btn-secondary'}`}
                                                onClick={() => toggleActive(admin.id, admin.is_active)}
                                                title={admin.is_active ? 'Deactivate' : 'Activate'}
                                            >
                                                {admin.is_active ? <X size={14} /> : <Check size={14} />}
                                            </button>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => deleteAdmin(admin.id)}
                                                title="Remove"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {admins.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#8b7355' }}>
                        No admin users yet. Add one above.
                    </div>
                )}
            </div>
        </div>
    );
};
