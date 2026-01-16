import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Dimensions,
    Image,
    TextInput,
    Modal,
    Alert,
    useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/stores/authStore';
import { useOrderStore } from '@/src/stores/orderStore';
import { useTasteProfileStore } from '@/src/stores/tasteProfileStore';
import { SupabaseImage } from '@/src/components/SupabaseImage';
import { ImageKeys } from '@/src/constants/imageKeys';
import { useCartStore } from '@/src/stores/cartStore';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
    const router = useRouter();
    const { items } = useCartStore();
    const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const { user, isAuthenticated, signOut, updateProfile } = useAuthStore();
    const { orders } = useOrderStore();
    const { profiles, fetchProfiles } = useTasteProfileStore();

    // Responsive dimensions
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const isTablet = SCREEN_WIDTH >= 768;

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editName, setEditName] = useState(user?.fullName || '');

    const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
    const pastOrders = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');

    // Effect to sync profiles on login
    useEffect(() => {
        if (isAuthenticated && user?.id) {
            fetchProfiles(user.id);
        }
    }, [isAuthenticated, user]);

    const handleSaveProfile = () => {
        if (updateProfile) {
            updateProfile({ fullName: editName });
        }
        setIsEditModalOpen(false);
        Alert.alert('Success', 'Profile updated!');
    };

    if (!isAuthenticated) {
        return (
            <View style={styles.container}>
                {/* Fixed Header */}
                <View style={styles.fixedHeader}>
                    <View style={styles.headerLeft}>
                        <SupabaseImage
                            remoteKey={ImageKeys.LOGO_MAIN}
                            defaultSource={require('@/assets/images/logo_bird.png')}
                            style={styles.headerLogo}
                            resizeMode="contain"
                        />
                        <Text style={styles.headerTitle}>SHADOW BEAN CO.</Text>
                    </View>
                    <Pressable onPress={() => router.push('/cart')} style={{ position: 'relative' }}>
                        <Ionicons name="cart-outline" size={24} color="#2C2724" />
                        {cartCount > 0 && (
                            <View style={styles.cartBadge}>
                                <Text style={styles.cartBadgeText}>{cartCount}</Text>
                            </View>
                        )}
                    </Pressable>
                </View>

                <View style={styles.authContainer}>
                    <View style={styles.authIconCircle}>
                        <Ionicons name="person" size={48} color="#fff" />
                    </View>
                    <Text style={styles.authTitle}>JOIN THE CLUB</Text>
                    <Text style={styles.authSubtitle}>
                        Sign in to track orders, save blends, and unlock exclusive rewards.
                    </Text>
                    <Pressable
                        style={styles.primaryButton}
                        onPress={() => router.push('/(auth)/login')}
                    >
                        <Text style={styles.primaryButtonText}>SIGN IN</Text>
                    </Pressable>
                    <Pressable
                        style={styles.secondaryButton}
                        onPress={() => router.push('/(auth)/register')}
                    >
                        <Text style={styles.secondaryButtonText}>CREATE ACCOUNT</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Fixed Header */}
            <View style={styles.fixedHeader}>
                <View style={styles.headerLeft}>
                    <SupabaseImage
                        remoteKey={ImageKeys.LOGO_MAIN}
                        defaultSource={require('@/assets/images/logo_bird.png')}
                        style={styles.headerLogo}
                        resizeMode="contain"
                    />
                    <Text style={styles.headerTitle}>SHADOW BEAN CO.</Text>
                </View>
                <Pressable onPress={() => router.push('/cart')} style={{ position: 'relative' }}>
                    <Ionicons name="cart-outline" size={24} color="#2C2724" />
                    {cartCount > 0 && (
                        <View style={styles.cartBadge}>
                            <Text style={styles.cartBadgeText}>{cartCount}</Text>
                        </View>
                    )}
                </Pressable>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    {/* Avatar */}
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {user?.fullName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                    </View>

                    <Text style={styles.welcomeLabel}>WELCOME BACK</Text>

                    {/* Editable Name */}
                    <Pressable onPress={() => setIsEditModalOpen(true)}>
                        <View style={styles.nameRow}>
                            <Text style={styles.userName}>{user?.fullName || 'Coffee Lover'}</Text>
                            <Ionicons name="pencil" size={16} color="rgba(255,255,255,0.6)" />
                        </View>
                    </Pressable>

                    <Text style={styles.userEmail}>{user?.email}</Text>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{orders.length}</Text>
                            <Text style={styles.statLabel}>Orders</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>0</Text>
                            <Text style={styles.statLabel}>Points</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{profiles.length}</Text>
                            <Text style={styles.statLabel}>Saved Blends</Text>
                        </View>
                    </View>
                </View>

                {/* Active Orders Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ACTIVE ORDERS</Text>
                    {activeOrders.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Ionicons name="cube-outline" size={40} color="#ddd" />
                            <Text style={styles.emptyText}>No brewing orders right now</Text>
                            <Pressable onPress={() => router.push('/(tabs)/shop')}>
                                <Text style={styles.emptyLink}>Start a new blend →</Text>
                            </Pressable>
                        </View>
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {activeOrders.map(order => (
                                <Pressable
                                    key={order.id}
                                    style={styles.orderCard}
                                    onPress={() => router.push(`/order/${order.id}`)}
                                >
                                    <View style={styles.orderStatus}>
                                        <Text style={styles.orderStatusText}>{order.status}</Text>
                                    </View>
                                    <Text style={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
                                    <Text style={styles.orderPrice}>₹{order.totalAmount}</Text>
                                    <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    )}
                </View>

                {/* Past Orders Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>PAST ORDERS</Text>
                    <Text style={styles.sectionSubtitle}>{pastOrders.length} completed order(s)</Text>
                </View>

                {/* Settings Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>SETTINGS</Text>
                    <View style={styles.settingsCard}>
                        <Pressable style={styles.settingRow} onPress={() => router.push('/address')}>
                            <Ionicons name="location-outline" size={22} color="#5D4037" />
                            <Text style={styles.settingText}>Saved Addresses</Text>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </Pressable>
                        <View style={styles.settingDivider} />
                        <Pressable style={styles.settingRow} onPress={() => router.push('/payment-methods')}>
                            <Ionicons name="card-outline" size={22} color="#5D4037" />
                            <Text style={styles.settingText}>Payment Methods</Text>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </Pressable>
                        <View style={styles.settingDivider} />
                        <Pressable style={styles.settingRow} onPress={() => router.push('/notifications')}>
                            <Ionicons name="notifications-outline" size={22} color="#5D4037" />
                            <Text style={styles.settingText}>Notifications</Text>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </Pressable>
                        <View style={styles.settingDivider} />
                        <Pressable style={styles.settingRow} onPress={() => router.push('/help-support')}>
                            <Ionicons name="help-circle-outline" size={22} color="#5D4037" />
                            <Text style={styles.settingText}>Help & Support</Text>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </Pressable>
                    </View>

                    {/* Sign Out */}
                    <Pressable style={styles.signOutButton} onPress={signOut}>
                        <Ionicons name="log-out-outline" size={20} color="#d32f2f" />
                        <Text style={styles.signOutText}>Sign Out</Text>
                    </Pressable>
                </View>

                {/* Bottom Spacing */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Edit Name Modal */}
            <Modal
                visible={isEditModalOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setIsEditModalOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Profile Name</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Enter your name"
                            placeholderTextColor="#999"
                        />
                        <View style={styles.modalButtons}>
                            <Pressable
                                style={styles.modalCancelButton}
                                onPress={() => setIsEditModalOpen(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </Pressable>
                            <Pressable style={styles.modalSaveButton} onPress={handleSaveProfile}>
                                <Text style={styles.modalSaveText}>Save</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAF8F5',
    },

    // Fixed Header
    fixedHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 16,
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.80)',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerLogo: {
        width: 32,
        height: 32,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#2C2724',
        letterSpacing: 1.5,
    },

    // Scroll
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 100,
        paddingHorizontal: 20,
    },

    // Auth Screen
    authContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    authIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#5D4037',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    authTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#2C2724',
        marginBottom: 12,
    },
    authSubtitle: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    primaryButton: {
        width: '100%',
        backgroundColor: '#5D4037',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1,
    },
    secondaryButton: {
        width: '100%',
        borderWidth: 2,
        borderColor: '#5D4037',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#5D4037',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    },

    // Profile Card
    profileCard: {
        backgroundColor: '#5D4037',
        borderRadius: 20,
        padding: 28,
        alignItems: 'center',
        marginBottom: 24,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    avatarText: {
        fontSize: 32,
        color: '#fff',
        fontWeight: '700',
    },
    welcomeLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 2,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 4,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
    },
    userEmail: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 4,
        marginBottom: 20,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
    },
    statLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 2,
        fontWeight: '600',
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginHorizontal: 16,
    },

    // Sections
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 2,
        color: '#888',
        marginBottom: 12,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#666',
    },

    // Empty State
    emptyCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#eee',
        borderStyle: 'dashed',
    },
    emptyText: {
        fontSize: 13,
        color: '#999',
        marginTop: 12,
        marginBottom: 8,
    },
    emptyLink: {
        fontSize: 13,
        fontWeight: '700',
        color: '#5D4037',
    },

    // Order Cards
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        marginRight: 12,
        width: 160,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    orderStatus: {
        alignSelf: 'flex-start',
        backgroundColor: '#6B8E23',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginBottom: 10,
    },
    orderStatusText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#fff',
        textTransform: 'uppercase',
    },
    orderId: {
        fontSize: 11,
        fontWeight: '700',
        color: '#888',
        marginBottom: 4,
    },
    orderPrice: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2C2724',
        marginBottom: 4,
    },
    orderDate: {
        fontSize: 10,
        color: '#bbb',
    },

    // Settings
    settingsCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    settingText: {
        flex: 1,
        marginLeft: 14,
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    settingDivider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginLeft: 52,
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#d32f2f',
    },
    signOutText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#d32f2f',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        width: width - 48,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2C2724',
        marginBottom: 16,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalCancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    modalCancelText: {
        color: '#888',
        fontWeight: '600',
    },
    modalSaveButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: '#5D4037',
        alignItems: 'center',
    },
    modalSaveText: {
        color: '#fff',
        fontWeight: '700',
    },
    cartBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#D32F2F',
        borderRadius: 10,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    cartBadgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: 'bold',
    },
});
