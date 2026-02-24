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
    description: string;
    tastingNotes: string;
    price: number;
    bitterness?: number;
    flavour?: number;
    roast?: string;
    grind?: string;
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
