import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Occasion } from '../../../types/database.types';
import { OccasionTypeDropdown } from './OccasionTypeDropdown';
import { DatePickerToggle } from './DatePickerToggle';
import { ReminderIntervalsSelector, DEFAULT_INTERVALS } from './ReminderIntervalsSelector';

export interface OccasionFormData {
  name: string;
  type: string;
  date: string | null;
  reminderIntervals: number[];
}

export interface OccasionFormProps {
  /** Recipient ID for the occasion */
  recipientId: string;
  /** Recipient name to display (read-only) */
  recipientName?: string;
  /** Existing occasion for edit mode */
  occasion?: Occasion;
  /** Callback when form is submitted */
  onSubmit: (data: OccasionFormData) => Promise<void>;
  /** Callback when cancel is pressed */
  onCancel: () => void;
  /** Test ID for testing */
  testID?: string;
}

/**
 * OccasionForm component for creating or editing occasions.
 * Supports both create and edit modes with validation and error handling.
 */
/**
 * Parse occasion date string to Date object
 */
const parseOccasionDate = (dateString?: string): Date | null => {
  if (!dateString) return null;
  const parsed = new Date(dateString);
  return isNaN(parsed.getTime()) ? null : parsed;
};

export function OccasionForm({
  recipientId,
  recipientName,
  occasion,
  onSubmit,
  onCancel,
  testID,
}: OccasionFormProps) {
  const isEditMode = !!occasion;

  // Initialize form state directly from occasion prop (critical for edit mode)
  // This ensures the DatePickerToggle receives the correct initial date on first render
  const initialDate = parseOccasionDate(occasion?.date);

  // Form state - initialize with occasion values if editing
  const [name, setName] = useState(occasion?.name || '');
  const [type, setType] = useState(occasion?.type || '');
  const [date, setDate] = useState<Date | null>(initialDate);
  const [reminderIntervals, setReminderIntervals] = useState<number[]>(
    occasion?.reminderIntervals || DEFAULT_INTERVALS
  );

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync form state if occasion prop changes (e.g., data refresh from API)
  useEffect(() => {
    if (occasion) {
      const parsed = parseOccasionDate(occasion.date);
      setName(occasion.name || '');
      setType(occasion.type || '');
      setDate(parsed);
      setReminderIntervals(occasion.reminderIntervals || DEFAULT_INTERVALS);
    }
  }, [occasion]);

  /**
   * Validate form fields
   */
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = 'Please enter an occasion name';
    } else if (trimmedName.length > 200) {
      newErrors.name = 'Name must be under 200 characters';
    }

    // Occasion type validation
    if (!type) {
      newErrors.type = 'Please select an occasion type';
    }

    // Reminder intervals validation (must be positive integers if provided)
    if (reminderIntervals.some((interval) => interval <= 0 || !Number.isInteger(interval))) {
      newErrors.reminderIntervals = 'Reminder intervals must be positive whole numbers';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Check if form is valid for submission
   */
  const isFormValid = (): boolean => {
    return name.trim() !== '' && type !== '';
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Format date as YYYY-MM-DD using local date components to avoid timezone shifts
      const dateString = date
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        : null;

      const formData: OccasionFormData = {
        name: name.trim(),
        type,
        date: dateString,
        reminderIntervals,
      };

      await onSubmit(formData);
    } catch (error: any) {
      console.error('Form submission error:', error);

      // Handle backend validation errors
      if (error.response?.status === 400 && error.response?.data?.error?.details) {
        const backendErrors = error.response.data.error.details;
        const mappedErrors: Record<string, string> = {};

        Object.keys(backendErrors).forEach((field) => {
          mappedErrors[field.toLowerCase()] = backendErrors[field][0];
        });

        setErrors(mappedErrors);
      } else {
        // Generic error
        setErrors({
          submit: error.message || 'Could not save. Check your connection and try again.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-white px-6 py-6"
      testID={testID}
      keyboardShouldPersistTaps="handled"
    >
      {/* Recipient (read-only) */}
      {recipientName && (
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Recipient</Text>
          <View className="border border-gray-200 rounded-lg px-3 py-3 bg-gray-50">
            <Text className="text-base text-gray-600">{recipientName}</Text>
          </View>
        </View>
      )}

      {/* Occasion Name (Required) */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">
          Occasion Name <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          className={`border rounded-lg px-3 py-2 text-base ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (errors.name) {
              setErrors((prev) => ({ ...prev, name: '' }));
            }
          }}
          placeholder="e.g., Graduation, Housewarming"
          maxLength={200}
          autoFocus={!isEditMode}
          accessibilityLabel="Occasion name"
          accessibilityHint="Enter the name of the occasion"
        />
        {errors.name && (
          <Text className="text-red-500 text-sm mt-1">{errors.name}</Text>
        )}
      </View>

      {/* Occasion Type Dropdown */}
      <OccasionTypeDropdown
        value={type}
        onChange={(newType) => {
          setType(newType);
          if (errors.type) {
            setErrors((prev) => ({ ...prev, type: '' }));
          }
        }}
        error={errors.type}
        testID="occasion-type-dropdown"
      />

      {/* Date Picker with Toggle */}
      <DatePickerToggle
        date={date}
        onChange={setDate}
        error={errors.date}
        testID="occasion-date-picker"
      />

      {/* Reminder Intervals Selector */}
      <ReminderIntervalsSelector
        value={reminderIntervals}
        onChange={setReminderIntervals}
        error={errors.reminderIntervals}
        testID="reminder-intervals-selector"
      />

      {/* Submit Error */}
      {errors.submit && (
        <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <Text className="text-red-700 text-sm">{errors.submit}</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View className="mb-8">
        {/* Save Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={!isFormValid() || isSubmitting}
          className={`rounded-lg py-3 mb-3 ${
            !isFormValid() || isSubmitting ? 'bg-gray-300' : 'bg-blue-500'
          }`}
          accessibilityLabel={isEditMode ? 'Update occasion' : 'Save occasion'}
          accessibilityRole="button"
          accessibilityState={{ disabled: !isFormValid() || isSubmitting }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold text-base">
              {isEditMode ? 'Update' : 'Save'}
            </Text>
          )}
        </Pressable>

        {/* Cancel Button */}
        <Pressable
          onPress={onCancel}
          disabled={isSubmitting}
          className="rounded-lg py-3 border border-gray-300"
          accessibilityLabel="Cancel"
          accessibilityRole="button"
        >
          <Text className="text-gray-700 text-center font-medium text-base">
            Cancel
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
