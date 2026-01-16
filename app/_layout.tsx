import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { Colors } from '@/src/constants/Colors';

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.background },
                }}
            >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen
                    name="cart"
                    options={{
                        presentation: 'modal',
                        headerShown: true,
                        title: 'Your Cart',
                    }}
                />
                <Stack.Screen name="order/[id]" options={{ headerShown: true }} />
                <Stack.Screen name="checkout/payment" options={{ headerShown: true, title: 'Payment' }} />
                <Stack.Screen name="checkout/confirmation" options={{ headerShown: true, title: 'Order Confirmed' }} />
            </Stack>
        </>
    );
}
