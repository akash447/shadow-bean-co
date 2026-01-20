import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    TextInput,
    Alert,
    Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/stores/authStore';

interface PaymentMethod {
    id: string;
    type: 'card' | 'upi';
    last4?: string;
    brand?: string;
    upiId?: string;
    isDefault: boolean;
}

export default function PaymentMethodScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [isAddingCard, setIsAddingCard] = useState(false);
    const [isAddingUPI, setIsAddingUPI] = useState(false);
    const [cardNumber, setCardNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');
    const [upiId, setUpiId] = useState('');

    useEffect(() => {
        // Mock data
        setPaymentMethods([
            { id: '1', type: 'card', last4: '4242', brand: 'Visa', isDefault: true },
        ]);
    }, []);

    const handleAddCard = () => {
        if (!cardNumber || !expiryDate || !cvv) {
            Alert.alert('Error', 'Please fill all card details');
            return;
        }
        const id = Date.now().toString();
        setPaymentMethods([...paymentMethods, {
            id,
            type: 'card',
            last4: cardNumber.slice(-4),
            brand: cardNumber.startsWith('4') ? 'Visa' : 'Mastercard',
            isDefault: false,
        }]);
        setCardNumber('');
        setExpiryDate('');
        setCvv('');
        setIsAddingCard(false);
        Alert.alert('Success', 'Card added!');
    };

    const handleAddUPI = () => {
        if (!upiId || !upiId.includes('@')) {
            Alert.alert('Error', 'Please enter a valid UPI ID');
            return;
        }
        const id = Date.now().toString();
        setPaymentMethods([...paymentMethods, {
            id,
            type: 'upi',
            upiId,
            isDefault: false,
        }]);
        setUpiId('');
        setIsAddingUPI(false);
        Alert.alert('Success', 'UPI added!');
    };

    const handleSetDefault = (id: string) => {
        setPaymentMethods(paymentMethods.map(pm => ({
            ...pm,
            isDefault: pm.id === id,
        })));
    };

    const handleDelete = (id: string) => {
        Alert.alert('Delete Payment Method', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: () => {
                    setPaymentMethods(paymentMethods.filter(pm => pm.id !== id));
                }
            },
        ]);
    };

    return (
        <View style={styles.container}>
            <View style={styles.fixedHeader}>
                <Pressable onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#2C2724" />
                </Pressable>
                <Text style={styles.headerTitle}>Payment Methods</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Saved Cards/UPI */}
                {paymentMethods.map(pm => (
                    <View key={pm.id} style={styles.methodCard}>
                        <View style={styles.methodHeader}>
                            <View style={styles.methodInfo}>
                                <Ionicons
                                    name={pm.type === 'card' ? 'card' : 'phone-portrait'}
                                    size={20}
                                    color="#5D4037"
                                />
                                <View style={{ marginLeft: 12 }}>
                                    {pm.type === 'card' ? (
                                        <>
                                            <Text style={styles.methodLabel}>{pm.brand}</Text>
                                            <Text style={styles.methodDetail}>•••• {pm.last4}</Text>
                                        </>
                                    ) : (
                                        <>
                                            <Text style={styles.methodLabel}>UPI</Text>
                                            <Text style={styles.methodDetail}>{pm.upiId}</Text>
                                        </>
                                    )}
                                </View>
                            </View>
                            {pm.isDefault && (
                                <View style={styles.defaultBadge}>
                                    <Text style={styles.defaultText}>DEFAULT</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.cardActions}>
                            {!pm.isDefault && (
                                <Pressable
                                    style={styles.actionButton}
                                    onPress={() => handleSetDefault(pm.id)}
                                >
                                    <Text style={styles.actionText}>Set Default</Text>
                                </Pressable>
                            )}
                            <Pressable
                                style={[styles.actionButton, styles.deleteButton]}
                                onPress={() => handleDelete(pm.id)}
                            >
                                <Text style={styles.deleteText}>Delete</Text>
                            </Pressable>
                        </View>
                    </View>
                ))}

                {/* Add Card Form */}
                {isAddingCard && (
                    <View style={styles.addForm}>
                        <Text style={styles.formTitle}>Add Card</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Card Number"
                            placeholderTextColor="#999"
                            value={cardNumber}
                            onChangeText={setCardNumber}
                            keyboardType="number-pad"
                            maxLength={16}
                        />
                        <View style={styles.inputRow}>
                            <TextInput
                                style={[styles.input, { flex: 1, marginRight: 8 }]}
                                placeholder="MM/YY"
                                placeholderTextColor="#999"
                                value={expiryDate}
                                onChangeText={setExpiryDate}
                                maxLength={5}
                            />
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="CVV"
                                placeholderTextColor="#999"
                                value={cvv}
                                onChangeText={setCvv}
                                keyboardType="number-pad"
                                maxLength={3}
                                secureTextEntry
                            />
                        </View>
                        <View style={styles.formButtons}>
                            <Pressable style={styles.cancelFormButton} onPress={() => setIsAddingCard(false)}>
                                <Text style={styles.cancelFormText}>Cancel</Text>
                            </Pressable>
                            <Pressable style={styles.saveFormButton} onPress={handleAddCard}>
                                <Text style={styles.saveFormText}>Add Card</Text>
                            </Pressable>
                        </View>
                    </View>
                )}

                {/* Add UPI Form */}
                {isAddingUPI && (
                    <View style={styles.addForm}>
                        <Text style={styles.formTitle}>Add UPI</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter UPI ID (e.g., name@upi)"
                            placeholderTextColor="#999"
                            value={upiId}
                            onChangeText={setUpiId}
                            autoCapitalize="none"
                        />
                        <View style={styles.formButtons}>
                            <Pressable style={styles.cancelFormButton} onPress={() => setIsAddingUPI(false)}>
                                <Text style={styles.cancelFormText}>Cancel</Text>
                            </Pressable>
                            <Pressable style={styles.saveFormButton} onPress={handleAddUPI}>
                                <Text style={styles.saveFormText}>Add UPI</Text>
                            </Pressable>
                        </View>
                    </View>
                )}

                {/* Add Buttons */}
                {!isAddingCard && !isAddingUPI && (
                    <View style={styles.addButtons}>
                        <Pressable style={styles.addButton} onPress={() => setIsAddingCard(true)}>
                            <Ionicons name="card-outline" size={24} color="#5D4037" />
                            <Text style={styles.addButtonText}>Add Card</Text>
                        </Pressable>
                        <Pressable style={styles.addButton} onPress={() => setIsAddingUPI(true)}>
                            <Ionicons name="phone-portrait-outline" size={24} color="#5D4037" />
                            <Text style={styles.addButtonText}>Add UPI</Text>
                        </Pressable>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAF8F5' },
    fixedHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16,
        backgroundColor: 'rgba(255,255,255,0.90)',
    },
    headerTitle: { fontSize: 16, fontWeight: '700', color: '#2C2724' },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
    methodCard: {
        backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    methodHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    methodInfo: { flexDirection: 'row', alignItems: 'center' },
    methodLabel: { fontSize: 14, fontWeight: '700', color: '#2C2724' },
    methodDetail: { fontSize: 12, color: '#888' },
    defaultBadge: { backgroundColor: '#6B8E23', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
    defaultText: { fontSize: 9, fontWeight: '700', color: '#fff' },
    cardActions: { flexDirection: 'row', gap: 8 },
    actionButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#F0EDE8' },
    actionText: { fontSize: 12, fontWeight: '600', color: '#5D4037' },
    deleteButton: { backgroundColor: '#FEE' },
    deleteText: { fontSize: 12, fontWeight: '600', color: '#d32f2f' },
    addButtons: { gap: 12 },
    addButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#fff', borderRadius: 16, padding: 20,
        borderWidth: 2, borderColor: '#E8E4DF', borderStyle: 'dashed',
    },
    addButtonText: { fontSize: 14, fontWeight: '600', color: '#5D4037', marginLeft: 8 },
    addForm: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 12 },
    formTitle: { fontSize: 16, fontWeight: '700', color: '#2C2724', marginBottom: 16 },
    input: {
        borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 12, color: '#333',
    },
    inputRow: { flexDirection: 'row' },
    formButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
    cancelFormButton: { flex: 1, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
    cancelFormText: { color: '#888', fontWeight: '600' },
    saveFormButton: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: '#5D4037', alignItems: 'center' },
    saveFormText: { color: '#fff', fontWeight: '700' },
});
