import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, Switch, Modal, Platform } from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

export interface DatePickerToggleProps {
  /** Currently selected date (null if no date set) */
  date: Date | null;
  /** Callback when date changes */
  onChange: (date: Date | null) => void;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Error message to display */
  error?: string;
  /** Test ID for testing */
  testID?: string;
}

/**
 * DatePickerToggle component for selecting an occasion date.
 * Includes a toggle for "No specific date yet" to support unscheduled occasions.
 *
 * This is a CONTROLLED component - it does not maintain internal date state.
 * The parent is responsible for managing the date value.
 */
export function DatePickerToggle({
  date,
  onChange,
  disabled = false,
  error,
  testID,
}: DatePickerToggleProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);

  const hasDate = date !== null;
  const displayDate = tempDate ?? date ?? new Date();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const handleToggleNoDate = (noDate: boolean) => {
    if (noDate) {
      onChange(null);
      setShowPicker(false);
      setTempDate(null);
    } else {
      const newDate = new Date();
      newDate.setHours(12, 0, 0, 0);
      onChange(newDate);
    }
  };

  const handleOpenPicker = () => {
    if (hasDate && !disabled) {
      setTempDate(date);
      setShowPicker(true);
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, newDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'set' && newDate) {
        const normalized = new Date(
          newDate.getFullYear(),
          newDate.getMonth(),
          newDate.getDate(),
          12, 0, 0, 0
        );
        onChange(normalized);
      }
      setTempDate(null);
      return;
    }

    // iOS: update temp date
    if (newDate) {
      const normalized = new Date(
        newDate.getFullYear(),
        newDate.getMonth(),
        newDate.getDate(),
        12, 0, 0, 0
      );
      setTempDate(normalized);
    }
  };

  const handleConfirm = () => {
    if (tempDate) {
      onChange(tempDate);
    }
    setShowPicker(false);
    setTempDate(null);
  };

  const handleCancel = () => {
    setShowPicker(false);
    setTempDate(null);
  };

  const formattedDate = hasDate ? format(displayDate, 'EEEE, MMMM d, yyyy') : null;

  return (
    <View className="mb-4" testID={testID}>
      <Text className="text-sm font-medium text-gray-700 mb-2">Date</Text>

      {/* No date toggle */}
      <View className="flex-row items-center justify-between mb-3 bg-gray-50 rounded-lg px-3 py-2">
        <View className="flex-row items-center">
          <Ionicons name="calendar-clear-outline" size={18} color="#6B7280" />
          <Text className="text-sm text-gray-600 ml-2">No specific date yet</Text>
        </View>
        <Switch
          value={!hasDate}
          onValueChange={handleToggleNoDate}
          disabled={disabled}
          accessibilityLabel="No specific date yet"
          accessibilityHint="Toggle to create an unscheduled occasion"
          trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
          thumbColor="#FFFFFF"
          ios_backgroundColor="#D1D5DB"
        />
      </View>

      {/* Date picker trigger */}
      {hasDate && (
        <Pressable
          onPress={handleOpenPicker}
          disabled={disabled}
          className={`flex-row items-center justify-between border rounded-xl px-4 py-4 bg-white ${
            error ? 'border-red-500' : 'border-gray-200'
          } ${disabled ? 'opacity-50' : ''}`}
          style={({ pressed }) => [
            { opacity: pressed && !disabled ? 0.7 : 1 },
          ]}
          accessibilityLabel={`Date: ${formattedDate || 'Select a date'}`}
          accessibilityRole="button"
          accessibilityHint="Tap to select a date"
        >
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-3">
              <Ionicons name="calendar" size={20} color="#3B82F6" />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-gray-500 mb-0.5">Selected Date</Text>
              <Text className="text-base font-medium text-gray-900">
                {formattedDate || 'Select a date'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Pressable>
      )}

      {/* Error message */}
      {error && (
        <View className="flex-row items-center mt-2">
          <Ionicons name="alert-circle" size={14} color="#EF4444" />
          <Text className="text-red-500 text-sm ml-1">{error}</Text>
        </View>
      )}

      {/* iOS Modal Picker */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={handleCancel}
        >
          <Pressable
            className="flex-1 bg-black/40 justify-end"
            onPress={handleCancel}
          >
            <Pressable
              className="bg-white rounded-t-3xl"
              onPress={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                <Pressable onPress={handleCancel} className="py-1">
                  <Text className="text-gray-500 text-base">Cancel</Text>
                </Pressable>
                <Text className="text-lg font-semibold text-gray-900">Select Date</Text>
                <Pressable onPress={handleConfirm} className="py-1">
                  <Text className="text-blue-500 text-base font-semibold">Done</Text>
                </Pressable>
              </View>

              {/* Picker - inline display requires significant height for calendar grid */}
              <View style={{ alignItems: 'center', paddingBottom: 32 }}>
                <DateTimePicker
                  value={displayDate}
                  mode="date"
                  display="inline"
                  onChange={handleDateChange}
                  minimumDate={today}
                  accentColor="#3B82F6"
                  themeVariant="light"
                />
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Android Picker (shows directly) */}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={displayDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={today}
        />
      )}
    </View>
  );
}
