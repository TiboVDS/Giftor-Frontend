import React, { ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';

export interface EmptyStateProps {
  /** Title text for empty state */
  title: string;
  /** Descriptive message for empty state */
  message: string;
  /** Optional icon or illustration component */
  icon?: ReactNode;
  /** Optional action button label */
  actionLabel?: string;
  /** Optional action button callback */
  onAction?: () => void;
}

/**
 * Generic empty state component for displaying when no data is available.
 * Centered layout with optional icon, title, message, and action button.
 *
 * @example
 * <EmptyState
 *   title="No recipients yet"
 *   message="Add people you give gifts to"
 *   actionLabel="Add Recipient"
 *   onAction={handleAddRecipient}
 * />
 */
export function EmptyState({ title, message, icon, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-8">
      {/* Optional Icon/Illustration */}
      {icon && <View className="mb-4">{icon}</View>}

      {/* Title */}
      <Text className="text-xl font-semibold text-gray-900 text-center mb-2">
        {title}
      </Text>

      {/* Message */}
      <Text className="text-base text-gray-600 text-center mb-6">
        {message}
      </Text>

      {/* Optional Action Button */}
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          className="bg-blue-500 rounded-lg px-6 py-3"
        >
          <Text className="text-white font-semibold text-base">
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
