import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CommunityShell } from '../community/CommunityApp';
export default function Layout() { return <SafeAreaProvider><CommunityShell><Stack screenOptions={{ headerShown: false, animation: 'fade' }} /></CommunityShell></SafeAreaProvider>; }
