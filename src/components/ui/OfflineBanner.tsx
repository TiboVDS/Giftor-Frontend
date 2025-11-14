import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

/**
 * Offline banner component
 * Displays at top of screen when network is unavailable
 * Auto-dismisses with smooth animation when network returns
 */
export const OfflineBanner: React.FC = () => {
  const { isOnline } = useNetworkStatus();
  const slideAnim = useRef(new Animated.Value(-60)).current; // Start off-screen

  useEffect(() => {
    if (!isOnline) {
      // Slide in when offline
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Slide out when online
      Animated.timing(slideAnim, {
        toValue: -60,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.bannerText}>
        ⚠️ Offline - changes will sync when connected
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FEF3C7', // Amber-100 (Tailwind equivalent)
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 1000,
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bannerText: {
    color: '#78350F', // Amber-900 (Tailwind equivalent)
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
