import axios from 'axios';
import { supabase } from './supabase';

const WC_URL = 'https://shadowbeanco.com/wp';
const CONSUMER_KEY = 'ck_a999ef5cdc6bc57141a54082d6789d7b78b649f3';
const CONSUMER_SECRET = 'cs_1df32fb3710fa79a72c1f2ba119cc0102d1d4649';

const wcApi = axios.create({
    baseURL: `${WC_URL}/wp-json/wc/v3`,
    params: {
        consumer_key: CONSUMER_KEY,
        consumer_secret: CONSUMER_SECRET,
    },
});

export interface WCOrderItem {
    name: string;
    quantity: number;
    price: string;
    meta_data?: Array<{ key: string; value: string }>;
}

export interface WCAddress {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2?: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email?: string;
    phone?: string;
}

export interface WCOrder {
    payment_method: string;
    payment_method_title: string;
    set_paid: boolean;
    billing: WCAddress;
    shipping: WCAddress;
    line_items: WCOrderItem[];
    customer_note?: string;
}

export const woocommerce = {
    // Products
    getProducts: async (page = 1, per_page = 20) => {
        try {
            const { data } = await wcApi.get('/products', { params: { page, per_page } });
            return { products: data, error: null };
        } catch (error) {
            console.error('Failed to fetch products:', error);
            return { products: [], error };
        }
    },

    // Orders
    getOrders: async (page = 1) => {
        try {
            const { data } = await wcApi.get('/orders', { params: { page } });
            return { orders: data, error: null };
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            return { orders: [], error };
        }
    },

    createOrder: async (orderData: WCOrder) => {
        try {
            const { data } = await wcApi.post('/orders', orderData);
            return { order: data, error: null };
        } catch (error) {
            console.error('Failed to create order:', error);
            return { order: null, error };
        }
    },

    // Create order and sync to Supabase
    createOrderWithSync: async (orderData: WCOrder, userId: string) => {
        try {
            // Create order in WooCommerce
            const { data: wcOrder } = await wcApi.post('/orders', orderData);

            // Sync to Supabase
            const { error: supabaseError } = await supabase.from('orders').insert({
                user_id: userId,
                woocommerce_order_id: wcOrder.id,
                total_amount: parseFloat(wcOrder.total),
                status: wcOrder.status,
                shipping_address: orderData.shipping,
                created_at: new Date().toISOString(),
            });

            if (supabaseError) {
                console.error('Failed to sync order to Supabase:', supabaseError);
            }

            return { order: wcOrder, error: null };
        } catch (error) {
            console.error('Failed to create order:', error);
            return { order: null, error };
        }
    },

    // Customers
    getCustomers: async () => {
        try {
            const { data } = await wcApi.get('/customers');
            return { customers: data, error: null };
        } catch (error) {
            console.error('Failed to fetch customers:', error);
            return { customers: [], error };
        }
    },

    // Sync products to Supabase
    syncProductsToSupabase: async () => {
        try {
            const { products } = await woocommerce.getProducts(1, 100);
            const { error } = await supabase.from('products').upsert(
                products.map((p: any) => ({
                    name: p.name,
                    description: p.description,
                    price: parseFloat(p.price),
                    sku: p.sku,
                    stock: p.stock_quantity,
                    meta_data: p.meta_data,
                })),
                { onConflict: 'sku' }
            );
            if (error) throw error;
            return { success: true, count: products.length };
        } catch (error) {
            console.error('Sync failed:', error);
            return { success: false, error };
        }
    }
};

export default woocommerce;
