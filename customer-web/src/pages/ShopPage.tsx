import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useCartStore } from '../stores/cartStore';
import type { TasteProfile } from '../stores/cartStore';
import './ShopPage.css';
import { useShopStore } from '../stores/shopStore';

const BASE_URL = 'https://yyqoagncaxzpxodwnuax.supabase.co/storage/v1/object/public/media/';

// We will use the SVGs we created earlier for Grind Types
const GrindSVGs = {
    'Whole Bean': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <ellipse cx="12" cy="12" rx="8" ry="10" />
            <path d="M8 8c4 2 4 6 0 8" />
        </svg>
    ),
    'Espresso': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 8h12v8a4 4 0 01-4 4h-4a4 4 0 01-4-4V8z" />
            <path d="M18 10h2a2 2 0 012 2v0a2 2 0 01-2 2h-2" />
            <line x1="6" y1="4" x2="18" y2="4" />
        </svg>
    ),
    'Moka Pot': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 20h8l1-6H7l1 6z" />
            <path d="M7 14l2-8h6l2 8" />
            <path d="M10 6V4h4v2" />
        </svg>
    ),
    'French Press': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="6" y="6" width="12" height="14" rx="1" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="6" y1="14" x2="18" y2="14" />
        </svg>
    ),
    'Pour Over': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 4h12l-3 10H9L6 4z" />
            <rect x="8" y="14" width="8" height="6" rx="1" />
        </svg>
    ),
    'Filter': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 4h16l-6 8v6l-4 2v-8L4 4z" />
        </svg>
    ),
};

const GRIND_TYPES = Object.keys(GrindSVGs) as Array<keyof typeof GrindSVGs>;

const ROAST_LEVELS = [
    { id: 'Light' },
    { id: 'Medium' },
    { id: 'Balanced' },
] as const;

