import { create } from 'zustand';
import { getTasteProfiles, createTasteProfile, deleteTasteProfile } from '../services/cognito-auth';

export interface TasteProfile {
    id: string;
    userId?: string;
    name: string;
    bitterness: number;
    acidity: number;
    body: number;
    flavour: number;
    roastLevel: string;
    grindType: string;
    createdAt?: string;
}

interface TasteProfileState {
    profiles: TasteProfile[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchProfiles: (userId: string) => Promise<void>;
    addProfile: (profile: Omit<TasteProfile, 'id' | 'createdAt'>, userId: string) => Promise<void>;
    saveProfile: (userId: string) => Promise<void>;
    deleteProfile: (id: string) => Promise<void>;

    // UI State for Shop
    currentCustomization: Partial<TasteProfile>;
    setCurrentCustomization: (customization: Partial<TasteProfile>) => void;
}

// ... imports
// ... imports

export const useTasteProfileStore = create<TasteProfileState>((set, get) => ({
    profiles: [],
    isLoading: false,
    error: null,
    currentCustomization: {},

    setCurrentCustomization: (customization) => {
        console.log('Store Update Request:', customization);
        set((state) => ({
            currentCustomization: { ...state.currentCustomization, ...customization }
        }));
    },
    // ... (rest of actions)


    saveProfile: async (userId) => {
        const { currentCustomization, profiles, addProfile } = get();

        // Validation
        if (!currentCustomization.roastLevel || !currentCustomization.grindType) return;

        // Check limit (Max 20)
        if (profiles.length >= 20) {
            const oldest = profiles[profiles.length - 1];
            if (oldest) await get().deleteProfile(oldest.id);
        }

        // Check Uniqueness
        const isDuplicate = profiles.some(p =>
            p.bitterness === (currentCustomization.bitterness ?? 3) &&
            p.acidity === (currentCustomization.acidity ?? 3) &&
            p.body === (currentCustomization.body ?? 3) &&
            p.flavour === (currentCustomization.flavour ?? 3) &&
            p.roastLevel === currentCustomization.roastLevel &&
            p.grindType === currentCustomization.grindType
        );

        if (isDuplicate) return;

        // Add
        await addProfile({
            name: `Blend #${Date.now().toString().slice(-4)}`,
            bitterness: currentCustomization.bitterness ?? 3,
            acidity: currentCustomization.acidity ?? 3,
            body: currentCustomization.body ?? 3,
            flavour: currentCustomization.flavour ?? 3,
            roastLevel: currentCustomization.roastLevel!,
            grindType: currentCustomization.grindType!,
        }, userId);
    },

    fetchProfiles: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
            const { profiles: data, error } = await getTasteProfiles(userId);

            if (error) throw error;

            const mappedProfiles: TasteProfile[] = (data || []).map((p: any) => ({
                id: p.id,
                userId: p.user_id,
                name: p.name,
                bitterness: p.bitterness,
                acidity: p.acidity,
                body: p.body,
                flavour: p.flavour,
                roastLevel: p.roast_level,
                grindType: p.grind_type,
                createdAt: p.created_at,
            }));

            set({ profiles: mappedProfiles, isLoading: false });
        } catch (error: any) {
            console.error('Error fetching taste profiles:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    addProfile: async (profile, userId) => {
        try {
            const { profile: data, error } = await createTasteProfile({
                userId,
                name: profile.name,
                bitterness: profile.bitterness,
                acidity: profile.acidity,
                body: profile.body,
                flavour: profile.flavour,
                roastLevel: profile.roastLevel,
                grindType: profile.grindType,
            });

            if (error) throw error;

            const newProfile: TasteProfile = {
                id: data.id,
                userId: data.user_id,
                name: data.name,
                bitterness: data.bitterness,
                acidity: data.acidity,
                body: data.body,
                flavour: data.flavour,
                roastLevel: data.roast_level,
                grindType: data.grind_type,
                createdAt: data.created_at,
            };

            set((state) => ({ profiles: [newProfile, ...state.profiles] }));

        } catch (error: any) {
            console.error('Error adding profile:', error);
        }
    },

    deleteProfile: async (id) => {
        try {
            const { error } = await deleteTasteProfile(id);

            if (error) throw error;

            set((state) => ({
                profiles: state.profiles.filter((p) => p.id !== id)
            }));
        } catch (error: any) {
            console.error('Error deleting profile:', error);
        }
    },

}));
