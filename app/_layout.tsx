import '../global.css';
import { useEffect, useRef } from 'react';
import { AppState, DeviceEventEmitter, type AppStateStatus } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from '../src/store';
import { dataChanged } from '../src/store/slices/appSlice';

export default function RootLayout() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Listen for live SMS/Notification transaction detection events from native Kotlin
    const nativeSub = DeviceEventEmitter.addListener(
      'spendly_new_transaction',
      (event: {
        id: string;
        amount: number;
        merchant?: string;
        isDebit: boolean;
        body: string;
        sender: string;
      }) => {
        console.log('═══════════════════════════════════════════════════════');
        console.log('[Spendly DevTools] 📥 NEW TRANSACTION DETECTED VIA SMS');
        console.log('  Sender   :', event.sender);
        console.log('  Amount   :', `₹${event.amount}`);
        console.log('  Type     :', event.isDebit ? 'EXPENSE' : 'INCOME');
        console.log('  Merchant :', event.merchant || '<none>');
        console.log('  Full Body:', event.body);
        console.log('  Txn ID   :', event.id);
        console.log('═══════════════════════════════════════════════════════');
        store.dispatch(dataChanged());
      },
    );

    // Refresh dashboard data when app comes to foreground
    // (picks up transactions inserted by native SmsReceiver while in background)
    const appStateSub = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          console.log('[Spendly] App came to foreground — refreshing data');
          store.dispatch(dataChanged());
        }
        appState.current = nextAppState;
      },
    );

    return () => {
      nativeSub.remove();
      appStateSub.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" />
          </Stack>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
