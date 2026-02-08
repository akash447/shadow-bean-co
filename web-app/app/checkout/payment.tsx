import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    useColorScheme,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/Colors';
import { useCartStore } from '@/src/stores/cartStore';
import { useOrderStore, Order } from '@/src/stores/orderStore';
import { useAuthStore } from '@/src/stores/authStore';
import { createOrder } from '@/src/services/cognito-auth';

type PaymentMethod = 'cod' | 'razorpay' | null;

export default function PaymentScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { items, getTotalPrice, clearCart } = useCartStore();
    const { addOrder } = useOrderStore();
    const { user } = useAuthStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);

    // Create order via API
    const createApiOrder = async (paymentMethod: string) => {
        try {
            const { order: data, error } = await createOrder({
                userId: user?.id || '00000000-0000-0000-0000-000000000000',
                totalAmount: getTotalPrice(),
                razorpayPaymentId: paymentMethod === 'cod' ? 'cod' : '',
                shippingAddress: {
                    name: user?.fullName || 'Guest',
                    city: 'Bangalore',
                    state: 'Karnataka',
                },
                items: items.map((item) => ({
                    tasteProfileId: item.tasteProfile.id,
                    tasteProfileName: item.tasteProfile.name,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                })),
            });

            if (error) throw new Error(error.message);
            return data;
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    };

    const handleCODPayment = async () => {
        if (!selectedMethod) {
            Alert.alert('Select Payment', 'Please select a payment method');
            return;
        }

        setIsProcessing(true);

        try {
            // Create order via API
            const apiOrder = await createApiOrder('cod');

            // Create local order
            const order: Order = {
                id: apiOrder.id || `order-${Date.now()}`,
                userId: user?.id || 'guest',
                status: 'pending',
                totalAmount: getTotalPrice(),
                paymentMethod: 'cod',
                shippingAddress: {
                    name: user?.fullName || 'Guest',
                    phone: '9876543210',
                    street: '123 Coffee Lane',
                    city: 'Bangalore',
                    state: 'Karnataka',
                    zip: '560001',
                },
                items: items.map((item) => ({
                    tasteProfileId: item.tasteProfile.id,
                    tasteProfileName: item.tasteProfile.name,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                })),
                createdAt: new Date().toISOString(),
            };

            addOrder(order);
            clearCart();
            setIsProcessing(false);
            router.replace('/checkout/confirmation');
        } catch (error) {
            setIsProcessing(false);
            Alert.alert('Order Failed', 'Unable to place order. Please try again.');
        }
    };

    const handlePayWithRazorpay = async () => {
        Alert.alert(
            'Coming Soon',
            'Online payment will be available soon. Please use Cash on Delivery for now.',
            [{ text: 'OK' }]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView style={styles.content}>
                {/* Order Summary */}
                <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.summaryTitle, { color: Colors.darkBrown }]}>
                        Order Summary
                    </Text>
                    {items.map((item) => (
                        <View key={item.id} style={styles.summaryItem}>
                            <Text style={[styles.itemName, { color: colors.text }]}>
                                {item.tasteProfile.name} x {item.quantity}
                            </Text>
                            <Text style={[styles.itemPrice, { color: colors.text }]}>
                                ₹{item.unitPrice * item.quantity}
                            </Text>
                        </View>
                    ))}
                    <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
                        <Text style={[styles.totalLabel, { color: Colors.darkBrown }]}>
                            Total
                        </Text>
                        <Text style={[styles.totalValue, { color: Colors.darkBrown }]}>
                            ₹{getTotalPrice()}
                        </Text>
                    </View>
                </View>

                {/* Payment Methods */}
                <Text style={[styles.sectionTitle, { color: Colors.darkBrown }]}>
                    Select Payment Method
                </Text>

                {/* Cash on Delivery Option */}
                <Pressable
                    style={[
                        styles.paymentOption,
                        {
                            borderColor: selectedMethod === 'cod' ? Colors.oliveGreen : colors.border,
                            backgroundColor: selectedMethod === 'cod' ? colors.card : colors.background,
                            borderWidth: selectedMethod === 'cod' ? 2 : 1,
                        }
                    ]}
                    onPress={() => setSelectedMethod('cod')}
                >
                    <View style={styles.paymentOptionContent}>
                        <Ionicons
                            name={selectedMethod === 'cod' ? 'radio-button-on' : 'radio-button-off'}
                            size={24}
                            color={selectedMethod === 'cod' ? Colors.oliveGreen : colors.textSecondary}
                        />
                        <View style={styles.paymentOptionText}>
                            <Text style={[styles.paymentOptionTitle, { color: colors.text }]}>
                                Cash on Delivery
                            </Text>
                            <Text style={[styles.paymentOptionDesc, { color: colors.textSecondary }]}>
                                Pay when you receive your order
                            </Text>
                        </View>
                    </View>
                    <Ionicons name="cash-outline" size={28} color={Colors.oliveGreen} />
                </Pressable>

                {/* Razorpay Option (Coming Soon) */}
                <Pressable
                    style={[
                        styles.paymentOption,
                        {
                            borderColor: selectedMethod === 'razorpay' ? Colors.oliveGreen : colors.border,
                            backgroundColor: colors.background,
                            opacity: 0.6,
                            marginTop: 12,
                        }
                    ]}
                    onPress={handlePayWithRazorpay}
                >
                    <View style={styles.paymentOptionContent}>
                        <Ionicons
                            name="radio-button-off"
                            size={24}
                            color={colors.textSecondary}
                        />
                        <View style={styles.paymentOptionText}>
                            <Text style={[styles.paymentOptionTitle, { color: colors.text }]}>
                                Online Payment
                            </Text>
                            <Text style={[styles.paymentOptionDesc, { color: colors.textSecondary }]}>
                                Cards, UPI, Net Banking • Coming Soon
                            </Text>
                        </View>
                    </View>
                    <Ionicons name="card-outline" size={28} color={colors.textSecondary} />
                </Pressable>

                {/* COD Note */}
                <View style={[styles.noteCard, { backgroundColor: Colors.cream }]}>
                    <Ionicons name="information-circle-outline" size={20} color={Colors.darkBrown} />
                    <Text style={[styles.noteText, { color: Colors.darkBrown }]}>
                        Please keep exact change ready at the time of delivery.
                    </Text>
                </View>

                {/* Processing Overlay */}
                {isProcessing && (
                    <View style={styles.processingOverlay}>
                        <View style={[styles.processingCard, { backgroundColor: colors.card }]}>
                            <ActivityIndicator size="large" color={Colors.oliveGreen} />
                            <Text style={[styles.processingText, { color: colors.text }]}>
                                Placing your order...
                            </Text>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Place Order Button */}
            <View style={[styles.footer, { backgroundColor: colors.background }]}>
                <Pressable
                    style={[
                        styles.payButton,
                        {
                            backgroundColor: selectedMethod ? colors.darkBrown : '#cccccc',
                        }
                    ]}
                    onPress={handleCODPayment}
                    disabled={isProcessing || !selectedMethod}
                >
                    <Text style={[
                        styles.payButtonText,
                        {
                            color: (colorScheme === 'dark' && selectedMethod) ? '#1c0d02' : '#ffffff'
                        }
                    ]}>
                        {isProcessing ? 'PLACING ORDER...' : `PAY NOW • ₹${getTotalPrice()}`}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    summaryCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },
    summaryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    itemName: {
        fontSize: 14,
    },
    itemPrice: {
        fontSize: 14,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        paddingTop: 12,
        marginTop: 8,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '700',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
    },
    paymentOptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    paymentOptionText: {
        marginLeft: 12,
    },
    paymentOptionTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    paymentOptionDesc: {
        fontSize: 12,
        marginTop: 2,
    },
    processingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    processingCard: {
        padding: 32,
        borderRadius: 16,
        alignItems: 'center',
    },
    processingText: {
        marginTop: 16,
        fontSize: 16,
    },
    footer: {
        padding: 16,
        paddingBottom: 32,
    },
    payButton: {
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    payButtonText: {
        fontSize: 16,
        fontWeight: '700',
    },
    noteCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginTop: 16,
        gap: 8,
    },
    noteText: {
        flex: 1,
        fontSize: 13,
    },
});
