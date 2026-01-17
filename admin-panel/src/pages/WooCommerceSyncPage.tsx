import { useState } from 'react';
import axios from 'axios';
import { supabase } from '../lib/supabase';


const WC_URL = 'https://shadowbeanco.com/wp';
const CONSUMER_KEY = 'ck_5bd030c25ef0b9156685f3c72e68528c5f54e9ec';
const CONSUMER_SECRET = 'cs_ffa5d47481be553b2488aef1ba245cd81ac86ccb';

const wcApi = axios.create({
    baseURL: `${WC_URL}/wp-json/wc/v3`,
    params: {
        consumer_key: CONSUMER_KEY,
        consumer_secret: CONSUMER_SECRET,
    },
});

const syncService = {
    syncProducts: async () => {
        // 1. Fetch from WooCommerce
        const { data: wcProducts } = await wcApi.get('/products', { params: { per_page: 100 } });

        // 2. Fetch existing products from Supabase to match by Name (using standard client)
        const { data: existingProducts } = await supabase.from('products').select('id, name');
        const productMap = new Map(existingProducts?.map((p: any) => [p.name, p.id]));

        // 3. Upsert to Supabase
        const upsertPayload = wcProducts.map((p: any) => {
            const payload: any = {
                name: p.name,
                description: p.description,
                base_price: p.price ? parseFloat(p.price) : 0,
                image_url: p.images?.[0]?.src || null,
                sizes: ['250g', '500g', '1kg'],
                is_active: p.status === 'publish'
            };

            // If product exists, attach ID to update it
            if (productMap.has(p.name)) {
                payload.id = productMap.get(p.name);
            }

            return payload;
        });

        // 4. Upsert using standard client
        const { error } = await supabase.from('products').upsert(upsertPayload);

        if (error) throw error;
        return wcProducts.length;
    },

    syncOrders: async () => {
        // 1. Fetch from WooCommerce
        const { data: wcOrders } = await wcApi.get('/orders', { params: { per_page: 100 } });

        // 2. Fetch existing orders from Supabase to match by woocommerce_order_id
        const { data: existingOrders } = await supabase.from('orders').select('id, woocommerce_order_id');
        const orderMap = new Map(existingOrders?.map((o: any) => [o.woocommerce_order_id, o.id]));

        // 3. Upsert to Supabase
        const upsertPayload = wcOrders.map((o: any) => {
            const payload: any = {
                woocommerce_order_id: o.id.toString(),
                status: o.status === 'completed' ? 'delivered' : o.status, // Map WC status to Supabase status
                total_amount: o.total ? parseFloat(o.total) : 0,
                shipping_address: o.shipping, // Store full shipping address object
                created_at: o.date_created,
                // user_id is left null for guest orders, ideally we match via email if needed later
            };

            // If order exists, attach ID to update it
            if (orderMap.has(payload.woocommerce_order_id)) {
                payload.id = orderMap.get(payload.woocommerce_order_id);
            }

            return payload;
        });

        // 4. Upsert using standard client
        const { error } = await supabase.from('orders').upsert(upsertPayload);

        if (error) throw error;
        return wcOrders.length;
    }
};

export function WooCommerceSyncPage() {
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [log, setLog] = useState<string[]>([]);

    const addLog = (msg: string) => setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const handleSyncProducts = async () => {
        setLoadingProducts(true);
        addLog('Starting Product Sync...');
        try {
            const count = await syncService.syncProducts();
            addLog(`✅ Products Synced: ${count}`);
        } catch (error: any) {
            console.error(error);
            addLog(`❌ Product Sync Error: ${error.message}`);
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleSyncOrders = async () => {
        setLoadingOrders(true);
        addLog('Starting Order Sync...');
        try {
            const count = await syncService.syncOrders();
            addLog(`✅ Orders Synced: ${count}`);
        } catch (error: any) {
            console.error(error);
            addLog(`❌ Order Sync Error: ${error.message}`);
        } finally {
            setLoadingOrders(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">WooCommerce Sync</h1>

            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-lg font-semibold mb-4">Manual Sync</h2>
                <p className="text-gray-600 mb-4">
                    Pull latest products and orders from your WordPress store into the app.
                </p>

                <div className="flex gap-4">
                    <button
                        onClick={handleSyncProducts}
                        disabled={loadingProducts}
                        className={`px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50`}
                    >
                        {loadingProducts ? 'Syncing Products...' : 'Sync Products'}
                    </button>

                    <button
                        onClick={handleSyncOrders}
                        disabled={loadingOrders}
                        className={`px-4 py-2 rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50`}
                    >
                        {loadingOrders ? 'Syncing Orders...' : 'Sync Orders'}
                    </button>
                </div>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
                <div className="font-bold text-gray-700 mb-2">Sync Log:</div>
                {log.length === 0 && <div className="text-gray-400">Ready to sync...</div>}
                {log.map((entry, i) => (
                    <div key={i}>{entry}</div>
                ))}
            </div>
        </div>
    );
}
