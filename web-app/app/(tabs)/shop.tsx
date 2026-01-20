import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    TouchableOpacity,
    Dimensions,
    Image,
    NativeSyntheticEvent,
    NativeScrollEvent,
    useWindowDimensions,
    Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTasteProfileStore } from '@/src/stores/tasteProfileStore';
import { useCartStore, TasteProfile } from '@/src/stores/cartStore';
import { useAuthStore } from '@/src/stores/authStore';
import { SupabaseImage } from '@/src/components/SupabaseImage';
import { ImageKeys } from '@/src/constants/imageKeys';

// Import pure web component for responsive web experience
import WebShopScreen from '@/src/components/WebShopScreen';

const GRIND_TYPES = [
    { id: 'Whole Bean', icon: 'cafe' },
    { id: 'Espresso', icon: 'water' },
    { id: 'Moka Pot', icon: 'flask' },
    { id: 'French Press', icon: 'beer' },
    { id: 'Pour Over', icon: 'funnel' },
    { id: 'Filter', icon: 'filter' },
] as const;

const ROAST_LEVELS = [
    { id: 'Light', desc: 'Bright & Floral' },
    { id: 'Medium', desc: 'Smooth & Sweet' },
    { id: 'Dark', desc: 'Rich & Bold' },
] as const;

const { width: STATIC_SCREEN_WIDTH } = Dimensions.get('window');

function TasteSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    // Local state for immediate responsiveness
    const [localValue, setLocalValue] = useState(value);

    // Sync from store if store updates externally (e.g. hydration)
    React.useEffect(() => {
        setLocalValue(value);
    }, [value]);

    return (
        <View style={styles.sliderRow}>
            <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>{label}</Text>
                <Text style={styles.sliderValue}>{localValue}/5</Text>
            </View>
            {Platform.OS === 'web' ? (
                <View style={{ width: '100%', paddingVertical: 10 }}>
                    <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={localValue}
                        onChange={(e: any) => {
                            const val = parseInt(e.target.value, 10);
                            console.log('Slider changed to:', val);
                            setLocalValue(val);
                            onChange(val); // Sync to Store
                        }}
                        style={{
                            width: '100%',
                            accentColor: '#5D4037',
                            cursor: 'pointer',
                            // @ts-ignore
                            touchAction: 'none',
                            position: 'relative',
                            zIndex: 10,
                            pointerEvents: 'auto'
                        }}
                    />
                </View>
            ) : (
                <Slider
                    style={styles.slider}
                    minimumValue={1}
                    maximumValue={5}
                    step={1}
                    value={localValue}
                    onValueChange={(val) => {
                        setLocalValue(val);
                        onChange(val);
                    }}
                    minimumTrackTintColor="#5D4037"
                    maximumTrackTintColor="#E8E4E0"
                    thumbTintColor="#5D4037"
                />
            )}
        </View>
    );
}

