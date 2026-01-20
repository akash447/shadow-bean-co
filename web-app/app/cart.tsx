import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    useColorScheme,
    Linking,
    Image, // Added Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/Colors';
import { useCartStore } from '@/src/stores/cartStore';
import { Platform } from 'react-native';

export default function CartScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const {
        items,
        termsAccepted,
        setTermsAccepted,
        removeItem,
        updateQuantity,
        getTotalPrice,
        clearCart,
    } = useCartStore();

    const handlePayNow = () => {
        if (!termsAccepted) return;
        router.push('/checkout/payment');
    };

    // LocalStorage Listener for Web Handoff
    React.useEffect(() => {
        if (Platform.OS === 'web') {
            try {
                const pendingItemStr = localStorage.getItem('pendingCartItem');
                if (pendingItemStr) {
                    console.log('Cart: Found pending item in LocalStorage. Injecting...');
                    const pendingItem = JSON.parse(pendingItemStr);

                    // Add Item to Store
                    useCartStore.getState().addItem({
                        id: pendingItem.id,
                        name: pendingItem.name,
                        bitterness: pendingItem.bitterness,
                        acidity: pendingItem.acidity,
                        body: pendingItem.body,
                        flavour: pendingItem.flavour,
                        roastLevel: pendingItem.roastLevel,
                        grindType: pendingItem.grindType,
                    }, 1);

                    // Clear after injection
                    localStorage.removeItem('pendingCartItem');
                    console.log('Cart: Injection Complete. Storage Cleared.');
                }
            } catch (e) {
                console.error('Cart Injection Error:', e);
            }
        }
    }, []);

    if (items.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.emptyCart}>
                    <Ionicons name="cart-outline" size={80} color={colors.textSecondary} />
                    <Text style={[styles.emptyText, { color: colors.text }]}>
                        Your cart is still empty?
                        {/* Debug Hint */}
                        {Platform.OS === 'web' && " (Try refreshing if demo didn't load)"}
                    </Text>
                    <Pressable
                        style={[styles.shopButton, { backgroundColor: colors.darkBrown }]}
                        onPress={() => router.push('/(tabs)/shop')}
                    >
                        <Text style={[styles.shopButtonText, { color: colors.cream }]}>
                            START SHOPPING
                        </Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Cart Items */}
                {items.map((item) => (
                    <View key={item.id} style={[styles.cartItem, { backgroundColor: colors.card }]}>
                        {/* Product Image */}
                        <Image
                            source={require('@/assets/images/product_bag.png')}
                            style={{ width: 50, height: 70, marginRight: 12 }}
                            resizeMode="contain"
                        />
                        <View style={styles.itemInfo}>
                            <Text style={[styles.itemName, { color: colors.text }]}>
                                {item.tasteProfile.name}
                            </Text>
                            <Text style={[styles.itemDetails, { color: colors.textSecondary }]}>
                                {item.tasteProfile.roastLevel} • {item.tasteProfile.grindType}
                            </Text>
                            <Text style={[styles.itemTaste, { color: colors.textSecondary }]}>
                                B:{item.tasteProfile.bitterness} A:{item.tasteProfile.acidity} B:{item.tasteProfile.body} F:{item.tasteProfile.flavour}
                            </Text>
                        </View>
                        <View style={styles.itemActions}>
                            <Text style={[styles.itemPrice, { color: colors.darkBrown }]}>
                                ₹{item.unitPrice}
                            </Text>
                            <View style={styles.quantityControl}>
                                <Pressable
                                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                                    style={[styles.quantityButton, { borderColor: colors.border }]}
                                >
                                    <Ionicons name="remove" size={16} color={colors.text} />
                                </Pressable>
                                <Text style={[styles.quantity, { color: colors.text }]}>
                                    {item.quantity}
                                </Text>
                                <Pressable
                                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                                    style={[styles.quantityButton, { borderColor: colors.border }]}
                                >
                                    <Ionicons name="add" size={16} color={colors.text} />
                                </Pressable>
                            </View>
                            <Pressable onPress={() => removeItem(item.id)}>
                                <Ionicons name="trash-outline" size={20} color="#f44336" />
                            </Pressable>
                        </View>
                    </View>
                ))}

                {/* Order Summary */}
                <View style={[styles.summary, { backgroundColor: colors.card }]}>
                    <Text style={[styles.summaryTitle, { color: colors.darkBrown }]}>
                        Order Summary
                    </Text>
                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                            Subtotal
                        </Text>
                        <Text style={[styles.summaryValue, { color: colors.text }]}>
                            ₹{getTotalPrice()}
                        </Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                            Shipping
                        </Text>
                        <Text style={[styles.summaryValue, { color: colors.text }]}>
                            Free
                        </Text>
                    </View>
                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={[styles.totalLabel, { color: colors.darkBrown }]}>
                            Total
                        </Text>
                        <Text style={[styles.totalValue, { color: colors.darkBrown }]}>
                            ₹{getTotalPrice()}
                        </Text>
                    </View>
                </View>

                {/* Terms & Conditions */}
                <Pressable
                    style={styles.termsRow}
                    onPress={() => setTermsAccepted(!termsAccepted)}
                >
                    <View
                        style={[
                            styles.checkbox,
                            {
                                backgroundColor: termsAccepted ? '#6B8E23' : 'transparent', // Explicit Olive Green
                                borderColor: '#6B8E23',
                            },
                        ]}
                    >
                        {termsAccepted && (
                            <Ionicons name="checkmark" size={14} color="#fff" />
                        )}
                    </View>
                    <Text style={[styles.termsText, { color: colors.text }]}>
                        I agree to the{' '}
                        <Text
                            style={[styles.termsLink, { color: colors.oliveGreen }]}
                            onPress={() => Linking.openURL('https://shadowbeanco.com/terms')}
                        >
                            Terms & Conditions
                        </Text>
                    </Text>
                </Pressable>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Pay Now Button */}
            <View style={[styles.footer, { backgroundColor: colors.background }]}>
                <Pressable
                    style={[
                        styles.payButton,
                        {
                            backgroundColor: termsAccepted ? colors.darkBrown : colors.border,
                        },
                    ]}
                    onPress={handlePayNow}
                    disabled={!termsAccepted}
                >
                    <Text
                        style={[
                            styles.payButtonText,
                            {
                                color: termsAccepted
                                    ? (colorScheme === 'dark' ? '#1c0d02' : '#FFFFFF') // Dark text on Light button in Dark Mode
                                    : colors.textSecondary
                            },
                        ]}
                    >
                        PAY NOW • ₹{getTotalPrice()}
                    </Text>
                </Pressable>
                {!termsAccepted && (
                    <Text style={[styles.termsHint, { color: colors.textSecondary }]}>
                        Please accept Terms & Conditions to proceed
                    </Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    emptyCart: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 18,
        marginTop: 16,
        marginBottom: 24,
    },
    shopButton: {
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 8,
    },
    shopButtonText: {
        fontSize: 14,
        fontWeight: '700',
    },
    cartItem: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    itemDetails: {
        fontSize: 12,
        marginBottom: 2,
    },
    itemTaste: {
        fontSize: 10,
    },
    itemActions: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: '700',
    },
    quantityControl: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
    },
    quantityButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantity: {
        fontSize: 14,
        fontWeight: '600',
        marginHorizontal: 12,
    },
    summary: {
        padding: 16,
        borderRadius: 12,
        marginTop: 8,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
    },
    summaryValue: {
        fontSize: 14,
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 8,
        marginTop: 4,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '700',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    termsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        paddingHorizontal: 4,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 4,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    termsText: {
        fontSize: 14,
        flex: 1,
    },
    termsLink: {
        textDecorationLine: 'underline',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingBottom: 50, // Increased to avoid home indicator
        backgroundColor: 'transparent',
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
    termsHint: {
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 10, // Added margin
    },
});
