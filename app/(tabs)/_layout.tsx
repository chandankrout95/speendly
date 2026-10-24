import { Tabs } from 'expo-router';
import { CustomTabBar } from '../../src/components/navigation/CustomTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...(props as any)} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home' }}
      />
      <Tabs.Screen
        name="transactions"
        options={{ title: 'Expenses' }}
      />
      <Tabs.Screen
        name="analytics"
        options={{ title: 'Insights' }}
      />
      <Tabs.Screen
        name="budgets"
        options={{ title: 'Budgets' }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings' }}
      />
    </Tabs>
  );
}
