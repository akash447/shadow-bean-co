import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { Hub } from 'aws-amplify/utils';
import {
    signIn as amplifySignIn,
    signUp as amplifySignUp,
    signOut as amplifySignOut,
    getCurrentUser,
    fetchUserAttributes,
    fetchAuthSession,
    confirmSignUp,
} from 'aws-amplify/auth';
import { ensureProfile } from '../services/api';

// Cognito OAuth constants
const COGNITO_DOMAIN = 'shadowbeanco.auth.ap-south-1.amazoncognito.com';
const CLIENT_ID = '42vpa5vousikig0c4ohq2vmkge';

// Local auth cache keys
const AUTH_CACHE_KEY = 'shadow_bean_auth_cache';
const OAUTH_REDIRECT_KEY = 'shadow_bean_oauth_redirect';

interface Profile {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    phone?: string;
    address?: Record<string, any>;
}

interface AuthUser {
    id: string;
    email: string;
    fullName?: string;
    isAdmin?: boolean;
}

interface AuthContextType {
    user: AuthUser | null;
    profile: Profile | null;
    loading: boolean;
    needsConfirmation: { email: string; password: string } | null;
    login: (email: string, password: string) => Promise<{ error: any }>;
    loginWithGoogle: () => Promise<void>;
    register: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: any; needsConfirmation?: boolean }>;
    confirmSignUp: (code: string) => Promise<{ error: any }>;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
// Local auth cache (backup when Amplify loses track of manually stored OAuth tokens)
// ==============================================

interface CachedAuth {
    userId: string;
    email: string;
    fullName: string;
    idToken: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt: number;
}

function cacheAuthData(data: CachedAuth) {
    localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(data));
}

function getCachedAuth(): CachedAuth | null {
    try {
        const s = localStorage.getItem(AUTH_CACHE_KEY);
        return s ? JSON.parse(s) : null;
    } catch { return null; }
}

function clearCachedAuth() {
    localStorage.removeItem(AUTH_CACHE_KEY);
}

