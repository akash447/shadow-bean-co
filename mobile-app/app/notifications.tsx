import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface NotificationSetting {
    id: string;
    title: string;
    description: string;
    enabled: boolean;
}

export default function NotificationsScreen() {
    const router = useRouter();
    const [settings, setSettings] = useState<NotificationSetting[]>([
        { id: 'order', title: 'Order Updates', description: 'Get notified about order status changes', enabled: true },
        { id: 'promo', title: 'Promotions', description: 'Receive special offers and discounts', enabled: true },
        { id: 'news', title: 'New Products', description: 'Be the first to know about new blends', enabled: false },
        { id: 'tips', title: 'Brewing Tips', description: 'Weekly coffee brewing tips and tricks', enabled: false },
        { id: 'reminder', title: 'Refill Reminders', description: 'Remind me when my coffee might be running low', enabled: true },
    ]);

    const toggleSetting = (id: string) => {
        setSettings(settings.map(s =>
            s.id === id ? { ...s, enabled: !s.enabled } : s
        ));
    };

    return (
        <View style={styles.container}>
            <View style={styles.fixedHeader}>
                <Pressable onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#2C2724" />
                </Pressable>
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Push Notifications</Text>
                    {settings.map(setting => (
                        <View key={setting.id} style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <Text style={styles.settingTitle}>{setting.title}</Text>
                                <Text style={styles.settingDesc}>{setting.description}</Text>
                            </View>
                            <Switch
                                value={setting.enabled}
                                onValueChange={() => toggleSetting(setting.id)}
                                trackColor={{ false: '#ddd', true: '#6B8E23' }}
                                thumbColor="#fff"
                            />
                        </View>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Email Preferences</Text>
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingTitle}>Newsletter</Text>
                            <Text style={styles.settingDesc}>Monthly coffee news and stories</Text>
                        </View>
                        <Switch
                            value={true}
                            trackColor={{ false: '#ddd', true: '#6B8E23' }}
                            thumbColor="#fff"
                        />
                    </View>
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingTitle}>Order Receipts</Text>
                            <Text style={styles.settingDesc}>Email confirmations for purchases</Text>
                        </View>
                        <Switch
                            value={true}
                            trackColor={{ false: '#ddd', true: '#6B8E23' }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

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
    section: {
        backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#5D4037', marginBottom: 16, letterSpacing: 1 },
    settingRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    },
    settingInfo: { flex: 1, marginRight: 16 },
    settingTitle: { fontSize: 14, fontWeight: '600', color: '#2C2724', marginBottom: 2 },
    settingDesc: { fontSize: 12, color: '#888' },
});
