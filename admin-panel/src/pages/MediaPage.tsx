import React, { useState, useEffect, useRef } from 'react';
import {
    Upload,
    Image as ImageIcon,
    Trash2,
    FolderOpen,
    Loader2,
    RefreshCw,
    X,
    Save,
    Search,
    Eye,
    Edit,
    Filter,
    Copy,
    Check,
    Film,
} from 'lucide-react';
import {
    getAssets,
    getUploadUrl,
    uploadToS3,
    createAsset,
    updateAsset,
    deleteAsset,
} from '../lib/admin-api';

// ===== Types =====

interface Asset {
    key: string;
    url: string;
    title: string;
    type: string;       // 'image' | 'video'
    category: string;
    created_at?: string;
    updated_at?: string;
}

type AssetCategory = 'all' | 'hero' | 'icons' | 'product' | 'about' | 'social' | 'video' | 'general';

const CATEGORIES: { value: AssetCategory; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'hero', label: 'Hero' },
    { value: 'icons', label: 'Icons' },
    { value: 'product', label: 'Product' },
    { value: 'about', label: 'About' },
    { value: 'social', label: 'Social' },
    { value: 'video', label: 'Video' },
    { value: 'general', label: 'General' },
];

const CATEGORY_OPTIONS = CATEGORIES.filter(c => c.value !== 'all');

// ===== Styles =====

