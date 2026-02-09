/**
 * Shadow Bean Co - Mobile App Auth (AWS Cognito)
 * ==============================================
 * AWS Amplify v6 Cognito integration for React Native / Expo.
 * ==============================================
 */

import { Platform } from 'react-native';
import {
    signUp as amplifySignUp,
    signIn as amplifySignIn,
    signOut as amplifySignOut,
    getCurrentUser as amplifyGetCurrentUser,
    fetchUserAttributes,
    fetchAuthSession,
    resetPassword as amplifyResetPassword,
    confirmResetPassword as amplifyConfirmResetPassword,
    confirmSignUp as amplifyConfirmSignUp,
} from 'aws-amplify/auth';

// ==============================================
// AUTH FUNCTIONS
// ==============================================

export const signUp = async (email: string, password: string, fullName: string) => {
    try {
        const result = await amplifySignUp({
            username: email,
            password,
            options: {
                userAttributes: {
                    email,
                    name: fullName,
                },
            },
        });

        return {
            data: {
                user: result.userId ? { id: result.userId } : null,
                needsConfirmation: !result.isSignUpComplete,
            },
            error: null,
        };
    } catch (err: any) {
        return { data: null, error: { message: err.message || 'Sign up failed' } };
    }
};

export const confirmSignUpCode = async (email: string, code: string) => {
    try {
        await amplifyConfirmSignUp({ username: email, confirmationCode: code });
        return { error: null };
    } catch (err: any) {
        return { error: { message: err.message || 'Confirmation failed' } };
    }
};

export const signIn = async (email: string, password: string) => {
    try {
        const result = await amplifySignIn({ username: email, password });

        if (result.isSignedIn) {
            const user = await amplifyGetCurrentUser();
            const attributes = await fetchUserAttributes();

            return {
                data: {
                    user: {
                        id: user.userId,
                        email: attributes.email || email,
                    },
                    session: { access_token: 'cognito-session' },
                },
                error: null,
            };
        }

        const nextStep = result.nextStep?.signInStep;
        if (nextStep === 'CONFIRM_SIGN_UP') {
            return {
                data: null,
                error: { message: 'Please confirm your email address first.' },
            };
        }

        return {
            data: null,
            error: { message: `Sign in requires: ${nextStep || 'unknown step'}` },
        };
    } catch (err: any) {
        return { data: null, error: { message: err.message || 'Sign in failed' } };
    }
};

export const signOut = async () => {
    try {
        await amplifySignOut();
        return { error: null };
    } catch (err: any) {
        return { error: { message: err.message || 'Sign out failed' } };
    }
};

export const resetPassword = async (email: string) => {
    try {
        await amplifyResetPassword({ username: email });
        return { data: { message: 'Reset code sent to your email' }, error: null };
    } catch (err: any) {
        return { data: null, error: { message: err.message || 'Password reset failed' } };
    }
};

export const confirmPasswordReset = async (email: string, code: string, newPassword: string) => {
    try {
        await amplifyConfirmResetPassword({
            username: email,
            confirmationCode: code,
            newPassword,
        });
        return { error: null };
    } catch (err: any) {
        return { error: { message: err.message || 'Password reset confirmation failed' } };
    }
};

export const getCurrentUser = async () => {
    try {
        const user = await amplifyGetCurrentUser();
        const attributes = await fetchUserAttributes();
        return {
            user: {
                id: user.userId,
                email: attributes.email || '',
                user_metadata: {
                    full_name: attributes.name || '',
                },
            },
            error: null,
        };
    } catch {
        return { user: null, error: null };
    }
};

export const getSession = async () => {
    try {
        const session = await fetchAuthSession();
        if (session.tokens) {
            return {
                session: {
                    access_token: session.tokens.accessToken?.toString(),
                    user: await getCurrentUser().then(r => r.user),
                },
                error: null,
            };
        }
        return { session: null, error: null };
    } catch {
        return { session: null, error: null };
    }
};

// ==============================================
// AUTH STATE LISTENER
// ==============================================

type AuthCallback = (event: string, session: any) => void;

export const onAuthStateChange = (callback: AuthCallback) => {
    // Amplify Hub is used in the app layout (_layout.tsx)
    // Compatibility shim for auth state change listeners
    let cancelled = false;

    // Check initial state
    (async () => {
        try {
            const { session } = await getSession();
            if (!cancelled) {
                callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
            }
        } catch {
            if (!cancelled) {
                callback('SIGNED_OUT', null);
            }
        }
    })();

    return {
        data: {
            subscription: {
                unsubscribe: () => { cancelled = true; },
            },
        },
    };
};

