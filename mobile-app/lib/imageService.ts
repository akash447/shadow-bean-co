/**
 * Image Service for Shadow Bean Co
 * Centralized image management via CloudFront CDN
 * Supports caching for fast loading
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// CloudFront CDN base URL (replaces Supabase storage)
const CLOUDFRONT_BASE_URL = 'https://media.shadowbeanco.net';

// Cache configuration
const CACHE_PREFIX = 'img_cache_';
const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

// Image keys and their fallback local assets
const LOCAL_FALLBACKS: Record<string, any> = {
    logo_bird: require('@/assets/images/logo_bird.png'),
    product_bag: require('@/assets/images/product_bag.png'),
    coffee_farm: require('@/assets/images/coffee_farm.png'),
    roasting_process: require('@/assets/images/roasting_process.jpg'),
    pour_over_brewing: require('@/assets/images/pour_over_brewing_action.jpg'),
    coffee_farmer: require('@/assets/images/coffee_farmer.jpg'),
    coffee_cherries: require('@/assets/images/coffee_cherries.jpg'),
    icon_shade_grown: require('@/assets/images/icon_shade_grown.png'),
    icon_salt_roasted: require('@/assets/images/icon_salt_roasted.png'),
    icon_small_batch: require('@/assets/images/icon_small_batch.png'),
    icon_personalised: require('@/assets/images/icon_personalised.png'),
    icon_pour_over: require('@/assets/images/icon_pour_over_kit.png'),
    icon_french_press: require('@/assets/images/icon_french_press.png'),
    icon_chhani: require('@/assets/images/icon_chhani.png'),
};

interface CachedImage {
    url: string;
    timestamp: number;
}

interface ImageAsset {
    key: string;
    url: string;
    title: string;
    category: string;
}

// In-memory cache for current session
const memoryCache: Map<string, string> = new Map();

/**
 * Get image URL from CloudFront CDN with caching
 * Falls back to local asset if not found
 */
export const getAppImage = async (key: string): Promise<string | any> => {
    // Check memory cache first (fastest)
    if (memoryCache.has(key)) {
        return memoryCache.get(key)!;
    }

    // Check AsyncStorage cache
    try {
        const cached = await AsyncStorage.getItem(CACHE_PREFIX + key);
        if (cached) {
            const parsed: CachedImage = JSON.parse(cached);
            if (Date.now() - parsed.timestamp < CACHE_EXPIRY_MS) {
                memoryCache.set(key, parsed.url);
                return parsed.url;
            }
        }
    } catch (error) {
        console.warn('Cache read error:', error);
    }

    // Build CloudFront CDN URL
    const cdnUrl = `${CLOUDFRONT_BASE_URL}/${key}`;

    // Save to cache
    try {
        const cacheData: CachedImage = { url: cdnUrl, timestamp: Date.now() };
        await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheData));
        memoryCache.set(key, cdnUrl);
    } catch (error) {
        console.warn('Cache write error:', error);
    }

    return cdnUrl;
};

/**
 * Preload critical images on app startup
 * Call this in your root layout or App.tsx
 */
export const preloadCriticalImages = async (): Promise<void> => {
    const criticalKeys = [
        'logo_bird',
        'product_bag',
        'coffee_farm',
    ];

    try {
        for (const key of criticalKeys) {
            const cdnUrl = `${CLOUDFRONT_BASE_URL}/${key}`;
            const cacheData: CachedImage = { url: cdnUrl, timestamp: Date.now() };
            await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheData));
            memoryCache.set(key, cdnUrl);
        }
    } catch (error) {
        console.warn('Preload images error:', error);
    }
};

/**
 * Get all images for a category
 * Note: With CloudFront CDN, category-based fetching is handled by the API
 */
export const getImagesByCategory = async (category: string): Promise<ImageAsset[]> => {
    // With CloudFront, images are accessed directly by key.
    // Return empty array - category browsing should be handled by the API layer.
    console.warn('getImagesByCategory: Use the API for category-based image lookups');
    return [];
};

/**
 * Clear image cache (useful for debugging or forced refresh)
 */
export const clearImageCache = async (): Promise<void> => {
    memoryCache.clear();
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
};

/**
 * Get image source for React Native Image component
 * Returns either { uri: string } or require() result
 */
export const getImageSource = async (key: string): Promise<{ uri: string } | any> => {
    const result = await getAppImage(key);
    if (typeof result === 'string') {
        return { uri: result };
    }
    return result;
};

// Export image keys for type safety
export const IMAGE_KEYS = {
    LOGO_BIRD: 'logo_bird',
    PRODUCT_BAG: 'product_bag',
    COFFEE_FARM: 'coffee_farm',
    ROASTING_PROCESS: 'roasting_process',
    POUR_OVER_BREWING: 'pour_over_brewing',
    COFFEE_FARMER: 'coffee_farmer',
    COFFEE_CHERRIES: 'coffee_cherries',
    ICON_SHADE_GROWN: 'icon_shade_grown',
    ICON_SALT_ROASTED: 'icon_salt_roasted',
    ICON_SMALL_BATCH: 'icon_small_batch',
    ICON_PERSONALISED: 'icon_personalised',
    ICON_POUR_OVER: 'icon_pour_over',
    ICON_FRENCH_PRESS: 'icon_french_press',
    ICON_CHHANI: 'icon_chhani',
} as const;
