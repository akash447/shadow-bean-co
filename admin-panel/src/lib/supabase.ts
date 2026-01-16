// Supabase client for Admin Panel
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yyqoagncaxzpxodwnuax.supabase.co';
const supabaseAnonKey = 'sb_publishable_eyQzRNo7TbvJP1KNGJA-Cg_awO9iGmP';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth functions
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

export const getSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
};

// Admin users check
export const isAdminUser = async (userId: string) => {
    const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', userId)
        .single();
    return { isAdmin: !!data, error };
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
