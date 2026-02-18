/**
 * Shadow Bean Co - Admin API Client
 * ==============================================
 * Admin panel data layer via AWS Lambda + RDS PostgreSQL.
 * Auth remains via AWS Amplify Cognito.
 * Data flows through API Gateway -> Lambda -> RDS PostgreSQL.
 * ==============================================
 */

import axios from 'axios';
import {
    signIn as cognitoSignIn,
    signOut as cognitoSignOut,
    getCurrentUser,
    fetchUserAttributes,
    fetchAuthSession,
} from 'aws-amplify/auth';

// Cognito OAuth constants
const COGNITO_DOMAIN = 'shadowbeanco.auth.ap-south-1.amazoncognito.com';
const CLIENT_ID = '42vpa5vousikig0c4ohq2vmkge';

// ==============================================
// PKCE helpers for manual Google OAuth
// ==============================================

function generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<any> {
    const codeVerifier = sessionStorage.getItem('oauth_pkce_verifier');
    if (!codeVerifier) throw new Error('Missing PKCE verifier');

    const response = await fetch(`https://${COGNITO_DOMAIN}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: CLIENT_ID,
            redirect_uri: redirectUri,
            code,
            code_verifier: codeVerifier,
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Token exchange failed: ${err}`);
    }

    return response.json();
}

function decodeJwtPayload(token: string): any {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
}

function storeTokensForAmplify(tokens: { id_token: string; access_token: string; refresh_token?: string }) {
    const idPayload = decodeJwtPayload(tokens.id_token);
    const username = idPayload['cognito:username'] || idPayload.sub;

    const prefix = `CognitoIdentityServiceProvider.${CLIENT_ID}`;
    localStorage.setItem(`${prefix}.LastAuthUser`, username);
    localStorage.setItem(`${prefix}.${username}.idToken`, tokens.id_token);
    localStorage.setItem(`${prefix}.${username}.accessToken`, tokens.access_token);
    if (tokens.refresh_token) {
        localStorage.setItem(`${prefix}.${username}.refreshToken`, tokens.refresh_token);
    }
    localStorage.setItem(`${prefix}.${username}.clockDrift`, '0');
}

// ==============================================
// API CLIENT
// ==============================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.shadowbeanco.net';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

// Attach Cognito JWT to every request
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

// Handle 401 responses - just log, don't redirect (App.tsx handles auth state)
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
// AUTH FUNCTIONS (Cognito - unchanged)
// ==============================================

// Flag to prevent Hub signedOut event from clearing state during Google redirect
export let isGoogleRedirecting = false;

export const signIn = async (email: string, password: string) => {
    const doSignIn = async () => {
        const result = await cognitoSignIn({
            username: email,
            password,
            options: { authFlowType: 'USER_SRP_AUTH' },
        });
        if (result.isSignedIn) {
            const user = await getCurrentUser();
            const attributes = await fetchUserAttributes();

            // Check admin status via API (checks admin_users table + master admin email)
            const { data: authCheck } = await api.post('/admin/auth/check');
            const adminCheck = authCheck?.isAdmin || false;

            return {
                data: {
                    user: {
                        id: user.userId,
                        email: attributes.email || email,
                        isAdmin: adminCheck,
                        isMaster: authCheck?.isMaster || false,
                    }
                },
                error: null
            };
        }

        const nextStep = result.nextStep?.signInStep;
        if (nextStep === 'CONFIRM_SIGN_UP') {
            return { data: null, error: { message: 'Please confirm your email address first. Check your inbox for the confirmation code.' } };
        } else if (nextStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
            return { data: null, error: { message: 'You need to set a new password. This is required for first-time login.' } };
        } else if (nextStep === 'CONFIRM_SIGN_IN_WITH_TOTP_CODE') {
            return { data: null, error: { message: 'Please enter your MFA code.' } };
        } else if (nextStep === 'RESET_PASSWORD') {
            return { data: null, error: { message: 'Password reset required. Please reset your password.' } };
        }

        return { data: null, error: { message: `Sign in incomplete. Next step: ${nextStep || 'unknown'}` } };
    };

    try {
        return await doSignIn();
    } catch (err: any) {
        // If already signed in, sign out first then retry
        if (err.name === 'UserAlreadyAuthenticatedException') {
            try {
                await cognitoSignOut();
                return await doSignIn();
            } catch (retryErr: any) {
                console.error('Cognito sign in retry error:', retryErr);
                return { data: null, error: { message: retryErr.message || 'Sign in failed' } };
            }
        }
        console.error('Cognito sign in error:', err);
        return { data: null, error: { message: err.message || 'Sign in failed' } };
    }
};

