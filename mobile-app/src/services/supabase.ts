import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Supabase configuration
const supabaseUrl = 'https://yyqoagncaxzpxodwnuax.supabase.co';
const supabaseAnonKey = 'sb_publishable_eyQzRNo7TbvJP1KNGJA-Cg_awO9iGmP';

// Check if we're in a browser environment (not SSR)
const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

// Platform-aware storage adapter
// Uses localStorage on web (browser only), and SecureStore on native
const WebStorageAdapter = {
    getItem: async (key: string): Promise<string | null> => {
        if (!isBrowser) return null;
        try {
            return window.localStorage.getItem(key);
        } catch {
            return null;
        }
    },
    setItem: async (key: string, value: string): Promise<void> => {
        if (!isBrowser) return;
        try {
            window.localStorage.setItem(key, value);
        } catch {
            // ignore
        }
    },
    removeItem: async (key: string): Promise<void> => {
        if (!isBrowser) return;
        try {
            window.localStorage.removeItem(key);
        } catch {
            // ignore
        }
    },
};

// Get the appropriate storage based on platform
const getStorage = () => {
    if (Platform.OS === 'web') {
        return WebStorageAdapter;
    }
    // Native: use expo-secure-store
    const SecureStore = require('expo-secure-store');
    return {
        getItem: (key: string) => SecureStore.getItemAsync(key),
        setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
        removeItem: (key: string) => SecureStore.deleteItemAsync(key),
    };
};

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: getStorage(),
        autoRefreshToken: true,
        persistSession: isBrowser || Platform.OS !== 'web',
        detectSessionInUrl: isBrowser,
    },
});

// Auth helper functions
export const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            },
        },
    });
    return { data, error };
};

export const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    return { data, error };
};

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
};

export const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'shadowbeanco://reset-password',
    });
    return { data, error };
};

export const getCurrentUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    return { user: data?.user, error };
};

export const getSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    return { session: data?.session, error };
};

// Profile functions
export const getProfile = async (userId: string) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    return { profile: data, error };
};

export const updateProfile = async (userId: string, updates: Record<string, any>) => {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
    return { profile: data, error };
};

// Taste profiles functions
export const getTasteProfiles = async (userId: string) => {
    const { data, error } = await supabase
        .from('taste_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    return { profiles: data, error };
};

export const createTasteProfile = async (profile: {
    userId: string;
    name: string;
    bitterness: number;
    acidity: number;
    body: number;
    flavour: number;
    roastLevel: string;
    grindType: string;
}) => {
    const { data, error } = await supabase
        .from('taste_profiles')
        .insert({
            user_id: profile.userId,
            name: profile.name,
            bitterness: profile.bitterness,
            acidity: profile.acidity,
            body: profile.body,
            flavour: profile.flavour,
            roast_level: profile.roastLevel,
            grind_type: profile.grindType,
        })
        .select()
        .single();
    return { profile: data, error };
};

// Orders functions
export const getOrders = async (userId: string) => {
    const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    return { orders: data, error };
};

export const createOrder = async (order: {
    userId: string;
    totalAmount: number;
    razorpayPaymentId: string;
    shippingAddress: Record<string, any>;
    items: Array<{
        tasteProfileId: string;
        tasteProfileName: string;
        quantity: number;
        unitPrice: number;
    }>;
}) => {
    // Create order
    const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
            user_id: order.userId,
            status: 'confirmed',
            total_amount: order.totalAmount,
            razorpay_payment_id: order.razorpayPaymentId,
            shipping_address: order.shippingAddress,
        })
        .select()
        .single();

    if (orderError) return { order: null, error: orderError };

    // Create order items
    const orderItems = order.items.map((item) => ({
        order_id: orderData.id,
        taste_profile_id: item.tasteProfileId,
        taste_profile_name: item.tasteProfileName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
    }));

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

    return { order: orderData, error: itemsError };
};

export const updateOrderTracking = async (
    orderId: string,
    shiprocketOrderId: string,
    shiprocketShipmentId: string
) => {
    const { data, error } = await supabase
        .from('orders')
        .update({
            shiprocket_order_id: shiprocketOrderId,
            shiprocket_shipment_id: shiprocketShipmentId,
        })
        .eq('id', orderId)
        .select()
        .single();
    return { order: data, error };
};

// Reviews functions - uses test_reviews table for demo
export const getReviews = async (limit = 10) => {
    const { data, error } = await supabase
        .from('reviews')
        .select('id, user_id, user_name, product_name, rating, comment, created_at')
        .order('rating', { ascending: false })
        .limit(limit);

    // Transform to match expected format in app
    const reviews = data?.map(r => ({
        ...r,
        profiles: { full_name: r.user_name }
    }));

    return { reviews, error };
};

export const createReview = async (review: {
    userId: string;
    orderId: string;
    rating: number;
    comment: string;
}) => {
    const { data, error } = await supabase
        .from('reviews')
        .insert({
            user_id: review.userId,
            order_id: review.orderId,
            rating: review.rating,
            comment: review.comment,
        })
        .select()
        .single();
    return { review: data, error };
};

// Pricing functions
export const getActivePricing = async () => {
    const { data, error } = await supabase
        .from('pricing')
        .select('*')
        .eq('is_active', true)
        .single();
    return { pricing: data, error };
};

// Terms & Conditions
export const getActiveTerms = async () => {
    const { data, error } = await supabase
        .from('terms_and_conditions')
        .select('*')
        .eq('is_active', true)
        .single();
    return { terms: data, error };
};

export default supabase;
