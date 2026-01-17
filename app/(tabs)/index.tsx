import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    Pressable,
    Dimensions,
    StatusBar,
    ImageBackground,
    useWindowDimensions,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getReviews } from '@/src/services/supabase';
import { SupabaseImage, useSupabaseImage } from '@/src/components/SupabaseImage';
import { ImageKeys } from '@/src/constants/imageKeys';
import { useCartStore } from '@/src/stores/cartStore';

// --- 4 Key USPs with PNG icons ---
// --- 4 Key USPs with PNG icons ---
const USP_FEATURES = [
    { key: ImageKeys.ICON_SHADE_GROWN, default: require('@/assets/images/icon_shade_grown.png'), title: 'SHADE GROWN', desc: 'Naturally grown under shade for richer flavor' },
    { key: ImageKeys.ICON_SALT_ROASTED, default: require('@/assets/images/icon_salt_roasted.png'), title: 'SALT ROASTED', desc: 'Signature salt-air roast for smooth, clean taste' },
    { key: ImageKeys.ICON_SMALL_BATCH, default: require('@/assets/images/icon_small_batch.png'), title: 'SMALL BATCH', desc: 'Roasted in small lots for freshness and precision' },
    { key: ImageKeys.ICON_PERSONALISED, default: require('@/assets/images/icon_personalised.png'), title: 'PERSONALISED', desc: 'Roast profiles tailored to your taste' },
];

const { height: STATIC_SCREEN_HEIGHT } = Dimensions.get('window');