export const signInWithGoogle = async () => {
    isGoogleRedirecting = true;

    // Generate PKCE
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Store verifier for callback
    sessionStorage.setItem('oauth_pkce_verifier', codeVerifier);

    // Redirect directly to Cognito with Google identity provider
    const redirectUri = encodeURIComponent(window.location.origin);
    const url = `https://${COGNITO_DOMAIN}/oauth2/authorize?` +
        `client_id=${CLIENT_ID}&` +
        `response_type=code&` +
        `scope=openid+email+profile&` +
        `redirect_uri=${redirectUri}&` +
        `identity_provider=Google&` +
        `code_challenge=${codeChallenge}&` +
        `code_challenge_method=S256`;

    window.location.href = url;
};

// Handle OAuth callback: exchange code for tokens, store them, then check session
export const handleOAuthCallback = async (): Promise<any> => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (!code) return null;

    try {
        console.log('Admin OAuth callback: exchanging code for tokens');
        const tokens = await exchangeCodeForTokens(code, window.location.origin);
        console.log('Admin OAuth callback: tokens received, storing for Amplify');
        storeTokensForAmplify(tokens);

        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
        // Clean PKCE state
        sessionStorage.removeItem('oauth_pkce_verifier');

        // Now check session (Amplify should find the tokens in localStorage)
        const { session } = await getSession();
        return session?.user || null;
    } catch (err) {
        console.error('Admin OAuth callback error:', err);
        window.history.replaceState({}, '', window.location.pathname);
        sessionStorage.removeItem('oauth_pkce_verifier');
        return null;
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

export const getSession = async () => {
    try {
        const user = await getCurrentUser();
        const attributes = await fetchUserAttributes();

        // Check admin status via API (checks admin_users table + master admin email)
        const { data: authCheck } = await api.post('/admin/auth/check');
        const adminCheck = authCheck?.isAdmin || false;

        if (!adminCheck) {
            return { session: null, error: null };
        }

        return {
            session: {
                user: {
                    id: user.userId,
                    email: attributes.email || '',
                    isAdmin: adminCheck,
                    isMaster: authCheck?.isMaster || false,
                }
            },
            error: null
        };
    } catch {
        return { session: null, error: null };
    }
};

export const isAdminUser = async (_userId: string) => {
    try {
        const { data: authCheck } = await api.post('/admin/auth/check');
        return { isAdmin: authCheck?.isAdmin || false, error: null };
    } catch {
        return { isAdmin: false, error: null };
    }
};

// ==============================================
// DATA FUNCTIONS (via API -> RDS)
// ==============================================

// Users / Profiles
export const getUsers = async () => {
    try {
        const { data } = await api.get('/admin/profiles');
        return { data, error: null };
    } catch (err: any) {
        return { data: null, error: { message: err.message } };
    }
};

// Orders
export const getOrders = async () => {
    try {
        const { data } = await api.get('/admin/orders');
        return { data, error: null };
    } catch (err: any) {
        return { data: null, error: { message: err.message } };
    }
};

export const updateOrderStatus = async (orderId: string, status: string) => {
    try {
        const { data } = await api.put(`/admin/orders/${orderId}/status`, { status });
        return { data, error: null };
    } catch (err: any) {
        return { data: null, error: { message: err.message } };
    }
};

export const cancelOrder = async (orderId: string, reason: string) => {
    try {
        const { data } = await api.put(`/admin/orders/${orderId}/cancel`, { reason });
        return { data, error: null };
    } catch (err: any) {
        return { data: null, error: { message: err.message } };
    }
};

// Pricing
export const getPricing = async () => {
    try {
        const { data } = await api.get('/admin/pricing');
        return { data, error: null };
    } catch (err: any) {
        return { data: null, error: { message: err.message } };
    }
};

export const updatePricing = async (id: string, updates: any) => {
    try {
        const { data } = await api.put(`/admin/pricing/${id}`, updates);
        return { data, error: null };
    } catch (err: any) {
        return { data: null, error: { message: err.message } };
    }
};

export const createPricing = async (pricing: any) => {
    try {
        const { data } = await api.post('/admin/pricing', pricing);
        return { data, error: null };
    } catch (err: any) {
        return { data: null, error: { message: err.message } };
    }
};

// Terms & Conditions
export const getTerms = async () => {
    try {
        const { data } = await api.get('/admin/terms');
        return { data, error: null };
    } catch (err: any) {
        return { data: null, error: { message: err.message } };
    }
};

export const updateTerms = async (content: string) => {
    try {
        const { data } = await api.post('/admin/terms', { content });
        return { data, error: null };
    } catch (err: any) {
        return { data: null, error: { message: err.message } };
    }
};

// Reviews
export const getReviews = async () => {
    try {
        const { data } = await api.get('/admin/reviews');
        return { data, error: null };
    } catch (err: any) {
        return { data: null, error: { message: err.message } };
    }
};

export const deleteReview = async (id: string) => {
    try {
        await api.delete(`/admin/reviews/${id}`);
        return { error: null };
    } catch (err: any) {
        return { error: { message: err.message } };
    }
};

// Dashboard Stats
export const getDashboardStats = async () => {
    try {
        const { data } = await api.get('/admin/dashboard/stats');
        return data;
    } catch (err: any) {
        console.error('Dashboard stats error:', err);
        return {
            totalUsers: 0,
            totalOrders: 0,
            totalRevenue: 0,
            totalReviews: 0,
            pendingOrders: 0,
            totalProducts: 0,
        };
    }
};

// Products
export const getProducts = async () => {
    try {
        const { data } = await api.get('/admin/products');
        return { data, error: null };
    } catch (err: any) {
        return { data: null, error: { message: err.message } };
    }
};

export const createProduct = async (product: {
    name: string;
    description?: string;
    base_price: number;
    sizes?: string[];
    image_url?: string;
    is_active?: boolean;
}) => {
    try {
        const { data } = await api.post('/admin/products', product);
        return { data, error: null };
    } catch (err: any) {
        return { data: null, error: { message: err.message } };
    }
};

export const updateProduct = async (id: string, updates: any) => {
    try {
        const { data } = await api.put(`/admin/products/${id}`, updates);
        return { data, error: null };
    } catch (err: any) {
        return { data: null, error: { message: err.message } };
    }
};

export const deleteProduct = async (id: string) => {
    try {
        await api.delete(`/admin/products/${id}`);
        return { error: null };
    } catch (err: any) {
        return { error: { message: err.message } };
    }
};

// Media / Assets
export const getAssets = async () => {
    try {
        const { data } = await api.get('/admin/assets');
        return { data, error: null };
    } catch (err: any) {
        return { data: null, error: { message: err.message } };
    }
};

export const getUploadUrl = async (filename: string, contentType: string) => {
    try {
        const { data } = await api.post('/admin/assets/upload', { filename, contentType });
        return { data, error: null };
    } catch (err: any) {
        return { data: null, error: { message: err.message } };
    }
};

export const uploadToS3 = async (uploadUrl: string, file: File) => {
    try {
        await axios.put(uploadUrl, file, {
            headers: { 'Content-Type': file.type },
        });
        return { error: null };
    } catch (err: any) {
        return { error: { message: err.message } };
    }
};

export const createAsset = async (assetData: {
    key: string;
    url: string;
    title: string;
    type: string;
    category: string;
}) => {
    try {
        const { data } = await api.post('/admin/assets', assetData);
        return { data, error: null };
    } catch (err: any) {
        return { data: null, error: { message: err.message } };
    }
};

export const updateAsset = async (key: string, updates: {
    title?: string;
    category?: string;
}) => {
    try {
        const { data } = await api.put(`/admin/assets/${encodeURIComponent(key)}`, updates);
        return { data, error: null };
    } catch (err: any) {
        return { data: null, error: { message: err.message } };
    }
};

export const deleteAsset = async (key: string) => {
    try {
        await api.delete(`/admin/assets/${encodeURIComponent(key)}`);
        return { error: null };
    } catch (err: any) {
        return { error: { message: err.message } };
    }
};

// Offers / Coupons
export const getOffers = async () => {
    try {
        const { data } = await api.get('/admin/offers');
        return { data, error: null };
    } catch (err: any) {
        return { data: null, error: { message: err.message } };
    }
};

export const createOffer = async (offer: any) => {
    try {
        const { data } = await api.post('/admin/offers', offer);
        return { data, error: null };
    } catch (err: any) {
        return { data: null, error: { message: err.message } };
    }
};

export const updateOffer = async (id: string, updates: any) => {
    try {
        const { data } = await api.put(`/admin/offers/${id}`, updates);
        return { data, error: null };
    } catch (err: any) {
        return { data: null, error: { message: err.message } };
    }
};

export const deleteOffer = async (id: string) => {
    try {
        await api.delete(`/admin/offers/${id}`);
        return { error: null };
    } catch (err: any) {
        return { error: { message: err.message } };
    }
};

// Real-time order subscription (polling every 10s for responsive admin experience)
export const subscribeToOrders = (callback: () => void) => {
    const interval = setInterval(callback, 10000);
    return () => clearInterval(interval);
};
