import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TasteProfile {
    id: string;
    name: string;
    bitterness: number;
    acidity: number;
    body: number;
    flavour: number;
    roastLevel: string;
    grindType: string;
}

interface CartItem {
    profile: TasteProfile;
    quantity: number;
}

interface CartStore {
    items: CartItem[];
    addItem: (profile: TasteProfile) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    getTotal: () => number;
}

// Check if two profiles are equivalent (same customization)
const profilesMatch = (a: TasteProfile, b: TasteProfile): boolean => {
    return (
        a.bitterness === b.bitterness &&
        a.acidity === b.acidity &&
        a.flavour === b.flavour &&
        a.body === b.body &&
        a.roastLevel === b.roastLevel &&
        a.grindType === b.grindType
    );
};

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (profile) => {
                set((state) => {
                    // Check for existing item with same customization
                    const existingIndex = state.items.findIndex(item =>
                        profilesMatch(item.profile, profile)
                    );

                    if (existingIndex !== -1) {
                        // Increment quantity of existing item
                        const newItems = [...state.items];
                        newItems[existingIndex] = {
                            ...newItems[existingIndex],
                            quantity: newItems[existingIndex].quantity + 1
                        };
                        return { items: newItems };
                    }

                    // Add new item
                    return { items: [...state.items, { profile, quantity: 1 }] };
                });
            },

            removeItem: (id) => {
                set((state) => ({
                    items: state.items.filter(item => item.profile.id !== id)
                }));
            },

            updateQuantity: (id, quantity) => {
                set((state) => ({
                    items: quantity <= 0
                        ? state.items.filter(item => item.profile.id !== id)
                        : state.items.map(item =>
                            item.profile.id === id ? { ...item, quantity } : item
                        )
                }));
            },

            clearCart: () => set({ items: [] }),

            getTotal: () => {
                return get().items.reduce((sum, item) => sum + (799 * item.quantity), 0);
            }
        }),
        {
            name: 'shadow-bean-cart',
        }
    )
);

export type { CartItem };
