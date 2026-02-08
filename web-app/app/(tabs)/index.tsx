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
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getReviews } from '@/src/services/cognito-auth';
import { ImageKeys } from '@/src/constants/imageKeys';
import { useCartStore } from '@/src/stores/cartStore';
import { UniversalImage } from '@/src/components/UniversalImage';

// --- Static Assets (Conditional: Web Public URL / Native Require) ---
// On Web, we serve from /public/images/ to bypass bundler issues.
// On Native, we use standard require().

const BASE_URL = 'https://media.shadowbeanco.net/';

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

    // On Web, use VH units for consistency
    // We revert to full screen height to ensure blocks fully cover the view. 
    // If the tab bar covers a bit of the bottom, we handle it with internal padding.
    const BLOCK_HEIGHT = isWeb ? '100vh' : SCREEN_HEIGHT;

    useEffect(() => {
        // Init reviews
        const defaultReviews = [
            { id: '1', rating: 5, comment: "Never tasted coffee this smooth!", profiles: { full_name: 'Priya S.' } },
            { id: '2', rating: 5, comment: "Coffee that doesn't need sugar.", profiles: { full_name: 'Arjun K.' } },
            { id: '3', rating: 5, comment: "Custom roast option is amazing.", profiles: { full_name: 'Sarah J.' } },
        ];
        getReviews().then(({ reviews: data }) => {
            if (data && data.length > 0) setReviews(data.slice(0, 5));
            else setReviews(defaultReviews);
        });

        // WEB DEMO: Inject default item if empty
        if (Platform.OS === 'web') {
            try {
                if (useCartStore.getState().items.length === 0) {
                    console.log('Home: Injecting Default Demo Item');
                    useCartStore.getState().addItem({
                        id: `demo-${Date.now()}`,
                        name: 'Custom Blend (Demo)',
                        bitterness: 3,
                        acidity: 3,
                        body: 3,
                        flavour: 3,
                        roastLevel: 'Medium',
                        grindType: 'Whole Bean',
                    }, 1);
                }
            } catch (e) {
                console.error('Demo Injection Failed (Silently Ignored):', e);
            }
        }
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

                        {/* LOWERED: Increased top padding to 45% to push text down as requested */}
                        <View style={[styles.heroContent, { justifyContent: 'flex-start', paddingTop: '45%' }]}>
                            <Text style={[styles.mainHeading, { color: '#fff', textAlign: 'center' }, isTablet && { fontSize: 50, lineHeight: 60 }]}>
                                COFFEE MADE{'\n'}JUST FOR YOU
                            </Text>
                            <Text style={[
                                styles.literallyText,
                                isTablet && { fontSize: 60 },
                            ]}>
                                (LITERALLY)
                            </Text>
                        </View>

                        <View style={[styles.uspMatrix, { bottom: 90 }]}>
                            <View style={[styles.uspMatrixRow, { marginBottom: 16 }]}>
                                {USP_FEATURES.slice(0, 2).map((item, i) => (
                                    <View key={i} style={styles.uspMatrixItem}>
                                        <UniversalImage
                                            source={item.source}
                                            style={[styles.uspIcon, { tintColor: '#fff', width: 28, height: 28 }]}
                                            resizeMode="contain"
                                        />
                                        <Text style={[styles.uspText, { color: '#fff', fontSize: 9 }]}>{item.title}</Text>
                                        <Text style={[styles.uspDesc, { fontSize: 9 }]}>{item.desc}</Text>
                                    </View>
                                ))}
                            </View>
                            <View style={[styles.uspMatrixRow, { marginBottom: 0 }]}>
                                {USP_FEATURES.slice(2, 4).map((item, i) => (
                                    <View key={i} style={styles.uspMatrixItem}>
                                        <UniversalImage
                                            source={item.source}
                                            style={[styles.uspIcon, { tintColor: '#fff', width: 28, height: 28 }]}
                                            resizeMode="contain"
                                        />
                                        <Text style={[styles.uspText, { color: '#fff', fontSize: 9 }]}>{item.title}</Text>
                                        <Text style={[styles.uspDesc, { fontSize: 9 }]}>{item.desc}</Text>
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

                        {/* Removed paddingBottom: 100 to center properly */}
                        <View style={[styles.heroContent, { justifyContent: 'center', paddingHorizontal: 20 }]}>
                            <Text style={[styles.mainHeading, { color: '#fff', textAlign: 'center', fontSize: 36, lineHeight: 44 }, isTablet && { fontSize: 50, lineHeight: 60 }]}>
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

                    <Link href="/(tabs)/shop" asChild>
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
                        >
                            {({ pressed }) => (
                                <Text style={[styles.heroButtonText, { color: pressed ? '#fff' : '#000' }]}>
                                    PERSONALIZE AND BUY NOW
                                </Text>
                            )}
                        </Pressable>
                    </Link>
                </View>
            </View>

            {/* ========== BLOCK 3: HOW TO USE (Start with Split Images) ========== */}
            <View style={[styles.block, styles.blockCream, { height: BLOCK_HEIGHT }, isWeb && webStyles.webBlock] as any}>
                {/* Split Images Header - Reduced height to give space to content */}
                <View style={{ flexDirection: 'row', height: isWeb ? '30%' : 200, width: '100%' }}>
                    <View style={{ flex: 1 }}>
                        <UniversalImage source={pourOverAction} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <UniversalImage source={coffeeCherries} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    </View>
                </View>

                {/* Content Below */}
                <View style={[styles.howToContainer, { flex: 1, justifyContent: 'center', paddingBottom: 20 }]}>
                    <Text style={[styles.howToTitle, isTablet && { fontSize: 36 }]}>HOW TO USE STEPS</Text>
                    <View style={styles.greenUnderline} />
                    <Text style={[styles.howToSubtitle, isTablet && { fontSize: 18 }]}>
                        To experience the full depth of our shade-grown, salt-roasted coffee — brew it black.
                    </Text>

                    <View style={[styles.stepsRow, { marginTop: 10 }, isTablet && { marginTop: 30, gap: 30 }]}> {/* Reduced marginTop */}
                        <View style={styles.stepItem}>
                            <UniversalImage
                                source={iconPourOver}
                                style={[styles.stepIcon, { width: 48, height: 48 }, isTablet && { width: 60, height: 60 }]} // Reduced icon size
                                resizeMode="contain"
                            />
                            <Text style={[styles.stepTitle, { fontSize: 10 }]}>BREW WITH{'\n'}OUR POUR-OVER{'\n'}KIT</Text>
                            <Text style={[styles.stepDesc, { fontSize: 10 }]}>Experience café-style clarity and flavor.</Text>
                        </View>
                        <View style={styles.stepItem}>
                            <UniversalImage
                                source={iconFrenchPress}
                                style={[styles.stepIcon, { width: 48, height: 48 }, isTablet && { width: 60, height: 60 }]}
                                resizeMode="contain"
                            />
                            <Text style={[styles.stepTitle, { fontSize: 10 }]}>USE YOUR{'\n'}OWN BREWER</Text>
                            <Text style={[styles.stepDesc, { fontSize: 10 }]}>Aeropress, Moka Pot, South Indian filter.</Text>
                        </View>
                        <View style={styles.stepItem}>
                            <UniversalImage
                                source={iconChhani}
                                style={[styles.stepIcon, { width: 48, height: 48 }, isTablet && { width: 60, height: 60 }]}
                                resizeMode="contain"
                            />
                            <Text style={[styles.stepTitle, { fontSize: 10 }]}>BREW WITH A{'\n'}SIMPLE CHHANI</Text>
                            <Text style={[styles.stepDesc, { fontSize: 10 }]}>No equipment? No problem. Use a strainer.</Text>
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
                            <Link href="/about" asChild>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.storyButton,
                                        {
                                            backgroundColor: pressed ? '#fff' : 'transparent',
                                            ...(isWeb ? { cursor: 'pointer' } : {})
                                        } as any
                                    ]}
                                >
                                    {({ pressed }) => (
                                        <Text style={[styles.storyButtonText, { color: pressed ? '#000' : '#fff' }]}>
                                            DISCOVER MORE
                                        </Text>
                                    )}
                                </Pressable>
                            </Link>
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
                            <Link href="/about" asChild>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.storyButton,
                                        { backgroundColor: pressed ? '#fff' : 'transparent' }
                                    ]}
                                >
                                    {({ pressed }) => (
                                        <Text style={[styles.storyButtonText, { color: pressed ? '#000' : '#fff' }]}>
                                            DISCOVER MORE
                                        </Text>
                                    )}
                                </Pressable>
                            </Link>
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

            {/* FIXED HEADER - Matches App Design */}
            <View style={[styles.fixedHeader, { zIndex: 9999, paddingTop: Platform.OS === 'web' ? 8 : 44, paddingBottom: 8 }]}>
                <View style={styles.headerLogoContainer}>
                    <UniversalImage
                        source={getImgSource('logo_bird.png')}
                        style={styles.headerLogo}
                        resizeMode="contain"
                    />
                    <Text style={styles.headerBrandText}>SHADOW BEAN CO.</Text>
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
        paddingTop: Platform.OS === 'web' ? 16 : 50,
        paddingHorizontal: 20,
        paddingBottom: 8,
        zIndex: 1000,
        backgroundColor: '#FFFFFF',
    },
    cartBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#D32F2F',
        borderRadius: 8,
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    cartBadgeText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: 'bold',
    },

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
        paddingTop: 100, // Adjusted padding
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
        // Web Link Fix: Ensure it behaves like a Flex container
        alignItems: 'center',
        justifyContent: 'center',
        display: 'flex',
        minWidth: 200, // Ensure it has some clickable area
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
    uspIcon: { width: 44, height: 44, marginBottom: 8, tintColor: '#fff' }, // Increased to 44px
    uspText: { fontSize: 13, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: 0.5 }, // Increased font size and weight
    uspDesc: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2, textAlign: 'center', paddingHorizontal: 4 },

    // USP 2x2 Matrix Layout
    uspMatrix: {
        position: 'absolute',
        bottom: 70, // Increased bottom spacing to stay above footer clearly
        left: 0,
        right: 0,
        paddingHorizontal: 20,
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
        // Web Link Fix: Ensure it behaves like a Flex container
        alignItems: 'center',
        justifyContent: 'center',
        display: 'flex',
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
        paddingVertical: 10,
        paddingBottom: Platform.OS === 'web' ? 20 : 70,
    },
    footerBrand: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: '#2C2724', marginBottom: 4 },
    copyright: { fontSize: 10, color: '#999' },
});
