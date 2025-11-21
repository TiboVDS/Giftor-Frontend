import React, { useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

interface DatePickerProps {
  label: string;
  value?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  error?: string;
  testID?: string;
}

/**
 * DatePicker component
 * Native date picker for iOS (wheel) and Android (calendar)
 */
export default function DatePicker({
  label,
  value,
  onChange,
  placeholder = 'Not set',
  error,
  testID,
}: DatePickerProps) {
  const [show, setShow] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    // On Android, always close after selection
    if (Platform.OS === 'android') {
      setShow(false);
    }

    if (event.type === 'set' && selectedDate) {
      onChange(selectedDate);
    } else if (event.type === 'dismissed') {
      setShow(false);
    }
  };

  const handleClear = () => {
    onChange(null);
  };

  const formattedDate = value ? format(value, 'dd MMM yyyy') : null;

  return (
    <View className="mb-4" testID={testID}>
      <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>

      {/* Date Display / Trigger Button */}
      <Pressable
        onPress={() => setShow(true)}
        className="border border-gray-300 rounded-lg px-3 py-3 bg-white"
        accessibilityLabel={`${label}: ${formattedDate || placeholder}`}
        accessibilityRole="button"
      >
        <View className="flex-row justify-between items-center">
          <Text
            className={formattedDate ? 'text-gray-900 text-base' : 'text-gray-400 text-base'}
          >
            {formattedDate || placeholder}
          </Text>
          {value && (
            <Pressable
              onPress={handleClear}
              className="ml-2 px-2 py-1"
              accessibilityLabel="Clear date"
              accessibilityRole="button"
            >
              <Text className="text-red-500 text-sm font-medium">Clear</Text>
            </Pressable>
          )}
        </View>
      </Pressable>

      {/* Error Message */}
      {error && (
        <Text className="text-red-500 text-sm mt-1">{error}</Text>
      )}

      {/* Native Date Picker */}
      {show && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          maximumDate={new Date()} // Can't select future dates for birthdays/anniversaries
        />
      )}

      {/* iOS Done Button (picker stays open until dismissed) */}
      {show && Platform.OS === 'ios' && (
        <View className="bg-white border-t border-gray-200 p-4">
          <Pressable
            onPress={() => setShow(false)}
            className="bg-blue-500 rounded-lg py-3"
            accessibilityLabel="Done selecting date"
            accessibilityRole="button"
          >
            <Text className="text-white text-center font-semibold text-base">
              Done
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
