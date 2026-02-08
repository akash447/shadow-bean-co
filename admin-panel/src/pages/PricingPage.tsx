import React, { useEffect, useState } from 'react';
import { getPricing, updatePricing, createPricing } from '../lib/admin-api';
import { Plus, Save, Edit2, X } from 'lucide-react';

export const PricingPage: React.FC = () => {
    const [pricing, setPricing] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ name: '', base_price: 0, discount_percent: 0 });
    const [showAddForm, setShowAddForm] = useState(false);
    const [newPricing, setNewPricing] = useState({ name: '', description: '', base_price: 0, discount_percent: 0 });

    useEffect(() => {
        loadPricing();
    }, []);

    const loadPricing = async () => {
        const { data, error } = await getPricing();
        if (!error && data) {
            setPricing(data);
        }
        setLoading(false);
    };

    const handleEdit = (item: any) => {
        setEditingId(item.id);
        setEditForm({
            name: item.name,
            base_price: item.base_price,
            discount_percent: item.discount_percent || 0,
        });
    };

    const handleSave = async (id: string) => {
        await updatePricing(id, editForm);
        setEditingId(null);
        loadPricing();
    };

    const handleCreate = async () => {
        await createPricing(newPricing);
        setShowAddForm(false);
        setNewPricing({ name: '', description: '', base_price: 0, discount_percent: 0 });
        loadPricing();
    };

    if (loading) {
        return <div>Loading pricing...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Pricing</h1>
                <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
                    <Plus size={18} />
                    Add Pricing
                </button>
            </div>

            {showAddForm && (
                <div className="card" style={{ marginBottom: '24px' }}>
                    <h3 className="card-title" style={{ marginBottom: '16px' }}>New Pricing</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={newPricing.name}
                                onChange={(e) => setNewPricing({ ...newPricing, name: e.target.value })}
                                placeholder="e.g., 250g Bag"
                            />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Description</label>
                            <input
                                type="text"
                                className="form-input"
                                value={newPricing.description}
                                onChange={(e) => setNewPricing({ ...newPricing, description: e.target.value })}
                                placeholder="Short description"
                            />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Base Price (₹)</label>
                            <input
                                type="number"
                                className="form-input"
                                value={newPricing.base_price}
                                onChange={(e) => setNewPricing({ ...newPricing, base_price: Number(e.target.value) })}
                            />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Discount (%)</label>
                            <input
                                type="number"
                                className="form-input"
                                value={newPricing.discount_percent}
                                onChange={(e) => setNewPricing({ ...newPricing, discount_percent: Number(e.target.value) })}
                            />
                        </div>
                    </div>
                    <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                        <button className="btn btn-primary" onClick={handleCreate}>
                            <Save size={18} />
                            Save
                        </button>
                        <button className="btn btn-outline" onClick={() => setShowAddForm(false)}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Base Price</th>
                                <th>Discount</th>
                                <th>Final Price</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pricing.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        {editingId === item.id ? (
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={editForm.name}
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                style={{ padding: '6px 12px' }}
                                            />
                                        ) : (
                                            <strong>{item.name}</strong>
                                        )}
                                    </td>
                                    <td style={{ color: '#8b7355' }}>{item.description || '-'}</td>
                                    <td>
                                        {editingId === item.id ? (
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={editForm.base_price}
                                                onChange={(e) => setEditForm({ ...editForm, base_price: Number(e.target.value) })}
                                                style={{ padding: '6px 12px', width: '100px' }}
                                            />
                                        ) : (
                                            `₹${item.base_price}`
                                        )}
                                    </td>
                                    <td>
                                        {editingId === item.id ? (
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={editForm.discount_percent}
                                                onChange={(e) => setEditForm({ ...editForm, discount_percent: Number(e.target.value) })}
                                                style={{ padding: '6px 12px', width: '80px' }}
                                            />
                                        ) : (
                                            <span className={item.discount_percent ? 'badge badge-success' : ''}>
                                                {item.discount_percent ? `${item.discount_percent}% off` : '-'}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ fontWeight: '600' }}>
                                        ₹{Math.round(item.base_price * (1 - (item.discount_percent || 0) / 100))}
                                    </td>
                                    <td>
                                        {editingId === item.id ? (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button className="btn btn-sm btn-secondary" onClick={() => handleSave(item.id)}>
                                                    <Save size={14} />
                                                </button>
                                                <button className="btn btn-sm btn-outline" onClick={() => setEditingId(null)}>
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button className="btn btn-sm btn-outline" onClick={() => handleEdit(item)}>
                                                <Edit2 size={14} />
                                                Edit
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {pricing.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#8b7355' }}>
                        No pricing configured yet
                    </div>
                )}
            </div>
        </div>
    );
};
