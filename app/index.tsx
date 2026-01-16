import { Redirect } from 'expo-router';

export default function Index() {
    // Redirect to home tab on app launch
    return <Redirect href="/(tabs)" />;
}
