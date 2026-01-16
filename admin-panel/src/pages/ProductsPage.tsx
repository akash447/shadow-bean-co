import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, Loader2, X, Save } from 'lucide-react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../lib/supabase';

interface Product {
    id: string;
    name: string;
    description: string;
    base_price: number;
    sizes: string[];
    image_url: string;
    is_active: boolean;
    created_at: string;
}

export const ProductsPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        base_price: 599,
        sizes: ['250g', '500g', '1kg'],
        image_url: '',
        is_active: true,
    });

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        const { data, error } = await getProducts();
        if (data) {
            setProducts(data);
        } else {
            console.error('Error loading products:', error);
        }
        setLoading(false);
    };

    const openAddModal = () => {
        setEditingProduct(null);
        setFormData({
            name: '',
            description: '',
            base_price: 599,
            sizes: ['250g', '500g', '1kg'],
            image_url: '',
            is_active: true,
        });
        setShowModal(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description || '',
            base_price: product.base_price,
            sizes: product.sizes || ['250g', '500g', '1kg'],
            image_url: product.image_url || '',
            is_active: product.is_active,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editingProduct) {
                const { error } = await updateProduct(editingProduct.id, formData);
                if (error) throw error;
            } else {
                const { error } = await createProduct(formData);
                if (error) throw error;
            }
            setShowModal(false);
            loadProducts();
        } catch (error: any) {
            alert('Error saving product: ' + error.message);
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        const { error } = await deleteProduct(id);
        if (error) {
            alert('Error deleting product: ' + error.message);
        } else {
            loadProducts();
        }
    };

    const toggleSize = (size: string) => {
        setFormData(prev => ({
            ...prev,
            sizes: prev.sizes.includes(size)
                ? prev.sizes.filter(s => s !== size)
                : [...prev.sizes, size]
        }));
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                <Loader2 className="animate-spin" size={32} color="#8b7355" />
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Products</h1>
                <button className="btn btn-primary" onClick={openAddModal}>
                    <Plus size={18} />
                    Add Product
                </button>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Product Catalog ({products.length})</h3>
                </div>

                {products.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#8b7355' }}>
                        <Package size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <p>No products yet. Click "Add Product" to create your first product.</p>
                    </div>
                ) : (
                    <>
                        {products.map((product) => (
                            <div
                                key={product.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '24px',
                                    padding: '20px',
                                    background: product.is_active ? '#f9f9f9' : '#f0f0f0',
                                    borderRadius: '12px',
                                    marginBottom: '16px',
                                    opacity: product.is_active ? 1 : 0.7,
                                }}
                            >
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    background: '#e8ddd4',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundImage: product.image_url ? `url(${product.image_url})` : 'none',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }}>
                                    {!product.image_url && <Package size={32} color="#8b7355" />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <h4>{product.name}</h4>
                                        {!product.is_active && (
                                            <span className="badge" style={{ background: '#e0e0e0', color: '#666' }}>
                                                Inactive
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ color: '#8b7355', fontSize: '14px', marginBottom: '8px' }}>
                                        {product.description || 'No description'}
                                    </p>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {product.sizes?.map((size) => (
                                            <span key={size} className="badge badge-info">{size}</span>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#3d2c29' }}>
                                        ₹{product.base_price}
                                    </div>
                                    <div style={{ color: '#8b7355', fontSize: '12px' }}>starting from</div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        className="btn btn-outline btn-sm"
                                        onClick={() => openEditModal(product)}
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleDelete(product.id)}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                    }}
                    onClick={() => setShowModal(false)}
                >
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: '16px',
                            padding: '24px',
                            width: '500px',
                            maxWidth: '90%',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '700' }}>
                                {editingProduct ? 'Edit Product' : 'Add New Product'}
                            </h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} color="#888" />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Product Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Shadow Bean Signature Blend"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Product description..."
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        resize: 'vertical',
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Base Price (₹) *</label>
                                <input
                                    type="number"
                                    value={formData.base_price}
                                    onChange={e => setFormData({ ...formData, base_price: Number(e.target.value) })}
                                    min={0}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Available Sizes</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {['250g', '500g', '1kg'].map(size => (
                                        <button
                                            key={size}
                                            type="button"
                                            onClick={() => toggleSize(size)}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '8px',
                                                border: formData.sizes.includes(size) ? '2px solid #4a5d4a' : '1px solid #ddd',
                                                background: formData.sizes.includes(size) ? '#e8f5e9' : '#fff',
                                                cursor: 'pointer',
                                                fontWeight: formData.sizes.includes(size) ? '600' : '400',
                                            }}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Image URL</label>
                                <input
                                    type="text"
                                    value={formData.image_url}
                                    onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                    placeholder="https://..."
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                <label htmlFor="is_active">Active (visible to customers)</label>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                            <button
                                className="btn btn-outline"
                                style={{ flex: 1 }}
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                style={{ flex: 1 }}
                                onClick={handleSave}
                                disabled={saving || !formData.name}
                            >
                                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                {saving ? 'Saving...' : 'Save Product'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
