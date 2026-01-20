// Shiprocket API Service
// API Documentation: https://apidocs.shiprocket.in

const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';
const SHIPROCKET_EMAIL = 'contact@shadowbeanco.com';
const SHIPROCKET_PASSWORD = '&FX&uwm&1%K11VVxLJE*65%WXvhv$SeT';

let authToken: string | null = null;
let tokenExpiry: number = 0;

// Get authentication token
export const getAuthToken = async (): Promise<string> => {
    // Return cached token if still valid
    if (authToken && Date.now() < tokenExpiry) {
        return authToken;
    }

    const response = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: SHIPROCKET_EMAIL,
            password: SHIPROCKET_PASSWORD,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to authenticate with Shiprocket');
    }

    const data = await response.json();
    authToken = data.token;
    // Token expires in 10 days, refresh after 9 days
    tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000;

    return authToken!;
};

// Helper function for authenticated requests
const authenticatedFetch = async (
    endpoint: string,
    options: RequestInit = {}
): Promise<Response> => {
    const token = await getAuthToken();
    return fetch(`${SHIPROCKET_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
    });
};

// Check courier serviceability and get shipping charges
export interface ServiceabilityParams {
    pickup_postcode: string;
    delivery_postcode: string;
    weight: number; // in kg
    cod: 0 | 1;
}

export const checkServiceability = async (params: ServiceabilityParams) => {
    const queryString = new URLSearchParams({
        pickup_postcode: params.pickup_postcode,
        delivery_postcode: params.delivery_postcode,
        weight: params.weight.toString(),
        cod: params.cod.toString(),
    }).toString();

    const response = await authenticatedFetch(
        `/courier/serviceability/?${queryString}`
    );

    if (!response.ok) {
        throw new Error('Failed to check serviceability');
    }

    return response.json();
};

// Create order
export interface CreateOrderParams {
    order_id: string;
    order_date: string;
    pickup_location: string;
    billing_customer_name: string;
    billing_last_name?: string;
    billing_address: string;
    billing_city: string;
    billing_state: string;
    billing_pincode: string;
    billing_country: string;
    billing_email: string;
    billing_phone: string;
    shipping_is_billing: boolean;
    shipping_customer_name?: string;
    shipping_address?: string;
    shipping_city?: string;
    shipping_state?: string;
    shipping_pincode?: string;
    shipping_country?: string;
    shipping_phone?: string;
    order_items: Array<{
        name: string;
        sku: string;
        units: number;
        selling_price: number;
    }>;
    payment_method: 'Prepaid' | 'COD';
    sub_total: number;
    length: number; // cm
    breadth: number; // cm
    height: number; // cm
    weight: number; // kg
}

export const createOrder = async (params: CreateOrderParams) => {
    const response = await authenticatedFetch('/orders/create/adhoc', {
        method: 'POST',
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        throw new Error('Failed to create Shiprocket order');
    }

    return response.json();
};

// Assign AWB (Air Waybill) to shipment
export const assignAWB = async (shipmentId: string, courierId?: number) => {
    const body: any = { shipment_id: shipmentId };
    if (courierId) {
        body.courier_id = courierId;
    }

    const response = await authenticatedFetch('/courier/assign/awb', {
        method: 'POST',
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error('Failed to assign AWB');
    }

    return response.json();
};

// Generate pickup request
export const generatePickup = async (shipmentIds: string[]) => {
    const response = await authenticatedFetch('/courier/generate/pickup', {
        method: 'POST',
        body: JSON.stringify({
            shipment_id: shipmentIds,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to generate pickup');
    }

    return response.json();
};

// Track shipment by AWB
export const trackShipment = async (awbCode: string) => {
    const response = await authenticatedFetch(`/courier/track/awb/${awbCode}`);

    if (!response.ok) {
        throw new Error('Failed to track shipment');
    }

    return response.json();
};

// Track shipment by order ID
export const trackByOrderId = async (orderId: string) => {
    const response = await authenticatedFetch(
        `/courier/track?order_id=${orderId}`
    );

    if (!response.ok) {
        throw new Error('Failed to track order');
    }

    return response.json();
};

// Generate manifest
export const generateManifest = async (shipmentIds: string[]) => {
    const response = await authenticatedFetch('/manifests/generate', {
        method: 'POST',
        body: JSON.stringify({
            shipment_id: shipmentIds,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to generate manifest');
    }

    return response.json();
};

// Print manifest - returns PDF URL
export const printManifest = async (orderIds: string[]) => {
    const response = await authenticatedFetch('/manifests/print', {
        method: 'POST',
        body: JSON.stringify({
            order_ids: orderIds,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to print manifest');
    }

    return response.json();
};

// Generate shipping label - returns PDF URL
export const generateLabel = async (shipmentIds: string[]) => {
    const response = await authenticatedFetch('/courier/generate/label', {
        method: 'POST',
        body: JSON.stringify({
            shipment_id: shipmentIds,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to generate label');
    }

    return response.json();
};

// Print invoice - returns PDF URL
export const printInvoice = async (orderIds: string[]) => {
    const response = await authenticatedFetch('/orders/print/invoice', {
        method: 'POST',
        body: JSON.stringify({
            ids: orderIds,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to print invoice');
    }

    return response.json();
};

// Cancel order
export const cancelOrder = async (orderIds: string[]) => {
    const response = await authenticatedFetch('/orders/cancel', {
        method: 'POST',
        body: JSON.stringify({
            ids: orderIds,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to cancel order');
    }

    return response.json();
};

// Create a complete order flow for Shadow Bean Co
export const createShadowBeanOrder = async (order: {
    orderId: string;
    customer: {
        name: string;
        email: string;
        phone: string;
        address: string;
        city: string;
        state: string;
        pincode: string;
    };
    items: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    totalAmount: number;
    paymentMethod: 'Prepaid' | 'COD';
}) => {
    // Default pickup location - Shadow Bean Co warehouse
    const PICKUP_LOCATION = 'Shadow Bean Co';

    // Create order
    const createResult = await createOrder({
        order_id: order.orderId,
        order_date: new Date().toISOString().split('T')[0],
        pickup_location: PICKUP_LOCATION,
        billing_customer_name: order.customer.name,
        billing_address: order.customer.address,
        billing_city: order.customer.city,
        billing_state: order.customer.state,
        billing_pincode: order.customer.pincode,
        billing_country: 'India',
        billing_email: order.customer.email,
        billing_phone: order.customer.phone,
        shipping_is_billing: true,
        order_items: order.items.map((item, index) => ({
            name: item.name,
            sku: `SBC-${order.orderId}-${index}`,
            units: item.quantity,
            selling_price: item.price,
        })),
        payment_method: order.paymentMethod,
        sub_total: order.totalAmount,
        length: 20, // Default package dimensions
        breadth: 15,
        height: 10,
        weight: 0.5, // 500g per order
    });

    return {
        shiprocketOrderId: createResult.order_id,
        shiprocketShipmentId: createResult.shipment_id,
    };
};

export default {
    getAuthToken,
    checkServiceability,
    createOrder,
    assignAWB,
    generatePickup,
    trackShipment,
    trackByOrderId,
    generateManifest,
    printManifest,
    generateLabel,
    printInvoice,
    cancelOrder,
    createShadowBeanOrder,
};
