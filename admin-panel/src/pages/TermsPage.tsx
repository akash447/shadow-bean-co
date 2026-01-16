import React, { useEffect, useState } from 'react';
import { getTerms, updateTerms } from '../lib/supabase';
import { Save, FileText } from 'lucide-react';

export const TermsPage: React.FC = () => {
    const [content, setContent] = useState('');
    const [version, setVersion] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        loadTerms();
    }, []);

    const loadTerms = async () => {
        const { data, error } = await getTerms();
        if (!error && data) {
            setContent(data.content || '');
            setVersion(data.version || 0);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        await updateTerms(content);
        setSaving(false);
        setSaved(true);
        loadTerms();
        setTimeout(() => setSaved(false), 3000);
    };

    if (loading) {
        return <div>Loading terms...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Terms & Conditions</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: '#8b7355' }}>Version {version}</span>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save & Publish'}
                    </button>
                </div>
            </div>

            {saved && (
                <div style={{
                    background: '#d4edda',
                    color: '#155724',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '16px'
                }}>
                    Terms saved successfully! Version {version + 1} is now live.
                </div>
            )}

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">
                        <FileText size={20} style={{ marginRight: '8px' }} />
                        Edit Terms & Conditions
                    </h3>
                </div>
                <p style={{ color: '#8b7355', marginBottom: '16px' }}>
                    Edit your Terms & Conditions below. Changes will create a new version when saved.
                </p>
                <textarea
                    className="form-input form-textarea"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter your Terms & Conditions here..."
                    style={{ minHeight: '400px', fontFamily: 'monospace' }}
                />
            </div>
        </div>
    );
};
