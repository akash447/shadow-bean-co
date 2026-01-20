import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    TextInput,
    Alert,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/stores/authStore';

interface Address {
    id: string;
    label: string;
    fullAddress: string;
    city: string;
    pincode: string;
    isDefault: boolean;
}

export default function AddressScreen() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newAddress, setNewAddress] = useState({
        label: '',
        fullAddress: '',
        city: '',
        pincode: '',
    });

    // Mock data - in real app, fetch from Supabase
    useEffect(() => {
        setAddresses([
            {
                id: '1',
                label: 'Home',
                fullAddress: '123 Coffee Lane, Apartment 4B',
                city: 'Mumbai',
                pincode: '400001',
                isDefault: true,
            },
        ]);
    }, []);

    const handleAddAddress = () => {
        if (!newAddress.fullAddress || !newAddress.city || !newAddress.pincode) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }
        const id = Date.now().toString();
        setAddresses([...addresses, { ...newAddress, id, isDefault: false }]);
        setNewAddress({ label: '', fullAddress: '', city: '', pincode: '' });
        setIsAddingNew(false);
        Alert.alert('Success', 'Address added!');
    };

    const handleSetDefault = (id: string) => {
        setAddresses(addresses.map(addr => ({
            ...addr,
            isDefault: addr.id === id,
        })));
    };

    const handleDelete = (id: string) => {
        Alert.alert('Delete Address', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: () => {
                    setAddresses(addresses.filter(addr => addr.id !== id));
                }
            },
        ]);
    };

    return (
        <View style={styles.container}>
            {/* Fixed Header */}
            <View style={styles.fixedHeader}>
                <Pressable onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#2C2724" />
                </Pressable>
                <Text style={styles.headerTitle}>Saved Addresses</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Address List */}
                {addresses.map(addr => (
                    <View key={addr.id} style={styles.addressCard}>
                        <View style={styles.addressHeader}>
                            <View style={styles.labelBadge}>
                                <Ionicons
                                    name={addr.label === 'Home' ? 'home' : 'business'}
                                    size={14}
                                    color="#5D4037"
                                />
                                <Text style={styles.labelText}>{addr.label || 'Address'}</Text>
                            </View>
                            {addr.isDefault && (
                                <View style={styles.defaultBadge}>
                                    <Text style={styles.defaultText}>DEFAULT</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.addressText}>{addr.fullAddress}</Text>
                        <Text style={styles.cityText}>{addr.city}, {addr.pincode}</Text>

                        <View style={styles.cardActions}>
                            {!addr.isDefault && (
                                <Pressable
                                    style={styles.actionButton}
                                    onPress={() => handleSetDefault(addr.id)}
                                >
                                    <Text style={styles.actionText}>Set Default</Text>
                                </Pressable>
                            )}
                            <Pressable
                                style={[styles.actionButton, styles.deleteButton]}
                                onPress={() => handleDelete(addr.id)}
                            >
                                <Text style={styles.deleteText}>Delete</Text>
                            </Pressable>
                        </View>
                    </View>
                ))}

                {/* Add New Address Form */}
                {isAddingNew ? (
                    <View style={styles.addForm}>
                        <Text style={styles.formTitle}>Add New Address</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Label (e.g., Home, Office)"
                            placeholderTextColor="#999"
                            value={newAddress.label}
                            onChangeText={(text) => setNewAddress({ ...newAddress, label: text })}
                        />
                        <TextInput
                            style={[styles.input, styles.multilineInput]}
                            placeholder="Full Address"
                            placeholderTextColor="#999"
                            value={newAddress.fullAddress}
                            onChangeText={(text) => setNewAddress({ ...newAddress, fullAddress: text })}
                            multiline
                        />
                        <View style={styles.inputRow}>
                            <TextInput
                                style={[styles.input, { flex: 1, marginRight: 8 }]}
                                placeholder="City"
                                placeholderTextColor="#999"
                                value={newAddress.city}
                                onChangeText={(text) => setNewAddress({ ...newAddress, city: text })}
                            />
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="Pincode"
                                placeholderTextColor="#999"
                                value={newAddress.pincode}
                                onChangeText={(text) => setNewAddress({ ...newAddress, pincode: text })}
                                keyboardType="number-pad"
                            />
                        </View>
                        <View style={styles.formButtons}>
                            <Pressable
                                style={styles.cancelFormButton}
                                onPress={() => setIsAddingNew(false)}
                            >
                                <Text style={styles.cancelFormText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={styles.saveFormButton}
                                onPress={handleAddAddress}
                            >
                                <Text style={styles.saveFormText}>Save Address</Text>
                            </Pressable>
                        </View>
                    </View>
                ) : (
                    <Pressable
                        style={styles.addButton}
                        onPress={() => setIsAddingNew(true)}
                    >
                        <Ionicons name="add-circle-outline" size={24} color="#5D4037" />
                        <Text style={styles.addButtonText}>Add New Address</Text>
                    </Pressable>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAF8F5',
    },
    fixedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.90)',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2C2724',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    addressCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    addressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    labelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F5F2',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    labelText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#5D4037',
        marginLeft: 4,
    },
    defaultBadge: {
        backgroundColor: '#6B8E23',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        marginLeft: 8,
    },
    defaultText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#fff',
    },
    addressText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
    cityText: {
        fontSize: 13,
        color: '#888',
        marginBottom: 12,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: '#F0EDE8',
    },
    actionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#5D4037',
    },
    deleteButton: {
        backgroundColor: '#FEE',
    },
    deleteText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#d32f2f',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        borderWidth: 2,
        borderColor: '#E8E4DF',
        borderStyle: 'dashed',
    },
    addButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#5D4037',
        marginLeft: 8,
    },
    addForm: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
    },
    formTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2C2724',
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        marginBottom: 12,
        color: '#333',
    },
    multilineInput: {
        height: 70,
        textAlignVertical: 'top',
    },
    inputRow: {
        flexDirection: 'row',
    },
    formButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    cancelFormButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    cancelFormText: {
        color: '#888',
        fontWeight: '600',
    },
    saveFormButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: '#5D4037',
        alignItems: 'center',
    },
    saveFormText: {
        color: '#fff',
        fontWeight: '700',
    },
});
