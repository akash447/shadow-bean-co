import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Dimensions,
    StatusBar,
    ImageBackground,
    useWindowDimensions,
    Platform,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getReviews } from '@/src/services/supabase';
import { ImageKeys } from '@/src/constants/imageKeys';
import { useCartStore } from '@/src/stores/cartStore';
import { UniversalImage } from '@/src/components/UniversalImage';

// --- Static Assets (Conditional: Web Public URL / Native Require) ---
// On Web, we serve from /public/images/ to bypass bundler issues.
// On Native, we use standard require().

const BASE_URL = 'https://yyqoagncaxzpxodwnuax.supabase.co/storage/v1/object/public/media/';

const getImgSource = (filename: string) => ({ uri: `${BASE_URL}${filename}` });

// DEBUG: Hardcoded URL to test rendering
// const iconShadeGrown = { uri: 'http://localhost:8084/images/icon_shade_grown.png' };
const iconShadeGrown = getImgSource('icon_shade_grown.png');
const iconSaltRoasted = getImgSource('icon_salt_roasted.png');
const iconSmallBatch = getImgSource('icon_small_batch.png');
const iconPersonalised = getImgSource('icon_personalised.png');
const iconPourOver = getImgSource('icon_pour_over_kit.png');
const iconFrenchPress = getImgSource('icon_french_press.png');
const iconChhani = getImgSource('icon_chhani.png');
const homeHeroBg = getImgSource('home_hero.png');
const farmerBg = getImgSource('coffee_farmer.jpg');

// Redesign Assets
const productBag = getImgSource('product_bag.png');
const pourOverAction = getImgSource('pour_over_brewing_action.jpg');
const coffeeCherries = getImgSource('coffee_cherries.jpg');

// --- 4 Key USPs (2x2 matrix layout) ---
const USP_FEATURES = [
    { source: iconShadeGrown, title: 'SHADE GROWN', desc: 'Naturally grown under shade for richer flavor.' },
    { source: iconSaltRoasted, title: 'SALT ROASTED', desc: 'Signature salt-air roast for smooth, clean taste' },
    { source: iconSmallBatch, title: 'SMALL BATCH', desc: 'Roasted in small lots for freshness and precision' },
    { source: iconPersonalised, title: 'PERSONALISED ROASTS', desc: 'Roast profiles tailored to your taste' },
];

