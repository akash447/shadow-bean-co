// Media Assets Service
// Fetches images from Supabase media_assets table by key
// This allows images to be updated in Admin Panel and automatically reflect in the app

import { supabase } from './supabase';

// Cache to avoid repeated fetches
const mediaCache: Record<string, string> = {};

// Default/fallback images (local assets)
const defaultImages: Record<string, any> = {
    hero_banner: require('@/assets/images/coffee_farm.png'),
    product_bag: require('@/assets/images/product_bag.png'),
    coffee_farm: require('@/assets/images/coffee_farm.png'),
    farmer_harvesting: require('@/assets/images/farmer_harvesting.jpg'),
    latte_art: require('@/assets/images/latte_art.png'),
    coffee_cherries: require('@/assets/images/coffee_cherries.jpg'),
    roasting_process: require('@/assets/images/roasting_process.jpg'),
    journey_map: require('@/assets/images/journey_map.png'),
    shop_hero: require('@/assets/images/pour_over_brewing.png'),
    pour_over_kit: require('@/assets/images/icon_pour_over_kit.png'),
    french_press: require('@/assets/images/icon_french_press.png'),
};

// Get a single image URL by key
export const getMediaUrl = async (key: string): Promise<string | null> => {
    // Check cache first
    if (mediaCache[key]) {
        return mediaCache[key];
    }

    try {
        const { data, error } = await supabase
            .from('media_assets')
            .select('url')
            .eq('key', key)
            .eq('is_active', true)
            .single();

        if (!error && data?.url) {
            mediaCache[key] = data.url;
            return data.url;
        }
    } catch (err) {
        console.log('Error fetching media:', err);
    }

    return null;
};

// Get default local image for a key
export const getDefaultImage = (key: string): any => {
    return defaultImages[key] || defaultImages.product_bag;
};

// Get all media assets
export const getAllMediaAssets = async (): Promise<Record<string, string>> => {
    try {
        const { data, error } = await supabase
            .from('media_assets')
            .select('key, url')
            .eq('is_active', true);

        if (!error && data) {
            const assets: Record<string, string> = {};
            data.forEach((item) => {
                assets[item.key] = item.url;
                mediaCache[item.key] = item.url;
            });
            return assets;
        }
    } catch (err) {
        console.log('Error fetching all media:', err);
    }

    return {};
};

// Get image source (for React Native Image component)
// Returns remote URL if available, otherwise falls back to local asset
export const getImageSource = async (key: string): Promise<{ uri: string } | any> => {
    const remoteUrl = await getMediaUrl(key);

    if (remoteUrl) {
        return { uri: remoteUrl };
    }

    // Fall back to local asset
    return getDefaultImage(key);
};

// Clear cache (useful when admin updates images)
export const clearMediaCache = () => {
    Object.keys(mediaCache).forEach((key) => delete mediaCache[key]);
};

// Preload all media assets (call on app startup)
export const preloadMediaAssets = async () => {
    await getAllMediaAssets();
};
