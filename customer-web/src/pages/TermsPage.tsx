import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveTerms } from '../services/api';

const BG = '#FAF8F5';
const CARD = '#ffffff';
const BORDER = '#e0d6cc';
const OLIVE = '#4f5130';
const DARK = '#1c0d02';
const MUTED = '#98918a';

export default function TermsPage() {
    const nav = useNavigate();
    const [content, setContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getActiveTerms()
            .then(terms => setContent(terms?.content || null))
            .catch(() => setContent(null))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ minHeight: '100dvh', background: BG, fontFamily: "'Montserrat', sans-serif" }}>
            <header style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, position: 'sticky', top: 0, zIndex: 20 }}>
                <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={() => nav(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, color: OLIVE, fontWeight: 600, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer' }}>
                        ← Back
                    </button>
                    <div style={{ width: 1, height: 22, background: BORDER }} />
                    <h1 style={{ fontFamily: "'Agdasima', sans-serif", fontSize: 24, fontWeight: 700, color: DARK, margin: 0 }}>Terms & Conditions</h1>
                </div>
            </header>

            <div style={{ maxWidth: 800, margin: '0 auto', padding: '36px 24px 80px' }}>
                <div style={{
                    background: CARD, borderRadius: 20, border: `1.5px solid ${BORDER}`,
                    padding: '32px 32px', boxShadow: '0 2px 12px rgba(28,13,2,0.05)',
                }}>
                    {loading ? (
                        <p style={{ color: MUTED, textAlign: 'center', padding: 40 }}>Loading...</p>
                    ) : content ? (
                        <div
                            style={{ color: DARK, fontSize: 14, lineHeight: 1.8 }}
                            dangerouslySetInnerHTML={{ __html: content }}
                        />
                    ) : (
                        <p style={{ color: MUTED, textAlign: 'center', padding: 40 }}>
                            Terms & Conditions will be available soon. For questions, contact us at contact@shadowbeanco.com
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
