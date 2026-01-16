import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    TextInput,
    Linking,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface FAQ {
    question: string;
    answer: string;
}

const FAQS: FAQ[] = [
    {
        question: 'How does custom roasting work?',
        answer: 'Our salt-air roasting technology allows you to personalize bitterness, acidity, body, and flavor levels. Once you set your preferences, we roast your beans to match your exact taste profile.',
    },
    {
        question: 'How long does shipping take?',
        answer: 'We ship within 24 hours of roasting. Delivery typically takes 3-5 business days depending on your location. All orders include tracking.',
    },
    {
        question: 'Can I modify my subscription?',
        answer: 'Yes! You can pause, skip, or cancel your subscription anytime from your Profile. You can also change your blend preferences before each shipment.',
    },
    {
        question: 'What grind options do you offer?',
        answer: 'We offer Whole Bean, French Press, Pour Over, Espresso, Drip, and Aeropress grinds to match your brewing method.',
    },
    {
        question: 'How should I store my coffee?',
        answer: 'Store in a cool, dry place away from sunlight. Our bags have a one-way valve to keep coffee fresh. Use within 4-6 weeks of roasting for best flavor.',
    },
];

export default function HelpSupportScreen() {
    const router = useRouter();
    const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
    const [contactMessage, setContactMessage] = useState('');

    const handleEmail = () => {
        Linking.openURL('mailto:support@shadowbean.co?subject=Help Request');
    };

    const handlePhone = () => {
        Linking.openURL('tel:+919876543210');
    };

    const handleWhatsApp = () => {
        Linking.openURL('https://wa.me/919876543210?text=Hi, I need help with my order');
    };

    const handleSubmit = () => {
        if (!contactMessage.trim()) {
            Alert.alert('Error', 'Please enter your message');
            return;
        }
        Alert.alert('Message Sent', 'We\'ll get back to you within 24 hours!');
        setContactMessage('');
    };

    return (
        <View style={styles.container}>
            <View style={styles.fixedHeader}>
                <Pressable onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#2C2724" />
                </Pressable>
                <Text style={styles.headerTitle}>Help & Support</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Contact Options */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Us</Text>
                    <View style={styles.contactRow}>
                        <Pressable style={styles.contactButton} onPress={handleEmail}>
                            <Ionicons name="mail" size={24} color="#5D4037" />
                            <Text style={styles.contactLabel}>Email</Text>
                        </Pressable>
                        <Pressable style={styles.contactButton} onPress={handlePhone}>
                            <Ionicons name="call" size={24} color="#5D4037" />
                            <Text style={styles.contactLabel}>Call</Text>
                        </Pressable>
                        <Pressable style={styles.contactButton} onPress={handleWhatsApp}>
                            <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                            <Text style={styles.contactLabel}>WhatsApp</Text>
                        </Pressable>
                    </View>
                </View>

                {/* FAQs */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                    {FAQS.map((faq, index) => (
                        <Pressable
                            key={index}
                            style={styles.faqItem}
                            onPress={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                        >
                            <View style={styles.faqHeader}>
                                <Text style={styles.faqQuestion}>{faq.question}</Text>
                                <Ionicons
                                    name={expandedFAQ === index ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color="#888"
                                />
                            </View>
                            {expandedFAQ === index && (
                                <Text style={styles.faqAnswer}>{faq.answer}</Text>
                            )}
                        </Pressable>
                    ))}
                </View>

                {/* Send Message */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Send Us a Message</Text>
                    <TextInput
                        style={styles.messageInput}
                        placeholder="Describe your issue or question..."
                        placeholderTextColor="#999"
                        value={contactMessage}
                        onChangeText={setContactMessage}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                    <Pressable style={styles.submitButton} onPress={handleSubmit}>
                        <Text style={styles.submitText}>SEND MESSAGE</Text>
                    </Pressable>
                </View>

                {/* Links */}
                <View style={styles.linksSection}>
                    <Pressable style={styles.linkItem} onPress={() => Linking.openURL('https://shadowbean.co/terms')}>
                        <Text style={styles.linkText}>Terms of Service</Text>
                        <Ionicons name="chevron-forward" size={16} color="#888" />
                    </Pressable>
                    <Pressable style={styles.linkItem} onPress={() => Linking.openURL('https://shadowbean.co/privacy')}>
                        <Text style={styles.linkText}>Privacy Policy</Text>
                        <Ionicons name="chevron-forward" size={16} color="#888" />
                    </Pressable>
                    <Pressable style={styles.linkItem} onPress={() => Linking.openURL('https://shadowbean.co/refunds')}>
                        <Text style={styles.linkText}>Return & Refund Policy</Text>
                        <Ionicons name="chevron-forward" size={16} color="#888" />
                    </Pressable>
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
    contactRow: { flexDirection: 'row', justifyContent: 'space-around' },
    contactButton: { alignItems: 'center', padding: 16 },
    contactLabel: { fontSize: 12, color: '#666', marginTop: 6 },
    faqItem: {
        borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingVertical: 12,
    },
    faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    faqQuestion: { fontSize: 14, fontWeight: '600', color: '#2C2724', flex: 1, marginRight: 8 },
    faqAnswer: { fontSize: 13, color: '#666', marginTop: 8, lineHeight: 20 },
    messageInput: {
        borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 14,
        fontSize: 14, minHeight: 100, color: '#333',
    },
    submitButton: {
        backgroundColor: '#5D4037', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 12,
    },
    submitText: { color: '#fff', fontWeight: '700', letterSpacing: 1 },
    linksSection: {
        backgroundColor: '#fff', borderRadius: 16, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    linkItem: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    },
    linkText: { fontSize: 14, color: '#2C2724' },
});
