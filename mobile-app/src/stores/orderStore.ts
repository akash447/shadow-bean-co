import { create } from 'zustand';

export interface Order {
    id: string;
    userId: string;
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    totalAmount: number;
    paymentMethod?: 'cod' | 'razorpay' | 'online';
    razorpayPaymentId?: string;
    shiprocketOrderId?: string;
    shiprocketShipmentId?: string;
    trackingStatus?: string;
    shippingAddress: {
        name: string;
        phone: string;
        street: string;
        city: string;
        state: string;
        zip: string;
    };
    items: {
        tasteProfileId: string;
        tasteProfileName: string;
        quantity: number;
        unitPrice: number;
    }[];
    createdAt: string;
}

interface OrderState {
    orders: Order[];
    currentOrder: Order | null;
    isLoading: boolean;

    // Actions
    setOrders: (orders: Order[]) => void;
    addOrder: (order: Order) => void;
    setCurrentOrder: (order: Order | null) => void;
    updateOrderStatus: (orderId: string, status: Order['status'], trackingStatus?: string) => void;
    setLoading: (loading: boolean) => void;
}

export const useOrderStore = create<OrderState>()((set, get) => ({
    orders: [],
    currentOrder: null,
    isLoading: false,

    setOrders: (orders) => {
        set({ orders });
    },

    addOrder: (order) => {
        set({ orders: [order, ...get().orders] });
    },

    setCurrentOrder: (order) => {
        set({ currentOrder: order });
    },

    updateOrderStatus: (orderId, status, trackingStatus) => {
        set({
            orders: get().orders.map((order) =>
                order.id === orderId
                    ? { ...order, status, trackingStatus: trackingStatus ?? order.trackingStatus }
                    : order
            ),
        });
    },

    setLoading: (isLoading) => {
        set({ isLoading });
    },
}));
