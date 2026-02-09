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
    signInWithRedirect,
} from 'aws-amplify/auth';
import { ensureProfile } from '../services/api';

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

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [needsConfirmation, setNeedsConfirmation] = useState<{ email: string; password: string } | null>(null);
    const isGoogleRedirecting = useRef(false);
    const authResolved = useRef(false);

    // Fetch the current authenticated user
    const fetchCurrentUser = useCallback(async () => {
        // Prevent duplicate calls after auth is already resolved
        if (authResolved.current) return null;

        try {
            const cognitoUser = await getCurrentUser();
            const attributes = await fetchUserAttributes();
            const session = await fetchAuthSession();

            // Check if user is in Admin group
            const groups = (session.tokens?.accessToken?.payload?.['cognito:groups'] as string[]) || [];
            const isAdmin = groups.includes('Admin');

            const authUser: AuthUser = {
                id: cognitoUser.userId,
                email: attributes.email || '',
                fullName: attributes.name || '',
                isAdmin,
            };

            setUser(authUser);
            authResolved.current = true;

            // Clean OAuth params from URL if present
            if (window.location.search.includes('code=')) {
                window.history.replaceState({}, '', window.location.pathname);
            }

            // Persist profile to database and use DB response
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
                // Fallback to Cognito-only profile if API is unreachable
                setProfile({
                    id: cognitoUser.userId,
                    email: attributes.email || '',
                    full_name: attributes.name || '',
                    phone: attributes.phone_number,
                });
            }

            return authUser;
        } catch {
            // Not authenticated
            setUser(null);
            setProfile(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Initialize auth state and listen for auth events
    useEffect(() => {
        const isOAuthCallback = window.location.search.includes('code=');

        // Set up Hub listener for auth events
        const hubListener = Hub.listen('auth', ({ payload }) => {
            console.log('Auth Hub event:', payload.event);
            switch (payload.event) {
                case 'signedIn':
                case 'signInWithRedirect':
                    console.log('User signed in via:', payload.event);
                    authResolved.current = false; // Allow fetchCurrentUser to run again
                    fetchCurrentUser();
                    break;
                case 'signedOut':
                    if (isGoogleRedirecting.current) {
                        console.log('Ignoring signedOut during Google redirect');
                        break;
                    }
                    console.log('User signed out');
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                    authResolved.current = false;
                    break;
                case 'tokenRefresh':
                    console.log('Token refreshed');
                    break;
                case 'tokenRefresh_failure':
                    console.log('Token refresh failed');
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                    authResolved.current = false;
                    break;
                case 'signInWithRedirect_failure':
                    console.error('Google OAuth redirect failed:', payload);
                    setLoading(false);
                    break;
            }
        });

        if (isOAuthCallback) {
            // OAuth callback: Amplify processes ?code= asynchronously.
            // We need to give it time, then call fetchCurrentUser which
            // triggers getCurrentUser() → finds the newly stored tokens.
            // Try at 1.5s (fast case) and 5s (safety net).
            const timer1 = setTimeout(() => {
                console.log('OAuth: trying fetchCurrentUser (1.5s)');
                fetchCurrentUser();
            }, 1500);
            const timer2 = setTimeout(() => {
                console.log('OAuth: trying fetchCurrentUser (5s fallback)');
                authResolved.current = false;
                fetchCurrentUser();
            }, 5000);
            return () => { hubListener(); clearTimeout(timer1); clearTimeout(timer2); };
        } else {
            // Normal page load: check for existing session immediately
            fetchCurrentUser();
            return () => hubListener();
        }
    }, [fetchCurrentUser]);

    const login = async (email: string, password: string) => {
        const doLogin = async () => {
            const result = await amplifySignIn({
                username: email,
                password,
                options: { authFlowType: 'USER_SRP_AUTH' },
            });

            if (result.isSignedIn) {
                authResolved.current = false;
                await fetchCurrentUser();
                return { error: null };
            }

            // Handle next steps (MFA, etc.)
            if (result.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
                setNeedsConfirmation({ email, password });
                return { error: { message: 'Please confirm your email address' } };
            }

            return { error: { message: 'Sign in incomplete' } };
        };

        try {
            return await doLogin();
        } catch (err: any) {
            // If already signed in, sign out first then retry
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
            const userAttributes: Record<string, string> = {
                email,
                name: fullName,
            };
            if (phone) userAttributes.phone_number = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;

            const result = await amplifySignUp({
                username: email,
                password,
                options: {
                    userAttributes,
                },
            });

            if (result.isSignUpComplete) {
                // Auto-confirmed by pre-signup trigger — sign in immediately
                await login(email, password);
                return { error: null };
            }

            // Fallback: if pre-signup trigger isn't active, need email confirmation
            setNeedsConfirmation({ email, password });
            return { error: null, needsConfirmation: true };
        } catch (err: any) {
            console.error('Register error:', err);
            return { error: { message: err.message || 'Registration failed' } };
        }
    };

    const handleConfirmSignUp = async (code: string) => {
        if (!needsConfirmation) {
            return { error: { message: 'No pending confirmation' } };
        }

        try {
            await confirmSignUp({
                username: needsConfirmation.email,
                confirmationCode: code,
            });

            // Auto sign-in after confirmation
            await login(needsConfirmation.email, needsConfirmation.password);
            setNeedsConfirmation(null);
            return { error: null };
        } catch (err: any) {
            return { error: { message: err.message || 'Confirmation failed' } };
        }
    };

    const logout = async () => {
        try {
            await amplifySignOut();
        } catch (err) {
            console.error('Logout error:', err);
        }
        setUser(null);
        setProfile(null);
        authResolved.current = false;
    };

    const refreshProfile = async () => {
        authResolved.current = false;
        await fetchCurrentUser();
    };

    const loginWithGoogle = async () => {
        isGoogleRedirecting.current = true;

        // Clean any stale OAuth params from URL
        if (window.location.search.includes('code=')) {
            window.history.replaceState({}, '', window.location.pathname);
        }

        try {
            await signInWithRedirect({ provider: 'Google' });
        } catch (err: any) {
            // If already authenticated, sign out first then redirect
            if (err.name === 'UserAlreadyAuthenticatedException') {
                try {
                    await amplifySignOut();
                    await signInWithRedirect({ provider: 'Google' });
                    return;
                } catch (retryErr: any) {
                    isGoogleRedirecting.current = false;
                    throw new Error(retryErr.message || 'Google sign-in failed after retry');
                }
            }
            isGoogleRedirecting.current = false;
            // Re-throw so LoginPage can display the error
            throw new Error(err.message || 'Google sign-in failed');
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            loading,
            needsConfirmation,
            login,
            loginWithGoogle,
            register,
            confirmSignUp: handleConfirmSignUp,
            logout,
            refreshProfile,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
