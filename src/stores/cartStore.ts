import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TasteProfile {
    id: string;
    name: string;
    bitterness: number;
    acidity: number;
    body: number;
    flavour: number;
    roastLevel: 'Light' | 'Medium' | 'Balanced';
    grindType: 'Whole Bean' | 'Espresso' | 'Moka Pot' | 'French Press' | 'Pour Over' | 'Filter';
}

// Helper for deep comparison
const areProfilesIdentical = (p1: TasteProfile, p2: TasteProfile) => {
    return (
        p1.bitterness === p2.bitterness &&
        p1.acidity === p2.acidity &&
        p1.body === p2.body &&
        p1.flavour === p2.flavour &&
        p1.roastLevel === p2.roastLevel &&
        p1.grindType === p2.grindType
    );
};

export interface CartItem {
    id: string;
    sku?: string; // Userspecific code + custom roast profile code
    tasteProfile: TasteProfile;
    quantity: number;
    unitPrice: number;
}

interface CartState {
    items: CartItem[];
    termsAccepted: boolean;

    // Actions
    addItem: (tasteProfile: TasteProfile, quantity?: number) => void;
    removeItem: (itemId: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    clearCart: () => void;
    setTermsAccepted: (accepted: boolean) => void;

    // Computed
    getTotalItems: () => number;
    getTotalPrice: () => number;
}

const BASE_PRICE = 599; // Base price per bag in INR

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            termsAccepted: false,

            addItem: (tasteProfile, quantity = 1) => {
                const items = get().items;
                // Check if identical profile already exists in cart
                const existingItem = items.find((item) => areProfilesIdentical(item.tasteProfile, tasteProfile));

                if (existingItem) {
                    set({
                        items: items.map((item) =>
                            item.id === existingItem.id
                                ? { ...item, quantity: item.quantity + quantity }
                                : item
                        ),
                    });
                } else {
                    // Generate SKU: CR_USERCODE_TIMESTAMP (Mocking UserCode as 'USER' if not available contextually, or random)
                    // In a real app we might pull userId, but here we'll use a random hash segment
                    const customCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                    const sku = `CR_${customCode}_${Date.now().toString().slice(-4)}`;

                    set({
                        items: [
                            ...items,
                            {
                                id: `cart-${Date.now()}`,
                                sku, // Persisted SKU
                                tasteProfile,
                                quantity,
                                unitPrice: BASE_PRICE,
                            },
                        ],
                    });
                }
            },

            removeItem: (itemId) => {
                set({
                    items: get().items.filter((item) => item.id !== itemId),
                });
            },

            updateQuantity: (itemId, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(itemId);
                    return;
                }
                set({
                    items: get().items.map((item) =>
                        item.id === itemId ? { ...item, quantity } : item
                    ),
                });
            },

            clearCart: () => {
                set({ items: [], termsAccepted: false });
            },

            setTermsAccepted: (accepted) => {
                set({ termsAccepted: accepted });
            },

            getTotalItems: () => {
                return get().items.reduce((total, item) => total + item.quantity, 0);
            },

            getTotalPrice: () => {
                return get().items.reduce(
                    (total, item) => total + item.unitPrice * item.quantity,
                    0
                );
            },
        }),
        {
            name: 'shadow-bean-cart',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