export default function HomeScreen() {
    const router = useRouter();
    const [reviews, setReviews] = useState<any[]>([]);
    const { items } = useCartStore();
    const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

    // Responsive dimensions
    const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
    const isTablet = SCREEN_WIDTH >= 768;
    const isWeb = Platform.OS === 'web';
    // On web, use min-height instead of fixed height for better scrolling
    const BLOCK_HEIGHT = isWeb ? undefined : SCREEN_HEIGHT;

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

    // Load background image for story section
    const storyBgSource = useSupabaseImage(ImageKeys.FARMER_HIGHLIGHT, require('@/assets/images/coffee_farmer.jpg'));

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* FIXED HEADER - 80% white transparent */}
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

            {/* SMOOTH BLOCK SCROLL */}
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                pagingEnabled={Platform.OS !== 'web'}
                decelerationRate={Platform.OS === 'web' ? 'normal' : 'fast'}
                snapToAlignment={Platform.OS === 'web' ? undefined : 'start'}
                snapToInterval={Platform.OS === 'web' ? undefined : BLOCK_HEIGHT}
                scrollEventThrottle={16}
            >
                {/* ========== BLOCK 1: HERO + USP MATRIX OVERLAY ========== */}
                <View style={[styles.block, { height: BLOCK_HEIGHT }]}>
                    <SupabaseImage
                        remoteKey={ImageKeys.HOME_HERO}
                        defaultSource={require('@/assets/images/coffee_farm.png')}
                        style={styles.blockImage}
                        resizeMode="cover"
                        showLoading={true}
                    />
                    <View style={styles.blockOverlay} />

                    {/* Hero Content - CENTERED */}
                    <View style={styles.heroContentCenter}>
                        <Text style={[
                            styles.heroTitle,
                            isTablet && { fontSize: 48, lineHeight: 64 }
                        ]}>COFFEE MADE{'\n'}JUST FOR YOU</Text>
                        <Text style={[
                            styles.heroLiterally,
                            isTablet && { fontSize: 60, letterSpacing: 14 }
                        ]}>(LITERALLY)</Text>
                    </View>

                    {/* USP MATRIX - Overlaying lower part of hero (NO Background) */}
                    <View style={[
                        styles.uspOverlay,
                        isTablet && { flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'center', bottom: 120, paddingHorizontal: 40 }
                    ]}>
                        {USP_FEATURES.map((item, i) => (
                            <View key={i} style={[
                                styles.uspItem,
                                isTablet && { width: '25%', maxWidth: 200 }
                            ]}>
                                <SupabaseImage
                                    remoteKey={item.key}
                                    defaultSource={item.default}
                                    style={[styles.uspIcon, isTablet && { width: 56, height: 56 }]}
                                    resizeMode="contain"
                                />
                                <Text style={[styles.uspTitle, isTablet && { fontSize: 13 }]}>{item.title}</Text>
                                <Text style={[styles.uspDesc, isTablet && { fontSize: 11, lineHeight: 16 }]}>{item.desc}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* ========== BLOCK 2: PRODUCT ========== */}
                <View style={[styles.block, styles.blockWhite, { height: BLOCK_HEIGHT }]}>
                    <View style={styles.productContent}>
                        <SupabaseImage
                            remoteKey={ImageKeys.PRODUCT_PLACEHOLDER}
                            defaultSource={require('@/assets/images/product_bag.png')}
                            style={[
                                styles.productImage,
                                isTablet && { width: 340, height: 400 }
                            ]}
                            resizeMode="contain"
                        />
                        <Text style={[
                            styles.productLabel,
                            isTablet && { fontSize: 14, letterSpacing: 3 }
                        ]}>YOUR PERFECT CUP</Text>
                        <Text style={[
                            styles.productHeading,
                            isTablet && { fontSize: 32, lineHeight: 44, maxWidth: 500 }
                        ]}>
                            HOME OF THE WORLD'S{'\n'}FIRST SALT-ROASTED COFFEE
                        </Text>
                        <Pressable
                            style={({ pressed }) => [
                                styles.ctaButton,
                                isTablet && { paddingVertical: 20, paddingHorizontal: 40 },
                                { backgroundColor: pressed ? '#000' : 'transparent', borderColor: pressed ? '#000' : '#2C2724' }
                            ]}
                            onPress={() => router.push('/(tabs)/shop')}
                        >
                            {({ pressed }) => (
                                <Text style={[
                                    styles.ctaButtonText,
                                    isTablet && { fontSize: 14 },
                                    { color: pressed ? '#fff' : '#2C2724' }
                                ]}>PERSONALIZE AND BUY NOW</Text>
                            )}
                        </Pressable>
                    </View>
                </View>

                {/* ========== BLOCK 2.5: HOW TO USE STEPS ========== */}
                <View style={[styles.block, styles.blockWhite, styles.howToBlock, { height: BLOCK_HEIGHT }]}>
                    {/* Single Banner Image */}
                    <View style={[styles.howToImageRow, isTablet && { height: '25%' }]}>
                        <SupabaseImage
                            remoteKey={ImageKeys.JOURNEY_BANNER}
                            defaultSource={require('@/assets/images/coffee_journey_banner.jpg')}
                            style={styles.howToSingleBanner}
                            resizeMode="cover"
                        />
                    </View>

                    {/* Title */}
                    <View style={[
                        styles.howToTitleSection,
                        isTablet && { paddingVertical: 40, paddingHorizontal: 60 }
                    ]}>
                        <Text style={[
                            styles.howToTitle,
                            isTablet && { fontSize: 32, letterSpacing: 3 }
                        ]}>HOW TO USE STEPS</Text>
                        <View style={[styles.howToDivider, isTablet && { width: 80, height: 4 }]} />
                        <Text style={[
                            styles.howToSubtitle,
                            isTablet && { fontSize: 18, lineHeight: 28, maxWidth: 600 }
                        ]}>
                            To experience the full depth of our shade-grown, salt-roasted coffee — brew it black.
                        </Text>
                    </View>

                    {/* 3 Methods */}
                    <View style={[
                        styles.howToMethodsRow,
                        isTablet && { paddingHorizontal: 60, maxWidth: 1000, alignSelf: 'center' }
                    ]}>
                        <View style={[styles.howToMethod, isTablet && { paddingHorizontal: 20 }]}>
                            <SupabaseImage
                                remoteKey={ImageKeys.ICON_POUR_OVER}
                                defaultSource={require('@/assets/images/icon_pour_over_kit.png')}
                                style={[styles.howToMethodIcon, isTablet && { width: 80, height: 80, marginBottom: 16 }]}
                                resizeMode="contain"
                            />
                            <Text style={[
                                styles.howToMethodTitle,
                                isTablet && { fontSize: 14, marginBottom: 10 }
                            ]}>BREW WITH OUR{'\n'}POUR-OVER KIT</Text>
                            <Text style={[
                                styles.howToMethodDesc,
                                isTablet && { fontSize: 13, lineHeight: 20 }
                            ]}>
                                Experience café-style clarity and flavor with our easy pour-over setup.
                            </Text>
                        </View>
                        <View style={[styles.howToMethod, isTablet && { paddingHorizontal: 20 }]}>
                            <SupabaseImage
                                remoteKey={ImageKeys.ICON_FRENCH_PRESS}
                                defaultSource={require('@/assets/images/icon_french_press.png')}
                                style={[styles.howToMethodIcon, isTablet && { width: 80, height: 80, marginBottom: 16 }]}
                                resizeMode="contain"
                            />
                            <Text style={[
                                styles.howToMethodTitle,
                                isTablet && { fontSize: 14, marginBottom: 10 }
                            ]}>USE YOUR{'\n'}OWN BREWER</Text>
                            <Text style={[
                                styles.howToMethodDesc,
                                isTablet && { fontSize: 13, lineHeight: 20 }
                            ]}>
                                Aeropress, Moka Pot, South Indian filter — brew it your way, your style.
                            </Text>
                        </View>
                        <View style={[styles.howToMethod, isTablet && { paddingHorizontal: 20 }]}>
                            <SupabaseImage
                                remoteKey={ImageKeys.ICON_CHHANI}
                                defaultSource={require('@/assets/images/icon_chhani.png')}
                                style={[styles.howToMethodIcon, isTablet && { width: 80, height: 80, marginBottom: 16 }]}
                                resizeMode="contain"
                            />
                            <Text style={[
                                styles.howToMethodTitle,
                                isTablet && { fontSize: 14, marginBottom: 10 }
                            ]}>BREW WITH A{'\n'}SIMPLE CHHANI</Text>
                            <Text style={[
                                styles.howToMethodDesc,
                                isTablet && { fontSize: 13, lineHeight: 20 }
                            ]}>
                                No equipment? No problem. A household strainer makes a smooth, honest cup.
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ========== BLOCK 3: OUR STORY ========== */}
                <ImageBackground
                    source={storyBgSource}
                    style={[styles.block, { height: BLOCK_HEIGHT }]}
                    resizeMode="cover"
                >
                    <View style={styles.storyOverlay} />

                    <View style={styles.storyFullContent}>
                        <Text style={[
                            styles.storyLabel,
                            isTablet && { fontSize: 16, letterSpacing: 6 }
                        ]}>OUR JOURNEY</Text>
                        <Text style={[
                            styles.storyHeadingBig,
                            isTablet && { fontSize: 64, letterSpacing: 14 }
                        ]}>OUR STORY</Text>
                        <Text style={[
                            styles.storyBodyBig,
                            isTablet && { fontSize: 18, lineHeight: 30, maxWidth: 500 }
                        ]}>
                            We celebrate India's shade-grown coffee tradition with a unique salt-air roasting method that preserves depth, aroma, and sweetness.
                        </Text>
                        <Pressable
                            style={({ pressed }) => [
                                styles.storyButton,
                                isTablet && { paddingVertical: 16, paddingHorizontal: 32 },
                                { backgroundColor: pressed ? '#000' : 'transparent', borderColor: pressed ? '#000' : '#fff' }
                            ]}
                            onPress={() => router.push('/(tabs)/about')}
                        >
                            {({ pressed }) => (
                                <Text style={[
                                    styles.storyButtonText,
                                    isTablet && { fontSize: 13 },
                                    { color: pressed ? '#fff' : '#fff' }
                                ]}>DISCOVER MORE</Text>
                            )}
                        </Pressable>
                    </View>
                </ImageBackground>

                {/* ========== BLOCK 4: REVIEWS ========== */}
                <View style={[styles.block, styles.blockCream, { height: BLOCK_HEIGHT }]}>
                    <View style={styles.reviewsFullContent}>
                        <View style={styles.reviewsHeader}>
                            <Text style={[
                                styles.reviewsSectionLabel,
                                isTablet && { fontSize: 12, letterSpacing: 3 }
                            ]}>TESTIMONIALS</Text>
                            <Text style={[
                                styles.reviewsHeading,
                                isTablet && { fontSize: 32 }
                            ]}>Loved By Coffee Lovers</Text>
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={[
                                styles.reviewsScroll,
                                isTablet && { paddingHorizontal: 40, gap: 24 }
                            ]}
                        >
                            {reviews.map((r, i) => (
                                <View key={i} style={[
                                    styles.reviewCard,
                                    isTablet && { width: 320, padding: 28 }
                                ]}>
                                    <Text style={[styles.reviewQuote, isTablet && { fontSize: 48 }]}>"</Text>
                                    <Text style={[
                                        styles.reviewText,
                                        isTablet && { fontSize: 16, lineHeight: 26 }
                                    ]}>{r.comment}</Text>
                                    <View style={styles.reviewBottom}>
                                        <Text style={[
                                            styles.reviewAuthor,
                                            isTablet && { fontSize: 15 }
                                        ]}>{r.profiles?.full_name}</Text>
                                        <View style={styles.reviewStars}>
                                            {[...Array(5)].map((_, idx) => (
                                                <Text key={idx} style={[
                                                    styles.starText,
                                                    isTablet && { fontSize: 14 }
                                                ]}>★</Text>
                                            ))}
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>

                        {/* Footer */}
                        <View style={styles.footerInline}>
                            <SupabaseImage
                                remoteKey={ImageKeys.LOGO_MAIN}
                                defaultSource={require('@/assets/images/logo_bird.png')}
                                style={[styles.footerLogo, isTablet && { width: 56, height: 56 }]}
                                resizeMode="contain"
                            />
                            <Text style={[
                                styles.footerBrand,
                                isTablet && { fontSize: 16, letterSpacing: 3 }
                            ]}>SHADOW BEAN CO.</Text>
                            <Text style={[styles.copyright, isTablet && { fontSize: 12 }]}>© 2024 Shadow Bean Co.</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollView: {
        flex: 1,
    },

    // ========== FIXED HEADER ==========
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

    // ========== BLOCKS ==========
    block: {
        width: '100%',
        position: 'relative',
    },
    blockWhite: {
        backgroundColor: '#fff',
    },
    blockCream: {
        backgroundColor: '#FDFBF7',
    },
    howToBlock: {
        justifyContent: 'flex-start',
    },
    blockImage: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    blockOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },

    // ========== HERO ==========
    heroContentCenter: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 180, // Make room for overlaying USP
    },
    heroTitle: {
        fontSize: 32,
        color: '#fff',
        textAlign: 'center',
        fontWeight: '300',
        letterSpacing: 4,
        lineHeight: 44,
    },
    heroLiterally: {
        fontSize: 46,
        color: '#fff',
        marginTop: 12,
        letterSpacing: 10,
        fontWeight: '700',
    },

    // ========== USP MATRIX OVERLAY (On Hero, NO Background) ==========
    uspOverlay: {
        position: 'absolute',
        bottom: 100, // Above tab bar
        left: 0,
        right: 0,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        paddingHorizontal: 16,
        // NO backgroundColor - transparent overlay on hero
    },
    uspItem: {
        width: '48%',
        alignItems: 'center',
        marginBottom: 16,
    },
    uspIcon: {
        width: 40,
        height: 40,
        marginBottom: 8,
        tintColor: '#fff', // White icons on dark hero
    },
    uspTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 1,
        marginBottom: 2,
    },
    uspDesc: {
        fontSize: 9,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        lineHeight: 12,
        paddingHorizontal: 4,
    },

    // ========== PRODUCT ==========
    productContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 24,
    },
    productImage: {
        width: 220,
        height: 280,
        marginBottom: 24,
    },
    productLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 2,
        color: '#999',
        marginBottom: 14,
    },
    productHeading: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2C2724',
        lineHeight: 32,
        textAlign: 'center',
        marginBottom: 24,
    },
    ctaButton: {
        borderWidth: 2,
        borderColor: '#2C2724',
        paddingVertical: 16,
        paddingHorizontal: 28,
    },
    ctaButtonText: {
        color: '#2C2724',
        fontWeight: '700',
        fontSize: 12,
        letterSpacing: 1,
    },

    // ========== STORY ==========
    storyOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    storyFullContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingTop: 60,
    },
    storyLabel: {
        fontSize: 14,
        fontWeight: '300',
        letterSpacing: 4,
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    storyHeadingBig: {
        fontSize: 46,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 20,
        letterSpacing: 10,
        textAlign: 'center',
    },
    storyBodyBig: {
        fontSize: 15,
        lineHeight: 24,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginBottom: 28,
        maxWidth: 300,
    },
    storyButton: {
        borderWidth: 2,
        borderColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    storyButtonText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.5,
    },

    // ========== REVIEWS ==========
    reviewsFullContent: {
        flex: 1,
        paddingTop: 120,
    },
    reviewsHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    reviewsSectionLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 2.5,
        color: '#6B8E23',
        marginBottom: 6,
    },
    reviewsHeading: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2C2724',
    },
    reviewsScroll: {
        paddingHorizontal: 20,
        gap: 14,
    },
    reviewCard: {
        width: 240,
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    reviewQuote: {
        fontSize: 40,
        color: '#6B8E23',
        fontWeight: '700',
        marginTop: -10,
        marginBottom: -10,
    },
    reviewText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#444',
        marginBottom: 16,
    },
    reviewBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    reviewAuthor: {
        fontSize: 13,
        fontWeight: '700',
        color: '#2C2724',
    },
    reviewStars: {
        flexDirection: 'row',
    },
    starText: {
        fontSize: 12,
        color: '#6B8E23',
    },

    // ========== FOOTER ==========
    footerInline: {
        alignItems: 'center',
        paddingVertical: 24,
        marginTop: 'auto',
        paddingBottom: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.80)',
    },
    footerLogo: {
        width: 40,
        height: 40,
        marginBottom: 10,
    },
    footerBrand: {
        color: '#2C2724',
        fontSize: 14,
        letterSpacing: 2,
        fontWeight: '700',
        marginBottom: 6,
    },
    copyright: {
        color: '#888',
        fontSize: 10,
    },

    // ========== HOW TO USE STEPS ==========
    howToImageRow: {
        flexDirection: 'row',
        height: '35%',  // Reduced from 50% - smaller image area
    },
    howToImage: {
        flex: 1,
        height: '100%',
    },
    howToSingleBanner: {
        width: '100%',
        height: '100%',
    },
    howToTitleSection: {
        flex: 1,  // Take up remaining space in the middle
        alignItems: 'center',
        justifyContent: 'center',  // Center vertically
        paddingVertical: 24,
        paddingHorizontal: 28,
    },
    howToTitle: {
        fontSize: 26,  // Larger title
        fontWeight: '700',
        color: '#2C2724',
        letterSpacing: 3,
        marginBottom: 14,
    },
    howToDivider: {
        width: 60,
        height: 3,
        backgroundColor: '#6B8E23',
        marginBottom: 16,
    },
    howToSubtitle: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: 300,
    },
    howToMethodsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 12,
        paddingTop: 16,
        paddingBottom: 90,  // Space for tab bar
        alignItems: 'flex-start',
        backgroundColor: '#fff',
    },
    howToMethod: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    howToMethodIcon: {
        width: 40,
        height: 40,
        marginBottom: 8,
    },
    howToMethodTitle: {
        fontSize: 9,
        fontWeight: '700',
        color: '#2C2724',
        textAlign: 'center',
        letterSpacing: 0.3,
        marginBottom: 5,
        lineHeight: 13,
    },
    howToMethodDesc: {
        fontSize: 9,
        color: '#888',
        textAlign: 'center',
        lineHeight: 14,
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
});
