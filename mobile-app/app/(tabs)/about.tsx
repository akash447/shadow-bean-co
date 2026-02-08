import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
    Image,
    Pressable,
    StatusBar,
    ImageBackground,
    useWindowDimensions,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ImageKeys } from '@/src/constants/imageKeys';
import { UniversalImage } from '@/src/components/UniversalImage';

// --- Static Assets ---
const BASE_URL = 'https://media.shadowbeanco.net/';
const getImgSource = (filename: string) => ({ uri: `${BASE_URL}${filename}` });

const aboutHeroBg = getImgSource('about_hero.jpg');
const coffeeFarm = getImgSource('coffee_farm.png');
const logoBird = getImgSource('logo_bird.png');
const journeyBanner = getImgSource('coffee_journey_banner.jpg');

export default function AboutScreen() {
    const router = useRouter();
    const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
    const isTablet = SCREEN_WIDTH >= 768;
    const isWeb = Platform.OS === 'web';

    // On Web, use VH units. Use minHeight to avoid collapse.
    const BLOCK_MIN_HEIGHT = isWeb ? '100vh' : SCREEN_HEIGHT;

    // --- RENDER CONTENT BLOCKS ---
    const renderContent = () => (
        <>
            {/* ========== BLOCK 1: HERO with BACKGROUND IMAGE ========== */}
            {/* ========== BLOCK 1: HERO with BACKGROUND IMAGE ========== */}
            <View style={[styles.block, { minHeight: BLOCK_MIN_HEIGHT }, isWeb && styles.webBlock]}>
                <View style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                    {/* Background Image - Works on both Web and Native via UniversalImage */}
                    <UniversalImage
                        source={aboutHeroBg}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                    />
                    <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' }} />
                    <View style={styles.heroContent}>
                        <Text style={[styles.heroPreTitle, isTablet && { fontSize: 14 }]}>
                            OUR ORIGINS
                        </Text>
                        <Text style={[styles.heroTitle, isTablet && { fontSize: 52, lineHeight: 60 }]}>
                            STORY BEHIND{'\n'}THE BRAND
                        </Text>
                        <View style={styles.heroDivider} />
                        <Text style={[styles.heroDescription, isTablet && { fontSize: 16, lineHeight: 28, maxWidth: 500 }]}>
                            Shadow Bean Co. was born from India's shaded coffee forests, where beans grow slowly under natural tree canopies and develop deep, layered flavor.
                        </Text>
                        <Text style={[styles.heroDescription, isTablet && { fontSize: 16, lineHeight: 28, maxWidth: 500 }]}>
                            We set out to honor this heritage by creating coffee that stays true to its origins: pure, small-batch, and crafted with intention.
                        </Text>
                    </View>
                </View>
            </View>

            {/* ========== BLOCK 2: THE PHILOSOPHY (Centered, No Icons) ========== */}
            <View style={[styles.block, styles.blockCream, { minHeight: BLOCK_MIN_HEIGHT }, isWeb && styles.webBlock]}>
                <View style={styles.philosophyBlock}>
                    <Text style={[styles.philosophyLabel, isTablet && { fontSize: 14 }]}>
                        THE
                    </Text>
                    <Text style={[styles.philosophyTitle, isTablet && { fontSize: 52 }]}>
                        PHILOSOPHY
                    </Text>

                    <View style={[styles.philosophyContent, isTablet && { maxWidth: 600 }]}>
                        <Text style={[styles.philosophyText, isTablet && { fontSize: 16, lineHeight: 28 }]}>
                            We believe great coffee needs nothing added - just care, precision, and respect for the bean. Our process blends shade-grown sourcing, salt-roasting, and small-batch craftsmanship.
                        </Text>
                        <Text style={[styles.philosophyText, isTablet && { fontSize: 16, lineHeight: 28 }]}>
                            Using a unique salt-air roast profile, we reduce bitterness and preserve natural oils, delivering a cup that's clean, smooth, and full of character.
                        </Text>
                        <Text style={[styles.philosophyText, isTablet && { fontSize: 16, lineHeight: 28 }]}>
                            And because every palate is different, we offer personalized roast profiles based on acidity, body, and bitterness, roasted just for you.
                        </Text>
                    </View>
                </View>
            </View>

            {/* ========== BLOCK 3: IMAGE ON TOP + JOURNEY BELOW ========== */}
            <View style={[styles.block, styles.blockCream, { minHeight: BLOCK_MIN_HEIGHT }, isWeb && styles.webBlock]}>

                {/* Image at Top */}
                <View style={styles.journeyImageContainer}>
                    <UniversalImage
                        source={journeyBanner}
                        style={styles.journeyImage}
                        resizeMode="cover"
                    />
                </View>

                {/* Journey Content */}
                <View style={styles.journeyBlock}>
                    <View style={styles.journeyDivider} />
                    <Text style={[styles.journeyTitle, isTablet && { fontSize: 28 }]}>
                        JOURNEY OF A COFFEE BEAN
                    </Text>

                    <Text style={[styles.journeyDescription, isTablet && { fontSize: 15, lineHeight: 26, maxWidth: 500 }]}>
                        From the shaded estates of Karnataka and Andhra Pradesh, each bean is hand-selected for quality and grown under the protective canopy of native trees.
                    </Text>

                    <Text style={[styles.journeyDescription, isTablet && { fontSize: 15, lineHeight: 26, maxWidth: 500 }]}>
                        After harvest, the beans travel to our roastery, where we roast them in small, controlled batches using our salt-air technique.
                    </Text>

                    <Text style={[styles.journeyDescription, isTablet && { fontSize: 15, lineHeight: 26, maxWidth: 500 }]}>
                        Freshly roasted, packed, and shipped, each bag carries the journey of Indian coffee, from forest shade to your perfect cup.
                    </Text>

                    {/* Shop Button */}
                    <Pressable
                        style={styles.shopButton}
                        onPress={() => router.push('/(tabs)/shop')}
                    >
                        <Text style={styles.shopButtonText}>SHOP NOW</Text>
                    </Pressable>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <UniversalImage
                            source={logoBird}
                            style={styles.footerLogo}
                            resizeMode="contain"
                        />
                        <Text style={styles.footerBrand}>SHADOW BEAN CO.</Text>
                        <Text style={styles.copyright}>© 2024 Shadow Bean Co.</Text>
                    </View>
                </View>

            </View>
        </>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Fixed Header - Brand Logo + Cart */}
            <View style={styles.fixedHeader}>
                <View style={styles.headerLeft}>
                    <UniversalImage
                        source={logoBird}
                        style={styles.headerLogo}
                        resizeMode="contain"
                    />
                    <Text style={styles.headerBrandName}>SHADOW BEAN CO.</Text>
                </View>
                <Pressable onPress={() => router.push('/cart')}>
                    <Ionicons name="cart-outline" size={24} color="#2C2724" />
                </Pressable>
            </View>

            {isWeb ? (
                <View style={styles.webScrollContainer as any}>
                    {renderContent()}
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    pagingEnabled={true}
                    decelerationRate="fast"
                    snapToAlignment="start"
                    snapToInterval={SCREEN_HEIGHT}
                >
                    {renderContent()}
                </ScrollView>
            )}
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
    webScrollContainer: {
        height: '100vh',
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
        flex: 1,
    },
    webBlock: {
        scrollSnapAlign: 'start',
    },
    block: {
        width: '100%',
    },
    blockCream: {
        backgroundColor: '#FAF8F5',
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
        paddingTop: Platform.OS === 'web' ? 16 : 50, // Reduced
        paddingHorizontal: 20,
        paddingBottom: 8, // Reduced
        zIndex: 1000,
        zIndex: 1000,
        backgroundColor: '#FFFFFF', // Darker match
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerLogo: {
        width: 24, // Reduced from 32
        height: 24,
        marginRight: 8,
        tintColor: '#2C2724',
    },
    headerBrandName: {
        fontSize: 11, // Reduced from 13
        fontWeight: '700',
        color: '#2C2724',
        letterSpacing: 1.5,
    },

    // ========== BLOCK 1: HERO ==========
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    heroContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    heroPreTitle: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 4,
        color: '#fff',
        marginBottom: 16,
    },
    heroTitle: {
        fontSize: 42,
        fontWeight: '300',
        color: '#fff',
        textAlign: 'center',
        lineHeight: 50,
        marginBottom: 20,
    },
    heroDivider: {
        width: 50,
        height: 3,
        backgroundColor: '#6B8E23',
        marginBottom: 24,
    },
    heroDescription: {
        fontSize: 15,
        lineHeight: 24,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginBottom: 12,
        maxWidth: 320,
    },

    // ========== BLOCK 2: PHILOSOPHY ==========
    philosophyBlock: {
        flex: 1,
        paddingTop: 140,
        paddingHorizontal: 28,
        alignItems: 'center',
        justifyContent: 'center', // Centering content might help web layout
    },
    philosophyLabel: {
        fontSize: 12,
        fontWeight: '300',
        color: '#2C2724',
        letterSpacing: 2,
    },
    philosophyTitle: {
        fontSize: 40,
        fontWeight: '700',
        color: '#2C2724',
        letterSpacing: 3,
        marginBottom: 40,
    },
    philosophyContent: {
        alignItems: 'center',
    },
    philosophyText: {
        fontSize: 14,
        lineHeight: 24,
        color: '#555',
        textAlign: 'center',
        marginBottom: 20,
    },

    // ========== BLOCK 3: JOURNEY ==========
    journeyImageContainer: {
        height: '35%',
        width: '100%',
    },
    journeyImage: {
        width: '100%',
        height: '100%',
    },
    journeyBlock: {
        flex: 1,
        paddingTop: 24,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    journeyDivider: {
        width: 50,
        height: 2,
        backgroundColor: '#2C2724',
        marginBottom: 16,
    },
    journeyTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#2C2724',
        letterSpacing: 1.5,
        marginBottom: 20,
        textAlign: 'center',
    },
    journeyDescription: {
        fontSize: 13,
        lineHeight: 22,
        color: '#555',
        textAlign: 'center',
        marginBottom: 12,
        maxWidth: 340,
    },
    shopButton: {
        backgroundColor: '#2C2724',
        paddingVertical: 14,
        paddingHorizontal: 36,
        borderRadius: 8,
        marginTop: 16,
    },
    shopButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 1.5,
    },

    // ========== FOOTER ==========
    footer: {
        alignItems: 'center',
        marginTop: 'auto',
        paddingVertical: 10, // Reduced
        paddingBottom: Platform.OS === 'web' ? 20 : 70, // Reduced
    },
    footerLogo: {
        width: 28, // Reduced from 36
        height: 28,
        marginBottom: 6,
        tintColor: '#2C2724',
    },
    footerBrand: {
        color: '#2C2724',
        fontSize: 10, // Reduced from 12
        letterSpacing: 2,
        fontWeight: '700',
        marginBottom: 4,
    },
    copyright: {
        color: '#888',
        fontSize: 10,
    },
});
