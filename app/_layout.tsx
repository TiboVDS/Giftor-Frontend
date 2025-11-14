import '../global.css';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import * as sqliteService from '@/services/database/sqliteService';
import * as syncService from '@/services/sync/syncService';
import * as offlineQueue from '@/services/sync/offlineQueue';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { useAuthStore } from '@/features/auth/stores/authStore';

export default function RootLayout() {
  const [isInitialized, setIsInitialized] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    // Initialize database and sync on app launch
    const initializeApp = async () => {
      try {
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
        setIsInitialized(true); // Still allow app to load even if sync fails
      }
    };

    initializeApp();
  }, [user]);

  useEffect(() => {
    // Listen for network reconnection and process sync queue
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

  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}
