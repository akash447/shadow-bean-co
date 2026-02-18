import React, { useEffect, useState } from 'react';
import { getOffers, createOffer, updateOffer, deleteOffer } from '../lib/admin-api';
import { Plus, Save, Edit2, X, Trash2, Tag, ToggleLeft, ToggleRight } from 'lucide-react';

interface Offer {
    id: string;
    code: string;
    description: string;
    type: string;
    value: number;
    min_order: number;
    max_uses: number;
    used_count: number;
    is_active: boolean;
    expires_at: string | null;
    created_at: string;
}

const emptyOffer = { code: '', description: '', type: 'percentage', value: 0, min_order: 0, max_uses: 0, is_active: true, expires_at: '' };

export const OffersPage: React.FC = () => {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [showAdd, setShowAdd] = useState(false);
    const [newOffer, setNewOffer] = useState({ ...emptyOffer });

    useEffect(() => { load(); }, []);

    const load = async () => {
        const { data, error } = await getOffers();
        if (!error && data) setOffers(data);
        setLoading(false);
    };

    const handleCreate = async () => {
        const payload = { ...newOffer, expires_at: newOffer.expires_at || null };
        await createOffer(payload);
        setShowAdd(false);
        setNewOffer({ ...emptyOffer });
        load();
    };

    const handleEdit = (item: Offer) => {
        setEditingId(item.id);
        setEditForm({
            code: item.code,
            description: item.description,
            type: item.type,
            value: item.value,
            min_order: item.min_order,
            max_uses: item.max_uses,
            is_active: item.is_active,
            expires_at: item.expires_at ? item.expires_at.slice(0, 16) : '',
        });
    };

    const handleSave = async (id: string) => {
        const payload = { ...editForm, expires_at: editForm.expires_at || null };
        await updateOffer(id, payload);
        setEditingId(null);
        load();
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this offer?')) return;
        await deleteOffer(id);
        load();
    };

    const toggleActive = async (item: Offer) => {
        await updateOffer(item.id, { is_active: !item.is_active });
        load();
    };

    if (loading) return <div>Loading offers...</div>;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Offers & Coupons</h1>
                <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
                    <Plus size={18} />
                    Create Offer
                </button>
            </div>

            {/* Add Form */}
            {showAdd && (
                <div className="card" style={{ marginBottom: 24 }}>
                    <h3 className="card-title" style={{ marginBottom: 16 }}>New Offer</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Code</label>
                            <input type="text" className="form-input" value={newOffer.code}
                                onChange={e => setNewOffer({ ...newOffer, code: e.target.value })}
                                placeholder="e.g., LAUNCH20" style={{ textTransform: 'uppercase' }} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Type</label>
                            <select className="form-input" value={newOffer.type}
                                onChange={e => setNewOffer({ ...newOffer, type: e.target.value })}>
                                <option value="percentage">Percentage (%)</option>
                                <option value="flat">Flat (₹)</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Value</label>
                            <input type="number" className="form-input" value={newOffer.value}
                                onChange={e => setNewOffer({ ...newOffer, value: Number(e.target.value) })} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Description</label>
                            <input type="text" className="form-input" value={newOffer.description}
                                onChange={e => setNewOffer({ ...newOffer, description: e.target.value })}
                                placeholder="Short description" />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Min Order (₹)</label>
                            <input type="number" className="form-input" value={newOffer.min_order}
                                onChange={e => setNewOffer({ ...newOffer, min_order: Number(e.target.value) })} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Max Uses (0 = unlimited)</label>
                            <input type="number" className="form-input" value={newOffer.max_uses}
                                onChange={e => setNewOffer({ ...newOffer, max_uses: Number(e.target.value) })} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Expires At</label>
                            <input type="datetime-local" className="form-input" value={newOffer.expires_at}
                                onChange={e => setNewOffer({ ...newOffer, expires_at: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                        <button className="btn btn-primary" onClick={handleCreate}>
                            <Save size={18} /> Save
                        </button>
                        <button className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Description</th>
                                <th>Type</th>
                                <th>Value</th>
                                <th>Min Order</th>
                                <th>Usage</th>
                                <th>Expires</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {offers.map(item => (
                                <tr key={item.id}>
                                    <td>
                                        {editingId === item.id ? (
                                            <input type="text" className="form-input" value={editForm.code}
                                                onChange={e => setEditForm({ ...editForm, code: e.target.value })}
                                                style={{ padding: '6px 12px', textTransform: 'uppercase' }} />
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Tag size={14} />
                                                <strong>{item.code}</strong>
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ color: '#8b7355', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {editingId === item.id ? (
                                            <input type="text" className="form-input" value={editForm.description}
                                                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                                style={{ padding: '6px 12px' }} />
                                        ) : (item.description || '—')}
                                    </td>
                                    <td>
                                        {editingId === item.id ? (
                                            <select className="form-input" value={editForm.type}
                                                onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                                                style={{ padding: '6px 12px' }}>
                                                <option value="percentage">%</option>
                                                <option value="flat">₹</option>
                                            </select>
                                        ) : (
                                            <span className="badge">{item.type === 'percentage' ? '%' : '₹'}</span>
                                        )}
                                    </td>
                                    <td>
                                        {editingId === item.id ? (
                                            <input type="number" className="form-input" value={editForm.value}
                                                onChange={e => setEditForm({ ...editForm, value: Number(e.target.value) })}
                                                style={{ padding: '6px 12px', width: 80 }} />
                                        ) : (
                                            <strong>{item.type === 'percentage' ? `${item.value}%` : `₹${item.value}`}</strong>
                                        )}
                                    </td>
                                    <td>
                                        {editingId === item.id ? (
                                            <input type="number" className="form-input" value={editForm.min_order}
                                                onChange={e => setEditForm({ ...editForm, min_order: Number(e.target.value) })}
                                                style={{ padding: '6px 12px', width: 80 }} />
                                        ) : (
                                            item.min_order > 0 ? `₹${item.min_order}` : '—'
                                        )}
                                    </td>
                                    <td>
                                        <span>{item.used_count}{item.max_uses > 0 ? `/${item.max_uses}` : '/∞'}</span>
                                    </td>
                                    <td style={{ fontSize: 13 }}>
                                        {editingId === item.id ? (
                                            <input type="datetime-local" className="form-input" value={editForm.expires_at}
                                                onChange={e => setEditForm({ ...editForm, expires_at: e.target.value })}
                                                style={{ padding: '6px 8px', fontSize: 12 }} />
                                        ) : (
                                            item.expires_at ? new Date(item.expires_at).toLocaleDateString() : '—'
                                        )}
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => toggleActive(item)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: item.is_active ? '#16a34a' : '#aaa' }}
                                            title={item.is_active ? 'Active — click to deactivate' : 'Inactive — click to activate'}
                                        >
                                            {item.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                                        </button>
                                    </td>
                                    <td>
                                        {editingId === item.id ? (
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button className="btn btn-sm btn-secondary" onClick={() => handleSave(item.id)}>
                                                    <Save size={14} />
                                                </button>
                                                <button className="btn btn-sm btn-outline" onClick={() => setEditingId(null)}>
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button className="btn btn-sm btn-outline" onClick={() => handleEdit(item)}>
                                                    <Edit2 size={14} />
                                                </button>
                                                <button className="btn btn-sm btn-outline" onClick={() => handleDelete(item.id)}
                                                    style={{ color: '#ef4444', borderColor: '#fca5a5' }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {offers.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 40, color: '#8b7355' }}>
                        No offers created yet. Click "Create Offer" to get started.
                    </div>
                )}
            </div>
        </div>
    );
};
