import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, signIn, signUp, signOut, getProfile, ensureProfile } from '../services/supabase';

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

    // Initialize auth state
    useEffect(() => {

        // Get initial session with error handling and retry for AbortError
        const initAuth = async (retryCount = 0) => {
            const maxRetries = 3;
            try {
                let currentSession = null;

                // First try getSession
                const { data: { session: existingSession } } = await supabase.auth.getSession();
                currentSession = existingSession;

                // If no session, check if we have stored OAuth tokens to restore
                if (!currentSession) {
                    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
                    const match = supabaseUrl.match(/\/\/([^.]+)\./);
                    const projectRef = match ? match[1] : 'supabase';
                    const storageKey = `sb-${projectRef}-auth-token`;

                    const storedTokens = localStorage.getItem(storageKey);
                    if (storedTokens) {
                        console.log('Found stored OAuth tokens, attempting to restore session...');
                        try {
                            const tokens = JSON.parse(storedTokens);
                            if (tokens.access_token) {
                                const { data, error } = await supabase.auth.setSession({
                                    access_token: tokens.access_token,
                                    refresh_token: tokens.refresh_token || '',
                                });

                                if (error) {
                                    console.error('Error restoring session:', error);
                                    // Clear invalid tokens
                                    localStorage.removeItem(storageKey);
                                } else if (data.session) {
                                    console.log('Session restored from stored tokens:', data.user?.email);
                                    currentSession = data.session;
                                }
                            }
                        } catch (parseErr) {
                            console.error('Error parsing stored tokens:', parseErr);
                            localStorage.removeItem(storageKey);
                        }
                    }
                }

                console.log('Final session check:', currentSession ? 'Found' : 'None');
                setSession(currentSession);
                setUser(currentSession?.user ?? null);
                if (currentSession?.user) {
                    await loadProfile(currentSession.user.id, currentSession.user.email);
                }
            } catch (error: any) {
                // Handle AbortError specifically - retry after a short delay
                if (error?.name === 'AbortError' && retryCount < maxRetries) {
                    console.log(`Auth AbortError, retrying (${retryCount + 1}/${maxRetries})...`);
                    await new Promise(resolve => setTimeout(resolve, 500));
                    return initAuth(retryCount + 1);
                }
                console.error('Auth initialization error:', error);
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                console.log('Auth state changed:', _event, session?.user?.email);
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    await loadProfile(session.user.id, session.user.email);
                } else {
                    setProfile(null);
                }
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
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
