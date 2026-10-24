import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { CommunityData } from './types';

export function getApiUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  const hostname = Platform.OS === 'web' && typeof window !== 'undefined'
    ? window.location.hostname
    : Constants.expoConfig?.hostUri?.split(':')[0] || 'localhost';
  return `http://${hostname}:8090/api`;
}
export async function getCommunityData(signal?: AbortSignal): Promise<CommunityData> {
  const response = await fetch(`${getApiUrl()}/community`, { signal });
  if (!response.ok) throw new Error('The directory could not be loaded. Please try again.');
  return response.json();
}
