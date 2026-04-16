// GA4 e-commerce event helpers
// Uses the global gtag() injected via index.html

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
    }
}

function gtag(...args: unknown[]) {
    if (window.gtag) window.gtag(...args);
}

export function trackViewItem(sku: string, roast: string, grind: string) {
    gtag('event', 'view_item', {
        currency: 'INR',
        value: 599,
        items: [{ item_id: sku, item_name: `Custom Blend ${sku}`, price: 599, item_category: roast, item_variant: grind }],
    });
}

export function trackAddToCart(sku: string, roast: string, grind: string) {
    gtag('event', 'add_to_cart', {
        currency: 'INR',
        value: 599,
        items: [{ item_id: sku, item_name: `Custom Blend ${sku}`, price: 599, item_category: roast, item_variant: grind }],
    });
}

export function trackViewCart(totalValue: number, itemCount: number) {
    gtag('event', 'view_cart', { currency: 'INR', value: totalValue, items_count: itemCount });
}

export function trackBeginCheckout(totalValue: number, itemCount: number) {
    gtag('event', 'begin_checkout', { currency: 'INR', value: totalValue, items_count: itemCount });
}

export function trackPurchase(orderId: string, totalValue: number, itemCount: number) {
    gtag('event', 'purchase', {
        transaction_id: orderId,
        currency: 'INR',
        value: totalValue,
        items_count: itemCount,
    });
}
