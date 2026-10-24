import { Redirect } from 'expo-router';
import { useAppSelector } from '../src/store/hooks';

// Phase 2 replaces this flag with a persisted app_settings value read from SQLite.
export default function Index() {
  const done = useAppSelector((s) => s.app.onboardingComplete);
  return <Redirect href={done ? '/(tabs)' : '/onboarding'} />;
}
