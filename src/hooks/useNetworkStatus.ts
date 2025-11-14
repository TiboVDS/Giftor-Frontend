import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isOnline: boolean;
  isInternetReachable: boolean | null;
  connectionType: string;
}

/**
 * Hook to detect network status changes
 * Uses NetInfo to monitor network connectivity in real-time
 *
 * @returns NetworkStatus object with isOnline, isInternetReachable, and connectionType
 */
export const useNetworkStatus = (): NetworkStatus => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: true, // Optimistic default
    isInternetReachable: null,
    connectionType: 'unknown',
  });

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setNetworkStatus({
        isOnline: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
      });
    });

    // Fetch current network state on mount
    NetInfo.fetch().then((state: NetInfoState) => {
      setNetworkStatus({
        isOnline: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
      });
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  return networkStatus;
};
