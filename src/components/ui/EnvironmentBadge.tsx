import React from 'react';
import { View, Text } from 'react-native';
import { ENV, getEnvironmentDisplayName, getEnvironmentBadgeColor } from '@/constants/config';

interface EnvironmentBadgeProps {
  /**
   * Whether to show the badge (default: only show in dev/staging, hide in production)
   */
  visible?: boolean;
}

/**
 * Environment Badge Component
 * Displays the current environment (DEV/STAGING/PROD) in the UI
 * Useful for testing and debugging to know which backend you're connected to
 */
export const EnvironmentBadge: React.FC<EnvironmentBadgeProps> = ({
  visible = !ENV.isProduction,
}) => {
  if (!visible) {
    return null;
  }

  const displayName = getEnvironmentDisplayName();
  const badgeColor = getEnvironmentBadgeColor();

  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: badgeColor,
      }}
    >
      <Text
        style={{
          color: '#FFFFFF',
          fontSize: 10,
          fontWeight: 'bold',
          letterSpacing: 0.5,
        }}
      >
        {displayName}
      </Text>
    </View>
  );
};
