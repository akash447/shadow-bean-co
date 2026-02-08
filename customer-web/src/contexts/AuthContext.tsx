import { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
    register: (email: string, password: string, fullName: string) => Promise<{ error: any; needsConfirmation?: boolean }>;
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

    // Fetch the current authenticated user
    const fetchCurrentUser = useCallback(async () => {
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
        fetchCurrentUser();

        // Listen for Amplify Auth events (including OAuth redirect callbacks)
        const hubListener = Hub.listen('auth', ({ payload }) => {
            console.log('Auth Hub event:', payload.event);
            switch (payload.event) {
                case 'signedIn':
                case 'signInWithRedirect':
                    console.log('User signed in via:', payload.event);
                    fetchCurrentUser();
                    break;
                case 'signedOut':
                    console.log('User signed out');
                    setUser(null);
                    setProfile(null);
                    break;
                case 'tokenRefresh':
                    console.log('Token refreshed');
                    break;
                case 'tokenRefresh_failure':
                    console.log('Token refresh failed');
                    setUser(null);
                    setProfile(null);
                    break;
                case 'signInWithRedirect_failure':
                    console.error('Google OAuth redirect failed:', payload);
                    break;
            }
        });

        return () => hubListener();
    }, [fetchCurrentUser]);

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

    const register = async (email: string, password: string, fullName: string) => {
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

            if (!result.isSignUpComplete) {
                // Need email confirmation
                setNeedsConfirmation({ email, password });
                return { error: null, needsConfirmation: true };
            }

            // Auto sign-in after registration
            await login(email, password);
            return { error: null };
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
    };

    const refreshProfile = async () => {
        await fetchCurrentUser();
    };

    const loginWithGoogle = async () => {
        try {
            await signInWithRedirect({ provider: 'Google' });
        } catch (err: any) {
            console.error('Google login error:', err);
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
