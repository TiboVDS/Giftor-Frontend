import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DatePicker from '../../../components/ui/DatePicker';
import TagInput from '../../../components/ui/TagInput';
import { useRecipientStore } from '../stores/recipientStore';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import {
  CreateRecipientRequest,
  RecipientDto,
  RELATIONSHIP_OPTIONS,
} from '../types/recipient.types';

interface AddRecipientFormProps {
  onSuccess: (recipient: RecipientDto) => void;
  onCancel: () => void;
}

/**
 * AddRecipientForm component
 * Form for creating a new recipient with validation and API integration
 */
export default function AddRecipientForm({
  onSuccess,
  onCancel,
}: AddRecipientFormProps) {
  // Form state
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Unknown');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [anniversary, setAnniversary] = useState<Date | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Zustand store and network status
  const { createRecipient } = useRecipientStore();
  const { isOnline } = useNetworkStatus();

  /**
   * Client-side validation
   */
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = 'Name is required';
    } else if (trimmedName.length > 200) {
      newErrors.name = 'Name must be under 200 characters';
    }

    // Profile picture URL validation (optional but must be valid if provided)
    if (profilePictureUrl && !isValidUrl(profilePictureUrl)) {
      newErrors.profilePictureUrl = 'Invalid URL format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Check if URL is valid
   */
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Check if form has data (for discard confirmation)
   */
  const hasFormData = (): boolean => {
    return (
      name.trim() !== '' ||
      profilePictureUrl.trim() !== '' ||
      birthday !== null ||
      anniversary !== null ||
      interests.length > 0 ||
      notes.trim() !== ''
    );
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    // Client-side validation
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Prepare request data
      const requestData: CreateRecipientRequest = {
        name: name.trim(),
        relationship: relationship || 'Unknown',
        profilePictureUrl: profilePictureUrl.trim() || undefined,
        birthday: birthday ? birthday.toISOString().split('T')[0] : undefined,
        anniversary: anniversary
          ? anniversary.toISOString().split('T')[0]
          : undefined,
        interests,
        notes: notes.trim() || undefined,
      };

      // Call API via Zustand store (handles offline queue)
      const createdRecipient = await createRecipient(requestData, isOnline);

      // Success callback (parent component should handle success UI feedback)
      onSuccess(createdRecipient);
    } catch (error: any) {
      console.error('Failed to create recipient:', error);

      // Handle backend validation errors
      if (
        error.response?.status === 400 &&
        error.response?.data?.error?.details
      ) {
        const backendErrors = error.response.data.error.details;
        const mappedErrors: Record<string, string> = {};

        // Map backend errors to form fields
        Object.keys(backendErrors).forEach((field) => {
          mappedErrors[field] = backendErrors[field][0]; // Take first error message
        });

        setErrors(mappedErrors);
      } else {
        // Network or other error - show generic error in form
        setErrors({
          name: 'Could not save. Check your connection and try again.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle cancel with confirmation if form has data
   */
  const handleCancel = () => {
    if (hasFormData()) {
      Alert.alert(
        'Discard changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onCancel },
        ]
      );
    } else {
      onCancel();
    }
  };

  return (
    <ScrollView className="flex-1 bg-white px-6 py-6">
      {/* Profile Picture (Optional - URL input for MVP) */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">
          Profile Picture (optional)
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-3 py-2 text-base"
          value={profilePictureUrl}
          onChangeText={setProfilePictureUrl}
          placeholder="Enter image URL"
          keyboardType="url"
          autoCapitalize="none"
          accessibilityLabel="Profile picture URL"
        />
        {errors.profilePictureUrl && (
          <Text className="text-red-500 text-sm mt-1">
            {errors.profilePictureUrl}
          </Text>
        )}
      </View>

      {/* Name (Required) */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">
          Name <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-3 py-2 text-base"
          value={name}
          onChangeText={setName}
          placeholder="e.g., Emma Johnson"
          autoFocus
          maxLength={200}
          accessibilityLabel="Recipient name"
        />
        {errors.name && (
          <Text className="text-red-500 text-sm mt-1">{errors.name}</Text>
        )}
      </View>

      {/* Relationship (Optional - defaults to Unknown) */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">
          Relationship
        </Text>
        <View className="border border-gray-300 rounded-lg bg-white">
          <Picker
            selectedValue={relationship}
            onValueChange={setRelationship}
            accessibilityLabel="Relationship"
          >
            {RELATIONSHIP_OPTIONS.map((option) => (
              <Picker.Item
                key={option.value}
                label={option.label}
                value={option.value}
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* Birthday (Optional) */}
      <DatePicker
        label="Birthday (optional)"
        value={birthday}
        onChange={setBirthday}
        placeholder="Not set"
        testID="birthday-picker"
      />

      {/* Anniversary (Optional) */}
      <DatePicker
        label="Anniversary (optional)"
        value={anniversary}
        onChange={setAnniversary}
        placeholder="Not set"
        testID="anniversary-picker"
      />

      {/* Interests (Optional) */}
      <TagInput
        label="Interests & Hobbies (optional)"
        value={interests}
        onChange={setInterests}
        placeholder="Type and press Enter to add..."
        testID="interests-input"
      />

      {/* Notes (Optional) */}
      <View className="mb-6">
        <Text className="text-sm font-medium text-gray-700 mb-1">
          Notes (optional)
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-3 py-2 text-base"
          value={notes}
          onChangeText={setNotes}
          placeholder="Any additional details..."
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          accessibilityLabel="Notes"
        />
      </View>

      {/* Action Buttons */}
      <View className="mb-8">
        {/* Save Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={!name.trim() || isSubmitting}
          className={`rounded-lg py-3 mb-3 ${
            !name.trim() || isSubmitting
              ? 'bg-gray-300'
              : 'bg-blue-500'
          }`}
          accessibilityLabel="Save recipient"
          accessibilityRole="button"
          accessibilityState={{ disabled: !name.trim() || isSubmitting }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold text-base">
              Save
            </Text>
          )}
        </Pressable>

        {/* Cancel Button */}
        <Pressable
          onPress={handleCancel}
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
