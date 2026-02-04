// Supabase client for Admin Panel (Data only)
// Auth is handled by AWS Amplify Cognito
import { createClient } from '@supabase/supabase-js';
import {
    signIn as cognitoSignIn,
    signOut as cognitoSignOut,
    getCurrentUser,
    fetchUserAttributes,
    fetchAuthSession,
} from 'aws-amplify/auth';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ===== AWS AMPLIFY AUTH FUNCTIONS =====

// Sign in with Cognito
export const signIn = async (email: string, password: string) => {
    try {
        const result = await cognitoSignIn({ username: email, password });
        if (result.isSignedIn) {
            const user = await getCurrentUser();
            const attributes = await fetchUserAttributes();
            const session = await fetchAuthSession();

            // Check if user is in Admin group
            const groups = (session.tokens?.accessToken?.payload?.['cognito:groups'] as string[]) || [];
            const isAdmin = groups.includes('Admin');

            return {
                data: {
                    user: {
                        id: user.userId,
                        email: attributes.email || email,
                        isAdmin
                    }
                },
                error: null
            };
        }
        return { data: null, error: { message: 'Sign in incomplete' } };
    } catch (err: any) {
        console.error('Cognito sign in error:', err);
        return { data: null, error: { message: err.message || 'Sign in failed' } };
    }
};

export const signOut = async () => {
    try {
        await cognitoSignOut();
        return { error: null };
    } catch (err: any) {
        return { error: { message: err.message || 'Sign out failed' } };
    }
};

// Get current session from Cognito
export const getSession = async () => {
    try {
        const user = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        const session = await fetchAuthSession();

        // Check if user is in Admin group
        const groups = (session.tokens?.accessToken?.payload?.['cognito:groups'] as string[]) || [];
        const isAdmin = groups.includes('Admin');

        if (!isAdmin) {
            return { session: null, error: null };
        }

        return {
            session: {
                user: {
                    id: user.userId,
                    email: attributes.email || '',
                    isAdmin
                }
            },
            error: null
        };
    } catch (err: any) {
        // Not logged in
        return { session: null, error: null };
    }
};

// Admin users check (via Cognito groups, not Supabase)
export const isAdminUser = async (_userId: string) => {
    try {
        const session = await fetchAuthSession();
        const groups = (session.tokens?.accessToken?.payload?.['cognito:groups'] as string[]) || [];
        return { isAdmin: groups.includes('Admin'), error: null };
    } catch {
        return { isAdmin: false, error: null };
    }
};

// Users management (using test_profiles for demo)
export const getUsers = async () => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
    return { data, error };
};

// Orders management (using test_orders for demo)
export const getOrders = async () => {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
    return { data, error };
};

export const updateOrderStatus = async (orderId: string, status: string) => {
    const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
    return { data, error };
};

// Cancel order with reason (for admin cancellation with notification)
export const cancelOrder = async (orderId: string, reason: string) => {
    const { data, error } = await supabase
        .from('orders')
        .update({
            status: 'cancelled',
            cancellation_reason: reason,
            cancelled_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

    // TODO: Trigger notification edge function here
    // Example: await supabase.functions.invoke('notify-customer', { body: { orderId, reason, type: 'cancelled' } });

    return { data, error };
};

// Pricing management
export const getPricing = async () => {
    const { data, error } = await supabase
        .from('pricing')
        .select('*')
        .order('created_at', { ascending: false });
    return { data, error };
};

export const updatePricing = async (id: string, updates: any) => {
    const { data, error } = await supabase
        .from('pricing')
        .update(updates)
        .eq('id', id);
    return { data, error };
};

export const createPricing = async (pricing: any) => {
    const { data, error } = await supabase
        .from('pricing')
        .insert(pricing);
    return { data, error };
};

// Terms & Conditions
export const getTerms = async () => {
    const { data, error } = await supabase
        .from('terms_and_conditions')
        .select('*')
        .order('version', { ascending: false })
        .limit(1);
    return { data: data?.[0], error };
};

export const updateTerms = async (content: string) => {
    const { data: existing } = await getTerms();
    const newVersion = existing ? existing.version + 1 : 1;

    const { data, error } = await supabase
        .from('terms_and_conditions')
        .insert({
            content,
            version: newVersion,
        });
    return { data, error };
};

// Reviews management (using test_reviews for demo)
export const getReviews = async () => {
    const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
    return { data, error };
};

export const deleteReview = async (id: string) => {
    const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);
    return { error };
};

// Dashboard stats (using test tables for demo)
export const getDashboardStats = async () => {
    const [users, orders, reviews, products] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('orders').select('id, total_amount, status', { count: 'exact' }),
        supabase.from('reviews').select('id', { count: 'exact' }),
        supabase.from('products').select('id', { count: 'exact' }),
    ]);

    const totalRevenue = orders.data?.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) || 0;
    const pendingOrders = orders.data?.filter(o => o.status === 'pending').length || 0;

    return {
        totalUsers: users.count || 0,
        totalOrders: orders.count || 0,
        totalRevenue,
        totalReviews: reviews.count || 0,
        pendingOrders,
        totalProducts: products.count || 0,
    };
};

// Products management
export const getProducts = async () => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
    return { data, error };
};

export const createProduct = async (product: {
    name: string;
    description?: string;
    base_price: number;
    sizes?: string[];
    image_url?: string;
    is_active?: boolean;
}) => {
    const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();
    return { data, error };
};

export const updateProduct = async (id: string, updates: any) => {
    const { data, error } = await supabase
        .from('products')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    return { data, error };
};

export const deleteProduct = async (id: string) => {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
    return { error };
};

/**
 * MEDIA SYSTEM (Dynamic Assets)
 */

// 1. Get All Assets
export const getAssets = async () => {
    const { data, error } = await supabase
        .from('app_assets')
        .select('*')
        .order('created_at', { ascending: false });
    return { data, error };
};

// 2. Upload Asset (Storage + DB Record)
export const uploadAsset = async (file: File, keyName: string) => {
    // 1. Upload to Storage
    // We'll use a public bucket named 'media'.
    // Ensure the bucket exists and policies allow insertion.
    const fileExt = file.name.split('.').pop();
    const fileName = `${keyName}.${fileExt}`;
    const filePath = `${fileName}`; // Could use folders if needed

    // CAUTION: This will overwrite if same name exists, which is good for Key-based updates.
    const { error: storageError } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
        });

    if (storageError) return { error: storageError };

    // 2. Get Public URL
    const { data: pubUrlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

    // 3. Upsert into DB (Key -> URL)
    const { data, error } = await supabase
        .from('app_assets')
        .upsert({
            key: keyName,
            url: pubUrlData.publicUrl,
            title: file.name, // Original filename as title initially
            type: 'image',
            updated_at: new Date().toISOString(),
        })
        .select()
        .single();

    return { data, error };
};

// 3. Delete Asset
export const deleteAsset = async (key: string) => {
    // 1. Get record to find storage path (if we need to delete file)
    // For now, just deleting the DB record is "soft" delete from app perspective,
    // but ideally we clean up storage too.

    // Simplification: Just delete DB record. The generic hook will fail to find it and fallback.
    const { error } = await supabase
        .from('app_assets')
        .delete()
        .eq('key', key);

    return { error };
};
// Real-time Subscriptions
export const subscribeToOrders = (callback: () => void) => {
    const channel = supabase
        .channel('public:orders')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders' },
            (payload) => {
                console.log('Real-time order update:', payload);
                callback();
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};
