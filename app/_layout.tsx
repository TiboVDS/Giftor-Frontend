import '../global.css';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import * as sqliteService from '@/services/database/sqliteService';
import * as syncService from '@/services/sync/syncService';
import * as offlineQueue from '@/services/sync/offlineQueue';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { useAuthStore } from '@/features/auth/stores/authStore';

export default function RootLayout() {
  const { isAuthenticated, isLoading, restoreSession, user } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const [hasRestoredSession, setHasRestoredSession] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Restore session and initialize database on app launch
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Restore auth session first
        await restoreSession();
        setHasRestoredSession(true);

        // Initialize SQLite database
        await sqliteService.initDatabase();

        // Check if user is authenticated and online
        const netInfo = await NetInfo.fetch();
        if (user && netInfo.isConnected) {
          // Fetch all data from backend and update local SQLite
          await syncService.fetchAllData(user.id);

          // Process any pending sync actions from previous offline session
          await offlineQueue.processQueue();
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('App initialization error:', error);
        setHasRestoredSession(true);
        setIsInitialized(true); // Still allow app to load even if sync fails
      }
    };

    initializeApp();
  }, []);

  // Listen for network reconnection and process sync queue
  useEffect(() => {
    // Only set up listener after database is initialized
    if (!isInitialized) {
      return;
    }

    const unsubscribe = NetInfo.addEventListener(async (state) => {
      if (state.isConnected && user) {
        try {
          // Process pending sync actions when network reconnects
          await offlineQueue.processQueue();
        } catch (error) {
          console.error('Error processing sync queue on reconnect:', error);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user, isInitialized]);

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

  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}
