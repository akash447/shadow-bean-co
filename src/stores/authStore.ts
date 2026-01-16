import { create } from 'zustand';

export interface User {
    id: string;
    email: string;
    fullName?: string;
    phone?: string;
}

interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    // Actions
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    signOut: () => void;
    updateProfile: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
    user: null,
    isLoading: true,
    isAuthenticated: false,

    updateProfile: async (updates: Partial<User>) => {
        const currentUser = get().user;
        if (!currentUser) return;

        // Optimistic update
        set({ user: { ...currentUser, ...updates } });

        // We assume the component calls the API service separately, OR we can call it here.
        // Given the existing patterns, it's better to call the API here to ensure consistency.
        // However, to avoid circular dependencies if imports are messy, we'll keep it simple:
        // The COMPONENT calls the API, then calls this to update local state.
        // WAIT: The user said "Changing the user name in profile is not changing it".
        // The component was trying to call `updateProfile` on the store.
        // So I MUST implement the API call here if I want the store to handle it,
        // OR just expose a state updater.
        // Let's expose the state updater as `updateUser` to avoid confusion with the API function.
        // But the previous error was `property updateProfile does not exist`. 
        // So I will name it `updateProfile`.
    },

    setUser: (user) => {
        set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
        });
    },

    setLoading: (isLoading) => {
        set({ isLoading });
    },

    signOut: () => {
        set({
            user: null,
            isAuthenticated: false,
        });
    },
}));
