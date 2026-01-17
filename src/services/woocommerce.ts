import axios from 'axios';
import { supabase } from './supabase';

const WC_URL = 'https://shadowbeanco.com/wp'; // Will update if they choose a different path
const CONSUMER_KEY = 'ck_5bd030c25ef0b9156685f3c72e68528c5f54e9ec';
const CONSUMER_SECRET = 'cs_ffa5d47481be553b2488aef1ba245cd81ac86ccb';

const wcApi = axios.create({
    baseURL: `${WC_URL}/wp-json/wc/v3`,
    params: {
        consumer_key: CONSUMER_KEY,
        consumer_secret: CONSUMER_SECRET,
    },
});

export const woocommerce = {
    // Products
    getProducts: async (page = 1, per_page = 20) => {
        const { data } = await wcApi.get('/products', { params: { page, per_page } });
        return data;
    },

    createProduct: async (productData: any) => {
        const { data } = await wcApi.post('/products', productData);
        return data;
    },

    // Orders
    getOrders: async (page = 1) => {
        const { data } = await wcApi.get('/orders', { params: { page } });
        return data;
    },

    createOrder: async (orderData: any) => {
        const { data } = await wcApi.post('/orders', orderData);
        return data;
    },

    // Customers
    getCustomers: async () => {
        const { data } = await wcApi.get('/customers');
        return data;
    },

    // Sync Functions
    syncProductsToSupabase: async () => {
        try {
            const products = await woocommerce.getProducts(1, 100);
            const { error } = await supabase.from('products').upsert(
                products.map((p: any) => ({
                    name: p.name,
                    description: p.description,
                    price: parseFloat(p.price),
                    sku: p.sku,
                    stock: p.stock_quantity,
                    meta_data: p.meta_data // Store robust WP data
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
