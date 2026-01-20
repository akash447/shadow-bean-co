import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { signIn, getProfile } from '@/src/services/supabase';
import { useAuthStore } from '@/src/stores/authStore';
import { logLogin, logScreenView } from '@/src/services/analytics';

export default function LoginScreen() {
    const router = useRouter();
    const { setUser, setProfile, setIsAuthenticated } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        logScreenView('Login');
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await signIn(email, password);

            if (error) {
                Alert.alert('Login Failed', error.message);
                setIsLoading(false);
                return;
            }

            if (data.user) {
                setUser(data.user);
                setIsAuthenticated(true);

                const { profile } = await getProfile(data.user.id);
                if (profile) {
                    setProfile(profile);
                }

                await logLogin('email');
                router.replace('/(tabs)');
            }
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = () => {
        Alert.alert(
            'Coming Soon',
            'Google Sign-In will be available soon! Please use email login for now.',
            [{ text: 'Got it' }]
        );
    };

    const handleAppleSignIn = () => {
        Alert.alert(
            'Coming Soon',
            'Apple Sign-In will be available soon! Please use email login for now.',
            [{ text: 'Got it' }]
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </Pressable>

                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to continue</Text>

                <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color="#888" />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#888"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#888" />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#888"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                    />
                    <Pressable onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color="#888"
                        />
                    </Pressable>
                </View>

                <Pressable
                    style={styles.forgotButton}
                    onPress={() => router.push('/(auth)/forgot-password')}
                >
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                </Pressable>

                {/* Sign In Button - HIGH CONTRAST */}
                <Pressable
                    style={styles.loginButton}
                    onPress={handleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#2C2724" />
                    ) : (
                        <Text style={styles.loginButtonText}>SIGN IN</Text>
                    )}
                </Pressable>

                {/* OR Divider */}
                <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                </View>

                {/* Social Sign In Buttons */}
                <Pressable style={styles.socialButton} onPress={handleGoogleSignIn}>
                    <Ionicons name="logo-google" size={20} color="#EA4335" />
                    <Text style={styles.socialButtonText}>Continue with Google</Text>
                </Pressable>

                <Pressable style={styles.socialButton} onPress={handleAppleSignIn}>
                    <Ionicons name="logo-apple" size={20} color="#fff" />
                    <Text style={styles.socialButtonText}>Continue with Apple</Text>
                </Pressable>

                <View style={styles.registerContainer}>
                    <Text style={styles.registerText}>Don't have an account? </Text>
                    <Pressable onPress={() => router.push('/(auth)/register')}>
                        <Text style={styles.registerLink}>Create Account</Text>
                    </Pressable>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2C2724',
    },
    content: {
        flex: 1,
        padding: 24,
        paddingTop: 60,
    },
    backButton: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#aaa',
        marginBottom: 32,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: '#fff',
    },
    forgotButton: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B8E23',
    },
    loginButton: {
        backgroundColor: '#6B8E23', // Olive Green - HIGH CONTRAST
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 24,
    },
    loginButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 1,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#444',
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#888',
        fontSize: 12,
        fontWeight: '600',
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 12,
        paddingVertical: 14,
        marginBottom: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    socialButtonText: {
        marginLeft: 12,
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
    },
    registerText: {
        fontSize: 14,
        color: '#aaa',
    },
    registerLink: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B8E23',
    },
});