// ==============================================
// DATA FUNCTIONS (via API -> RDS)
// API -> RDS PostgreSQL data queries.
// ==============================================

import axios from 'axios';

const API_BASE_URL = Platform.OS === 'web'
    ? (typeof window !== 'undefined' && (window as any).__ENV__?.API_URL) || 'https://api.shadowbeanco.net'
    : 'https://api.shadowbeanco.net';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token
api.interceptors.request.use(async (config) => {
    try {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch {
        // Not authenticated
    }
    return config;
});

// Profile
export const getProfile = async (userId: string) => {
    try {
        const { data } = await api.get(`/profiles/${userId}`);
        return { profile: data, error: null };
    } catch {
        return { profile: null, error: null };
    }
};

export const updateProfile = async (userId: string, updates: Record<string, any>) => {
    try {
        const { data } = await api.put(`/profiles/${userId}`, updates);
        return { profile: data, error: null };
    } catch (err: any) {
        return { profile: null, error: { message: err.message } };
    }
};

// Taste Profiles
export const getTasteProfiles = async (userId: string) => {
    try {
        const { data } = await api.get(`/taste-profiles?user_id=${userId}`);
        return { profiles: data, error: null };
    } catch {
        return { profiles: [], error: null };
    }
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
    try {
        const { data } = await api.post('/taste-profiles', {
            user_id: profile.userId,
            name: profile.name,
            bitterness: profile.bitterness,
            acidity: profile.acidity,
            body: profile.body,
            flavour: profile.flavour,
            roast_level: profile.roastLevel,
            grind_type: profile.grindType,
        });
        return { profile: data, error: null };
    } catch (err: any) {
        return { profile: null, error: { message: err.message } };
    }
};

// Orders
export const getOrders = async (userId: string) => {
    try {
        const { data } = await api.get(`/orders?user_id=${userId}`);
        return { orders: data, error: null };
    } catch {
        return { orders: [], error: null };
    }
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
    try {
        const { data } = await api.post('/orders', {
            user_id: order.userId,
            total_amount: order.totalAmount,
            razorpay_payment_id: order.razorpayPaymentId,
            shipping_address: order.shippingAddress,
            items: order.items.map(i => ({
                taste_profile_id: i.tasteProfileId,
                taste_profile_name: i.tasteProfileName,
                quantity: i.quantity,
                unit_price: i.unitPrice,
            })),
        });
        return { order: data, error: null };
    } catch (err: any) {
        return { order: null, error: { message: err.message } };
    }
};

export const updateOrderTracking = async (
    orderId: string,
    shiprocketOrderId: string,
    shiprocketShipmentId: string
) => {
    try {
        const { data } = await api.put(`/orders/${orderId}/tracking`, {
            shiprocket_order_id: shiprocketOrderId,
            shiprocket_shipment_id: shiprocketShipmentId,
        });
        return { order: data, error: null };
    } catch (err: any) {
        return { order: null, error: { message: err.message } };
    }
};

// Reviews
export const getReviews = async (limit = 10) => {
    try {
        const { data } = await api.get(`/reviews?limit=${limit}`);
        const reviews = data.map((r: any) => ({
            ...r,
            profiles: { full_name: r.user_name },
        }));
        return { reviews, error: null };
    } catch {
        return { reviews: [], error: null };
    }
};

export const createReview = async (review: {
    userId: string;
    orderId: string;
    rating: number;
    comment: string;
}) => {
    try {
        const { data } = await api.post('/reviews', {
            user_id: review.userId,
            order_id: review.orderId,
            rating: review.rating,
            comment: review.comment,
        });
        return { review: data, error: null };
    } catch (err: any) {
        return { review: null, error: { message: err.message } };
    }
};

// Pricing
export const getActivePricing = async () => {
    try {
        const { data } = await api.get('/pricing/active');
        return { pricing: data, error: null };
    } catch {
        return { pricing: null, error: null };
    }
};

// Terms & Conditions
export const getActiveTerms = async () => {
    try {
        const { data } = await api.get('/terms/active');
        return { terms: data, error: null };
    } catch {
        return { terms: null, error: null };
    }
};
