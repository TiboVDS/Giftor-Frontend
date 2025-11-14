import '../global.css';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const { isAuthenticated, isLoading, restoreSession } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const [hasRestoredSession, setHasRestoredSession] = useState(false);

  // Restore session on app launch
  useEffect(() => {
    const restore = async () => {
      await restoreSession();
      setHasRestoredSession(true);
    };
    restore();
  }, []);

  // Auth guard - redirect based on authentication status
  useEffect(() => {
    // Don't navigate until:
    // 1. Navigation is ready
    // 2. Session has been restored
    // 3. Auth loading is complete
    if (!navigationState?.key || !hasRestoredSession || isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // User not authenticated and trying to access protected route -> redirect to login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // User authenticated but on auth screen -> redirect to app
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, navigationState?.key, hasRestoredSession, isLoading]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
