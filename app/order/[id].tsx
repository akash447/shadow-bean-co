import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    useColorScheme,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/Colors';
import { useOrderStore } from '@/src/stores/orderStore';

const STATUS_STEPS = [
    { key: 'confirmed', label: 'Order Confirmed', icon: 'checkmark-circle' },
    { key: 'processing', label: 'Processing', icon: 'cube' },
    { key: 'shipped', label: 'Shipped', icon: 'airplane' },
    { key: 'delivered', label: 'Delivered', icon: 'home' },
];

export default function OrderDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { orders } = useOrderStore();

    const order = orders.find((o) => o.id === id);

    if (!order) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.notFound}>
                    <Ionicons name="alert-circle-outline" size={60} color={colors.textSecondary} />
                    <Text style={[styles.notFoundText, { color: colors.text }]}>
                        Order not found
                    </Text>
                    <Pressable
                        style={[styles.backButton, { backgroundColor: colors.darkBrown }]}
                        onPress={() => router.back()}
                    >
                        <Text style={[styles.backButtonText, { color: colors.cream }]}>
                            GO BACK
                        </Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    const currentStatusIndex = STATUS_STEPS.findIndex(
        (step) => step.key === order.status
    );

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            showsVerticalScrollIndicator={false}
        >
            {/* Order Header */}
            <View style={[styles.header, { backgroundColor: colors.card }]}>
                <Text style={[styles.orderId, { color: colors.darkBrown }]}>
                    Order #{order.id.slice(-6).toUpperCase()}
                </Text>
                <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                </Text>
            </View>

            {/* Tracking Status */}
            <View style={styles.trackingSection}>
                <Text style={[styles.sectionTitle, { color: colors.darkBrown }]}>
                    Order Status
                </Text>
                <View style={[styles.trackingCard, { backgroundColor: colors.card }]}>
                    {STATUS_STEPS.map((step, index) => {
                        const isCompleted = index <= currentStatusIndex;
                        const isCurrent = index === currentStatusIndex;
                        return (
                            <View key={step.key} style={styles.trackingStep}>
                                <View style={styles.trackingIconContainer}>
                                    <View
                                        style={[
                                            styles.trackingIcon,
                                            {
                                                backgroundColor: isCompleted ? colors.oliveGreen : colors.border,
                                            },
                                        ]}
                                    >
                                        <Ionicons
                                            name={step.icon as any}
                                            size={20}
                                            color={isCompleted ? '#fff' : colors.textSecondary}
                                        />
                                    </View>
                                    {index < STATUS_STEPS.length - 1 && (
                                        <View
                                            style={[
                                                styles.trackingLine,
                                                {
                                                    backgroundColor:
                                                        index < currentStatusIndex ? colors.oliveGreen : colors.border,
                                                },
                                            ]}
                                        />
                                    )}
                                </View>
                                <View style={styles.trackingContent}>
                                    <Text
                                        style={[
                                            styles.trackingLabel,
                                            {
                                                color: isCurrent ? colors.darkBrown : colors.textSecondary,
                                                fontWeight: isCurrent ? '700' : '400',
                                            },
                                        ]}
                                    >
                                        {step.label}
                                    </Text>
                                    {isCurrent && order.trackingStatus && (
                                        <Text style={[styles.trackingDetail, { color: colors.oliveGreen }]}>
                                            {order.trackingStatus}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* Shiprocket Tracking */}
            {order.shiprocketShipmentId && (
                <View style={styles.shiprocketSection}>
                    <Pressable
                        style={[styles.shiprocketButton, { backgroundColor: colors.oliveGreen }]}
                    >
                        <Ionicons name="locate-outline" size={20} color="#fff" />
                        <Text style={styles.shiprocketButtonText}>Track with Shiprocket</Text>
                    </Pressable>
                </View>
            )}

            {/* Order Items */}
            <View style={styles.itemsSection}>
                <Text style={[styles.sectionTitle, { color: colors.darkBrown }]}>
                    Order Items
                </Text>
                {order.items.map((item, index) => (
                    <View
                        key={index}
                        style={[styles.itemCard, { backgroundColor: colors.card }]}
                    >
                        <View style={styles.itemInfo}>
                            <Text style={[styles.itemName, { color: colors.text }]}>
                                {item.tasteProfileName}
                            </Text>
                            <Text style={[styles.itemQty, { color: colors.textSecondary }]}>
                                Qty: {item.quantity}
                            </Text>
                        </View>
                        <Text style={[styles.itemPrice, { color: colors.darkBrown }]}>
                            ₹{item.unitPrice * item.quantity}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Shipping Address */}
            <View style={styles.addressSection}>
                <Text style={[styles.sectionTitle, { color: colors.darkBrown }]}>
                    Shipping Address
                </Text>
                <View style={[styles.addressCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.addressName, { color: colors.text }]}>
                        {order.shippingAddress.name}
                    </Text>
                    <Text style={[styles.addressLine, { color: colors.textSecondary }]}>
                        {order.shippingAddress.street}
                    </Text>
                    <Text style={[styles.addressLine, { color: colors.textSecondary }]}>
                        {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zip}
                    </Text>
                    <Text style={[styles.addressPhone, { color: colors.textSecondary }]}>
                        Phone: {order.shippingAddress.phone}
                    </Text>
                </View>
            </View>

            {/* Total */}
            <View style={[styles.totalSection, { backgroundColor: colors.card }]}>
                <Text style={[styles.totalLabel, { color: colors.darkBrown }]}>
                    Order Total
                </Text>
                <Text style={[styles.totalValue, { color: colors.darkBrown }]}>
                    ₹{order.totalAmount}
                </Text>
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    notFound: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    notFoundText: {
        fontSize: 18,
        marginTop: 16,
        marginBottom: 24,
    },
    backButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    backButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    header: {
        padding: 20,
        marginBottom: 8,
    },
    orderId: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    orderDate: {
        fontSize: 13,
    },
    trackingSection: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },
    trackingCard: {
        padding: 16,
        borderRadius: 12,
    },
    trackingStep: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    trackingIconContainer: {
        alignItems: 'center',
        width: 40,
    },
    trackingIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    trackingLine: {
        width: 2,
        height: 30,
        marginVertical: 4,
    },
    trackingContent: {
        flex: 1,
        marginLeft: 12,
        paddingTop: 6,
    },
    trackingLabel: {
        fontSize: 14,
    },
    trackingDetail: {
        fontSize: 12,
        marginTop: 2,
    },
    shiprocketSection: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    shiprocketButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 8,
        gap: 8,
    },
    shiprocketButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    itemsSection: {
        padding: 20,
    },
    itemCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    itemInfo: {},
    itemName: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    itemQty: {
        fontSize: 12,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: '700',
    },
    addressSection: {
        padding: 20,
    },
    addressCard: {
        padding: 16,
        borderRadius: 12,
    },
    addressName: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    addressLine: {
        fontSize: 13,
        marginBottom: 2,
    },
    addressPhone: {
        fontSize: 13,
        marginTop: 8,
    },
    totalSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    totalValue: {
        fontSize: 24,
        fontWeight: '700',
    },
});
