/**
 * Shadow Bean Co - API Client
 * ==============================================
 * Unified data layer backed by AWS Lambda + RDS PostgreSQL.
 * All data flows through API Gateway -> Lambda -> RDS PostgreSQL.
 *
 * All requests are authenticated via Cognito JWT tokens
 * which are automatically attached by the interceptor.
 * ==============================================
 */

import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

// API base URL - points to API Gateway / Lambda
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.shadowbeanco.net';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach Cognito JWT token to every request
// Strategy: try Amplify first, fall back to our local auth cache
api.interceptors.request.use(async (config) => {
    // 1. Try Amplify's session (works for email/password + fresh OAuth)
    try {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            return config;
        }
    } catch {
        // Amplify session failed — try fallback
    }

    // 2. Fallback: read from our local auth cache (for OAuth sessions where Amplify lost track)
    try {
        const cached = JSON.parse(localStorage.getItem('shadow_bean_auth_cache') || '');
        if (cached?.idToken) {
            config.headers.Authorization = `Bearer ${cached.idToken}`;
        }
    } catch {
        // No cached token available
    }

    return config;
});

// Handle 401 responses - just log, don't redirect (AuthContext handles auth state)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn('API returned 401 - user may need to re-authenticate');
        }
        return Promise.reject(error);
    }
);

// ==============================================
// PROFILES
// ==============================================

export interface UserProfile {
    id: string;
    cognito_sub: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    phone?: string;
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
    const { data } = await api.get(`/profiles/${userId}`);
    return data;
}

export async function updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data } = await api.put(`/profiles/${userId}`, updates);
    return data;
}

export async function ensureProfile(cognitoSub: string, email: string, fullName?: string): Promise<UserProfile> {
    const { data } = await api.post('/profiles/ensure', { cognito_sub: cognitoSub, email, full_name: fullName });
    return data;
}

// ==============================================
// PRODUCTS
// ==============================================

export interface Product {
    id: string;
    name: string;
    description?: string;
    base_price: number;
    sizes?: string[];
    image_url?: string;
    is_active: boolean;
    created_at: string;
}

export async function getProducts(): Promise<Product[]> {
    const { data } = await api.get('/products');
    return data;
}

export async function getProduct(id: string): Promise<Product> {
    const { data } = await api.get(`/products/${id}`);
    return data;
}

// ==============================================
// TASTE PROFILES
// ==============================================

export interface TasteProfile {
    id: string;
    user_id: string;
    name: string;
    bitterness: number;
    acidity: number;
    body: number;
    flavour: number;
    roast_level: string;
    grind_type: string;
    created_at: string;
}

export async function getTasteProfiles(userId: string): Promise<TasteProfile[]> {
    const { data } = await api.get(`/taste-profiles?user_id=${userId}`);
    return data;
}

export async function createTasteProfile(profile: Omit<TasteProfile, 'id' | 'created_at'>): Promise<TasteProfile> {
    const { data } = await api.post('/taste-profiles', profile);
    return data;
}

export async function updateTasteProfile(id: string, updates: Partial<TasteProfile>): Promise<TasteProfile> {
    const { data } = await api.put(`/taste-profiles/${id}`, updates);
    return data;
}

export async function deleteTasteProfile(id: string): Promise<void> {
    await api.delete(`/taste-profiles/${id}`);
}

// ==============================================
// ADDRESSES
// ==============================================

export interface Address {
    id: string;
    user_id: string;
    label: string;
    full_name: string;
    phone: string;
    address_line: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    is_default: boolean;
}

export async function getAddresses(userId: string): Promise<Address[]> {
    const { data } = await api.get(`/addresses?user_id=${userId}`);
    return data;
}

export async function createAddress(address: Omit<Address, 'id'>): Promise<Address> {
    const { data } = await api.post('/addresses', address);
    return data;
}

export async function updateAddress(id: string, updates: Partial<Address>): Promise<Address> {
    const { data } = await api.put(`/addresses/${id}`, updates);
    return data;
}

export async function deleteAddress(id: string): Promise<void> {
    await api.delete(`/addresses/${id}`);
}

// ==============================================
// ORDERS
// ==============================================

export interface OrderItem {
    id?: string;
    taste_profile_id?: string;
    taste_profile_name: string;
    quantity: number;
    unit_price: number;
    size?: string;
}

export interface Order {
    id: string;
    user_id: string;
    status: string;
    total_amount: number;
    razorpay_payment_id?: string;
    shipping_address?: Record<string, any>;
    shiprocket_order_id?: string;
    shiprocket_shipment_id?: string;
    tracking_url?: string;
    cancellation_reason?: string;
    cancelled_at?: string;
    order_items?: OrderItem[];
    created_at: string;
}

export async function getOrders(userId: string): Promise<Order[]> {
    const { data } = await api.get(`/orders?user_id=${userId}`);
    return data;
}

export async function getOrder(orderId: string): Promise<Order> {
    const { data } = await api.get(`/orders/${orderId}`);
    return data;
}

export async function createOrder(order: {
    user_id: string;
    total_amount: number;
    razorpay_payment_id: string;
    shipping_address: Record<string, any>;
    items: OrderItem[];
}): Promise<Order> {
    const { data } = await api.post('/orders', order);
    return data;
}

// ==============================================
// REVIEWS
// ==============================================

export interface Review {
    id: string;
    user_id: string;
    user_name?: string;
    product_name?: string;
    order_id?: string;
    rating: number;
    comment: string;
    created_at: string;
}

export async function getReviews(limit = 10): Promise<Review[]> {
    const { data } = await api.get(`/reviews?limit=${limit}`);
    return data;
}

export async function createReview(review: {
    user_id: string;
    order_id?: string;
    rating: number;
    comment: string;
}): Promise<Review> {
    const { data } = await api.post('/reviews', review);
    return data;
}

// ==============================================
// PRICING
// ==============================================

export interface Pricing {
    id: string;
    name?: string;
    description?: string;
    base_price?: number;
    size_100g?: number;
    size_250g?: number;
    size_500g?: number;
    size_1kg?: number;
    discount_pct?: number;
    is_active: boolean;
}

export async function getActivePricing(): Promise<Pricing | null> {
    const { data } = await api.get('/pricing/active');
    return data;
}

// ==============================================
// TERMS & CONDITIONS
// ==============================================

export interface Terms {
    id: string;
    content: string;
    version: number;
    is_active: boolean;
}

export async function getActiveTerms(): Promise<Terms | null> {
    const { data } = await api.get('/terms/active');
    return data;
}

// ==============================================
// APP ASSETS (Media)
// ==============================================

export interface AppAsset {
    id: string;
    key: string;
    url: string;
    title?: string;
    type: string;
    category?: string;
}

export async function getAssets(): Promise<AppAsset[]> {
    const { data } = await api.get('/assets');
    return data;
}

export async function getAssetByKey(key: string): Promise<AppAsset | null> {
    const { data } = await api.get(`/assets/${key}`);
    return data;
}

// ==============================================
// OFFERS / COUPONS
// ==============================================

export async function validateOffer(code: string, cartTotal: number): Promise<{ valid: boolean; type?: string; value?: number; reason?: string }> {
    const { data } = await api.post('/offers/validate', { code, cart_total: cartTotal });
    return data;
}

export default api;