async function manualTokenRefresh(refreshToken: string): Promise<any> {
    const res = await fetch(`https://${COGNITO_DOMAIN}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: CLIENT_ID,
            refresh_token: refreshToken,
        }),
    });
    if (!res.ok) throw new Error('Token refresh failed');
    return res.json();
}

// ==============================================
// Auth Provider
// ==============================================

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [needsConfirmation, setNeedsConfirmation] = useState<{ email: string; password: string } | null>(null);
    const isGoogleRedirecting = useRef(false);

    // Fetch the current authenticated user
    // Strategy:
    //   1. Try Amplify's getCurrentUser (works for email/password + fresh OAuth)
    //   2. If Amplify fails, try our local auth cache (for OAuth sessions where Amplify lost track)
    //   3. If cached token expired, attempt manual refresh via stored refresh_token
    const fetchCurrentUser = useCallback(async () => {
        try {
            const cognitoUser = await getCurrentUser();
            const attributes = await fetchUserAttributes();
            const session = await fetchAuthSession();

            const groups = (session.tokens?.accessToken?.payload?.['cognito:groups'] as string[]) || [];
            const isAdmin = groups.includes('Admin');

            const authUser: AuthUser = {
                id: cognitoUser.userId,
                email: attributes.email || '',
                fullName: attributes.name || '',
                isAdmin,
            };

            setUser(authUser);

            // Cache auth data as backup for when Amplify fails later
            const idTokenStr = session.tokens?.idToken?.toString();
            const accessTokenStr = session.tokens?.accessToken?.toString();
            if (idTokenStr) {
                const tokenPayload = decodeJwtPayload(idTokenStr);
                const prefix = `CognitoIdentityServiceProvider.${CLIENT_ID}`;
                const lastUser = localStorage.getItem(`${prefix}.LastAuthUser`);
                const refreshToken = lastUser ? localStorage.getItem(`${prefix}.${lastUser}.refreshToken`) || undefined : undefined;
                cacheAuthData({
                    userId: cognitoUser.userId,
                    email: attributes.email || '',
                    fullName: attributes.name || '',
                    idToken: idTokenStr,
                    accessToken: accessTokenStr || '',
                    refreshToken,
                    expiresAt: tokenPayload.exp * 1000,
                });
            }

            // Persist profile to database (creates if missing — ensures all users have a DB profile)
            try {
                const dbProfile = await ensureProfile(cognitoUser.userId, attributes.email || '', attributes.name || '');
                setProfile({
                    id: dbProfile.id || cognitoUser.userId,
                    email: dbProfile.email || attributes.email || '',
                    full_name: dbProfile.full_name || attributes.name || '',
                    phone: dbProfile.phone || attributes.phone_number,
                    avatar_url: dbProfile.avatar_url,
                });
            } catch {
                setProfile({
                    id: cognitoUser.userId,
                    email: attributes.email || '',
                    full_name: attributes.name || '',
                    phone: attributes.phone_number,
                });
            }

            return authUser;
        } catch {
            // Amplify failed — try our local auth cache
            console.warn('Amplify auth check failed, trying cached auth');
            const cached = getCachedAuth();
            if (!cached) {
                setUser(null);
                setProfile(null);
                return null;
            }

            let activeToken = cached.idToken;

            // If token expired, try manual refresh
            if (cached.expiresAt <= Date.now()) {
                if (!cached.refreshToken) {
                    console.warn('Token expired and no refresh token — clearing session');
                    clearCachedAuth();
                    setUser(null);
                    setProfile(null);
                    return null;
                }
                try {
                    console.log('Token expired, refreshing manually via Cognito');
                    const newTokens = await manualTokenRefresh(cached.refreshToken);
                    // Update both Amplify storage and our cache
                    storeTokensForAmplify(newTokens);
                    const decoded = decodeJwtPayload(newTokens.id_token);
                    activeToken = newTokens.id_token;
                    cacheAuthData({
                        userId: decoded.sub,
                        email: decoded.email || cached.email,
                        fullName: decoded.name || cached.fullName,
                        idToken: newTokens.id_token,
                        accessToken: newTokens.access_token,
                        refreshToken: newTokens.refresh_token || cached.refreshToken,
                        expiresAt: decoded.exp * 1000,
                    });
                } catch {
                    console.error('Manual token refresh failed — clearing session');
                    clearCachedAuth();
                    setUser(null);
                    setProfile(null);
                    return null;
                }
            }

            // Set user from cached/refreshed token
            const decoded = decodeJwtPayload(activeToken);
            const authUser: AuthUser = {
                id: decoded.sub,
                email: decoded.email || cached.email,
                fullName: decoded.name || cached.fullName,
            };
            setUser(authUser);

            // Ensure profile exists in DB
            try {
                const dbProfile = await ensureProfile(authUser.id, authUser.email, authUser.fullName || '');
                setProfile({
                    id: dbProfile.id || authUser.id,
                    email: dbProfile.email || authUser.email,
                    full_name: dbProfile.full_name || authUser.fullName || '',
                    phone: dbProfile.phone,
                    avatar_url: dbProfile.avatar_url,
                });
            } catch {
                setProfile({
                    id: authUser.id,
                    email: authUser.email,
                    full_name: authUser.fullName || '',
                });
            }

            return authUser;
        } finally {
            setLoading(false);
        }
    }, []);

    // Handle OAuth callback: exchange code for tokens, cache them, then fetch user
    const handleOAuthCallback = useCallback(async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        if (!code) return;

        try {
            console.log('OAuth callback: exchanging code for tokens');
            const tokens = await exchangeCodeForTokens(code, window.location.origin);
            console.log('OAuth callback: tokens received, storing');
            storeTokensForAmplify(tokens);

            // Also cache in our resilient format (includes refresh_token)
            const decoded = decodeJwtPayload(tokens.id_token);
            cacheAuthData({
                userId: decoded.sub,
                email: decoded.email || '',
                fullName: decoded.name || '',
                idToken: tokens.id_token,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiresAt: decoded.exp * 1000,
            });

            // Clean PKCE state
            sessionStorage.removeItem('oauth_pkce_verifier');

            // Check for pending redirect (stored by LoginPage before Google OAuth)
            const pendingRedirect = sessionStorage.getItem(OAUTH_REDIRECT_KEY);
            sessionStorage.removeItem(OAUTH_REDIRECT_KEY);

            if (pendingRedirect && pendingRedirect !== '/' && pendingRedirect !== window.location.pathname) {
                // Redirect immediately — tokens are in storage, fetchCurrentUser will run on the new page
                window.location.replace(pendingRedirect);
                return;
            }

            // No redirect — clean URL and fetch user on current page
            window.history.replaceState({}, '', window.location.pathname);
            await fetchCurrentUser();
        } catch (err) {
            console.error('OAuth callback error:', err);
            window.history.replaceState({}, '', window.location.pathname);
            sessionStorage.removeItem('oauth_pkce_verifier');
            sessionStorage.removeItem(OAUTH_REDIRECT_KEY);
            setLoading(false);
        }
    }, [fetchCurrentUser]);

    // Initialize auth state
    useEffect(() => {
        const isOAuthCallback = window.location.search.includes('code=') && sessionStorage.getItem('oauth_pkce_verifier');

        const hubListener = Hub.listen('auth', ({ payload }) => {
            console.log('Auth Hub event:', payload.event);
            switch (payload.event) {
                case 'signedIn':
                case 'signInWithRedirect':
                    fetchCurrentUser();
                    break;
                case 'signedOut':
                    if (isGoogleRedirecting.current) break;
                    clearCachedAuth();
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                    break;
                case 'tokenRefresh':
                    break;
                case 'tokenRefresh_failure':
                    // Don't immediately clear — try manual refresh from our cache
                    console.warn('Amplify token refresh failed, attempting manual refresh');
                    {
                        const cached = getCachedAuth();
                        if (cached?.refreshToken) {
                            manualTokenRefresh(cached.refreshToken).then(newTokens => {
                                storeTokensForAmplify(newTokens);
                                const dec = decodeJwtPayload(newTokens.id_token);
                                cacheAuthData({
                                    userId: dec.sub,
                                    email: dec.email || cached.email,
                                    fullName: dec.name || cached.fullName,
                                    idToken: newTokens.id_token,
                                    accessToken: newTokens.access_token,
                                    refreshToken: newTokens.refresh_token || cached.refreshToken,
                                    expiresAt: dec.exp * 1000,
                                });
                                console.log('Manual token refresh succeeded');
                            }).catch(() => {
                                console.error('Manual token refresh also failed — clearing session');
                                clearCachedAuth();
                                setUser(null);
                                setProfile(null);
                                setLoading(false);
                            });
                        } else {
                            clearCachedAuth();
                            setUser(null);
                            setProfile(null);
                            setLoading(false);
                        }
                    }
                    break;
                case 'signInWithRedirect_failure':
                    console.error('Amplify OAuth redirect failed:', payload);
                    setLoading(false);
                    break;
            }
        });

        if (isOAuthCallback) {
            handleOAuthCallback();
        } else {
            fetchCurrentUser();
        }

        return () => hubListener();
    }, [fetchCurrentUser, handleOAuthCallback]);

    const login = async (email: string, password: string) => {
        const doLogin = async () => {
            const result = await amplifySignIn({
                username: email,
                password,
                options: { authFlowType: 'USER_SRP_AUTH' },
            });

            if (result.isSignedIn) {
                await fetchCurrentUser();
                return { error: null };
            }

            if (result.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
                setNeedsConfirmation({ email, password });
                return { error: { message: 'Please confirm your email address' } };
            }

            return { error: { message: 'Sign in incomplete' } };
        };

        try {
            return await doLogin();
        } catch (err: any) {
            if (err.name === 'UserAlreadyAuthenticatedException') {
                try {
                    await amplifySignOut();
                    return await doLogin();
                } catch (retryErr: any) {
                    return { error: { message: retryErr.message || 'Sign in failed' } };
                }
            }
            console.error('Login error:', err);
            return { error: { message: err.message || 'Sign in failed' } };
        }
    };

    const register = async (email: string, password: string, fullName: string, phone?: string) => {
        try {
            const userAttributes: Record<string, string> = { email, name: fullName };
            if (phone) userAttributes.phone_number = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;

            const result = await amplifySignUp({
                username: email,
                password,
                options: { userAttributes },
            });

            if (result.isSignUpComplete) {
                await login(email, password);
                return { error: null };
            }

            setNeedsConfirmation({ email, password });
            return { error: null, needsConfirmation: true };
        } catch (err: any) {
            console.error('Register error:', err);
            return { error: { message: err.message || 'Registration failed' } };
        }
    };

    const handleConfirmSignUp = async (code: string) => {
        if (!needsConfirmation) return { error: { message: 'No pending confirmation' } };

        try {
            await confirmSignUp({ username: needsConfirmation.email, confirmationCode: code });
            await login(needsConfirmation.email, needsConfirmation.password);
            setNeedsConfirmation(null);
            return { error: null };
        } catch (err: any) {
            return { error: { message: err.message || 'Confirmation failed' } };
        }
    };

    const logout = async () => {
        try { await amplifySignOut(); } catch {}
        clearCachedAuth();
        setUser(null);
        setProfile(null);
    };

    const refreshProfile = async () => {
        await fetchCurrentUser();
    };

    const loginWithGoogle = async () => {
        isGoogleRedirecting.current = true;

        const codeVerifier = generateCodeVerifier();
        const codeChallenge = await generateCodeChallenge(codeVerifier);

        sessionStorage.setItem('oauth_pkce_verifier', codeVerifier);

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

    return (
        <AuthContext.Provider value={{
            user, profile, loading, needsConfirmation,
            login, loginWithGoogle, register,
            confirmSignUp: handleConfirmSignUp,
            logout, refreshProfile,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}

export default AuthContext;
