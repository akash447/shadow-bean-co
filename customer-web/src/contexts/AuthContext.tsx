import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { signIn, signUp, signOut, getProfile, ensureProfile } from '../services/supabase';

interface Profile {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    phone?: string;
    address?: Record<string, any>;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ error: any }>;
    register: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    // Helper to decode JWT without verification (for client-side user info only)
    const decodeJWT = (token: string) => {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            const payload = JSON.parse(atob(parts[1]));
            return payload;
        } catch {
            return null;
        }
    };

    // Initialize auth state
    useEffect(() => {

        // Get initial session - bypass Supabase auth methods that hang
        const initAuth = async () => {
            try {
                // Check for stored OAuth tokens
                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
                const match = supabaseUrl.match(/\/\/([^.]+)\./);
                const projectRef = match ? match[1] : 'supabase';
                const storageKey = `sb-${projectRef}-auth-token`;

                const storedTokens = localStorage.getItem(storageKey);
                if (storedTokens) {
                    console.log('Found stored OAuth tokens, decoding JWT...');
                    try {
                        const tokens = JSON.parse(storedTokens);
                        if (tokens.access_token) {
                            // Decode JWT to get user info (bypass Supabase auth)
                            const payload = decodeJWT(tokens.access_token);

                            if (payload && payload.sub) {
                                console.log('JWT decoded successfully:', payload.email);

                                // Check if token is expired
                                const now = Math.floor(Date.now() / 1000);
                                if (payload.exp && payload.exp < now) {
                                    console.log('Token expired, clearing...');
                                    localStorage.removeItem(storageKey);
                                    setLoading(false);
                                    return;
                                }

                                // Create a mock user object from JWT payload
                                const mockUser = {
                                    id: payload.sub,
                                    email: payload.email,
                                    user_metadata: payload.user_metadata || {},
                                    aud: payload.aud,
                                    role: payload.role,
                                } as any;

                                // Create a mock session
                                const mockSession = {
                                    access_token: tokens.access_token,
                                    refresh_token: tokens.refresh_token || '',
                                    expires_at: tokens.expires_at,
                                    user: mockUser,
                                } as Session;

                                console.log('Session created from JWT:', mockUser.email);
                                setSession(mockSession);
                                setUser(mockUser);

                                // Load profile in background - don't block
                                setLoading(false);
                                loadProfile(mockUser.id, mockUser.email).catch(err => {
                                    console.warn('Profile load error (non-blocking):', err);
                                });
                                return;
                            }
                        }
                    } catch (parseErr) {
                        console.error('Error parsing stored tokens:', parseErr);
                        localStorage.removeItem(storageKey);
                    }
                }

                // No stored tokens - user is not logged in
                console.log('No valid session found');
                setLoading(false);
            } catch (error: any) {
                console.error('Auth initialization error:', error);
                setLoading(false);
            }
        };

        initAuth();

        // Skip onAuthStateChange - we're bypassing Supabase auth
        // Manual JWT decoding handles session restoration
    }, []);

    const loadProfile = async (userId: string, email?: string, fullName?: string) => {
        // First ensure profile exists (creates if missing - important for OAuth users)
        await ensureProfile(userId, email, fullName);

        // Then load the profile
        const { profile: profileData, error } = await getProfile(userId);
        if (!error && profileData) {
            setProfile(profileData);
        }
        setLoading(false);
    };

    const login = async (email: string, password: string) => {
        const { error } = await signIn(email, password);
        return { error };
    };

    const register = async (email: string, password: string, fullName: string) => {
        const { error } = await signUp(email, password, fullName);
        return { error };
    };

    const logout = async () => {
        await signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
    };

    const refreshProfile = async () => {
        if (user) {
            await loadProfile(user.id);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            session,
            profile,
            loading,
            login,
            register,
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