export default function ShopScreen() {
    // Use pure web component on web platform for responsive interactions
    if (Platform.OS === 'web') {
        return <WebShopScreen />;
    }

    const router = useRouter();
    const stepScrollRef = useRef<ScrollView>(null);
    const [currentStep, setCurrentStep] = useState(0);

    // DEBUG: Verify Mount
    React.useEffect(() => {
        console.log('ShopScreen MOUNTED');
        if (Platform.OS === 'web') {
            console.log('Web Environment Verified in ShopScreen');
            // @ts-ignore
            window.shopScreenLoaded = true;
        }
    }, []);


    const {
        currentCustomization,
        setCurrentCustomization,
        saveProfile,
        deleteProfile,
        profiles,
    } = useTasteProfileStore();
    const { addItem, items } = useCartStore();
    const { user } = useAuthStore();
    const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

    // Responsive dimensions - match app layout
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const isTablet = SCREEN_WIDTH >= 768;

    // CAROUSEL FIX: 
    // Ensure we have a safe width for calculation to avoid 0px width on initial render/SSR
    const SAFE_WIDTH = SCREEN_WIDTH || 375;

    const STEP_WIDTH = Platform.OS === 'web'
        ? (isTablet ? 500 : SAFE_WIDTH * 0.92) // 92% width on Mobile Web
        : isTablet
            ? Math.min(SAFE_WIDTH - 200, 500)
            : SAFE_WIDTH - 40;

    // For Web Style, we prefer percentage string to avoid hydration mismatches
    const cardWidthStyle = Platform.OS === 'web' && !isTablet ? '92vw' : STEP_WIDTH;

    const scrollToStep = (step: number) => {
        // Ensure accurate scrolling calculation
        stepScrollRef.current?.scrollTo({ x: step * (STEP_WIDTH + 12), animated: true }); // +12 for marginRight gap
        setCurrentStep(step);
    };

    const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const step = Math.round(e.nativeEvent.contentOffset.x / STEP_WIDTH);
        setCurrentStep(step);
    };

    const handleAddCustomToCart = async () => {
        // PROOF OF LIFE
        if (Platform.OS === 'web') console.log("ADD TO CART CLICKED");

        try {
            console.log('=== handleAddCustomToCart triggered ===');
            if (Platform.OS === 'web') {
                // Immediate feedback
                console.log('Web environment detected');
            }

            const profile: TasteProfile = {
                id: `custom-${Date.now()}`,
                name: `Blend #${profiles.length + 1}`,
                bitterness: currentCustomization.bitterness ?? 3,
                acidity: currentCustomization.acidity ?? 3,
                body: currentCustomization.body ?? 3,
                flavour: currentCustomization.flavour ?? 3,
                roastLevel: (currentCustomization.roastLevel ?? 'Medium') as 'Light' | 'Medium' | 'Dark',
                grindType: (currentCustomization.grindType ?? 'Whole Bean') as 'Whole Bean' | 'Espresso' | 'Moka Pot' | 'French Press' | 'Pour Over' | 'Filter',
            };

            console.log('Adding item:', profile);
            addItem(profile);

            // Save profile safely
            if (user) {
                try {
                    await saveProfile(user.id);
                } catch (err) {
                    console.error('Profile save error:', err);
                }
            }

            // Navigate
            console.log('Navigating to Cart...');
            if (Platform.OS === 'web') {
                // Use Router for SPA navigation - preserves state in memory
                setTimeout(() => {
                    router.push('/cart');
                }, 100);
            } else {
                router.push('/cart');
            }
        } catch (error) {
            console.error('CRITICAL ERROR:', error);
            if (Platform.OS === 'web') window.alert('Error: ' + error);
        }
    };

    return (
        <View style={styles.container}>
            {/* FIXED HEADER - Matches App Design */}
            <View style={[styles.fixedHeader, { paddingTop: Platform.OS === 'web' ? 8 : 44, paddingBottom: 8 }]}>
                <View style={styles.headerLeft}>
                    <Image
                        source={require('@/assets/images/logo_bird.png')}
                        style={styles.headerLogo}
                        resizeMode="contain"
                    />
                    <Text style={styles.headerTitle}>SHADOW BEAN CO.</Text>
                </View>
                <Pressable
                    style={{ position: 'relative', padding: 8 }}
                    onPress={() => router.push('/cart')}
                >
                    <Ionicons name="cart-outline" size={28} color="#2C2724" />
                    {cartCount > 0 && (
                        <View style={styles.cartBadge}>
                            <Text style={styles.cartBadgeText}>{cartCount}</Text>
                        </View>
                    )}
                </Pressable>
            </View>

            <ScrollView
                style={styles.mainScroll}
                contentContainerStyle={[
                    styles.mainContent,
                    isTablet && { alignItems: 'center' }
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={[
                    styles.topSection,
                    isTablet && { maxWidth: 800, width: '100%', paddingHorizontal: 40 },
                    // Reduce padding on mobile to pull content up
                    !isTablet && { paddingBottom: 0 }
                ]}>
                    <View style={styles.productPreview}>
                        <Image
                            source={require('@/assets/images/product_bag.png')}
                            style={[
                                styles.productImage,
                                // Responsive Compact Image
                                { height: isTablet ? 130 : 100, width: isTablet ? 100 : 80 }
                            ]}
                            resizeMode="contain"
                        />
                        <Text style={[
                            styles.productLabel,
                            isTablet && { fontSize: 10 }
                        ]}>YOUR BLEND</Text>
                        <Text style={[
                            styles.productName,
                            isTablet && { fontSize: 14 }
                        ]}>
                            {currentCustomization.roastLevel || 'Medium'} Roast
                        </Text>
                    </View>

                    <View style={styles.stepIndicator}>
                        <Text style={[
                            styles.stepText,
                            isTablet && { fontSize: 12 }
                        ]}>STEP {currentStep + 1} OF 3</Text>
                        <View style={styles.stepDots}>
                            {[0, 1, 2].map((i) => (
                                <Pressable key={i} onPress={() => scrollToStep(i)}>
                                    <View style={[
                                        styles.stepDot,
                                        currentStep === i && styles.stepDotActive,
                                        isTablet && { width: 12, height: 12, borderRadius: 6 },
                                        isTablet && currentStep === i && { width: 32 }
                                    ]} />
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Horizontal Swipeable Steps */}
                <ScrollView
                    ref={stepScrollRef}
                    horizontal
                    pagingEnabled={Platform.OS !== 'web'}
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={handleScroll}
                    contentContainerStyle={[styles.stepsContainer, { paddingBottom: 0 }]}
                    decelerationRate="fast"
                    snapToInterval={Platform.OS === 'web' ? undefined : STEP_WIDTH}
                    style={Platform.OS === 'web' ? {
                        // @ts-ignore
                        scrollSnapType: 'x mandatory'
                    } : undefined}
                >
                    {/* ... Steps content ... */}
                    {/* Note: Ensure closing tag is matched in context, applied via replace block end */}

                    {/* Step 1: Taste Profile */}
                    <View style={[styles.stepCard, { width: cardWidthStyle as any }]}>
                        <Text style={styles.stepTitle}>Taste Profile</Text>
                        <Text style={styles.stepSubtitle}>Adjust to your preference</Text>
                        <View style={styles.slidersContainer}>
                            <TasteSlider
                                label="Bitterness"
                                value={currentCustomization.bitterness ?? 3}
                                onChange={(v) => setCurrentCustomization({ bitterness: v })}
                            />
                            <TasteSlider
                                label="Acidity"
                                value={currentCustomization.acidity ?? 3}
                                onChange={(v) => setCurrentCustomization({ acidity: v })}
                            />
                            {/* Body Removed as per request */}
                            <TasteSlider
                                label="Flavour"
                                value={currentCustomization.flavour ?? 3}
                                onChange={(v) => setCurrentCustomization({ flavour: v })}
                            />
                        </View>
                        <Pressable style={styles.nextButton} onPress={() => scrollToStep(1)}>
                            <Text style={styles.nextButtonText}>NEXT: ROAST LEVEL →</Text>
                        </Pressable>
                    </View>

                    {/* Step 2: Roast Level */}
                    <View style={[styles.stepCard, { width: cardWidthStyle as any }]}>
                        <Text style={styles.stepTitle}>Roast Level</Text>
                        <Text style={styles.stepSubtitle}>Choose your intensity</Text>
                        <View style={styles.roastGrid}>
                            {ROAST_LEVELS.map((level) => {
                                const isSelected = currentCustomization.roastLevel === level.id;
                                const handlePress = () => {
                                    console.log('Selected Roast:', level.id);
                                    setCurrentCustomization({ roastLevel: level.id as any });
                                };

                                if (Platform.OS === 'web') {
                                    return (
                                        <View
                                            key={level.id}
                                            // @ts-ignore
                                            onClick={handlePress}
                                            style={[
                                                styles.roastOption,
                                                isSelected && styles.roastOptionSelected,
                                                // @ts-ignore
                                                { cursor: 'pointer', transition: '0.2s all' }
                                            ]}
                                        >
                                            <Text style={[styles.roastName, isSelected && styles.roastNameSelected]}>{level.id}</Text>
                                            <Text style={styles.roastDesc}>{level.desc}</Text>
                                        </View>
                                    );
                                }

                                return (
                                    <TouchableOpacity
                                        key={level.id}
                                        activeOpacity={0.7}
                                        onPress={handlePress}
                                        style={[styles.roastOption, isSelected && styles.roastOptionSelected, { zIndex: 50 }]}
                                    >
                                        <Text style={[styles.roastName, isSelected && styles.roastNameSelected]}>{level.id}</Text>
                                        <Text style={styles.roastDesc}>{level.desc}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <Pressable style={styles.nextButton} onPress={() => scrollToStep(2)}>
                            <Text style={styles.nextButtonText}>NEXT: GRIND TYPE →</Text>
                        </Pressable>
                    </View>

                    {/* Step 3: Grind Type (WITH ICONS) */}
                    <View style={[styles.stepCard, { width: cardWidthStyle as any }]}>
                        <Text style={styles.stepTitle}>Grind Type</Text>
                        <Text style={styles.stepSubtitle}>Match your brewing method</Text>
                        <View style={styles.grindGrid}>
                            {GRIND_TYPES.map((grind) => {
                                const isSelected = currentCustomization.grindType === grind.id;
                                const handlePress = () => {
                                    console.log('Selected Grind:', grind.id);
                                    setCurrentCustomization({ grindType: grind.id as any });
                                };

                                if (Platform.OS === 'web') {
                                    return (
                                        <View
                                            key={grind.id}
                                            // @ts-ignore
                                            onClick={handlePress}
                                            style={[
                                                styles.grindOption,
                                                isSelected && styles.grindOptionSelected,
                                                // @ts-ignore
                                                { cursor: 'pointer', transition: '0.2s all' }
                                            ]}
                                        >
                                            <Ionicons
                                                name={grind.icon as any}
                                                size={24}
                                                color={isSelected ? '#fff' : '#888'}
                                            />
                                            <Text style={[styles.grindLabel, isSelected && styles.grindLabelSelected]}>
                                                {grind.id}
                                            </Text>
                                        </View>
                                    );
                                }

                                return (
                                    <TouchableOpacity
                                        key={grind.id}
                                        activeOpacity={0.7}
                                        onPress={handlePress}
                                        style={[styles.grindOption, isSelected && styles.grindOptionSelected, { zIndex: 50 }]}
                                    >
                                        <Ionicons
                                            name={grind.icon as any}
                                            size={24}
                                            color={isSelected ? '#fff' : '#888'}
                                        />
                                        <Text style={[styles.grindLabel, isSelected && styles.grindLabelSelected]}>
                                            {grind.id}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </ScrollView>

                {/* Cart Section - Moved Inside ScrollView */}
                <View style={[
                    styles.cartSection,
                    isTablet && { maxWidth: 600, width: '100%', alignSelf: 'center' },
                    {
                        marginTop: 20,
                        marginBottom: 40,
                        marginHorizontal: 20,
                        borderRadius: 24, // Rounded corners for non-sticky
                        backgroundColor: '#1C1614',
                        padding: 20,
                    }
                ]}>
                    <View style={styles.summaryRow}>
                        <View>
                            <Text style={[
                                styles.summaryLabel,
                                isTablet && { fontSize: 13 },
                                { color: '#888', marginBottom: 4 }
                            ]}>Your Custom Blend</Text>
                            <Text style={[
                                styles.summaryValue,
                                isTablet && { fontSize: 15 },
                                { color: '#fff' }
                            ]}>
                                {currentCustomization.roastLevel || 'Medium'} • {currentCustomization.grindType || 'Whole Bean'} • 250g
                            </Text>
                        </View>
                    </View>

                    {/* Unified Add to Cart Button for Web & Native */}
                    <TouchableOpacity
                        onPress={handleAddCustomToCart}
                        activeOpacity={0.8}
                        style={[
                            styles.addToCartButton,
                            isTablet && { paddingVertical: 18 },
                            { marginTop: 16, borderRadius: 12 }
                        ]}
                    >
                        <Text style={[
                            styles.addToCartText,
                            isTablet && { fontSize: 15 }
                        ]}>ADD TO CART</Text>
                        <Text style={[
                            styles.addToCartPrice,
                            isTablet && { fontSize: 14, paddingHorizontal: 14, paddingVertical: 6 },
                            { backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }
                        ]}>₹799</Text>
                    </TouchableOpacity>
                </View>

                {/* DEBUG: State Proof of Life */}
                {Platform.OS === 'web' && (
                    <Text style={{ fontSize: 10, color: '#aaa', textAlign: 'center', marginBottom: 20 }}>
                        Debug State: {JSON.stringify(currentCustomization)}
                    </Text>
                )}

                {/* Bottom Spacing */}
                <View style={{ height: 40 }} />
            </ScrollView >
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAF8F5',
    },
    // Fixed Header
    fixedHeader: {
        position: Platform.OS === 'web' ? 'relative' : 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        // @ts-ignore
        pointerEvents: 'box-none', // Allow clicks to pass through empty space
        zIndex: 100, // Safe Z-Index
        backgroundColor: 'rgba(255,255,255,0.98)',
        paddingTop: Platform.OS === 'web' ? 12 : 50,
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerLogo: {
        width: 28, // Compact
        height: 28,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 12, // Compact
        fontWeight: '800',
        color: '#2C2724',
        letterSpacing: 2,
    },
    mainScroll: {
        flex: 1,
    },
    mainContent: {
        paddingTop: Platform.OS === 'web' ? 0 : 80, // Matches header height
        paddingBottom: 150, // Clears Tab Bar (Critical for interactions)
    },

    // Top Section
    topSection: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    productPreview: {
        alignItems: 'center',
        marginRight: 16,
    },
    productImage: {
        width: 50, // Highly Compact
        height: 70,
        marginBottom: 4,
    },
    productLabel: {
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 1,
        color: '#6B8E23',
        marginBottom: 2,
    },
    productName: {
        fontSize: 12,
        fontWeight: '700',
        color: '#2C2724',
    },
    stepIndicator: {
        flex: 1,
        alignItems: 'flex-start', // Align left next to image
    },
    stepText: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 2,
        color: '#888',
        marginBottom: 8,
    },
    stepDots: {
        flexDirection: 'row',
        gap: 8,
    },
    stepDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E0DCD6',
    },
    stepDotActive: {
        backgroundColor: '#5D4037',
        width: 24,
    },

    // Steps
    stepsContainer: {
        paddingHorizontal: 16,
    },
    stepCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginRight: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        justifyContent: 'flex-start',
        borderWidth: 1,
        borderColor: '#F2F0ED',
        minHeight: 300,
        // @ts-ignore
        scrollSnapAlign: 'center',
    },
    stepTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#2C2724',
        marginBottom: 4,
    },
    stepSubtitle: {
        fontSize: 14,
        color: '#888',
        marginBottom: 24,
    },
    slidersContainer: {
        marginBottom: 12,
        width: '100%',
    },
    nextButton: {
        backgroundColor: '#5D4037',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 20,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1.5,
    },

    // Sliders
    sliderRow: {
        marginBottom: 20,
    },
    sliderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    sliderLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A403A',
    },
    sliderValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#5D4037',
    },
    slider: {
        width: '100%',
        height: 40,
    },

    // Roast Grid
    roastGrid: {
        gap: 10,
        width: '100%',
    },
    roastOption: {
        backgroundColor: '#F8F6F3',
        borderRadius: 12,
        padding: 14,
        borderWidth: 2,
        borderColor: 'transparent',
        // @ts-ignore
        cursor: Platform.OS === 'web' ? 'pointer' : 'auto',
    },
    roastOptionSelected: {
        borderColor: '#5D4037',
        backgroundColor: '#FAF7F4',
    },
    roastName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#666',
        marginBottom: 2,
    },
    roastNameSelected: {
        color: '#5D4037',
    },
    roastDesc: {
        fontSize: 11,
        color: '#999',
    },

    // Grind (WITH ICONS - 2 columns)
    grindGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 10,
    },
    grindOption: {
        width: '48%',
        backgroundColor: '#F8F6F3',
        borderRadius: 12,
        paddingVertical: 16,
        marginBottom: 0,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        // @ts-ignore
        cursor: Platform.OS === 'web' ? 'pointer' : 'auto',
    },
    grindOptionSelected: {
        backgroundColor: '#5D4037',
        borderColor: '#5D4037',
    },
    grindLabel: {
        fontSize: 11,
        color: '#666',
        fontWeight: '600',
        marginTop: 8,
        textAlign: 'center',
    },
    grindLabelSelected: {
        color: '#fff',
    },

    // Cart Section (Moved up, directly below steps)
    // Cart Section (Moved up, directly below steps)
    cartSection: {
        marginHorizontal: 16,
        marginTop: 16,
        backgroundColor: '#1C1614',
        borderRadius: 16,
        padding: 16,
        zIndex: 50,
    },
    stickyFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#2C2724',
        borderTopLeftRadius: 30, // Rounded top corners for footer
        borderTopRightRadius: 30,
        overflow: 'hidden',
        boxShadow: '0 -4px 10px rgba(0,0,0,0.1)',
        elevation: 10,
        zIndex: 200,
        paddingBottom: Platform.OS === 'ios' ? 24 : 16,
        paddingTop: 16,
        paddingHorizontal: 0,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -3,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 0,
    },
    summaryLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#888',
        letterSpacing: 1,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    addToCartButton: {
        backgroundColor: '#6B8E23', // Green
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        width: '100%',
        gap: 10,
        zIndex: 100,
        // @ts-ignore - Web-only cursor property
        cursor: 'pointer',
        // @ts-ignore
        pointerEvents: 'auto',
    },
    addToCartText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginRight: 10,
    },
    addToCartPrice: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        overflow: 'hidden',
    },

    // Saved Blends
    savedSection: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    savedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    savedTitle: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.5,
        color: '#888',
    },
    savedCount: {
        fontSize: 10,
        color: '#5D4037',
        fontWeight: '700',
        marginLeft: 8,
    },
    savedScroll: {
        gap: 10,
    },
    savedTile: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        width: 160,
        height: 280, // Vertical and longer
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        justifyContent: 'space-between',
    },
    savedTileTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 8,
    },
    savedTileImage: {
        width: 80,
        height: 100,
        marginBottom: 8,
        alignSelf: 'center',
    },
    savedTileNumber: {
        fontSize: 10,
        fontWeight: '700',
        color: '#8D6E63',
    },
    savedTileName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#2C2724',
        marginBottom: 2,
        textAlign: 'center',
    },
    savedTileInfo: {
        fontSize: 10,
        color: '#666',
        textAlign: 'center',
    },
    savedTileTaste: {
        backgroundColor: '#F5F5F5',
        borderRadius: 4,
        paddingVertical: 2,
        paddingHorizontal: 4,
        marginTop: 4,
        marginBottom: 8,
        alignSelf: 'center',
    },
    savedTileTasteText: {
        fontSize: 9,
        color: '#666',
        fontWeight: '600',
    },
    savedTileButton: {
        backgroundColor: '#2C2724',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
        width: '100%',
    },
    savedTileButtonText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    cartBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#D32F2F',
        borderRadius: 10,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    cartBadgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: 'bold',
    },
    profileDetailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        marginTop: 4,
    },
    profileDetailLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.6)',
        letterSpacing: 0.5,
    },
    profileDetailValue: {
        fontSize: 11,
        color: '#fff',
        fontWeight: '600',
    },
});
