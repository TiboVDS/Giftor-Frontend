import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface SectionHeaderProps {
  /** Section title */
  title: string;
  /** Optional action button label (e.g., "Add") */
  actionLabel?: string;
  /** Callback when action button is pressed */
  onAction?: () => void;
}

/**
 * Reusable section header component with title and optional action button.
 * Used for sections like "Occasions" and "Gift Ideas" in detail screens.
 *
 * @example
 * <SectionHeader
 *   title="Occasions"
 *   actionLabel="Add"
 *   onAction={() => navigateToAddOccasion()}
 * />
 */
export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <Text
        className="text-lg font-semibold text-gray-900"
        accessibilityRole="header"
      >
        {title}
      </Text>

      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          className="flex-row items-center px-3 py-1.5 rounded-full bg-blue-50 active:bg-blue-100"
          accessibilityLabel={`${actionLabel} ${title.toLowerCase()}`}
          accessibilityRole="button"
        >
          <Ionicons name="add" size={16} color="#3B82F6" />
          <Text className="text-blue-500 font-medium text-sm ml-1">
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
