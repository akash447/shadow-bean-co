export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    chips?: string[];
    card?: ChatCard | null;
}

export interface ChatCard {
    type: 'product' | 'summary' | 'confirmed';
    data: ProductCardData | OrderSummaryData | OrderConfirmedData;
}

export interface ProductCardData {
    name: string;
    bitterness: number;
    flavour: number;
    roast: string;
    grind: string;
    price: number;
    reason: string;
}

export interface OrderSummaryData {
    items: { name: string; qty: number; price: number }[];
    discount: number;
    total: number;
    grind: string;
}

export interface OrderConfirmedData {
    orderId: string;
    total: number;
}

export interface TasteState {
    time?: 'morning' | 'evening';
    milk?: boolean;
    bitterness?: number;
    flavour?: number;
    roast?: string;
    grind?: string;
    qty?: number;
}