export default function HomeScreen() {
    const router = useRouter();
    const [reviews, setReviews] = useState<any[]>([]);
    const { items } = useCartStore();
    const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

    const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
    const isTablet = SCREEN_WIDTH >= 768;
    const isWeb = Platform.OS === 'web';

    // DEBUG: Check what the image import resolves to
    if (isWeb) {
        console.log('DEBUG: iconShadeGrown value:', iconShadeGrown);
        console.log('DEBUG: farmerBg value:', farmerBg);
        console.log('DEBUG: ImageKeys constant:', ImageKeys);
    }

    // On Web, use VH units for the full Viewport
    const BLOCK_HEIGHT = isWeb ? '100vh' : SCREEN_HEIGHT;

    useEffect(() => {
        const defaultReviews = [
            { id: '1', rating: 5, comment: "Never tasted coffee this smooth!", profiles: { full_name: 'Priya S.' } },
            { id: '2', rating: 5, comment: "Coffee that doesn't need sugar.", profiles: { full_name: 'Arjun K.' } },
            { id: '3', rating: 5, comment: "Custom roast option is amazing.", profiles: { full_name: 'Sarah J.' } },
        ];
        getReviews().then(({ reviews: data }) => {
            if (data && data.length > 0) setReviews(data.slice(0, 5));
            else setReviews(defaultReviews);
        });
    }, []);

    // --- RENDER CONTENT BLOCKS ---
    const renderContent = () => (
        <>
            {/* ========== BLOCK 1: HERO (Dark Forest + USP) ========== */}
            <View style={[styles.block, { height: BLOCK_HEIGHT, backgroundColor: '#000' }, isWeb && webStyles.webBlock] as any}>
                {isWeb ? (
                    <View
                        style={{
                            width: '100%',
                            height: '100%',
                            justifyContent: 'center',
                            backgroundImage: `url(${homeHeroBg.uri})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        } as any}
                    >
                        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' }} />

                        <View style={[styles.heroContent, { justifyContent: 'center', paddingBottom: 100 }]}>
                            <Text style={[styles.mainHeading, { color: '#fff', textAlign: 'center' }, isTablet && { fontSize: 50, lineHeight: 60 }]}>
                                COFFEE MADE{'\n'}JUST FOR YOU
                            </Text>
                            <Text style={[
                                styles.literallyText,
                                isTablet && { fontSize: 60 },
                                isWeb && { WebkitTextStroke: '1px #fff', color: 'transparent' } as any
                            ]}>
                                (LITERALLY)
                            </Text>
                        </View>

                        <View style={styles.uspMatrix}>
                            <View style={styles.uspMatrixRow}>
                                {USP_FEATURES.slice(0, 2).map((item, i) => (
                                    <View key={i} style={styles.uspMatrixItem}>
                                        <UniversalImage
                                            source={item.source}
                                            style={[styles.uspIcon, { tintColor: '#fff' }]}
                                            resizeMode="contain"
                                        />
                                        <Text style={[styles.uspText, { color: '#fff' }]}>{item.title}</Text>
                                        <Text style={styles.uspDesc}>{item.desc}</Text>
                                    </View>
                                ))}
                            </View>
                            <View style={styles.uspMatrixRow}>
                                {USP_FEATURES.slice(2, 4).map((item, i) => (
                                    <View key={i} style={styles.uspMatrixItem}>
                                        <UniversalImage
                                            source={item.source}
                                            style={[styles.uspIcon, { tintColor: '#fff' }]}
                                            resizeMode="contain"
                                        />
                                        <Text style={[styles.uspText, { color: '#fff' }]}>{item.title}</Text>
                                        <Text style={styles.uspDesc}>{item.desc}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                ) : (
                    <ImageBackground
                        source={homeHeroBg}
                        style={{ width: '100%', height: '100%', justifyContent: 'center' }}
                        imageStyle={{ opacity: 1 }}
                        resizeMode="cover"
                    >
                        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' }} />

                        <View style={[styles.heroContent, { justifyContent: 'center', paddingBottom: 100 }]}>
                            <Text style={[styles.mainHeading, { color: '#fff', textAlign: 'center' }, isTablet && { fontSize: 50, lineHeight: 60 }]}>
                                COFFEE MADE{'\n'}JUST FOR YOU
                            </Text>
                            <Text style={[styles.literallyText, isTablet && { fontSize: 60 }]}>
                                (LITERALLY)
                            </Text>
                        </View>

                        <View style={styles.uspMatrix}>
                            <View style={styles.uspMatrixRow}>
                                {USP_FEATURES.slice(0, 2).map((item, i) => (
                                    <View key={i} style={styles.uspMatrixItem}>
                                        <UniversalImage
                                            source={item.source}
                                            style={[styles.uspIcon, { tintColor: '#fff' }]}
                                            resizeMode="contain"
                                        />
                                        <Text style={[styles.uspText, { color: '#fff' }]}>{item.title}</Text>
                                        <Text style={styles.uspDesc}>{item.desc}</Text>
                                    </View>
                                ))}
                            </View>
                            <View style={styles.uspMatrixRow}>
                                {USP_FEATURES.slice(2, 4).map((item, i) => (
                                    <View key={i} style={styles.uspMatrixItem}>
                                        <UniversalImage
                                            source={item.source}
                                            style={[styles.uspIcon, { tintColor: '#fff' }]}
                                            resizeMode="contain"
                                        />
                                        <Text style={[styles.uspText, { color: '#fff' }]}>{item.title}</Text>
                                        <Text style={styles.uspDesc}>{item.desc}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </ImageBackground>
                )}
            </View>

            {/* ========== BLOCK 2: PRODUCT FEATURE (White) ========== */}
            <View style={[styles.block, styles.blockWhite, { height: BLOCK_HEIGHT, justifyContent: 'center' }, isWeb && webStyles.webBlock] as any}>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
                    <View style={{ width: isTablet ? 350 : 250, height: isTablet ? 350 : 250, marginBottom: 30 }}>
                        <UniversalImage
                            source={productBag}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="contain"
                        />
                    </View>

                    <Text style={[styles.microHeading, { color: '#888', marginBottom: 16 }, isTablet && { fontSize: 14 }]}>YOUR PERFECT CUP</Text>
                    <Text style={[styles.mainHeading, { color: '#000', textAlign: 'center', marginBottom: 40 }, isTablet && { fontSize: 40, lineHeight: 50 }]}>
                        HOME OF THE WORLD'S{'\n'}FIRST SALT-ROASTED COFFEE
                    </Text>

                    <Pressable
                        style={({ pressed }) => [
                            styles.heroButton,
                            {
                                backgroundColor: pressed ? '#000' : 'transparent',
                                borderColor: '#000',
                                borderWidth: 2,
                                ...(isWeb ? { cursor: 'pointer' } : {})
                            } as any
                        ]}
                        onPress={() => router.push('/(tabs)/shop')}
                    >
                        {({ pressed }) => (
                            <Text style={[styles.heroButtonText, { color: pressed ? '#fff' : '#000' }]}>
                                PERSONALIZE AND BUY NOW
                            </Text>
                        )}
                    </Pressable>
                </View>
            </View>

            {/* ========== BLOCK 3: HOW TO USE (Start with Split Images) ========== */}
            <View style={[styles.block, styles.blockCream, { minHeight: BLOCK_HEIGHT }, isWeb && webStyles.webBlock] as any}>
                {/* Split Images Header - Fixed height to prevent full screen coverage */}
                <View style={{ flexDirection: 'row', height: isWeb ? '40%' : 280, width: '100%' }}>
                    <View style={{ flex: 1 }}>
                        <UniversalImage source={pourOverAction} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <UniversalImage source={coffeeCherries} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    </View>
                </View>

                {/* Content Below */}
                <View style={[styles.howToContainer, { flex: 1, justifyContent: 'center' }]}>
                    <Text style={[styles.howToTitle, isTablet && { fontSize: 36 }]}>HOW TO USE STEPS</Text>
                    <View style={styles.greenUnderline} />
                    <Text style={[styles.howToSubtitle, isTablet && { fontSize: 18 }]}>
                        To experience the full depth of our shade-grown, salt-roasted coffee — brew it black.
                    </Text>

                    <View style={[styles.stepsRow, { marginTop: 30 }, isTablet && { marginTop: 50, gap: 40 }]}>
                        <View style={styles.stepItem}>
                            <UniversalImage
                                source={iconPourOver}
                                style={[styles.stepIcon, isTablet && { width: 80, height: 80 }]}
                                resizeMode="contain"
                            />
                            <Text style={styles.stepTitle}>BREW WITH{'\n'}OUR POUR-OVER{'\n'}KIT</Text>
                            <Text style={styles.stepDesc}>Experience café-style clarity and flavor with our easy pour-over setup.</Text>
                        </View>
                        <View style={styles.stepItem}>
                            <UniversalImage
                                source={iconFrenchPress}
                                style={[styles.stepIcon, isTablet && { width: 80, height: 80 }]}
                                resizeMode="contain"
                            />
                            <Text style={styles.stepTitle}>USE YOUR{'\n'}OWN BREWER</Text>
                            <Text style={styles.stepDesc}>Aeropress, Moka Pot, South Indian filter — brew it your way, your style.</Text>
                        </View>
                        <View style={styles.stepItem}>
                            <UniversalImage
                                source={iconChhani}
                                style={[styles.stepIcon, isTablet && { width: 80, height: 80 }]}
                                resizeMode="contain"
                            />
                            <Text style={styles.stepTitle}>BREW WITH A{'\n'}SIMPLE CHHANI</Text>
                            <Text style={styles.stepDesc}>No equipment? No problem. A household strainer makes a smooth, honest cup.</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* ========== BLOCK 4: OUR STORY (Black) ========== */}
            <View style={[styles.block, { height: BLOCK_HEIGHT, backgroundColor: '#000' }, isWeb && webStyles.webBlock] as any}>
                {isWeb ? (
                    <View
                        style={{
                            width: '100%',
                            height: '100%',
                            justifyContent: 'center',
                            backgroundImage: `url(${farmerBg.uri})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        } as any}
                    >
                        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' }} />

                        <View style={styles.storyContent}>
                            <Text style={styles.storyLabel}>OUR JOURNEY</Text>
                            <Text style={[styles.storyHeading, isTablet && { fontSize: 60 }]}>OUR{'\n'}STORY</Text>
                            <Text style={[styles.storyBody, isTablet && { fontSize: 16, lineHeight: 28 }]}>
                                We celebrate India's shade-grown coffee tradition with a unique salt-air roasting method that preserves depth, aroma, and sweetness.
                            </Text>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.storyButton,
                                    {
                                        backgroundColor: pressed ? '#fff' : 'transparent',
                                        ...(isWeb ? { cursor: 'pointer' } : {})
                                    } as any
                                ]}
                                onPress={() => router.push('/(tabs)/about')}
                            >
                                {({ pressed }) => (
                                    <Text style={[styles.storyButtonText, { color: pressed ? '#000' : '#fff' }]}>
                                        DISCOVER MORE
                                    </Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                ) : (
                    <ImageBackground
                        source={farmerBg}
                        style={{ width: '100%', height: '100%', justifyContent: 'center' }}
                        imageStyle={{ opacity: 0.4 }}
                        resizeMode="cover"
                    >
                        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' }} />

                        <View style={styles.storyContent}>
                            <Text style={styles.storyLabel}>OUR JOURNEY</Text>
                            <Text style={[styles.storyHeading, isTablet && { fontSize: 60 }]}>OUR{'\n'}STORY</Text>
                            <Text style={[styles.storyBody, isTablet && { fontSize: 16, lineHeight: 28 }]}>
                                We celebrate India's shade-grown coffee tradition with a unique salt-air roasting method that preserves depth, aroma, and sweetness.
                            </Text>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.storyButton,
                                    { backgroundColor: pressed ? '#fff' : 'transparent' }
                                ]}
                                onPress={() => router.push('/(tabs)/about')}
                            >
                                {({ pressed }) => (
                                    <Text style={[styles.storyButtonText, { color: pressed ? '#000' : '#fff' }]}>
                                        DISCOVER MORE
                                    </Text>
                                )}
                            </Pressable>
                        </View>
                    </ImageBackground>
                )}
            </View>

            {/* ========== BLOCK 4: TESTIMONIALS (Cream) ========== */}
            <View style={[styles.block, styles.blockCream, { height: BLOCK_HEIGHT, justifyContent: 'center' }, isWeb && webStyles.webBlock] as any}>
                <View style={styles.reviewsContent}>
                    <Text style={styles.brandLabelSmall}>TESTIMONIALS</Text>
                    <Text style={styles.reviewsHeading}>Loved By Coffee Lovers</Text>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 20, gap: 20, paddingTop: 30 }}
                    >
                        {reviews.map((r, i) => (
                            <View key={i} style={styles.reviewCard}>
                                <Text style={styles.reviewQuote}>"</Text>
                                <Text style={styles.reviewText}>{r.comment}</Text>
                                <View style={styles.reviewFooter}>
                                    <Text style={styles.reviewAuthor}>{r.profiles?.full_name}</Text>
                                    <Text style={styles.starText}>★★★★★</Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerBrand}>SHADOW BEAN CO.</Text>
                    <Text style={styles.copyright}>© 2024 Shadow Bean Co.</Text>
                </View>
            </View>
        </>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />

            {/* FIXED HEADER - Light Bar with Logo */}
            <View style={styles.fixedHeader}>
                <View style={styles.headerLogoContainer}>
                    <UniversalImage
                        source={getImgSource('logo_bird.png')}
                        style={styles.headerLogo}
                        resizeMode="contain"
                    />
                    <Text style={styles.headerBrandText}>SHADOW BEAN CO.</Text>
                </View>
                <Pressable onPress={() => router.push('/cart')} style={{ position: 'relative' }}>
                    <Ionicons name="cart-outline" size={24} color="#000" />
                    {cartCount > 0 && (
                        <View style={styles.cartBadge}>
                            <Text style={styles.cartBadgeText}>{cartCount}</Text>
                        </View>
                    )}
                </Pressable>
            </View>

            {isWeb ? (
                // WEB: Use a pure View with CSS scroll snapping
                // We cast styles to any to bypass strict RN types for web-only props
                <View style={webStyles.webScrollContainer as any}>
                    {renderContent()}
                </View>
            ) : (
                // NATIVE: Use ScrollView with pagingEnabled
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    pagingEnabled={true}
                    snapToInterval={SCREEN_HEIGHT}
                    decelerationRate="fast"
                    snapToAlignment="start"
                    scrollEventThrottle={16}
                >
                    {renderContent()}
                </ScrollView>
            )}
        </View>
    );
}