export default function ShopPage() {
    const navigate = useNavigate();
    const { addItem } = useCartStore();

    // Global Shop State (Persisted)
    const {
        step, setStep,
        bitterness, acidity, flavour, setTaste,
        roastLevel, setRoastLevel,
        grindType, setGrindType
    } = useShopStore();

    // Generate Dynamic SKU
    const generateSKU = (b: number, a: number, f: number, r: string, g: string) => {
        return `CR-${b}${a}${f}-${r.charAt(0).toUpperCase()}${g.charAt(0).toUpperCase()}`;
    };

    const currentSKU = generateSKU(bitterness, acidity, flavour, roastLevel, grindType);

    // Mock Saved Profiles with updated naming convention
    const [savedProfiles, setSavedProfiles] = useState<TasteProfile[]>([
        { id: '1', name: 'CR-423-DF', bitterness: 4, acidity: 2, flavour: 3, body: 4, roastLevel: 'Balanced', grindType: 'French Press' },
        { id: '2', name: 'CR-235-MP', bitterness: 2, acidity: 3, flavour: 5, body: 3, roastLevel: 'Medium', grindType: 'Pour Over' },
    ]);

    const removeProfile = (id: string) => {
        setSavedProfiles(prev => prev.filter(p => p.id !== id));
    };

    const loadProfile = (p: TasteProfile) => {
        setTaste('bitterness', p.bitterness);
        setTaste('acidity', p.acidity);
        setTaste('flavour', p.flavour);
        if (p.roastLevel) setRoastLevel(p.roastLevel as any);
        if (p.grindType) setGrindType(p.grindType as any);
    };

    const handleAddToCart = () => {
        const profile: TasteProfile = {
            id: `custom-${Date.now()}`,
            name: currentSKU,
            bitterness,
            acidity,
            body: 3, // Default
            flavour,
            roastLevel,
            grindType,
        };

        // Auto-save to catalogue if unique
        const isDuplicate = savedProfiles.some(p => p.name === currentSKU);
        if (!isDuplicate) {
            const newSavedProfile: TasteProfile = {
                ...profile,
                id: `saved-${Date.now()}`, // Distinct ID for saved list
            };
            setSavedProfiles(prev => [...prev, newSavedProfile]);
        }

        addItem(profile);
        navigate('/cart');
    };

    // Save current as new profile
    const saveCurrentProfile = () => {
        const newProfile: TasteProfile = {
            id: `saved-${Date.now()}`,
            name: currentSKU,
            bitterness,
            acidity,
            body: 3,
            flavour,
            roastLevel,
            grindType,
        };
        setSavedProfiles(prev => [...prev, newProfile]);
    };

    // Total steps for the stepper (now 2 steps)
    const totalSteps = 2;
    const getDisplayStep = () => step;

    return (
        <div className="shop-page">
            <Header variant="light" />

            <main className="shop-layout">
                {/* Mobile Product Preview Header - Only visible on mobile */}
                <div className="mobile-product-header">
                    <div className="mobile-product-preview">
                        <img
                            src={`${BASE_URL}product_bag.png`}
                            alt="Custom Coffee Blend"
                            className="mobile-product-img"
                        />
                        <span className="mobile-blend-label">YOUR BLEND</span>
                    </div>
                    <div className="step-indicator">
                        <span className="step-text">STEP {getDisplayStep()} OF {totalSteps}</span>
                        <div className="step-dots">
                            {[1, 2].map((s) => (
                                <div
                                    key={s}
                                    className={`step-dot ${s <= getDisplayStep() ? 'active' : ''}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* LEFT: Product Image & Details - Desktop only */}
                <div className="shop-left">
                    <div className="product-showcase">
                        <img
                            src={`${BASE_URL}product_bag.png`}
                            alt="Custom Coffee Blend"
                            className="shop-product-img"
                        />
                    </div>

                    {/* Live Customization Details Summary */}
                    <div className="live-details-card">
                        <h3>YOUR BLEND</h3>
                        <div className="sku-display">{currentSKU}</div>

                        <div className="detail-row">
                            <span>Roast</span>
                            <strong>{roastLevel}</strong>
                        </div>
                        <div className="detail-row">
                            <span>Grind</span>
                            <strong>{grindType}</strong>
                        </div>
                        <div className="detail-row">
                            <span>Profile</span>
                            <strong>{bitterness}/{acidity}/{flavour}</strong>
                        </div>
                        <button className="btn-save-profile" onClick={saveCurrentProfile}>
                            SAVE PROFILE
                        </button>
                    </div>

                    {/* Saved Custom Roasts Section (Siderail) */}
                    <div className="saved-roasts-container">
                        <h3 className="saved-roasts-title">SAVED CATALOG</h3>
                        {savedProfiles.length === 0 ? (
                            <p className="no-saved-roasts">No saved roasts.</p>
                        ) : (
                            <div className="saved-roasts-list">
                                {savedProfiles.map((p) => (
                                    <div key={p.id} className="saved-roast-card" onClick={() => loadProfile(p)}>
                                        <div className="saved-roast-info">
                                            <span className="saved-roast-name">{p.name}</span>
                                            <span className="saved-roast-desc">{p.roastLevel} • {p.grindType}</span>
                                        </div>
                                        <button className="btn-delete-roast" onClick={(e) => { e.stopPropagation(); removeProfile(p.id); }}>
                                            &times;
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Customization - Carousel */}
                <div className="shop-right">
                    <div className="customization-container">

                        {/* VIEW 1: Taste Profile */}
                        <div className={`slide-view ${step === 1 ? 'active' : 'hidden-left'}`}>
                            <div className="mobile-customization-card">
                                <div className="step-header">
                                    <h2>Taste Profile</h2>
                                    <p>Adjust to your preference</p>
                                </div>

                                <div className="sliders-container">
                                    <div className="slider-group">
                                        <div className="slider-labels">
                                            <label>Bitterness</label>
                                            <span className="slider-val">{bitterness}/5</span>
                                        </div>
                                        <input
                                            type="range" min="1" max="5" value={bitterness}
                                            onChange={(e) => setTaste('bitterness', Number(e.target.value))}
                                            className="styled-slider"
                                        />
                                    </div>

                                    <div className="slider-group">
                                        <div className="slider-labels">
                                            <label>Acidity</label>
                                            <span className="slider-val">{acidity}/5</span>
                                        </div>
                                        <input
                                            type="range" min="1" max="5" value={acidity}
                                            onChange={(e) => setTaste('acidity', Number(e.target.value))}
                                            className="styled-slider"
                                        />
                                    </div>



                                    <div className="slider-group">
                                        <div className="slider-labels">
                                            <label>Flavour</label>
                                            <span className="slider-val">{flavour}/5</span>
                                        </div>
                                        <input
                                            type="range" min="1" max="5" value={flavour}
                                            onChange={(e) => setTaste('flavour', Number(e.target.value))}
                                            className="styled-slider"
                                        />
                                    </div>
                                </div>

                                <div className="nav-next-container">
                                    <button className="btn-next-roast" onClick={() => setStep(2)}>
                                        NEXT: ROAST & GRIND →
                                    </button>
                                </div>
                                <button className="btn-add-to-cart-desktop desktop-only step1-spacer" onClick={handleAddToCart}>
                                    ADD TO CART • ₹799
                                </button>
                            </div>
                        </div>

                        {/* VIEW 2: Roast & Grind Combined */}
                        <div className={`slide-view ${step === 2 ? 'active' : 'hidden-right'}`}>
                            <div className="mobile-customization-card">
                                {/* Back Button */}
                                <button className="btn-back" onClick={() => setStep(1)}>
                                    ← BACK
                                </button>

                                {/* Roast Level Section */}
                                <div className="step-section">
                                    <div className="step-header">
                                        <h2>Roast Level</h2>
                                    </div>
                                    <div className="roast-tiles-inline">
                                        {ROAST_LEVELS.map((r) => (
                                            <button
                                                key={r.id}
                                                className={`roast-chip ${roastLevel === r.id ? 'selected' : ''}`}
                                                onClick={() => setRoastLevel(r.id)}
                                            >
                                                {r.id}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Grind Type Section */}
                                <div className="step-section">
                                    <div className="step-header">
                                        <h2>Grind Type</h2>
                                    </div>
                                    <div className="grind-tiles-mobile">
                                        {GRIND_TYPES.map((g) => (
                                            <button
                                                key={g}
                                                className={`tile grind-tile ${grindType === g ? 'selected' : ''}`}
                                                onClick={() => setGrindType(g)}
                                            >
                                                <div className="tile-icon">{GrindSVGs[g]}</div>
                                                <span className="tile-title-sm">{g}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button className="btn-add-to-cart-desktop desktop-only step2-spacer" onClick={handleAddToCart}>
                                    ADD TO CART • ₹799
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Sticky Cart Bar */}
                    <div className="mobile-sticky-cart">
                        <div className="mobile-cart-content">
                            <div className="mobile-cart-info">
                                <span className="mobile-cart-label">Your Custom Blend</span>
                                <span className="mobile-cart-desc">{roastLevel} • {grindType} • 250g</span>
                            </div>
                            <button className="mobile-cart-btn" onClick={handleAddToCart}>
                                ADD TO CART <span className="mobile-cart-price">₹799</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
