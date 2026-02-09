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
    // Store tokens in the format Amplify v6 expects (CognitoIdentityServiceProvider keys)
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
// Auth Provider
// ==============================================

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [needsConfirmation, setNeedsConfirmation] = useState<{ email: string; password: string } | null>(null);
    const isGoogleRedirecting = useRef(false);

    // Fetch the current authenticated user
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

            // Persist profile to database (also creates profile for new Google users)
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
            setUser(null);
            setProfile(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Handle OAuth callback: exchange code for tokens, store them, then fetch user
    const handleOAuthCallback = useCallback(async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        if (!code) return;

        try {
            console.log('OAuth callback: exchanging code for tokens');
            const tokens = await exchangeCodeForTokens(code, window.location.origin);
            console.log('OAuth callback: tokens received, storing for Amplify');
            storeTokensForAmplify(tokens);

            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
            // Clean PKCE state
            sessionStorage.removeItem('oauth_pkce_verifier');

            // Now Amplify should find the tokens in localStorage
            await fetchCurrentUser();
        } catch (err) {
            console.error('OAuth callback error:', err);
            // Clean URL even on error
            window.history.replaceState({}, '', window.location.pathname);
            sessionStorage.removeItem('oauth_pkce_verifier');
            setLoading(false);
        }
    }, [fetchCurrentUser]);

    // Initialize auth state
    useEffect(() => {
        const isOAuthCallback = window.location.search.includes('code=') && sessionStorage.getItem('oauth_pkce_verifier');

        // Hub listener for Amplify-initiated auth events
        const hubListener = Hub.listen('auth', ({ payload }) => {
            console.log('Auth Hub event:', payload.event);
            switch (payload.event) {
                case 'signedIn':
                case 'signInWithRedirect':
                    fetchCurrentUser();
                    break;
                case 'signedOut':
                    if (isGoogleRedirecting.current) break;
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                    break;
                case 'tokenRefresh':
                    break;
                case 'tokenRefresh_failure':
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                    break;
                case 'signInWithRedirect_failure':
                    console.error('Amplify OAuth redirect failed:', payload);
                    setLoading(false);
                    break;
            }
        });

        if (isOAuthCallback) {
            // Manual OAuth callback: exchange code ourselves
            handleOAuthCallback();
        } else {
            // Normal page load: check for existing session
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
        setUser(null);
        setProfile(null);
    };

    const refreshProfile = async () => {
        await fetchCurrentUser();
    };

    const loginWithGoogle = async () => {
        isGoogleRedirecting.current = true;

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
