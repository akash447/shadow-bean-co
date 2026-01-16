import { Tabs } from 'expo-router';
import { useColorScheme, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/src/constants/Colors';
import { useCartStore } from '@/src/stores/cartStore';
import { Text } from 'react-native';

function CartIcon() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const itemCount = useCartStore((state) => state.items.length);

    return (
        <Pressable onPress={() => router.push('/cart')} style={{ marginRight: 16 }}>
            <View>
                <Ionicons name="cart-outline" size={24} color={colors.text} />
                {itemCount > 0 && (
                    <View
                        style={{
                            position: 'absolute',
                            right: -6,
                            top: -6,
                            backgroundColor: colors.oliveGreen,
                            borderRadius: 10,
                            width: 18,
                            height: 18,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
                            {itemCount}
                        </Text>
                    </View>
                )}
            </View>
        </Pressable>
    );
}

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#2C2724', // Dark brown for selected
                tabBarInactiveTintColor: 'rgba(44, 39, 36, 0.4)', // Faded for unselected
                tabBarStyle: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Slightly visible background
                    borderTopWidth: 0,
                    position: 'absolute',
                    elevation: 0,
                    height: 80,
                    paddingBottom: 20,
                },
                tabBarLabelStyle: {
                    fontWeight: '700',
                    fontSize: 10,
                },
                headerStyle: {
                    backgroundColor: 'transparent',
                    elevation: 0,
                    shadowOpacity: 0,
                },
                headerTransparent: true,
                headerTintColor: '#2C2724',
                headerRight: () => <CartIcon />,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home-outline" size={size} color={color} />
                    ),
                    headerShown: false, // HIDE default header on Home
                }}
            />
            <Tabs.Screen
                name="shop"
                options={{
                    title: 'Shop',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="cafe-outline" size={size} color={color} />
                    ),
                    headerShown: false, // Hide default header
                }}
            />
            <Tabs.Screen
                name="about"
                options={{
                    title: 'About',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="information-circle-outline" size={size} color={color} />
                    ),
                    headerShown: false, // Hide default header
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color} />
                    ),
                    headerShown: false, // Hide default header
                }}
            />
        </Tabs>
    );
}
