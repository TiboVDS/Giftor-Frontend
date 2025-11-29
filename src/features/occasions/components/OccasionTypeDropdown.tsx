import React from 'react';
import { View, Text, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';

export interface OccasionTypeDropdownProps {
  /** Currently selected occasion type */
  value: string;
  /** Callback when selection changes */
  onChange: (type: string) => void;
  /** Error message to display */
  error?: string;
  /** Test ID for testing */
  testID?: string;
}

// Occasion type values matching backend enum
export const OCCASION_TYPES = [
  'Birthday',
  'Anniversary',
  'Holiday',
  'Graduation',
  'NewJob',
  'Visit',
  'HostGift',
  'JustBecause',
  'Custom',
] as const;

export type OccasionType = (typeof OCCASION_TYPES)[number];

// Map occasion type values to user-friendly labels
export const OCCASION_TYPE_LABELS: Record<string, string> = {
  Birthday: 'Birthday',
  Anniversary: 'Anniversary',
  Holiday: 'Holiday',
  Graduation: 'Graduation',
  NewJob: 'New Job',
  Visit: 'Visit',
  HostGift: 'Host Gift',
  JustBecause: 'Just Because',
  Custom: 'Custom',
};

/**
 * OccasionTypeDropdown component for selecting occasion type.
 * Displays user-friendly labels while storing backend enum values.
 */
export function OccasionTypeDropdown({
  value,
  onChange,
  error,
  testID,
}: OccasionTypeDropdownProps) {
  return (
    <View className="mb-4" testID={testID}>
      <Text className="text-sm font-medium text-gray-700 mb-1">
        Occasion Type <Text className="text-red-500">*</Text>
      </Text>

      <View
        className={`border rounded-lg bg-white ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      >
        <Picker
          selectedValue={value}
          onValueChange={onChange}
          accessibilityLabel="Occasion type"
          accessibilityHint="Select the type of occasion"
          style={Platform.OS === 'android' ? { marginVertical: -8 } : undefined}
        >
          <Picker.Item
            label="Select occasion type..."
            value=""
            color="#9CA3AF"
          />
          {OCCASION_TYPES.map((type) => (
            <Picker.Item
              key={type}
              label={OCCASION_TYPE_LABELS[type]}
              value={type}
            />
          ))}
        </Picker>
      </View>

      {error && (
        <Text className="text-red-500 text-sm mt-1">{error}</Text>
      )}
    </View>
  );
}
