import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ReminderIntervalsSelectorProps {
  /** Currently selected intervals (days before occasion) */
  value: number[];
  /** Callback when intervals change */
  onChange: (intervals: number[]) => void;
  /** Error message to display */
  error?: string;
  /** Test ID for testing */
  testID?: string;
}

// Preset reminder interval options
export const PRESET_INTERVALS = [
  { label: '1 month', value: 30 },
  { label: '2 weeks', value: 14 },
  { label: '1 week', value: 7 },
  { label: '3 days', value: 3 },
  { label: '2 days', value: 2 },
  { label: '1 day', value: 1 },
] as const;

// Default reminder intervals
export const DEFAULT_INTERVALS = [14, 7, 2];

/**
 * ReminderIntervalsSelector component for selecting reminder days.
 * Displays preset options as chips with multi-select capability.
 * Includes custom input for non-preset intervals.
 */
export function ReminderIntervalsSelector({
  value,
  onChange,
  error,
  testID,
}: ReminderIntervalsSelectorProps) {
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const isSelected = (interval: number): boolean => {
    return value.includes(interval);
  };

  const toggleInterval = (interval: number) => {
    if (isSelected(interval)) {
      // Remove interval
      onChange(value.filter((v) => v !== interval));
    } else {
      // Add interval and sort descending
      const newIntervals = [...value, interval].sort((a, b) => b - a);
      onChange(newIntervals);
    }
  };

  const handleAddCustom = () => {
    const days = parseInt(customInput.trim(), 10);

    if (isNaN(days) || days <= 0) {
      Alert.alert('Invalid Input', 'Please enter a positive number of days.');
      return;
    }

    if (days > 365) {
      Alert.alert('Invalid Input', 'Reminder cannot be more than 365 days before.');
      return;
    }

    if (value.includes(days)) {
      Alert.alert('Already Added', `${days} days is already selected.`);
      setCustomInput('');
      return;
    }

    const newIntervals = [...value, days].sort((a, b) => b - a);
    onChange(newIntervals);
    setCustomInput('');
    setShowCustomInput(false);
  };

  const removeInterval = (interval: number) => {
    onChange(value.filter((v) => v !== interval));
  };

  // Get label for an interval (preset or custom)
  const getIntervalLabel = (interval: number): string => {
    const preset = PRESET_INTERVALS.find((p) => p.value === interval);
    if (preset) {
      return preset.label;
    }
    return `${interval} day${interval !== 1 ? 's' : ''}`;
  };

  return (
    <View className="mb-4" testID={testID}>
      <Text className="text-sm font-medium text-gray-700 mb-2">
        Reminder Intervals
      </Text>
      <Text className="text-xs text-gray-500 mb-3">
        Get reminded before the occasion
      </Text>

      {/* Preset interval chips */}
      <View className="flex-row flex-wrap gap-2 mb-3">
        {PRESET_INTERVALS.map((preset) => (
          <Pressable
            key={preset.value}
            onPress={() => toggleInterval(preset.value)}
            className={`px-3 py-2 rounded-full border ${
              isSelected(preset.value)
                ? 'bg-blue-500 border-blue-500'
                : 'bg-white border-gray-300'
            }`}
            accessibilityLabel={`${preset.label} reminder`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected(preset.value) }}
          >
            <Text
              className={`text-sm font-medium ${
                isSelected(preset.value) ? 'text-white' : 'text-gray-700'
              }`}
            >
              {preset.label}
            </Text>
          </Pressable>
        ))}

        {/* Add custom button */}
        <Pressable
          onPress={() => setShowCustomInput(!showCustomInput)}
          className="px-3 py-2 rounded-full border border-dashed border-gray-400 flex-row items-center"
          accessibilityLabel="Add custom reminder interval"
          accessibilityRole="button"
        >
          <Ionicons
            name={showCustomInput ? 'close' : 'add'}
            size={16}
            color="#6B7280"
          />
          <Text className="text-sm text-gray-600 ml-1">Custom</Text>
        </Pressable>
      </View>

      {/* Custom input */}
      {showCustomInput && (
        <View className="flex-row items-center mb-3">
          <TextInput
            value={customInput}
            onChangeText={setCustomInput}
            placeholder="Days"
            keyboardType="number-pad"
            maxLength={3}
            className="border border-gray-300 rounded-lg px-3 py-2 text-base w-20 mr-2"
            accessibilityLabel="Custom days input"
          />
          <Text className="text-gray-600 mr-2">days before</Text>
          <Pressable
            onPress={handleAddCustom}
            className="bg-blue-500 px-4 py-2 rounded-lg"
            accessibilityLabel="Add custom interval"
            accessibilityRole="button"
          >
            <Text className="text-white font-medium">Add</Text>
          </Pressable>
        </View>
      )}

      {/* Selected intervals (with remove option for non-preset values) */}
      {value.length > 0 && (
        <View>
          <Text className="text-xs text-gray-500 mb-2">
            Selected reminders:
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {value.map((interval) => (
              <View
                key={interval}
                className="flex-row items-center bg-blue-100 px-3 py-1.5 rounded-full"
              >
                <Text className="text-sm text-blue-700 font-medium">
                  {getIntervalLabel(interval)}
                </Text>
                <Pressable
                  onPress={() => removeInterval(interval)}
                  className="ml-2"
                  accessibilityLabel={`Remove ${getIntervalLabel(interval)} reminder`}
                  accessibilityRole="button"
                >
                  <Ionicons name="close-circle" size={18} color="#1D4ED8" />
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* No intervals warning */}
      {value.length === 0 && (
        <Text className="text-sm text-amber-600">
          No reminders selected. You won't be notified before this occasion.
        </Text>
      )}

      {/* Error message */}
      {error && (
        <Text className="text-red-500 text-sm mt-1">{error}</Text>
      )}
    </View>
  );
}
