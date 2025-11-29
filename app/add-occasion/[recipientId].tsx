import React, { useCallback } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { OccasionForm, OccasionFormData } from '../../src/features/occasions/components/OccasionForm';
import { useOccasionStore } from '../../src/features/occasions/stores/occasionStore';
import { useRecipientStore } from '../../src/features/recipients/stores/recipientStore';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import { useAuthStore } from '../../src/features/auth/stores/authStore';

/**
 * AddOccasionScreen - Create a new occasion for a recipient.
 * Implements Story 2.7 AC-1 (Add Occasion navigation) and AC-4 (Creating occasion calls API).
 */
export default function AddOccasionScreen() {
  const router = useRouter();
  const { recipientId } = useLocalSearchParams<{ recipientId: string }>();
  const { createOccasion } = useOccasionStore();
  const { recipients } = useRecipientStore();
  const { isOnline } = useNetworkStatus();
  const { user } = useAuthStore();

  // Find recipient to display name
  const recipient = recipients.find((r) => r.id === recipientId);
  const recipientName = recipient?.name || 'Unknown Recipient';

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleSubmit = useCallback(
    async (data: OccasionFormData) => {
      if (!recipientId || !user?.id) {
        Alert.alert('Error', 'Missing recipient or user information.');
        return;
      }

      try {
        await createOccasion(
          {
            recipientId,
            userId: user.id,
            name: data.name,
            type: data.type,
            date: data.date || undefined,
            reminderIntervals: data.reminderIntervals,
            isRecurring: false, // Will be derived from business logic later
          },
          isOnline
        );

        // Success toast
        Alert.alert('Success', 'Occasion created', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      } catch (error: any) {
        console.error('Failed to create occasion:', error);
        Alert.alert(
          'Error',
          error.message || 'Could not create occasion. Please try again.'
        );
        throw error; // Re-throw so form shows error state
      }
    },
    [recipientId, user, isOnline, createOccasion, router]
  );

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center">
        <Pressable
          onPress={handleBack}
          className="mr-3"
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900">Add Occasion</Text>
      </View>

      {/* Occasion Form */}
      <OccasionForm
        recipientId={recipientId || ''}
        recipientName={recipientName}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        testID="add-occasion-form"
      />
    </SafeAreaView>
  );
}
