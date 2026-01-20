import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ShopState {
    step: 1 | 2;
    bitterness: number;
    acidity: number;
    flavour: number;
    roastLevel: 'Light' | 'Medium' | 'Balanced';
    grindType: string;

    setStep: (step: 1 | 2) => void;
    setTaste: (key: 'bitterness' | 'acidity' | 'flavour', value: number) => void;
    setRoastLevel: (level: 'Light' | 'Medium' | 'Balanced') => void;
    setGrindType: (type: string) => void;
    resetShop: () => void;
}

export const useShopStore = create<ShopState>()(
    persist(
        (set) => ({
            step: 1,
            bitterness: 3,
            acidity: 3,
            flavour: 3,
            roastLevel: 'Medium',
            grindType: 'Whole Bean',

            setStep: (step) => set({ step }),
            setTaste: (key, value) => set({ [key]: value }),
            setRoastLevel: (roastLevel) => set({ roastLevel }),
            setGrindType: (grindType) => set({ grindType }),
            resetShop: () => set({
                step: 1,
                bitterness: 3,
                acidity: 3,
                flavour: 3,
                roastLevel: 'Medium',
                grindType: 'Whole Bean'
            }),
        }),
        {
            name: 'shadow-bean-shop-state',
        }
    )
);
