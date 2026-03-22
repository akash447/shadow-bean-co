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

export interface AppliedDiscount {
    code: string;
    type: string;   // 'percentage' | 'flat'
    value: number;
}

interface CartStore {
    items: CartItem[];
    discount: AppliedDiscount | null;
    addItem: (profile: TasteProfile) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    getSubtotal: () => number;
    getDiscountAmount: () => number;
    getTotal: () => number;
    setDiscount: (d: AppliedDiscount | null) => void;
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
            discount: null,

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

            clearCart: () => set({ items: [], discount: null }),

            setDiscount: (d) => set({ discount: d }),

            getSubtotal: () => {
                return get().items.reduce((sum, item) => sum + (599 * item.quantity), 0);
            },

            getDiscountAmount: () => {
                const { discount } = get();
                const subtotal = get().getSubtotal();
                if (!discount) return 0;
                if (discount.type === 'percentage') return Math.round(subtotal * discount.value / 100);
                return Math.min(discount.value, subtotal);
            },

            getTotal: () => {
                return get().getSubtotal() - get().getDiscountAmount();
            }
        }),
        {
            name: 'shadow-bean-cart',
        }
    )
);

export type { CartItem };
