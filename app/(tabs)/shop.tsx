import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Dimensions,
    Image,
    NativeSyntheticEvent,
    NativeScrollEvent,
    useWindowDimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTasteProfileStore } from '@/src/stores/tasteProfileStore';
import { useCartStore, TasteProfile } from '@/src/stores/cartStore';
import { useAuthStore } from '@/src/stores/authStore';
import { SupabaseImage } from '@/src/components/SupabaseImage';
import { ImageKeys } from '@/src/constants/imageKeys';

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
    return (
        <View style={styles.sliderRow}>
            <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>{label}</Text>
                <Text style={styles.sliderValue}>{value}/5</Text>
            </View>
            <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={5}
                step={1}
                value={value}
                onValueChange={onChange}
                minimumTrackTintColor="#5D4037"
                maximumTrackTintColor="#E8E4E0"
                thumbTintColor="#5D4037"
            />
        </View>
    );
}

export default function ShopScreen() {
    const router = useRouter();
    const stepScrollRef = useRef<ScrollView>(null);
    const [currentStep, setCurrentStep] = useState(0);
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

    // Responsive dimensions
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const isTablet = SCREEN_WIDTH >= 768;
    const STEP_WIDTH = isTablet ? Math.min(SCREEN_WIDTH - 200, 500) : SCREEN_WIDTH - 100;

    const scrollToStep = (step: number) => {
        stepScrollRef.current?.scrollTo({ x: step * STEP_WIDTH, animated: true });
        setCurrentStep(step);
    };

    const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const step = Math.round(e.nativeEvent.contentOffset.x / STEP_WIDTH);
        setCurrentStep(step);
    };

    const handleAddCustomToCart = () => {
        const profile: TasteProfile = {
            id: `custom-${Date.now()}`,
            name: `Blend #${profiles.length + 1}`,
            bitterness: currentCustomization.bitterness ?? 3,
            acidity: currentCustomization.acidity ?? 3,
            body: currentCustomization.body ?? 3,
            flavour: currentCustomization.flavour ?? 3,
            roastLevel: currentCustomization.roastLevel ?? 'Medium',
            grindType: currentCustomization.grindType ?? 'Whole Bean',
        };
        addItem(profile);

        // Auto-save to 'Your Custom Roasts' if user is logged in
        if (user) {
            saveProfile(user.id);
        }
        router.push('/cart');
    };

    return (
        <View style={styles.container}>
            {/* FIXED HEADER - Same as Home */}
            <View style={styles.fixedHeader}>
                <View style={styles.headerLeft}>
                    <SupabaseImage
                        remoteKey={ImageKeys.LOGO_MAIN}
                        defaultSource={require('@/assets/images/logo_bird.png')}
                        style={styles.headerLogo}
                        resizeMode="contain"
                    />
                    <Text style={styles.headerTitle}>SHADOW BEAN CO.</Text>
                </View>
                <Pressable onPress={() => router.push('/cart')} style={{ position: 'relative' }}>
                    <Ionicons name="cart-outline" size={24} color="#2C2724" />
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
            >
                {/* Product + Step Indicator */}
                <View style={[
                    styles.topSection,
                    isTablet && { maxWidth: 800, width: '100%', paddingHorizontal: 40 }
                ]}>
                    <View style={styles.productPreview}>
                        <SupabaseImage
                            remoteKey={ImageKeys.PRODUCT_PLACEHOLDER}
                            defaultSource={require('@/assets/images/product_bag.png')}
                            style={[
                                styles.productImage,
                                isTablet && { width: 100, height: 130 }
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
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={handleScroll}
                    contentContainerStyle={styles.stepsContainer}
                    decelerationRate="fast"
                    snapToInterval={STEP_WIDTH}
                >
                    {/* Step 1: Taste Profile */}
                    <View style={[styles.stepCard, { width: STEP_WIDTH }]}>
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
                            <TasteSlider
                                label="Body"
                                value={currentCustomization.body ?? 3}
                                onChange={(v) => setCurrentCustomization({ body: v })}
                            />
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
                    <View style={[styles.stepCard, { width: STEP_WIDTH }]}>
                        <Text style={styles.stepTitle}>Roast Level</Text>
                        <Text style={styles.stepSubtitle}>Choose your intensity</Text>
                        <View style={styles.roastGrid}>
                            {ROAST_LEVELS.map((level) => {
                                const isSelected = currentCustomization.roastLevel === level.id;
                                return (
                                    <Pressable
                                        key={level.id}
                                        onPress={() => setCurrentCustomization({ roastLevel: level.id as any })}
                                        style={[styles.roastOption, isSelected && styles.roastOptionSelected]}
                                    >
                                        <Text style={[styles.roastName, isSelected && styles.roastNameSelected]}>{level.id}</Text>
                                        <Text style={styles.roastDesc}>{level.desc}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                        <Pressable style={styles.nextButton} onPress={() => scrollToStep(2)}>
                            <Text style={styles.nextButtonText}>NEXT: GRIND TYPE →</Text>
                        </Pressable>
                    </View>

                    {/* Step 3: Grind Type (WITH ICONS) */}
                    <View style={[styles.stepCard, { width: STEP_WIDTH }]}>
                        <Text style={styles.stepTitle}>Grind Type</Text>
                        <Text style={styles.stepSubtitle}>Match your brewing method</Text>
                        <View style={styles.grindGrid}>
                            {GRIND_TYPES.map((grind) => {
                                const isSelected = currentCustomization.grindType === grind.id;
                                return (
                                    <Pressable
                                        key={grind.id}
                                        onPress={() => setCurrentCustomization({ grindType: grind.id as any })}
                                        style={[styles.grindOption, isSelected && styles.grindOptionSelected]}
                                    >
                                        <Ionicons
                                            name={grind.icon as any}
                                            size={24}
                                            color={isSelected ? '#fff' : '#888'}
                                        />
                                        <Text style={[styles.grindLabel, isSelected && styles.grindLabelSelected]}>
                                            {grind.id}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                </ScrollView>

                {/* Add to Cart Section - DIRECTLY below steps */}
                <View style={[
                    styles.cartSection,
                    isTablet && { maxWidth: 600, width: '100%', alignSelf: 'center' }
                ]}>
                    <View style={styles.summaryRow}>
                        <Text style={[
                            styles.summaryLabel,
                            isTablet && { fontSize: 13 }
                        ]}>Your Custom Blend</Text>
                        <Text style={[
                            styles.summaryValue,
                            isTablet && { fontSize: 15 }
                        ]}>
                            {currentCustomization.roastLevel || 'Medium'} • {currentCustomization.grindType || 'Whole Bean'} • 250g
                        </Text>
                    </View>
                    {/* Custom Roast Profile Details */}
                    <View style={styles.profileDetailsRow}>
                        <Text style={styles.profileDetailLabel}>Taste Profile:</Text>
                        <Text style={styles.profileDetailValue}>
                            B:{currentCustomization.bitterness ?? 3} A:{currentCustomization.acidity ?? 3} B:{currentCustomization.body ?? 3} F:{currentCustomization.flavour ?? 3}
                        </Text>
                    </View>
                    <Pressable
                        style={[
                            styles.addToCartButton,
                            isTablet && { paddingVertical: 18 }
                        ]}
                        onPress={handleAddCustomToCart}
                    >
                        <Text style={[
                            styles.addToCartText,
                            isTablet && { fontSize: 15 }
                        ]}>ADD TO CART</Text>
                        <Text style={[
                            styles.addToCartPrice,
                            isTablet && { fontSize: 14, paddingHorizontal: 14, paddingVertical: 6 }
                        ]}>₹799</Text>
                    </Pressable>
                </View>

                {/* Saved Blends / Custom Roasts */}
                {profiles.length > 0 && (
                    <View style={styles.savedSection}>
                        <View style={styles.savedHeader}>
                            <Text style={styles.savedTitle}>YOUR CUSTOM ROASTS</Text>
                            <Text style={styles.savedCount}>{profiles.length}/20</Text>
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.savedScroll}
                        >
                            {profiles.slice(0, 20).map((profile, index) => (
                                <View key={profile.id} style={styles.savedTile}>
                                    <View style={styles.savedTileTop}>
                                        <Text style={styles.savedTileNumber}>#{index + 1}</Text>
                                        <Pressable onPress={() => deleteProfile(profile.id)}>
                                            <Ionicons name="trash-outline" size={16} color="#8D6E63" />
                                        </Pressable>
                                    </View>

                                    <SupabaseImage
                                        remoteKey={ImageKeys.PRODUCT_PLACEHOLDER}
                                        defaultSource={require('@/assets/images/product_bag.png')}
                                        style={styles.savedTileImage}
                                        resizeMode="contain"
                                    />

                                    <Text style={styles.savedTileName} numberOfLines={1}>{profile.name}</Text>
                                    <Text style={styles.savedTileInfo}>{profile.roastLevel}</Text>
                                    <Text style={styles.savedTileInfo}>{profile.grindType}</Text>
                                    <View style={styles.savedTileTaste}>
                                        <Text style={styles.savedTileTasteText}>
                                            B:{profile.bitterness} A:{profile.acidity} B:{profile.body} F:{profile.flavour}
                                        </Text>
                                    </View>

                                    <Pressable
                                        style={styles.savedTileButton}
                                        onPress={() => {
                                            addItem(profile);
                                            router.push('/cart');
                                        }}
                                    >
                                        <Text style={styles.savedTileButtonText}>ADD TO CART</Text>
                                    </Pressable>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Bottom Spacing */}
                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAF8F5',
    },
    // Fixed Header
    fixedHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 16,
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.80)',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerLogo: {
        width: 32,
        height: 32,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#2C2724',
        letterSpacing: 1.5,
    },
    mainScroll: {
        flex: 1,
    },
    mainContent: {
        paddingTop: 100,
    },

    // Top Section
    topSection: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    productPreview: {
        width: 90,
        alignItems: 'center',
    },
    productImage: {
        width: 70,
        height: 90,
        marginBottom: 6,
    },
    productLabel: {
        fontSize: 8,
        fontWeight: '700',
        letterSpacing: 1,
        color: '#6B8E23',
    },
    productName: {
        fontSize: 11,
        fontWeight: '600',
        color: '#2C2724',
    },
    stepIndicator: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepText: {
        fontSize: 10,
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
        paddingLeft: 16,
    },
    stepCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        justifyContent: 'space-between',
    },
    stepTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2C2724',
        marginBottom: 4,
    },
    stepSubtitle: {
        fontSize: 12,
        color: '#888',
        marginBottom: 16,
    },
    slidersContainer: {
        marginBottom: 12,
    },
    nextButton: {
        backgroundColor: '#5D4037',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 'auto',
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
    },

    // Sliders
    sliderRow: {
        marginBottom: 12,
    },
    sliderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    sliderLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2C2724',
    },
    sliderValue: {
        fontSize: 13,
        fontWeight: '700',
        color: '#5D4037',
    },
    slider: {
        height: 30,
    },

    // Roast
    roastGrid: {
        gap: 10,
        marginBottom: 12,
    },
    roastOption: {
        backgroundColor: '#F8F6F3',
        borderRadius: 12,
        padding: 14,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    roastOptionSelected: {
        borderColor: '#5D4037',
        backgroundColor: '#FAF7F4',
    },
    roastName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 2,
    },
    roastNameSelected: {
        color: '#5D4037',
        fontWeight: '700',
    },
    roastDesc: {
        fontSize: 11,
        color: '#999',
    },

    // Grind (WITH ICONS - 2 columns, 3 rows)
    grindGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    grindOption: {
        width: '48%',
        backgroundColor: '#F8F6F3',
        borderRadius: 12,
        paddingVertical: 20,
        marginBottom: 10,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
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
    cartSection: {
        marginHorizontal: 16,
        marginTop: 16,
        backgroundColor: '#2C2724',
        borderRadius: 16,
        padding: 16,
    },
    summaryRow: {
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.6)',
        letterSpacing: 1,
        marginBottom: 2,
    },
    summaryValue: {
        fontSize: 13,
        color: '#fff',
        fontWeight: '500',
    },
    addToCartButton: {
        backgroundColor: '#6B8E23',
        borderRadius: 10,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    addToCartText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 1,
    },
    addToCartPrice: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
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
