// Analytics Service for Shadow Bean Co
// Uses Firebase Analytics with Measurement ID: G-M42CKD26L1
// Property ID: 519498804

import {
    getAnalytics,
    logEvent,
    setUserId,
    setUserProperties,
    isSupported
} from 'firebase/analytics';
import { initializeFirebase } from '@/src/config/firebase';

let analyticsInstance: ReturnType<typeof getAnalytics> | null = null;

// Initialize analytics
const getAnalyticsInstance = async () => {
    if (!analyticsInstance) {
        const supported = await isSupported();
        if (supported) {
            const { analytics } = await initializeFirebase();
            analyticsInstance = analytics;
        }
    }
    return analyticsInstance;
};

// Track screen views
export const logScreenView = async (screenName: string, screenClass?: string) => {
    try {
        const analytics = await getAnalyticsInstance();
        if (analytics) {
            logEvent(analytics, 'screen_view', {
                screen_name: screenName,
                screen_class: screenClass || screenName,
            });
        }
    } catch (error) {
        console.log('Analytics screen view error:', error);
    }
};

// Track user login
export const logLogin = async (method: string = 'email') => {
    try {
        const analytics = await getAnalyticsInstance();
        if (analytics) {
            logEvent(analytics, 'login', { method });
        }
    } catch (error) {
        console.log('Analytics login error:', error);
    }
};

// Track sign up
export const logSignUp = async (method: string = 'email') => {
    try {
        const analytics = await getAnalyticsInstance();
        if (analytics) {
            logEvent(analytics, 'sign_up', { method });
        }
    } catch (error) {
        console.log('Analytics sign up error:', error);
    }
};

// Track add to cart
export const logAddToCart = async (item: {
    itemId: string;
    itemName: string;
    price: number;
    quantity: number;
}) => {
    try {
        const analytics = await getAnalyticsInstance();
        if (analytics) {
            logEvent(analytics, 'add_to_cart', {
                value: item.price * item.quantity,
                currency: 'INR',
                items: [{
                    item_id: item.itemId,
                    item_name: item.itemName,
                    price: item.price,
                    quantity: item.quantity,
                }],
            });
        }
    } catch (error) {
        console.log('Analytics add to cart error:', error);
    }
};

// Track purchase/checkout
export const logPurchase = async (order: {
    orderId: string;
    totalAmount: number;
    items: Array<{
        itemId: string;
        itemName: string;
        price: number;
        quantity: number;
    }>;
}) => {
    try {
        const analytics = await getAnalyticsInstance();
        if (analytics) {
            logEvent(analytics, 'purchase', {
                transaction_id: order.orderId,
                value: order.totalAmount,
                currency: 'INR',
                items: order.items.map(item => ({
                    item_id: item.itemId,
                    item_name: item.itemName,
                    price: item.price,
                    quantity: item.quantity,
                })),
            });
        }
    } catch (error) {
        console.log('Analytics purchase error:', error);
    }
};

// Track begin checkout
export const logBeginCheckout = async (cartValue: number, itemCount: number) => {
    try {
        const analytics = await getAnalyticsInstance();
        if (analytics) {
            logEvent(analytics, 'begin_checkout', {
                value: cartValue,
                currency: 'INR',
                items: [{ quantity: itemCount }],
            });
        }
    } catch (error) {
        console.log('Analytics begin checkout error:', error);
    }
};

// Track taste profile save
export const logSaveTasteProfile = async (profileData: {
    bitterness: number;
    acidity: number;
    body: number;
    flavour: number;
    roastLevel: string;
    grindType: string;
}) => {
    try {
        const analytics = await getAnalyticsInstance();
        if (analytics) {
            logEvent(analytics, 'save_taste_profile', {
                bitterness: profileData.bitterness,
                acidity: profileData.acidity,
                body: profileData.body,
                flavour: profileData.flavour,
                roast_level: profileData.roastLevel,
                grind_type: profileData.grindType,
            });
        }
    } catch (error) {
        console.log('Analytics save profile error:', error);
    }
};

// Track custom events
export const logCustomEvent = async (eventName: string, params?: Record<string, any>) => {
    try {
        const analytics = await getAnalyticsInstance();
        if (analytics) {
            logEvent(analytics, eventName, params);
        }
    } catch (error) {
        console.log('Analytics custom event error:', error);
    }
};

// Set user ID for tracking
export const setAnalyticsUserId = async (userId: string) => {
    try {
        const analytics = await getAnalyticsInstance();
        if (analytics) {
            setUserId(analytics, userId);
        }
    } catch (error) {
        console.log('Analytics set user ID error:', error);
    }
};

// Set user properties
export const setAnalyticsUserProperties = async (properties: Record<string, string>) => {
    try {
        const analytics = await getAnalyticsInstance();
        if (analytics) {
            setUserProperties(analytics, properties);
        }
    } catch (error) {
        console.log('Analytics set user property error:', error);
    }
};

// Track view item (product)
export const logViewItem = async (product: {
    itemId: string;
    itemName: string;
    price: number;
}) => {
    try {
        const analytics = await getAnalyticsInstance();
        if (analytics) {
            logEvent(analytics, 'view_item', {
                items: [{
                    item_id: product.itemId,
                    item_name: product.itemName,
                    price: product.price,
                }],
                value: product.price,
                currency: 'INR',
            });
        }
    } catch (error) {
        console.log('Analytics view item error:', error);
    }
};

// Track search
export const logSearch = async (searchTerm: string) => {
    try {
        const analytics = await getAnalyticsInstance();
        if (analytics) {
            logEvent(analytics, 'search', { search_term: searchTerm });
        }
    } catch (error) {
        console.log('Analytics search error:', error);
    }
};

// Track share
export const logShare = async (contentType: string, itemId: string) => {
    try {
        const analytics = await getAnalyticsInstance();
        if (analytics) {
            logEvent(analytics, 'share', {
                content_type: contentType,
                item_id: itemId,
                method: 'app',
            });
        }
    } catch (error) {
        console.log('Analytics share error:', error);
    }
};
