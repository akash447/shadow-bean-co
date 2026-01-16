import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/Colors';
import { useOrderStore } from '@/src/stores/orderStore';

export default function ConfirmationScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { orders } = useOrderStore();
    const latestOrder = orders[0];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                {/* Success Icon */}
                <View style={[styles.iconCircle, { backgroundColor: '#4CAF50' }]}>
                    <Ionicons name="checkmark" size={60} color="#fff" />
                </View>

                <Text style={[styles.title, { color: colors.darkBrown }]}>
                    Order Confirmed!
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Thank you for your order
                </Text>

                {latestOrder && (
                    <View style={[styles.orderCard, { backgroundColor: colors.card }]}>
                        <Text style={[styles.orderId, { color: colors.text }]}>
                            Order #{latestOrder.id.slice(-6).toUpperCase()}
                        </Text>
                        <Text style={[styles.orderAmount, { color: colors.darkBrown }]}>
                            ₹{latestOrder.totalAmount}
                        </Text>
                        <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
                            {new Date(latestOrder.createdAt).toLocaleString()}
                        </Text>
                    </View>
                )}

                <Text style={[styles.message, { color: colors.textSecondary }]}>
                    We'll send you an email confirmation and tracking details once your
                    order is shipped.
                </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.footer}>
                {latestOrder && (
                    <Pressable
                        style={[styles.trackButton, { backgroundColor: colors.oliveGreen }]}
                        onPress={() => router.push(`/order/${latestOrder.id}`)}
                    >
                        <Text style={styles.trackButtonText}>TRACK ORDER</Text>
                    </Pressable>
                )}
                <Pressable
                    style={[styles.homeButton, { borderColor: colors.darkBrown }]}
                    onPress={() => router.replace('/(tabs)')}
                >
                    <Text style={[styles.homeButtonText, { color: colors.darkBrown }]}>
                        CONTINUE SHOPPING
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
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 24,
    },
    orderCard: {
        width: '100%',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 24,
    },
    orderId: {
        fontSize: 14,
        marginBottom: 8,
    },
    orderAmount: {
        fontSize: 32,
        fontWeight: '700',
        marginBottom: 4,
    },
    orderDate: {
        fontSize: 12,
    },
    message: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    footer: {
        padding: 20,
        paddingBottom: 40,
    },
    trackButton: {
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12,
    },
    trackButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    homeButton: {
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 2,
    },
    homeButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