const webStyles = {
    webScrollContainer: {
        height: '100vh',
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
        flex: 1,
    },
    webBlock: {
        scrollSnapAlign: 'start',
    },
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollView: {
        flex: 1,
    },

    fixedHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: 'rgba(245, 245, 240, 0.95)',
        zIndex: 100,
    },
    cartBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#D32F2F',
        borderRadius: 10,
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },

    block: {
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
    },
    blockWhite: { backgroundColor: '#fff' },
    blockCream: { backgroundColor: '#F9F9F9' },

    // BLOCK 1
    heroContent: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 80,
    },
    brandLabel: {
        fontSize: 12,
        letterSpacing: 3,
        fontWeight: '700',
        color: '#2C2724',
        marginBottom: 'auto',
    },
    microHeading: {
        fontSize: 10,
        letterSpacing: 2,
        fontWeight: 'bold',
        color: '#888',
        marginBottom: 16,
    },
    mainHeading: {
        fontSize: 32,
        fontWeight: '900',
        textAlign: 'center',
        color: '#000',
        lineHeight: 40,
        marginBottom: 8,
        paddingHorizontal: 20,
    },
    literallyText: {
        fontSize: 42,
        fontWeight: '900',
        textAlign: 'center',
        color: '#fff',
        marginBottom: 32,
        letterSpacing: 4,
    },
    heroButton: {
        borderWidth: 2,
        borderColor: '#000',
        paddingVertical: 14,
        paddingHorizontal: 24,
    },
    heroButtonText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    uspRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingBottom: 80, // Increased padding to avoid tab bar overlap
        paddingHorizontal: 10,
    },
    uspItem: { alignItems: 'center', width: '25%' },
    uspIcon: { width: 32, height: 32, marginBottom: 8, tintColor: '#000' },
    uspText: { fontSize: 10, fontWeight: '700', color: '#000', textAlign: 'center' },
    uspDesc: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2, textAlign: 'center' },

    // USP 2x2 Matrix Layout
    uspMatrix: {
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        paddingHorizontal: 40,
    },
    uspMatrixRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 24,
    },
    uspMatrixItem: {
        alignItems: 'center',
        width: '45%',
    },

    // Header with Logo
    headerLogoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerLogo: {
        width: 28,
        height: 28,
        marginRight: 8,
    },
    headerBrandText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#000',
        letterSpacing: 1,
    },

    // BLOCK 2
    howToContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    howToTitle: {
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: 2,
        color: '#2C2724',
        marginBottom: 8,
        textAlign: 'center',
    },
    greenUnderline: { width: 40, height: 3, backgroundColor: '#556B2F', marginBottom: 24 },
    howToSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 40,
        maxWidth: 300,
        lineHeight: 22,
    },
    stepsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: 800,
    },
    stepItem: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    stepIcon: { width: 70, height: 70, marginBottom: 16 },
    stepTitle: {
        fontSize: 10,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: 0.5,
        color: '#2C2724',
    },
    stepDesc: {
        fontSize: 10,
        color: '#888',
        textAlign: 'center',
        lineHeight: 14,
    },

    // BLOCK 3
    storyContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    storyLabel: {
        fontSize: 12,
        letterSpacing: 4,
        color: '#fff',
        marginBottom: 20,
    },
    storyHeading: {
        fontSize: 42,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        letterSpacing: 8,
        marginBottom: 30,
    },
    storyBody: {
        fontSize: 14,
        color: '#ccc',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
        maxWidth: 400,
    },
    storyButton: {
        borderWidth: 1,
        borderColor: '#fff',
        paddingVertical: 14,
        paddingHorizontal: 32,
    },
    storyButtonText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 2,
    },

    // BLOCK 4 (TESTIMONIALS)
    reviewsContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 40,
    },
    brandLabelSmall: {
        fontSize: 10, letterSpacing: 2, fontWeight: '700', color: '#888', marginBottom: 10
    },
    reviewsHeading: {
        fontSize: 24, fontWeight: '700', color: '#2C2724', marginBottom: 20
    },
    reviewCard: {
        width: 260,
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 4,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    reviewQuote: { fontSize: 32, color: '#556B2F', height: 30 },
    reviewText: { fontSize: 13, lineHeight: 20, color: '#444', marginBottom: 16, minHeight: 60 },
    reviewFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    reviewAuthor: { fontSize: 12, fontWeight: '700', color: '#000' },
    starText: { color: '#556B2F', fontSize: 10 },

    footer: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 20,
    },
    footerBrand: { fontSize: 12, fontWeight: '700', letterSpacing: 2, color: '#2C2724', marginBottom: 4 },
    copyright: { fontSize: 10, color: '#999' },
});
