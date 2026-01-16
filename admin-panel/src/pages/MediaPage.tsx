import React, { useState, useEffect, useRef } from 'react';
import { Upload, Image as ImageIcon, Trash2, FolderOpen, Loader2, RefreshCw } from 'lucide-react';
import { getAssets, uploadAsset, deleteAsset } from '../lib/supabase';

export const MediaPage: React.FC = () => {
    const [images, setImages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [replaceKey, setReplaceKey] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadAssets();
    }, []);

    const loadAssets = async () => {
        setLoading(true);
        const { data, error } = await getAssets();
        if (data) {
            setImages(data);
        } else {
            console.error('Error loading assets:', error);
        }
        setLoading(false);
    };

    const handleReplace = (key: string) => {
        setReplaceKey(key);
        // Small timeout to ensure state is set before click
        setTimeout(() => fileInputRef.current?.click(), 0);
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            setReplaceKey(null); // Reset if cancelled
            return;
        }

        let keyName = replaceKey;

        if (!keyName) {
            // Prompt for key name if not replacing
            const defaultName = file.name.split('.')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
            keyName = window.prompt("Enter a unique key for this image (e.g., 'home_hero', 'logo_main'):", defaultName);
        }

        if (!keyName) {
            setReplaceKey(null);
            return;
        }

        setUploading(true);
        const { error } = await uploadAsset(file, keyName);
        if (error) {
            alert('Upload failed: ' + error.message);
        } else {
            loadAssets(); // Refresh list
            if (replaceKey) {
                alert(`Successfully replaced image for key: ${replaceKey}`);
            }
        }
        setUploading(false);
        setReplaceKey(null); // Reset replacement state

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDelete = async (key: string) => {
        if (!window.confirm('Are you sure? This will break any app components using this key.')) return;

        const { error } = await deleteAsset(key);
        if (error) {
            alert('Delete failed: ' + error.message);
        } else {
            loadAssets();
        }
    };

    const copyKey = (key: string) => {
        navigator.clipboard.writeText(key);
        alert(`Key '${key}' copied to clipboard!`);
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Media Gallery</h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        className="btn btn-primary"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                        {uploading ? 'Uploading...' : 'Upload Image'}
                    </button>
                    {/* Hidden Input */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handleFileSelect}
                    />
                </div>
            </div>

            {/* Upload Zone */}
            <div
                className="card"
                style={{ marginBottom: '24px', cursor: 'pointer' }}
                onClick={() => fileInputRef.current?.click()}
            >
                <div
                    style={{
                        border: '2px dashed #d4c4b0',
                        borderRadius: '12px',
                        padding: '40px',
                        textAlign: 'center',
                        background: '#faf8f5',
                    }}
                >
                    <FolderOpen size={48} style={{ color: '#8b7355', marginBottom: '16px' }} />
                    <p style={{ fontSize: '16px', fontWeight: '500', color: '#3d2c29' }}>
                        Click to upload new asset
                    </p>
                    <p style={{ color: '#aaa', fontSize: '12px', marginTop: '16px' }}>
                        You will be asked to assign a KEY (e.g., 'home_hero')
                    </p>
                </div>
            </div>

            {/* System Keys Reference */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-header">
                    <h3 className="card-title">Required App Keys</h3>
                </div>
                <div style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {[
                        'logo_main', 'home_hero', 'about_hero', 'journey_banner', 'product_placeholder',
                        'farmer_highlight', 'icon_shade_grown', 'icon_salt_roasted',
                        'icon_small_batch', 'icon_personalised', 'icon_pour_over_kit',
                        'icon_french_press', 'icon_chhani'
                    ].map(key => (
                        <div
                            key={key}
                            style={{
                                background: '#f0e6d9',
                                padding: '6px 12px',
                                borderRadius: '16px',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#5d4037',
                                cursor: 'pointer',
                                border: '1px solid #dccbb5'
                            }}
                            onClick={() => copyKey(key)}
                            title="Click to copy"
                        >
                            {key}
                        </div>
                    ))}
                </div>
                <p style={{ padding: '0 16px 16px', fontSize: '12px', color: '#888' }}>
                    * Upload images with these exact keys to update them in the App immediately.
                </p>
            </div>

            {/* Image Grid */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">System Assets ({images.length})</h3>
                </div>

                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
                ) : (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                            gap: '16px',
                            padding: '16px',
                        }}
                    >
                        {images.map((image) => (
                            <div
                                key={image.key}
                                style={{
                                    background: '#f5f0eb',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    border: '1px solid #e8ddd4',
                                    position: 'relative'
                                }}
                            >
                                <div
                                    style={{
                                        height: '160px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: '#fff',
                                        backgroundImage: `url(${image.url})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                    }}
                                >
                                    {!image.url && <ImageIcon size={48} color="#8b7355" />}
                                </div>
                                <div style={{ padding: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                        <p
                                            style={{ fontWeight: '700', color: '#3d2c29', fontSize: '14px', cursor: 'pointer' }}
                                            onClick={() => copyKey(image.key)}
                                            title="Click to copy Key"
                                        >
                                            {image.key}
                                        </p>
                                    </div>
                                    <p style={{ fontSize: '11px', color: '#8b7355', truncate: true } as any}>
                                        {image.title}
                                    </p>
                                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                                        <button
                                            className="btn btn-sm btn-outline"
                                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                            onClick={() => handleReplace(image.key)}
                                        >
                                            <RefreshCw size={14} />
                                            Replace
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline"
                                            onClick={() => window.open(image.url, '_blank')}
                                        >
                                            View
                                        </button>
                                        <button
                                            className="btn btn-sm btn-danger"
                                            onClick={() => handleDelete(image.key)}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
