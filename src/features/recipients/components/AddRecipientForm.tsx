import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
  ActionSheetIOS,
} from 'react-native';
import { Image } from 'expo-image';
import { Picker } from '@react-native-picker/picker';
import DatePicker from '../../../components/ui/DatePicker';
import TagInput from '../../../components/ui/TagInput';
import { useRecipientStore } from '../stores/recipientStore';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { useAuthStore } from '../../auth/stores/authStore';
import {
  CreateRecipientRequest,
  RecipientDto,
  UpdateRecipientRequest,
  RELATIONSHIP_OPTIONS,
} from '../types/recipient.types';
import { Recipient } from '../../../types/database.types';
import {
  pickImage,
  takePhoto,
  uploadProfilePicture,
  deleteProfilePicture,
} from '../../../services/supabase/storageClient';

interface AddRecipientFormProps {
  mode?: 'create' | 'edit';
  initialData?: Recipient;
  onSuccess: (recipient: RecipientDto) => void;
  onCancel: () => void;
}

/**
 * AddRecipientForm component
 * Form for creating or editing a recipient with validation and API integration
 */
export default function AddRecipientForm({
  mode = 'create',
  initialData,
  onSuccess,
  onCancel,
}: AddRecipientFormProps) {
  // Form state
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Unknown');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [profilePictureLocalUri, setProfilePictureLocalUri] = useState<string | null>(null);
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [anniversary, setAnniversary] = useState<Date | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Zustand stores and network status
  const { createRecipient, updateRecipient } = useRecipientStore();
  const { isOnline } = useNetworkStatus();
  const { user } = useAuthStore();

  // Pre-fill form fields in edit mode
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      console.log('🔄 Pre-filling edit form with initialData:', {
        name: initialData.name,
        profilePictureUrl: initialData.profilePictureUrl,
        hasProfilePicture: !!initialData.profilePictureUrl
      });
      setName(initialData.name || '');
      setRelationship(initialData.relationship || 'Unknown');
      setProfilePictureUrl(initialData.profilePictureUrl || '');
      setBirthday(initialData.birthday ? new Date(initialData.birthday) : null);
      setAnniversary(initialData.anniversary ? new Date(initialData.anniversary) : null);
      setInterests(initialData.hobbiesInterests || []);
      setNotes(initialData.notes || '');
    }
  }, [mode, initialData]);

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
   * Get initials from recipient name for avatar placeholder
   */
  const getInitials = (name: string): string => {
    if (!name || !name.trim()) return '?';
    const nameParts = name.trim().split(' ').filter(Boolean);
    if (nameParts.length === 0) return '?';
    if (nameParts.length === 1) return nameParts[0][0].toUpperCase();
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };

  /**
   * Handle profile picture action sheet selection
   */
  const handleProfilePicturePress = () => {
    const hasExistingPicture = profilePictureUrl || profilePictureLocalUri;

    if (Platform.OS === 'ios') {
      const options = hasExistingPicture
        ? ['Take Photo', 'Choose from Library', 'Remove Photo', 'Cancel']
        : ['Take Photo', 'Choose from Library', 'Cancel'];

      const destructiveButtonIndex = hasExistingPicture ? 2 : undefined;
      const cancelButtonIndex = hasExistingPicture ? 3 : 2;

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex,
          cancelButtonIndex,
        },
        async (buttonIndex) => {
          if (buttonIndex === 0) {
            await handleTakePhoto();
          } else if (buttonIndex === 1) {
            await handlePickImage();
          } else if (buttonIndex === 2 && hasExistingPicture) {
            await handleRemovePhoto();
          }
        }
      );
    } else {
      // Android - use Alert for action sheet
      const buttons = hasExistingPicture
        ? [
            { text: 'Take Photo', onPress: handleTakePhoto },
            { text: 'Choose from Library', onPress: handlePickImage },
            { text: 'Remove Photo', onPress: handleRemovePhoto, style: 'destructive' as const },
            { text: 'Cancel', style: 'cancel' as const },
          ]
        : [
            { text: 'Take Photo', onPress: handleTakePhoto },
            { text: 'Choose from Library', onPress: handlePickImage },
            { text: 'Cancel', style: 'cancel' as const },
          ];

      Alert.alert('Profile Picture', 'Choose an option', buttons);
    }
  };

  /**
   * Handle taking a photo with camera
   */
  const handleTakePhoto = async () => {
    try {
      setIsUploadingImage(true);
      const uri = await takePhoto();
      if (uri) {
        // Show image immediately (local preview)
        setProfilePictureLocalUri(uri);

        // For EDIT mode only: Upload immediately since we have a recipient ID
        if (mode === 'edit' && initialData?.id && user?.id) {
          try {
            const uploadedUrl = await uploadProfilePicture(uri, initialData.id, user.id);

            // Update with uploaded URL
            setProfilePictureUrl(uploadedUrl);
            setProfilePictureLocalUri(null); // Clear local URI, use uploaded URL

            Alert.alert('Success', '✓ Photo uploaded');
          } catch (uploadError) {
            console.error('Immediate upload failed:', uploadError);
            // Keep local URI so user can still see it
          }
        }
        // For CREATE mode: Keep local preview, will upload on save
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Could not take photo. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  /**
   * Handle picking image from library
   */
  const handlePickImage = async () => {
    try {
      setIsUploadingImage(true);
      const uri = await pickImage();
      if (uri) {
        // Show image immediately (local preview)
        setProfilePictureLocalUri(uri);

        // For EDIT mode only: Upload immediately since we have a recipient ID
        if (mode === 'edit' && initialData?.id && user?.id) {
          try {
            const uploadedUrl = await uploadProfilePicture(uri, initialData.id, user.id);

            // Update with uploaded URL
            setProfilePictureUrl(uploadedUrl);
            setProfilePictureLocalUri(null); // Clear local URI, use uploaded URL

            Alert.alert('Success', '✓ Photo uploaded');
          } catch (uploadError) {
            console.error('Immediate upload failed:', uploadError);
            // Keep local URI so user can still see it
          }
        }
        // For CREATE mode: Keep local preview, will upload on save
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Could not select image. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  /**
   * Handle removing profile picture
   */
  const handleRemovePhoto = async () => {
    try {
      // If in edit mode and there's an existing profile picture in Supabase, delete it
      if (mode === 'edit' && initialData?.id && initialData?.profilePictureUrl && user?.id) {
        setIsUploadingImage(true);
        await deleteProfilePicture(initialData.id, user.id);
      }

      // Clear local state
      setProfilePictureUrl('');
      setProfilePictureLocalUri(null);
    } catch (error) {
      console.error('Error removing photo:', error);
      Alert.alert('Error', 'Could not remove photo. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  /**
   * Upload image to Supabase Storage if user selected a local image
   * @param recipientId - ID of the recipient to upload for
   * @returns Uploaded image URL or null if no local image
   */
  const uploadImageIfNeeded = async (recipientId: string): Promise<string | null> => {
    if (!profilePictureLocalUri || !user?.id) {
      return null;
    }

    try {
      setIsUploadingImage(true);
      const publicUrl = await uploadProfilePicture(
        profilePictureLocalUri,
        recipientId,
        user.id
      );
      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setIsUploadingImage(false);
    }
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
      if (mode === 'create') {
        // First create recipient to get ID
        const requestData: CreateRecipientRequest = {
          name: name.trim(),
          relationship: relationship || 'Unknown',
          profilePictureUrl: undefined, // Will upload after getting ID
          birthday: birthday ? birthday.toISOString().split('T')[0] : undefined,
          anniversary: anniversary
            ? anniversary.toISOString().split('T')[0]
            : undefined,
          interests,
          notes: notes.trim() || undefined,
        };

        // Call API via Zustand store (handles offline queue)
        const createdRecipient = await createRecipient(requestData, isOnline);

        // Upload profile picture if user selected one
        if (profilePictureLocalUri && createdRecipient.id && user?.id) {
          try {
            const uploadedUrl = await uploadProfilePicture(
              profilePictureLocalUri,
              createdRecipient.id,
              user.id
            );

            // Update recipient with uploaded image URL
            const recipientToUpdate: Recipient = {
              id: createdRecipient.id,
              userId: createdRecipient.userId,
              name: createdRecipient.name,
              relationship: createdRecipient.relationship,
              profilePictureUrl: uploadedUrl,
              birthday: createdRecipient.birthday,
              anniversary: createdRecipient.anniversary,
              hobbiesInterests: createdRecipient.interests,
              notes: createdRecipient.notes,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await updateRecipient(recipientToUpdate, isOnline);
            createdRecipient.profilePictureUrl = uploadedUrl;
          } catch (uploadError) {
            console.error('Profile picture upload failed:', uploadError);
            // Non-critical - recipient was created successfully
          }
        }

        // Success callback (parent component should handle success UI feedback)
        onSuccess(createdRecipient);
      } else {
        // Edit existing recipient
        if (!initialData?.id) {
          throw new Error('Recipient ID is required for update');
        }

        // Use the already uploaded profile picture URL
        const updatedRecipient: Recipient = {
          ...initialData,
          name: name.trim(),
          relationship: relationship || 'Unknown',
          profilePictureUrl: profilePictureUrl || undefined,
          birthday: birthday ? birthday.toISOString().split('T')[0] : undefined,
          anniversary: anniversary
            ? anniversary.toISOString().split('T')[0]
            : undefined,
          hobbiesInterests: interests,
          notes: notes.trim() || undefined,
          updatedAt: new Date().toISOString(),
        };

        // Call API via Zustand store (handles offline queue)
        await updateRecipient(updatedRecipient, isOnline);

        // Convert to DTO for callback
        const recipientDto: RecipientDto = {
          id: updatedRecipient.id,
          userId: updatedRecipient.userId,
          name: updatedRecipient.name,
          relationship: updatedRecipient.relationship,
          profilePictureUrl: updatedRecipient.profilePictureUrl,
          birthday: updatedRecipient.birthday,
          anniversary: updatedRecipient.anniversary,
          interests: updatedRecipient.hobbiesInterests || [],
          notes: updatedRecipient.notes,
        };

        // Success callback
        onSuccess(recipientDto);
      }
    } catch (error: any) {
      console.error(`Failed to ${mode} recipient:`, error);

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
      {/* Profile Picture (Optional - Image Picker) */}
      <View className="mb-6">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Profile Picture (optional)
        </Text>
        <Pressable
          onPress={handleProfilePicturePress}
          disabled={isUploadingImage}
          className="self-center"
          accessibilityLabel="Change profile picture"
          accessibilityHint="Tap to take photo, choose from library, or remove photo"
        >
          <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center overflow-hidden border-2 border-gray-300">
            {(() => {
              console.log('🖼️ Avatar render check:', {
                isUploadingImage,
                profilePictureLocalUri,
                profilePictureUrl: profilePictureUrl ? profilePictureUrl.substring(0, 50) + '...' : null,
                hasLocalUri: !!profilePictureLocalUri,
                hasUrl: !!profilePictureUrl,
                willShowImage: !!(profilePictureLocalUri || profilePictureUrl)
              });

              if (isUploadingImage) {
                return <ActivityIndicator size="large" color="#3b82f6" />;
              } else if (profilePictureLocalUri || profilePictureUrl) {
                const uri = profilePictureLocalUri || profilePictureUrl;
                console.log('📸 Attempting to render Image with URI:', uri);
                return (
                  <Image
                    source={{ uri }}
                    style={{ width: 96, height: 96 }}
                    contentFit="cover"
                    onError={(error) => {
                      console.error('❌ Profile picture load error:', error);
                      console.log('Failed URI:', uri);
                    }}
                    onLoad={() => {
                      console.log('✅ Profile picture loaded:', uri);
                    }}
                  />
                );
              } else {
                return (
                  <Text className="text-3xl font-bold text-gray-500">
                    {getInitials(name)}
                  </Text>
                );
              }
            })()}
          </View>
          <Text className="text-center text-blue-500 text-sm mt-2">
            {profilePictureLocalUri || profilePictureUrl ? 'Change Photo' : 'Add Photo'}
          </Text>
        </Pressable>
        {errors.profilePictureUrl && (
          <Text className="text-red-500 text-sm mt-1 text-center">
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
          disabled={!name.trim() || isSubmitting || isUploadingImage}
          className={`rounded-lg py-3 mb-3 ${
            !name.trim() || isSubmitting || isUploadingImage
              ? 'bg-gray-300'
              : 'bg-blue-500'
          }`}
          accessibilityLabel="Save recipient"
          accessibilityRole="button"
          accessibilityState={{ disabled: !name.trim() || isSubmitting || isUploadingImage }}
        >
          {isSubmitting || isUploadingImage ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold text-base">
              {mode === 'edit' ? 'Update' : 'Save'}
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
