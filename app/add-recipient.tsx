import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import AddRecipientForm from '@/features/recipients/components/AddRecipientForm';
import type { RecipientDto } from '@/features/recipients/types/recipient.types';

/**
 * Add Recipient Screen
 * Modal screen for creating a new recipient profile
 */
export default function AddRecipientScreen() {
  const router = useRouter();

  const handleSuccess = (recipient: RecipientDto) => {
    console.log('✅ Recipient created successfully:', recipient.name);
    // Navigate back to People tab
    router.back();
  };

  const handleCancel = () => {
    // Navigate back to People tab
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <Stack.Screen
        options={{
          title: 'New Recipient',
          presentation: 'modal',
          headerBackTitle: 'Cancel',
        }}
      />
      <View className="flex-1">
        <AddRecipientForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </View>
    </SafeAreaView>
  );
}
