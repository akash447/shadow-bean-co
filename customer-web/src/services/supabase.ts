import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Initializing Supabase client...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'MISSING');

// Create Supabase client with simplified configuration
// Using implicit flow to avoid PKCE-related AbortError issues
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: localStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'implicit',
    },
});

console.log('Supabase client created successfully');

// =====================
// AUTH FUNCTIONS
// =====================

export async function signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: fullName },
        },
    });

    // Create profile if signup successful
    if (data.user && !error) {
        await ensureProfile(data.user.id, email, fullName);
    }

    return { data, error };
}

export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    // Ensure profile exists on login
    if (data.user && !error) {
        await ensureProfile(data.user.id, data.user.email || email);
    }

    return { data, error };
}

// Google OAuth Sign In
export async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin,
        },
    });
    return { data, error };
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
}

export async function resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
}

export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

// =====================
// PROFILE FUNCTIONS
// =====================

// Ensure a profile exists for the user (create if missing)
export async function ensureProfile(userId: string, email?: string, fullName?: string) {
    console.log('ensureProfile called for:', userId);

    // Use upsert to atomically create-or-update the profile
    // This is faster than check-then-insert and avoids race conditions
    const { error } = await supabase
        .from('profiles')
        .upsert(
            {
                id: userId,
                email: email || '',
                full_name: fullName || '',
            },
            {
                onConflict: 'id',
                ignoreDuplicates: true, // Don't update if exists
            }
        );

    if (error) {
        console.error('ensureProfile error:', error);
    } else {
        console.log('ensureProfile completed for:', userId);
    }
}

export async function getProfile(userId: string) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    return { profile: data, error };
}

export async function updateProfile(userId: string, updates: Record<string, any>) {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);
    return { data, error };
}


// =====================
// TASTE PROFILES
// =====================

export interface TasteProfileDB {
    id?: string;
    user_id: string;
    name: string;
    bitterness: number;
    acidity: number;
    body: number;
    flavour: number;
    roast_level: string;
    grind_type: string;
    created_at?: string;
}

export async function getTasteProfiles(userId: string) {
    const { data, error } = await supabase
        .from('taste_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    return { profiles: data, error };
}

export async function createTasteProfile(profile: TasteProfileDB) {
    const { data, error } = await supabase
        .from('taste_profiles')
        .insert(profile)
        .select()
        .single();
    return { profile: data, error };
}

export async function updateTasteProfile(id: string, updates: Partial<TasteProfileDB>) {
    const { data, error } = await supabase
        .from('taste_profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    return { profile: data, error };
}

export async function deleteTasteProfile(id: string) {
    const { error } = await supabase
        .from('taste_profiles')
        .delete()
        .eq('id', id);
    return { error };
}

// =====================
// ORDERS
// =====================

export interface OrderItem {
    taste_profile_id: string;
    taste_profile_name: string;
    quantity: number;
    unit_price: number;
}

export interface Order {
    user_id: string;
    total_amount: number;
    razorpay_payment_id?: string;
    shipping_address: Record<string, any>;
    items: OrderItem[];
}

export async function getOrders(userId: string) {
    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    return { orders: data, error };
}

// Helper function to make Supabase REST API calls with timeout
async function supabaseRestCall(
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    body?: any,
    accessToken?: string,
    timeoutMs = 15000
): Promise<{ data: any; error: any }> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Prefer': 'return=representation',
        };

        // Use access token if available, otherwise use anon key
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        } else {
            headers['Authorization'] = `Bearer ${supabaseKey}`;
        }

        const response = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Supabase REST error:', response.status, errorText);
            return { data: null, error: { message: errorText, status: response.status } };
        }

        const data = await response.json();
        return { data, error: null };
    } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
            return { data: null, error: { message: 'Request timed out', code: 'TIMEOUT' } };
        }
        return { data: null, error: err };
    }
}

// Get access token from localStorage
function getStoredAccessToken(): string | null {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const match = supabaseUrl.match(/\/\/([^.]+)\./);
    const projectRef = match ? match[1] : 'supabase';
    const storageKey = `sb-${projectRef}-auth-token`;

    const stored = localStorage.getItem(storageKey);
    if (stored) {
        try {
            const tokens = JSON.parse(stored);
            return tokens.access_token || null;
        } catch {
            return null;
        }
    }
    return null;
}

export async function createOrder(order: Order) {
    console.log('=== CREATE ORDER START (Direct REST API) ===');
    console.log('Order input:', JSON.stringify(order, null, 2));

    const accessToken = getStoredAccessToken();
    console.log('Using access token:', accessToken ? 'Yes' : 'No');

    // Create order payload
    const orderPayload: Record<string, any> = {
        total_amount: order.total_amount,
        razorpay_payment_id: order.razorpay_payment_id,
        shipping_address: order.shipping_address,
        status: 'pending',
    };

    // Include user_id if provided
    if (order.user_id && order.user_id.trim() !== '') {
        orderPayload.user_id = order.user_id;
        console.log('Order will be linked to user:', order.user_id);
    } else {
        console.log('Creating as guest order (no user_id)');
    }

    console.log('Order payload to insert:', JSON.stringify(orderPayload, null, 2));
    console.log('Calling REST API for orders insert...');

    // Use direct REST API call instead of Supabase client
    const { data: orderData, error: orderError } = await supabaseRestCall(
        'orders',
        'POST',
        orderPayload,
        accessToken ?? undefined
    );

    console.log('Order insert result:', { orderData, orderError });

    if (orderError) {
        console.error('Order creation failed with error:', orderError);
        return { order: null, error: orderError };
    }

    // Handle array response
    const createdOrder = Array.isArray(orderData) ? orderData[0] : orderData;

    // Create order items
    const orderItems = order.items.map(item => ({
        order_id: createdOrder.id,
        taste_profile_id: item.taste_profile_id,
        taste_profile_name: item.taste_profile_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
    }));

    console.log('Creating order items:', orderItems);

    const { error: itemsError } = await supabaseRestCall(
        'order_items',
        'POST',
        orderItems,
        accessToken ?? undefined
    );

    if (itemsError) {
        console.error('Order items creation failed:', itemsError);
        return { order: createdOrder, error: itemsError };
    }

    console.log('Order created successfully:', orderData);
    return { order: orderData, error: null };
}

// =====================
// REVIEWS
// =====================

export interface Review {
    id?: string;
    user_id: string;
    order_id?: string;
    rating: number;
    comment: string;
    created_at?: string;
}

export async function getReviews(limit = 10) {
    const { data, error } = await supabase
        .from('test_reviews')
        .select(`
            *,
            profiles (full_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
    return { reviews: data, error };
}

export async function createReview(review: Review) {
    const { data, error } = await supabase
        .from('test_reviews')
        .insert(review)
        .select()
        .single();
    return { review: data, error };
}

// Subscribe to realtime review updates
export function subscribeToReviews(callback: (reviews: any[]) => void) {
    const channel = supabase
        .channel('reviews-channel')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'test_reviews' },
            async () => {
                // Refetch reviews when any change happens
                const { reviews } = await getReviews();
                if (reviews) callback(reviews);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

export default supabase;
