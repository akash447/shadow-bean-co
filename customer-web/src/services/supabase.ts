import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: localStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});

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
    return { data, error };
}

export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
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

export async function createOrder(order: Order) {
    console.log('Creating order:', order);

    // Create order - user_id can be null for guest orders
    const orderPayload: Record<string, any> = {
        total_amount: order.total_amount,
        razorpay_payment_id: order.razorpay_payment_id,
        shipping_address: order.shipping_address,
        status: 'pending',
    };

    // Only include user_id if it's not empty
    if (order.user_id && order.user_id.trim() !== '') {
        orderPayload.user_id = order.user_id;
    }

    const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select()
        .single();

    console.log('Order insert result:', { orderData, orderError });

    if (orderError) {
        console.error('Order creation failed:', orderError);
        return { order: null, error: orderError };
    }

    // Create order items
    const orderItems = order.items.map(item => ({
        order_id: orderData.id,
        taste_profile_id: item.taste_profile_id,
        taste_profile_name: item.taste_profile_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
    }));

    console.log('Creating order items:', orderItems);

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

    if (itemsError) {
        console.error('Order items creation failed:', itemsError);
        return { order: orderData, error: itemsError };
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
