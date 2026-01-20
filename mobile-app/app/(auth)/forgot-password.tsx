import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    useColorScheme,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/Colors';
import { resetPassword } from '@/src/services/supabase';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleResetPassword = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email');
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await resetPassword(email);

            if (error) {
                Alert.alert('Error', error.message);
            } else {
                setEmailSent(true);
            }
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    if (emailSent) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.successContent}>
                    <Ionicons name="mail-open-outline" size={80} color={colors.oliveGreen} />
                    <Text style={[styles.successTitle, { color: colors.text }]}>
                        Check Your Email
                    </Text>
                    <Text style={[styles.successText, { color: colors.textSecondary }]}>
                        We've sent password reset instructions to {email}
                    </Text>
                    <Pressable
                        style={[styles.backButton, { backgroundColor: colors.darkBrown }]}
                        onPress={() => router.replace('/(auth)/login')}
                    >
                        <Text style={[styles.backButtonText, { color: colors.cream }]}>
                            BACK TO LOGIN
                        </Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                {/* Back Button */}
                <Pressable style={styles.navBackButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </Pressable>

                <Text style={[styles.title, { color: colors.text }]}>Forgot Password</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Enter your email and we'll send you instructions to reset your password
                </Text>

                {/* Email Input */}
                <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                    <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Email"
                        placeholderTextColor={colors.textSecondary}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                {/* Reset Button */}
                <Pressable
                    style={[styles.resetButton, { backgroundColor: colors.darkBrown }]}
                    onPress={handleResetPassword}
                    disabled={isLoading}
                >
                    <Text style={[styles.resetButtonText, { color: colors.cream }]}>
                        {isLoading ? 'Sending...' : 'SEND RESET LINK'}
                    </Text>
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 24,
        paddingTop: 60,
    },
    navBackButton: {
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 32,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 24,
    },
    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
    },
    resetButton: {
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    resetButtonText: {
        fontSize: 16,
        fontWeight: '700',
    },
    successContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginTop: 24,
        marginBottom: 12,
    },
    successText: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    backButton: {
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 8,
    },
    backButtonText: {
        fontSize: 14,
        fontWeight: '700',
    },
});
