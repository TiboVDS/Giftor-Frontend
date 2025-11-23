import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRecipientStore } from '@/features/recipients/stores/recipientStore';
import AddRecipientForm from '@/features/recipients/components/AddRecipientForm';
import { RecipientDto } from '@/features/recipients/types/recipient.types';

export default function EditRecipientScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Get recipient from store
  const { recipients } = useRecipientStore();
  const recipient = recipients.find(r => r.id === id);

  // Navigate back
  const handleBack = () => {
    router.back();
  };

  // Handle successful update
  const handleSuccess = (updatedRecipient: RecipientDto) => {
    // Show success toast
    Alert.alert('Success', `✓ ${updatedRecipient.name} updated`);

    // Navigate back to recipient detail
    router.back();
  };

  // Handle cancel
  const handleCancel = () => {
    router.back();
  };

  // Recipient not found
  if (!recipient) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
        {/* Header */}
        <View className="px-4 py-3 border-b border-gray-200 flex-row items-center">
          <Pressable onPress={handleBack} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text className="text-lg font-semibold text-gray-900">Edit Recipient</Text>
        </View>

        {/* Error content */}
        <View className="flex-1 items-center justify-center p-8">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="text-xl font-semibold text-gray-900 text-center mt-4 mb-2">
            Recipient not found
          </Text>
          <Text className="text-base text-gray-600 text-center mb-6">
            This recipient may have been deleted or doesn't exist.
          </Text>
          <Pressable
            onPress={handleBack}
            className="bg-blue-500 rounded-lg px-6 py-3"
          >
            <Text className="text-white font-semibold text-base">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center">
        <Pressable onPress={handleBack} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900">Edit Recipient</Text>
      </View>

      {/* Form */}
      <AddRecipientForm
        mode="edit"
        initialData={recipient}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </SafeAreaView>
  );
}
