import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useCartStore, TasteProfile } from '@/src/stores/cartStore';
import { useAuthStore } from '@/src/stores/authStore';

const GRIND_TYPES = [
    { id: 'Whole Bean', icon: '☕' },
    { id: 'Espresso', icon: '💧' },
    { id: 'Moka Pot', icon: '🧪' },
    { id: 'French Press', icon: '🍺' },
    { id: 'Pour Over', icon: '🔽' },
    { id: 'Filter', icon: '📄' },
] as const;

const ROAST_LEVELS = [
    { id: 'Light', desc: 'Bright & Floral' },
    { id: 'Medium', desc: 'Smooth & Sweet' },
    { id: 'Dark', desc: 'Rich & Bold' },
] as const;

// Pure Web Component using local React state for guaranteed reactivity
export default function WebShopScreen() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);

    // LOCAL STATE - guaranteed to trigger re-renders
    const [bitterness, setBitterness] = useState(3);
    const [acidity, setAcidity] = useState(3);
    const [flavour, setFlavour] = useState(3);
    const [roastLevel, setRoastLevel] = useState<string>('Medium');
    const [grindType, setGrindType] = useState<string>('Whole Bean');

    const { addItem, items } = useCartStore();
    const { user } = useAuthStore();
    const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

    const handleAddToCart = async () => {
        console.log('ADD TO CART CLICKED');

        const profile: TasteProfile = {
            id: `custom-${Date.now()}`,
            name: `Blend #${Date.now().toString().slice(-4)}`,
            bitterness,
            acidity,
            body: 3,
            flavour,
            roastLevel: roastLevel as any,
            grindType: grindType as any,
        };

        addItem(profile);
        router.push('/cart');
    };

    // DEBUG: Log all state changes
    React.useEffect(() => {
        console.log('[WebShopScreen] STATE CHANGE:', { currentStep, bitterness, acidity, flavour, roastLevel, grindType });
    }, [currentStep, bitterness, acidity, flavour, roastLevel, grindType]);

    // DEBUG: Native click listener to check if events reach DOM
    React.useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            console.log('[NATIVE CLICK]', (e.target as HTMLElement)?.tagName, (e.target as HTMLElement)?.innerText?.slice(0, 30));
        };
        document.addEventListener('click', handleClick, true);
        console.log('[WebShopScreen] Native click listener attached');
        return () => document.removeEventListener('click', handleClick, true);
    }, []);

    // Explicit handlers with debug
    const goToStep = (step: number) => {
        console.log('[goToStep] Setting step to:', step);
        setCurrentStep(step);
    };

    const updateBitterness = (val: number) => {
        console.log('[updateBitterness]:', val);
        setBitterness(val);
    };

    const updateAcidity = (val: number) => {
        console.log('[updateAcidity]:', val);
        setAcidity(val);
    };

    const updateFlavour = (val: number) => {
        console.log('[updateFlavour]:', val);
        setFlavour(val);
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <header style={styles.header}>
                <div style={styles.headerLeft}>
                    <span style={styles.logo}>☕</span>
                    <span style={styles.brandName}>SHADOW BEAN CO.</span>
                </div>
                <button
                    style={styles.cartButton}
                    onClick={() => router.push('/cart')}
                >
                    🛒 {cartCount > 0 && <span style={styles.badge}>{cartCount}</span>}
                </button>
            </header>

            {/* Step Indicator */}
            <div style={styles.stepIndicator}>
                <span style={styles.stepText}>STEP {currentStep + 1} OF 3</span>
                <div style={styles.dots}>
                    {[0, 1, 2].map(i => (
                        <button
                            key={i}
                            onClick={() => setCurrentStep(i)}
                            style={{
                                ...styles.dot,
                                ...(currentStep === i ? styles.dotActive : {})
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Carousel */}
            <div style={styles.carousel}>
                {/* Step 1: Taste Profile */}
                <div style={{ ...styles.card, display: currentStep === 0 ? 'block' : 'none' }}>
                    <h2 style={styles.cardTitle}>Taste Profile</h2>
                    <p style={styles.cardSubtitle}>Adjust to your preference</p>

                    {/* Bitterness Slider */}
                    <div style={styles.sliderRow}>
                        <div style={styles.sliderHeader}>
                            <label style={styles.sliderLabel}>Bitterness</label>
                            <span style={styles.sliderValue}>{bitterness}/5</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="5"
                            step="1"
                            value={bitterness}
                            onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                console.log('Bitterness changed to:', val);
                                setBitterness(val);
                            }}
                            style={styles.slider}
                        />
                    </div>

                    {/* Acidity Slider */}
                    <div style={styles.sliderRow}>
                        <div style={styles.sliderHeader}>
                            <label style={styles.sliderLabel}>Acidity</label>
                            <span style={styles.sliderValue}>{acidity}/5</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="5"
                            step="1"
                            value={acidity}
                            onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                console.log('Acidity changed to:', val);
                                setAcidity(val);
                            }}
                            style={styles.slider}
                        />
                    </div>

                    {/* Flavour Slider */}
                    <div style={styles.sliderRow}>
                        <div style={styles.sliderHeader}>
                            <label style={styles.sliderLabel}>Flavour</label>
                            <span style={styles.sliderValue}>{flavour}/5</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="5"
                            step="1"
                            value={flavour}
                            onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                console.log('Flavour changed to:', val);
                                setFlavour(val);
                            }}
                            style={styles.slider}
                        />
                    </div>

                    <div
                        role="button"
                        tabIndex={0}
                        style={{ ...styles.nextButton, userSelect: 'none' }}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            console.log('[DIV CLICK] NEXT: ROAST LEVEL');
                            goToStep(1);
                        }}
                    >
                        NEXT: ROAST LEVEL →
                    </div>
                </div>

                {/* Step 2: Roast Level */}
                <div style={{ ...styles.card, display: currentStep === 1 ? 'block' : 'none' }}>
                    <h2 style={styles.cardTitle}>Roast Level</h2>
                    <p style={styles.cardSubtitle}>Choose your intensity</p>

                    <div style={styles.roastGrid}>
                        {ROAST_LEVELS.map(level => {
                            const isSelected = roastLevel === level.id;
                            return (
                                <button
                                    key={level.id}
                                    onClick={() => {
                                        console.log('Roast selected:', level.id);
                                        setRoastLevel(level.id);
                                    }}
                                    style={{
                                        ...styles.roastOption,
                                        ...(isSelected ? styles.roastOptionSelected : {})
                                    }}
                                >
                                    <span style={{
                                        ...styles.roastName,
                                        ...(isSelected ? styles.roastNameSelected : {})
                                    }}>{level.id}</span>
                                    <span style={styles.roastDesc}>{level.desc}</span>
                                </button>
                            );
                        })}
                    </div>

                    <button style={styles.nextButton} onClick={() => setCurrentStep(2)}>
                        NEXT: GRIND TYPE →
                    </button>
                </div>

                {/* Step 3: Grind Type */}
                <div style={{ ...styles.card, display: currentStep === 2 ? 'block' : 'none' }}>
                    <h2 style={styles.cardTitle}>Grind Type</h2>
                    <p style={styles.cardSubtitle}>Match your brewing method</p>

                    <div style={styles.grindGrid}>
                        {GRIND_TYPES.map(grind => {
                            const isSelected = grindType === grind.id;
                            return (
                                <button
                                    key={grind.id}
                                    onClick={() => {
                                        console.log('Grind selected:', grind.id);
                                        setGrindType(grind.id);
                                    }}
                                    style={{
                                        ...styles.grindOption,
                                        ...(isSelected ? styles.grindOptionSelected : {})
                                    }}
                                >
                                    <span style={styles.grindIcon}>{grind.icon}</span>
                                    <span style={{
                                        ...styles.grindLabel,
                                        ...(isSelected ? styles.grindLabelSelected : {})
                                    }}>{grind.id}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Cart Section */}
            <div style={styles.cartSection}>
                <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>Your Custom Blend</span>
                    <span style={styles.summaryValue}>
                        {roastLevel} • {grindType} • 250g
                    </span>
                </div>
                <button style={styles.addToCartButton} onClick={handleAddToCart}>
                    ADD TO CART
                    <span style={styles.priceTag}>₹799</span>
                </button>
            </div>

            {/* Debug */}
            <p style={styles.debug}>
                State: Bitterness={bitterness}, Acidity={acidity}, Flavour={flavour}, Roast={roastLevel}, Grind={grindType}
            </p>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#FAF8F5',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        paddingBottom: 100,
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: 'rgba(255,255,255,0.98)',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    logo: {
        fontSize: 24,
    },
    brandName: {
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: 2,
        color: '#2C2724',
    },
    cartButton: {
        background: 'none',
        border: 'none',
        fontSize: 24,
        cursor: 'pointer',
        position: 'relative',
        padding: 8,
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#6B8E23',
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
        borderRadius: 10,
        padding: '2px 6px',
    },
    stepIndicator: {
        padding: '16px',
        textAlign: 'center',
    },
    stepText: {
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 2,
        color: '#888',
        marginBottom: 8,
        display: 'block',
    },
    dots: {
        display: 'flex',
        justifyContent: 'center',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E0DCD6',
        border: 'none',
        cursor: 'pointer',
        transition: '0.2s all',
    },
    dotActive: {
        backgroundColor: '#5D4037',
        width: 24,
    },
    carousel: {
        padding: '0 16px',
        maxWidth: 500,
        margin: '0 auto',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #F2F0ED',
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 800,
        color: '#2C2724',
        marginBottom: 4,
        marginTop: 0,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#888',
        marginBottom: 24,
        marginTop: 0,
    },
    sliderRow: {
        marginBottom: 20,
    },
    sliderHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    sliderLabel: {
        fontSize: 14,
        fontWeight: 600,
        color: '#4A403A',
    },
    sliderValue: {
        fontSize: 14,
        fontWeight: 700,
        color: '#5D4037',
    },
    slider: {
        width: '100%',
        height: 40,
        accentColor: '#5D4037',
        cursor: 'pointer',
    },
    nextButton: {
        width: '100%',
        backgroundColor: '#5D4037',
        color: '#fff',
        border: 'none',
        borderRadius: 12,
        padding: '14px 24px',
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: 1.5,
        cursor: 'pointer',
        marginTop: 20,
        transition: '0.2s all',
    },
    roastGrid: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
    },
    roastOption: {
        backgroundColor: '#F8F6F3',
        border: '2px solid transparent',
        borderRadius: 12,
        padding: 14,
        textAlign: 'left',
        cursor: 'pointer',
        transition: '0.2s all',
        display: 'block',
        width: '100%',
    },
    roastOptionSelected: {
        borderColor: '#5D4037',
        backgroundColor: '#FAF7F4',
    },
    roastName: {
        fontSize: 15,
        fontWeight: 700,
        color: '#666',
        display: 'block',
        marginBottom: 2,
    },
    roastNameSelected: {
        color: '#5D4037',
    },
    roastDesc: {
        fontSize: 11,
        color: '#999',
    },
    grindGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10,
    },
    grindOption: {
        backgroundColor: '#F8F6F3',
        border: '2px solid transparent',
        borderRadius: 12,
        padding: '16px 8px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: '0.2s all',
    },
    grindOptionSelected: {
        backgroundColor: '#5D4037',
        borderColor: '#5D4037',
    },
    grindIcon: {
        fontSize: 24,
        display: 'block',
        marginBottom: 4,
    },
    grindLabel: {
        fontSize: 11,
        color: '#666',
        fontWeight: 600,
    },
    grindLabelSelected: {
        color: '#fff',
    },
    cartSection: {
        margin: '20px 16px 40px',
        backgroundColor: '#1C1614',
        borderRadius: 24,
        padding: 20,
        maxWidth: 500,
        marginLeft: 'auto',
        marginRight: 'auto',
    },
    summaryRow: {
        marginBottom: 16,
    },
    summaryLabel: {
        display: 'block',
        fontSize: 12,
        color: '#888',
        marginBottom: 4,
    },
    summaryValue: {
        display: 'block',
        fontSize: 14,
        fontWeight: 700,
        color: '#fff',
    },
    addToCartButton: {
        width: '100%',
        backgroundColor: '#6B8E23',
        color: '#fff',
        border: 'none',
        borderRadius: 12,
        padding: '16px 24px',
        fontSize: 14,
        fontWeight: 800,
        letterSpacing: 1,
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        transition: '0.2s all',
    },
    priceTag: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: '4px 8px',
        borderRadius: 4,
        fontSize: 13,
    },
    debug: {
        fontSize: 10,
        color: '#aaa',
        textAlign: 'center',
        padding: 20,
    },
};