const styles = {
    filterBar: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px',
        flexWrap: 'wrap' as const,
    },
    searchWrapper: {
        position: 'relative' as const,
        flex: '1 1 260px',
        minWidth: '200px',
    },
    searchIcon: {
        position: 'absolute' as const,
        left: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#8b7355',
        pointerEvents: 'none' as const,
    },
    searchInput: {
        width: '100%',
        padding: '10px 12px 10px 40px',
        border: '1px solid #e8ddd4',
        borderRadius: '8px',
        fontSize: '14px',
        background: '#fff',
        color: '#3d2c29',
        outline: 'none',
    },
    categoryPill: (active: boolean) => ({
        padding: '6px 16px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
        border: active ? '2px solid #3d2c29' : '1px solid #d4c4b0',
        background: active ? '#3d2c29' : '#fff',
        color: active ? '#fff' : '#5d4037',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap' as const,
    }),
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '20px',
        padding: '20px',
    },
    assetCard: {
        background: '#faf8f5',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #e8ddd4',
        transition: 'box-shadow 0.2s ease, transform 0.15s ease',
        cursor: 'pointer',
    },
    thumbnail: (url: string) => ({
        height: '180px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: url ? `url(${url}) center / cover no-repeat` : '#f0e6d9',
        position: 'relative' as const,
    }),
    thumbnailOverlay: {
        position: 'absolute' as const,
        inset: 0,
        background: 'rgba(61, 44, 41, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        opacity: 0,
        transition: 'opacity 0.2s ease',
    },
    overlayBtn: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: '#fff',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.15s',
    },
    cardBody: {
        padding: '14px',
    },
    cardKey: {
        fontWeight: 700,
        color: '#3d2c29',
        fontSize: '13px',
        lineHeight: '1.3',
        marginBottom: '2px',
        wordBreak: 'break-all' as const,
    },
    cardTitle: {
        fontSize: '12px',
        color: '#8b7355',
        whiteSpace: 'nowrap' as const,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    cardCategory: (category: string) => ({
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '10px',
        fontSize: '10px',
        fontWeight: 600,
        background: categoryColor(category).bg,
        color: categoryColor(category).text,
        marginTop: '6px',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
    }),
    cardActions: {
        display: 'flex',
        gap: '6px',
        marginTop: '10px',
    },
    modalOverlay: {
        position: 'fixed' as const,
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modal: {
        background: '#fff',
        borderRadius: '16px',
        padding: '28px',
        width: '520px',
        maxWidth: '92vw',
        maxHeight: '85vh',
        overflowY: 'auto' as const,
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
    },
    modalTitle: {
        fontSize: '20px',
        fontWeight: 700,
        color: '#3d2c29',
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px',
    },
    formGroup: {
        marginBottom: '18px',
    },
    label: {
        display: 'block',
        marginBottom: '6px',
        fontWeight: 600,
        fontSize: '13px',
        color: '#3d2c29',
    },
    input: {
        width: '100%',
        padding: '10px 14px',
        border: '1px solid #e8ddd4',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#3d2c29',
        outline: 'none',
    },
    select: {
        width: '100%',
        padding: '10px 14px',
        border: '1px solid #e8ddd4',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#3d2c29',
        background: '#fff',
        outline: 'none',
        cursor: 'pointer',
    },
    previewContainer: {
        width: '100%',
        maxHeight: '300px',
        borderRadius: '8px',
        overflow: 'hidden',
        background: '#f0e6d9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '18px',
    },
    previewImg: {
        maxWidth: '100%',
        maxHeight: '300px',
        objectFit: 'contain' as const,
    },
    dropZone: (dragging: boolean) => ({
        border: `2px dashed ${dragging ? '#3d2c29' : '#d4c4b0'}`,
        borderRadius: '12px',
        padding: '48px 24px',
        textAlign: 'center' as const,
        background: dragging ? '#f0e6d9' : '#faf8f5',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    }),
    emptyState: {
        padding: '60px 20px',
        textAlign: 'center' as const,
        color: '#8b7355',
    },
    buttonRow: {
        display: 'flex',
        gap: '12px',
        marginTop: '24px',
    },
    copyFeedback: {
        position: 'absolute' as const,
        top: '-28px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#3d2c29',
        color: '#fff',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 600,
        whiteSpace: 'nowrap' as const,
    },
};

function categoryColor(category: string): { bg: string; text: string } {
    switch (category) {
        case 'hero':    return { bg: '#fce4ec', text: '#880e4f' };
        case 'icons':   return { bg: '#e8eaf6', text: '#283593' };
        case 'product': return { bg: '#e8f5e9', text: '#2e7d32' };
        case 'about':   return { bg: '#fff3e0', text: '#e65100' };
        case 'social':  return { bg: '#e1f5fe', text: '#0277bd' };
        case 'video':   return { bg: '#f3e5f5', text: '#7b1fa2' };
        default:        return { bg: '#f0e6d9', text: '#5d4037' };
    }
}

// ===== Required App Keys Reference =====

const REQUIRED_KEYS = [
    'logo_main', 'home_hero', 'about_hero', 'journey_banner', 'product_placeholder',
    'farmer_highlight', 'icon_shade_grown', 'icon_salt_roasted',
    'icon_small_batch', 'icon_personalised', 'icon_pour_over_kit',
    'icon_french_press', 'icon_chhani',
];

// ===== Component =====

export const MediaPage: React.FC = () => {
    // Data state
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<AssetCategory>('all');

    // Upload state
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [dragging, setDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const replaceFileInputRef = useRef<HTMLInputElement>(null);

    // Modal state
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [replaceTarget, setReplaceTarget] = useState<Asset | null>(null);

    // Upload form
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadCategory, setUploadCategory] = useState('general');

    // Edit form
    const [editTitle, setEditTitle] = useState('');
    const [editCategory, setEditCategory] = useState('general');
    const [saving, setSaving] = useState(false);

    // Copy feedback
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    // Hover state for card overlays
    const [hoveredKey, setHoveredKey] = useState<string | null>(null);

    // ===== Data Loading =====

    useEffect(() => {
        loadAssets();
    }, []);

    const loadAssets = async () => {
        setLoading(true);
        const { data, error } = await getAssets();
        if (data) {
            setAssets(Array.isArray(data) ? data : []);
        } else {
            console.error('Error loading assets:', error);
        }
        setLoading(false);
    };

    // ===== Filtering =====

    const filteredAssets = assets.filter(asset => {
        const matchesCategory = activeCategory === 'all' || asset.category === activeCategory;
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            !query ||
            asset.key?.toLowerCase().includes(query) ||
            asset.title?.toLowerCase().includes(query) ||
            asset.category?.toLowerCase().includes(query);
        return matchesCategory && matchesSearch;
    });

    // ===== Copy Key =====

    const handleCopyKey = (key: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        navigator.clipboard.writeText(key);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 1500);
    };

    // ===== Upload Flow =====

    const openUploadModal = (file?: File) => {
        setUploadFile(file || null);
        setUploadTitle(file ? file.name.replace(/\.[^.]+$/, '') : '');
        setUploadCategory('general');
        setShowUploadModal(true);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            openUploadModal(file);
        }
        // Reset so the same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDropZoneDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            openUploadModal(file);
        }
    };

    const handleUploadSubmit = async () => {
        if (!uploadFile) return;

        setUploading(true);
        setUploadProgress('Requesting upload URL...');

        try {
            // Step 1: Get pre-signed URL
            const { data: uploadInfo, error: urlError } = await getUploadUrl(
                uploadFile.name,
                uploadFile.type
            );
            if (urlError || !uploadInfo) {
                throw new Error(urlError?.message || 'Failed to get upload URL');
            }

            // Step 2: Upload to S3
            setUploadProgress('Uploading to storage...');
            const { error: s3Error } = await uploadToS3(uploadInfo.uploadUrl, uploadFile);
            if (s3Error) {
                throw new Error(s3Error.message || 'Failed to upload file');
            }

            // Step 3: Save asset record
            setUploadProgress('Saving asset record...');
            const assetType = uploadFile.type.startsWith('video/') ? 'video' : 'image';
            const { error: createError } = await createAsset({
                key: uploadInfo.s3Key,
                url: uploadInfo.cdnUrl,
                title: uploadTitle || uploadFile.name,
                type: assetType,
                category: uploadCategory,
            });
            if (createError) {
                throw new Error(createError.message || 'Failed to save asset');
            }

            setShowUploadModal(false);
            setUploadFile(null);
            loadAssets();
        } catch (err: any) {
            alert('Upload failed: ' + (err.message || 'Unknown error'));
        } finally {
            setUploading(false);
            setUploadProgress('');
        }
    };

    // ===== Replace Flow =====

    const handleReplaceClick = (asset: Asset, e: React.MouseEvent) => {
        e.stopPropagation();
        setReplaceTarget(asset);
        setTimeout(() => replaceFileInputRef.current?.click(), 0);
    };

    const handleReplaceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !replaceTarget) {
            setReplaceTarget(null);
            return;
        }

        setUploading(true);
        setUploadProgress('Replacing asset...');

        try {
            // Step 1: Get pre-signed URL
            const { data: uploadInfo, error: urlError } = await getUploadUrl(
                file.name,
                file.type
            );
            if (urlError || !uploadInfo) {
                throw new Error(urlError?.message || 'Failed to get upload URL');
            }

            // Step 2: Upload to S3
            setUploadProgress('Uploading replacement...');
            const { error: s3Error } = await uploadToS3(uploadInfo.uploadUrl, file);
            if (s3Error) {
                throw new Error(s3Error.message || 'Failed to upload file');
            }

            // Step 3: Save asset record with the original key
            setUploadProgress('Updating record...');
            const assetType = file.type.startsWith('video/') ? 'video' : 'image';
            const { error: createError } = await createAsset({
                key: replaceTarget.key,
                url: uploadInfo.cdnUrl,
                title: replaceTarget.title,
                type: assetType,
                category: replaceTarget.category,
            });
            if (createError) {
                throw new Error(createError.message || 'Failed to update asset record');
            }

            loadAssets();
        } catch (err: any) {
            alert('Replace failed: ' + (err.message || 'Unknown error'));
        } finally {
            setUploading(false);
            setUploadProgress('');
            setReplaceTarget(null);
            if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
        }
    };

    // ===== Delete =====

    const handleDelete = async (asset: Asset, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm(`Delete "${asset.title || asset.key}"? This cannot be undone and may break app components using this key.`)) {
            return;
        }

        const { error } = await deleteAsset(asset.key);
        if (error) {
            alert('Delete failed: ' + error.message);
        } else {
            // If we had a preview/edit modal open for this asset, close it
            if (selectedAsset?.key === asset.key) {
                setShowPreviewModal(false);
                setShowEditModal(false);
                setSelectedAsset(null);
            }
            loadAssets();
        }
    };

    // ===== Edit Metadata =====

    const openEditModal = (asset: Asset, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setSelectedAsset(asset);
        setEditTitle(asset.title || '');
        setEditCategory(asset.category || 'general');
        setShowEditModal(true);
    };

    const handleEditSave = async () => {
        if (!selectedAsset) return;
        setSaving(true);

        const { error } = await updateAsset(selectedAsset.key, {
            title: editTitle,
            category: editCategory,
        });

        if (error) {
            alert('Update failed: ' + error.message);
        } else {
            setShowEditModal(false);
            setSelectedAsset(null);
            loadAssets();
        }
        setSaving(false);
    };

    // ===== Preview =====

    const openPreview = (asset: Asset) => {
        setSelectedAsset(asset);
        setShowPreviewModal(true);
    };

    // ===== Render Helpers =====

    const renderDropZone = () => (
        <div
            className="card"
            style={{ marginBottom: '24px', cursor: 'pointer' }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDropZoneDrop}
        >
            <div style={styles.dropZone(dragging)}>
                <FolderOpen size={48} style={{ color: '#8b7355', marginBottom: '12px' }} />
                <p style={{ fontSize: '16px', fontWeight: 600, color: '#3d2c29' }}>
                    {dragging ? 'Drop file here' : 'Click or drag a file to upload'}
                </p>
                <p style={{ color: '#aaa', fontSize: '12px', marginTop: '8px' }}>
                    Supports images (JPG, PNG, WEBP, SVG) and video (MP4, WEBM)
                </p>
            </div>
        </div>
    );

    const renderRequiredKeys = () => (
        <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">
                <h3 className="card-title">Required App Keys</h3>
            </div>
            <div style={{ padding: '0 16px 8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {REQUIRED_KEYS.map(key => {
                    const exists = assets.some(a => a.key === key);
                    return (
                        <div
                            key={key}
                            style={{
                                position: 'relative',
                                background: exists ? '#e8f5e9' : '#fff3e0',
                                padding: '5px 12px',
                                borderRadius: '16px',
                                fontSize: '12px',
                                fontWeight: 600,
                                color: exists ? '#2e7d32' : '#e65100',
                                cursor: 'pointer',
                                border: `1px solid ${exists ? '#a5d6a7' : '#ffcc80'}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                            }}
                            onClick={() => handleCopyKey(key)}
                            title={exists ? 'Uploaded - Click to copy key' : 'Missing - Click to copy key'}
                        >
                            {exists ? <Check size={12} /> : null}
                            {key}
                            {copiedKey === key && (
                                <span style={styles.copyFeedback}>Copied!</span>
                            )}
                        </div>
                    );
                })}
            </div>
            <p style={{ padding: '4px 16px 16px', fontSize: '12px', color: '#888' }}>
                Green = uploaded, Orange = missing. Click to copy key name.
            </p>
        </div>
    );

    const renderFilterBar = () => (
        <div style={styles.filterBar}>
            <div style={styles.searchWrapper}>
                <Search size={18} style={styles.searchIcon} />
                <input
                    type="text"
                    placeholder="Search by key, title, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={styles.searchInput}
                />
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Filter size={16} style={{ color: '#8b7355' }} />
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.value}
                        onClick={() => setActiveCategory(cat.value)}
                        style={styles.categoryPill(activeCategory === cat.value)}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>
        </div>
    );

    const renderAssetCard = (asset: Asset) => {
        const isHovered = hoveredKey === asset.key;
        const isVideo = asset.type === 'video';

        return (
            <div
                key={asset.key}
                style={{
                    ...styles.assetCard,
                    boxShadow: isHovered ? '0 8px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.06)',
                    transform: isHovered ? 'translateY(-2px)' : 'none',
                }}
                onMouseEnter={() => setHoveredKey(asset.key)}
                onMouseLeave={() => setHoveredKey(null)}
                onClick={() => openPreview(asset)}
            >
                {/* Thumbnail */}
                <div style={styles.thumbnail(asset.url)}>
                    {!asset.url && (
                        isVideo
                            ? <Film size={48} color="#8b7355" />
                            : <ImageIcon size={48} color="#8b7355" />
                    )}
                    {/* Hover Overlay */}
                    <div
                        style={{
                            ...styles.thumbnailOverlay,
                            opacity: isHovered ? 1 : 0,
                        }}
                    >
                        <button
                            style={styles.overlayBtn}
                            title="Preview"
                            onClick={(e) => { e.stopPropagation(); openPreview(asset); }}
                        >
                            <Eye size={18} color="#3d2c29" />
                        </button>
                        <button
                            style={styles.overlayBtn}
                            title="Edit Metadata"
                            onClick={(e) => openEditModal(asset, e)}
                        >
                            <Edit size={18} color="#3d2c29" />
                        </button>
                        <button
                            style={styles.overlayBtn}
                            title="Replace File"
                            onClick={(e) => handleReplaceClick(asset, e)}
                        >
                            <RefreshCw size={18} color="#3d2c29" />
                        </button>
                    </div>
                    {/* Category badge on thumbnail */}
                    {asset.category && (
                        <span
                            style={{
                                position: 'absolute',
                                top: '8px',
                                left: '8px',
                                ...styles.cardCategory(asset.category),
                                marginTop: 0,
                            }}
                        >
                            {asset.category}
                        </span>
                    )}
                    {isVideo && (
                        <span
                            style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                background: 'rgba(0,0,0,0.6)',
                                color: '#fff',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '10px',
                                fontWeight: 600,
                            }}
                        >
                            VIDEO
                        </span>
                    )}
                </div>

                {/* Card Body */}
                <div style={styles.cardBody}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <p
                                    style={styles.cardKey}
                                    onClick={(e) => handleCopyKey(asset.key, e)}
                                    title="Click to copy key"
                                >
                                    {asset.key}
                                </p>
                                {copiedKey === asset.key && (
                                    <span style={styles.copyFeedback}>Copied!</span>
                                )}
                            </div>
                            <p style={styles.cardTitle}>{asset.title || 'Untitled'}</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={styles.cardActions}>
                        <button
                            className="btn btn-sm btn-outline"
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                            onClick={(e) => handleReplaceClick(asset, e)}
                        >
                            <RefreshCw size={13} />
                            Replace
                        </button>
                        <button
                            className="btn btn-sm btn-outline"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                            onClick={(e) => { e.stopPropagation(); window.open(asset.url, '_blank'); }}
                            title="Open in new tab"
                        >
                            <Eye size={13} />
                        </button>
                        <button
                            className="btn btn-sm btn-outline"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                            onClick={(e) => handleCopyKey(asset.key, e)}
                            title="Copy key"
                        >
                            <Copy size={13} />
                        </button>
                        <button
                            className="btn btn-sm btn-danger"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={(e) => handleDelete(asset, e)}
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderAssetGrid = () => (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">
                    Assets ({filteredAssets.length}
                    {filteredAssets.length !== assets.length ? ` of ${assets.length}` : ''})
                </h3>
                <button
                    className="btn btn-sm btn-outline"
                    onClick={loadAssets}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                    <RefreshCw size={14} />
                    Refresh
                </button>
            </div>

            {loading ? (
                <div style={{ padding: '60px', textAlign: 'center' }}>
                    <Loader2 className="animate-spin" size={32} color="#8b7355" />
                    <p style={{ marginTop: '12px', color: '#8b7355' }}>Loading assets...</p>
                </div>
            ) : filteredAssets.length === 0 ? (
                <div style={styles.emptyState}>
                    <ImageIcon size={48} style={{ marginBottom: '16px', opacity: 0.4 }} />
                    <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                        {assets.length === 0
                            ? 'No assets uploaded yet'
                            : 'No assets match your filters'}
                    </p>
                    <p style={{ fontSize: '13px' }}>
                        {assets.length === 0
                            ? 'Upload your first asset using the drop zone above.'
                            : 'Try adjusting your search or category filter.'}
                    </p>
                </div>
            ) : (
                <div style={styles.grid}>
                    {filteredAssets.map(renderAssetCard)}
                </div>
            )}
        </div>
    );

    // ===== Upload Modal =====

    const renderUploadModal = () => {
        if (!showUploadModal) return null;

        return (
            <div style={styles.modalOverlay} onClick={() => !uploading && setShowUploadModal(false)}>
                <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                    <div style={styles.modalHeader}>
                        <h2 style={styles.modalTitle}>Upload New Asset</h2>
                        <button
                            style={styles.closeBtn}
                            onClick={() => !uploading && setShowUploadModal(false)}
                        >
                            <X size={24} color="#888" />
                        </button>
                    </div>

                    {/* File Preview */}
                    {uploadFile && (
                        <div style={styles.previewContainer}>
                            {uploadFile.type.startsWith('image/') ? (
                                <img
                                    src={URL.createObjectURL(uploadFile)}
                                    alt="Preview"
                                    style={styles.previewImg}
                                />
                            ) : uploadFile.type.startsWith('video/') ? (
                                <video
                                    src={URL.createObjectURL(uploadFile)}
                                    style={{ maxWidth: '100%', maxHeight: '300px' }}
                                    controls
                                    muted
                                />
                            ) : (
                                <div style={{ padding: '40px', textAlign: 'center' }}>
                                    <FolderOpen size={48} color="#8b7355" />
                                    <p style={{ marginTop: '8px', color: '#8b7355' }}>{uploadFile.name}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* File info */}
                    {uploadFile && (
                        <div style={{
                            background: '#f7f3ed',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            marginBottom: '18px',
                            fontSize: '12px',
                            color: '#5d4037',
                        }}>
                            <strong>{uploadFile.name}</strong> -- {(uploadFile.size / 1024).toFixed(1)} KB -- {uploadFile.type}
                        </div>
                    )}

                    {/* Select File button if no file yet */}
                    {!uploadFile && (
                        <div
                            style={{
                                ...styles.dropZone(false),
                                marginBottom: '18px',
                            }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload size={32} color="#8b7355" />
                            <p style={{ marginTop: '8px', color: '#5d4037', fontWeight: 600 }}>Click to select a file</p>
                        </div>
                    )}

                    {/* Title */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Title</label>
                        <input
                            type="text"
                            value={uploadTitle}
                            onChange={(e) => setUploadTitle(e.target.value)}
                            placeholder="e.g., Homepage Hero Background"
                            style={styles.input}
                            disabled={uploading}
                        />
                    </div>

                    {/* Category */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Category</label>
                        <select
                            value={uploadCategory}
                            onChange={(e) => setUploadCategory(e.target.value)}
                            style={styles.select}
                            disabled={uploading}
                        >
                            {CATEGORY_OPTIONS.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Progress */}
                    {uploading && uploadProgress && (
                        <div style={{
                            background: '#f7f3ed',
                            borderRadius: '8px',
                            padding: '12px 16px',
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '13px',
                            color: '#5d4037',
                        }}>
                            <Loader2 className="animate-spin" size={16} color="#8b7355" />
                            {uploadProgress}
                        </div>
                    )}

                    {/* Actions */}
                    <div style={styles.buttonRow}>
                        <button
                            className="btn btn-outline"
                            style={{ flex: 1 }}
                            onClick={() => setShowUploadModal(false)}
                            disabled={uploading}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            style={{ flex: 1 }}
                            onClick={handleUploadSubmit}
                            disabled={uploading || !uploadFile}
                        >
                            {uploading
                                ? <><Loader2 className="animate-spin" size={16} /> Uploading...</>
                                : <><Upload size={16} /> Upload Asset</>
                            }
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ===== Edit Modal =====

    const renderEditModal = () => {
        if (!showEditModal || !selectedAsset) return null;

        return (
            <div style={styles.modalOverlay} onClick={() => !saving && setShowEditModal(false)}>
                <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                    <div style={styles.modalHeader}>
                        <h2 style={styles.modalTitle}>Edit Asset Metadata</h2>
                        <button
                            style={styles.closeBtn}
                            onClick={() => !saving && setShowEditModal(false)}
                        >
                            <X size={24} color="#888" />
                        </button>
                    </div>

                    {/* Preview */}
                    {selectedAsset.url && selectedAsset.type !== 'video' && (
                        <div style={styles.previewContainer}>
                            <img
                                src={selectedAsset.url}
                                alt={selectedAsset.title}
                                style={styles.previewImg}
                            />
                        </div>
                    )}

                    {/* Key (read-only) */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Key (read-only)</label>
                        <div style={{
                            ...styles.input,
                            background: '#f7f3ed',
                            color: '#8b7355',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                            onClick={() => handleCopyKey(selectedAsset.key)}
                        >
                            <span>{selectedAsset.key}</span>
                            <Copy size={14} color="#8b7355" />
                        </div>
                    </div>

                    {/* Title */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Title</label>
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="Asset title..."
                            style={styles.input}
                            disabled={saving}
                        />
                    </div>

                    {/* Category */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Category</label>
                        <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            style={styles.select}
                            disabled={saving}
                        >
                            {CATEGORY_OPTIONS.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* CDN URL */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>CDN URL</label>
                        <div style={{
                            ...styles.input,
                            background: '#f7f3ed',
                            color: '#8b7355',
                            fontSize: '12px',
                            wordBreak: 'break-all',
                        }}>
                            {selectedAsset.url || 'N/A'}
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={styles.buttonRow}>
                        <button
                            className="btn btn-outline"
                            style={{ flex: 1 }}
                            onClick={() => setShowEditModal(false)}
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            style={{ flex: 1 }}
                            onClick={handleEditSave}
                            disabled={saving}
                        >
                            {saving
                                ? <><Loader2 className="animate-spin" size={16} /> Saving...</>
                                : <><Save size={16} /> Save Changes</>
                            }
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ===== Preview Modal =====

    const renderPreviewModal = () => {
        if (!showPreviewModal || !selectedAsset) return null;

        return (
            <div
                style={styles.modalOverlay}
                onClick={() => setShowPreviewModal(false)}
            >
                <div
                    style={{
                        ...styles.modal,
                        width: '720px',
                        maxWidth: '94vw',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={styles.modalHeader}>
                        <h2 style={styles.modalTitle}>{selectedAsset.title || selectedAsset.key}</h2>
                        <button
                            style={styles.closeBtn}
                            onClick={() => setShowPreviewModal(false)}
                        >
                            <X size={24} color="#888" />
                        </button>
                    </div>

                    {/* Large Preview */}
                    <div style={{
                        width: '100%',
                        maxHeight: '420px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        background: '#f0e6d9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '20px',
                    }}>
                        {selectedAsset.type === 'video' ? (
                            <video
                                src={selectedAsset.url}
                                style={{ maxWidth: '100%', maxHeight: '420px' }}
                                controls
                                autoPlay
                                muted
                            />
                        ) : selectedAsset.url ? (
                            <img
                                src={selectedAsset.url}
                                alt={selectedAsset.title}
                                style={{ maxWidth: '100%', maxHeight: '420px', objectFit: 'contain' }}
                            />
                        ) : (
                            <div style={{ padding: '60px', textAlign: 'center' }}>
                                <ImageIcon size={64} color="#8b7355" />
                                <p style={{ marginTop: '12px', color: '#8b7355' }}>No preview available</p>
                            </div>
                        )}
                    </div>

                    {/* Asset Details */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px',
                        background: '#f7f3ed',
                        borderRadius: '10px',
                        padding: '16px',
                        marginBottom: '18px',
                    }}>
                        <div>
                            <span style={{ fontSize: '11px', color: '#8b7355', fontWeight: 600, textTransform: 'uppercase' }}>Key</span>
                            <p style={{ fontSize: '13px', fontWeight: 700, color: '#3d2c29', wordBreak: 'break-all' }}>{selectedAsset.key}</p>
                        </div>
                        <div>
                            <span style={{ fontSize: '11px', color: '#8b7355', fontWeight: 600, textTransform: 'uppercase' }}>Category</span>
                            <p><span style={styles.cardCategory(selectedAsset.category)}>{selectedAsset.category || 'general'}</span></p>
                        </div>
                        <div>
                            <span style={{ fontSize: '11px', color: '#8b7355', fontWeight: 600, textTransform: 'uppercase' }}>Type</span>
                            <p style={{ fontSize: '13px', color: '#3d2c29' }}>{selectedAsset.type || 'image'}</p>
                        </div>
                        <div>
                            <span style={{ fontSize: '11px', color: '#8b7355', fontWeight: 600, textTransform: 'uppercase' }}>CDN URL</span>
                            <p
                                style={{ fontSize: '11px', color: '#3d2c29', wordBreak: 'break-all', cursor: 'pointer' }}
                                onClick={() => navigator.clipboard.writeText(selectedAsset.url)}
                                title="Click to copy URL"
                            >
                                {selectedAsset.url || 'N/A'}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                            className="btn btn-outline btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => handleCopyKey(selectedAsset.key)}
                        >
                            <Copy size={14} />
                            Copy Key
                        </button>
                        <button
                            className="btn btn-outline btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => window.open(selectedAsset.url, '_blank')}
                        >
                            <Eye size={14} />
                            Open CDN URL
                        </button>
                        <button
                            className="btn btn-outline btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                            onClick={(e) => {
                                setShowPreviewModal(false);
                                openEditModal(selectedAsset, e);
                            }}
                        >
                            <Edit size={14} />
                            Edit
                        </button>
                        <button
                            className="btn btn-outline btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                            onClick={(e) => {
                                setShowPreviewModal(false);
                                handleReplaceClick(selectedAsset, e);
                            }}
                        >
                            <RefreshCw size={14} />
                            Replace
                        </button>
                        <button
                            className="btn btn-sm btn-danger"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}
                            onClick={(e) => {
                                setShowPreviewModal(false);
                                handleDelete(selectedAsset, e);
                            }}
                        >
                            <Trash2 size={14} />
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ===== Global Loading Overlay =====

    const renderUploadOverlay = () => {
        if (!uploading) return null;
        return (
            <div style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                background: '#3d2c29',
                color: '#fff',
                padding: '14px 24px',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                zIndex: 2000,
                fontSize: '14px',
                fontWeight: 600,
            }}>
                <Loader2 className="animate-spin" size={18} />
                {uploadProgress || 'Processing...'}
            </div>
        );
    };

    // ===== Main Render =====

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <h1 className="page-title">Media Gallery</h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        className="btn btn-primary"
                        disabled={uploading}
                        onClick={() => openUploadModal()}
                    >
                        {uploading
                            ? <><Loader2 className="animate-spin" size={18} /> Uploading...</>
                            : <><Upload size={18} /> Upload Asset</>
                        }
                    </button>
                </div>
            </div>

            {/* Hidden file inputs */}
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*,video/*"
                onChange={handleFileInputChange}
            />
            <input
                type="file"
                ref={replaceFileInputRef}
                style={{ display: 'none' }}
                accept="image/*,video/*"
                onChange={handleReplaceFileChange}
            />

            {/* Drop Zone */}
            {renderDropZone()}

            {/* Required Keys Reference */}
            {renderRequiredKeys()}

            {/* Filters */}
            {renderFilterBar()}

            {/* Asset Grid */}
            {renderAssetGrid()}

            {/* Modals */}
            {renderUploadModal()}
            {renderEditModal()}
            {renderPreviewModal()}

            {/* Upload Progress Toast */}
            {renderUploadOverlay()}
        </div>
    );
};
