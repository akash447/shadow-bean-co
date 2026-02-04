/**
 * AWS Amplify Authentication Service
 * Replaces Supabase Auth with Amazon Cognito via Amplify
 */

import {
    signUp as amplifySignUp,
    signIn as amplifySignIn,
    signOut as amplifySignOut,
    getCurrentUser,
    fetchUserAttributes,
    fetchAuthSession,
    resetPassword,
    confirmResetPassword,
    confirmSignUp,
    type SignUpInput,
} from 'aws-amplify/auth';

// =====================
// AUTH FUNCTIONS
// =====================

export interface AuthUser {
    id: string;
    email: string;
    fullName?: string;
    isAdmin?: boolean;
}

export async function signUp(email: string, password: string, fullName: string) {
    try {
        const signUpInput: SignUpInput = {
            username: email,
            password,
            options: {
                userAttributes: {
                    email,
                    name: fullName,
                },
            },
        };
        const result = await amplifySignUp(signUpInput);
        return {
            data: {
                user: { id: result.userId, email },
                needsConfirmation: !result.isSignUpComplete
            },
            error: null
        };
    } catch (err: any) {
        console.error('Sign up error:', err);
        return { data: null, error: { message: err.message || 'Sign up failed' } };
    }
}

export async function confirmSignUpCode(email: string, code: string) {
    try {
        await confirmSignUp({ username: email, confirmationCode: code });
        return { error: null };
    } catch (err: any) {
        return { error: { message: err.message || 'Confirmation failed' } };
    }
}

export async function signIn(email: string, password: string) {
    try {
        const result = await amplifySignIn({ username: email, password });
        if (result.isSignedIn) {
            const user = await getAuthUser();
            return { data: { user }, error: null };
        }
        return { data: { nextStep: result.nextStep }, error: null };
    } catch (err: any) {
        console.error('Sign in error:', err);
        return { data: null, error: { message: err.message || 'Sign in failed' } };
    }
}

export async function signOut() {
    try {
        await amplifySignOut();
        return { error: null };
    } catch (err: any) {
        return { error: { message: err.message || 'Sign out failed' } };
    }
}

export async function requestPasswordReset(email: string) {
    try {
        await resetPassword({ username: email });
        return { data: { message: 'Password reset code sent' }, error: null };
    } catch (err: any) {
        return { data: null, error: { message: err.message || 'Password reset failed' } };
    }
}

export async function confirmPasswordReset(email: string, code: string, newPassword: string) {
    try {
        await confirmResetPassword({ username: email, confirmationCode: code, newPassword });
        return { error: null };
    } catch (err: any) {
        return { error: { message: err.message || 'Password reset confirmation failed' } };
    }
}

export async function getAuthUser(): Promise<AuthUser | null> {
    try {
        const user = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        const session = await fetchAuthSession();

        // Check if user is in Admin group
        const groups = (session.tokens?.accessToken?.payload?.['cognito:groups'] as string[]) || [];
        const isAdmin = groups.includes('Admin');

        return {
            id: user.userId,
            email: attributes.email || '',
            fullName: attributes.name || '',
            isAdmin,
        };
    } catch {
        return null;
    }
}

export async function getSession() {
    try {
        const session = await fetchAuthSession();
        return session.tokens ? session : null;
    } catch {
        return null;
    }
}

// =====================
// PROFILE FUNCTIONS (stored in DynamoDB)
// =====================

export interface UserProfile {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    phone?: string;
}

// These will be implemented when DynamoDB API is set up
export async function getProfile(userId: string): Promise<{ profile: UserProfile | null; error: any }> {
    // TODO: Fetch from DynamoDB shadowbeanco-profiles table
    console.log('getProfile - DynamoDB integration pending for:', userId);
    return { profile: null, error: null };
}

export async function updateProfile(userId: string, updates: Partial<UserProfile>) {
    // TODO: Update in DynamoDB shadowbeanco-profiles table
    console.log('updateProfile - DynamoDB integration pending:', userId, updates);
    return { data: null, error: null };
}

export async function ensureProfile(_userId: string, _email?: string, _fullName?: string) {
    // TODO: Upsert in DynamoDB shadowbeanco-profiles table
    console.log('ensureProfile - DynamoDB integration pending');
}

// =====================
// ORDERS (DynamoDB)
// =====================

export interface OrderItem {
    taste_profile_id: string;
    taste_profile_name: string;
    quantity: number;
    unit_price: number;
}

export interface Order {
    id?: string;
    user_id: string;
    total_amount: number;
    razorpay_payment_id?: string;
    shipping_address: Record<string, any>;
    items: OrderItem[];
    status?: string;
    created_at?: string;
}

export async function getOrders(userId: string) {
    // TODO: Fetch from DynamoDB shadowbeanco-orders table
    console.log('getOrders - DynamoDB integration pending for:', userId);
    return { orders: [], error: null };
}

export async function createOrder(order: Order): Promise<{ order: Order | null; error: any }> {
    // TODO: Insert into DynamoDB shadowbeanco-orders table
    console.log('createOrder - DynamoDB integration pending:', order);
    return { order: null, error: null };
}

// =====================
// TASTE PROFILES (DynamoDB)
// =====================

export interface TasteProfile {
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
    // TODO: Fetch from DynamoDB shadowbeanco-taste-profiles table
    console.log('getTasteProfiles - DynamoDB integration pending for:', userId);
    return { profiles: [], error: null };
}

export async function createTasteProfile(profile: TasteProfile) {
    // TODO: Insert into DynamoDB
    console.log('createTasteProfile - DynamoDB integration pending:', profile);
    return { profile: null, error: null };
}

export async function updateTasteProfile(id: string, updates: Partial<TasteProfile>) {
    // TODO: Update in DynamoDB
    console.log('updateTasteProfile - DynamoDB integration pending:', id, updates);
    return { profile: null, error: null };
}

export async function deleteTasteProfile(id: string) {
    // TODO: Delete from DynamoDB
    console.log('deleteTasteProfile - DynamoDB integration pending:', id);
    return { error: null };
}

// =====================
// REVIEWS (DynamoDB)
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
    // TODO: Fetch from DynamoDB shadowbeanco-reviews table
    console.log('getReviews - DynamoDB integration pending, limit:', limit);
    return { reviews: [], error: null };
}

export async function createReview(review: Review) {
    // TODO: Insert into DynamoDB
    console.log('createReview - DynamoDB integration pending:', review);
    return { review: null, error: null };
}

export function subscribeToReviews(_callback: (reviews: any[]) => void) {
    // Note: DynamoDB doesn't have real-time subscriptions like Supabase
    // Would need to implement with AppSync or polling
    console.log('subscribeToReviews - Real-time not available with DynamoDB');
    return () => { };
}
