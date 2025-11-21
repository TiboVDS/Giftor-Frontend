import { View, Text, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useRecipientStore } from '@/features/recipients/stores/recipientStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export default function PeopleScreen() {
  const router = useRouter();
  const { recipients, fetchRecipients, isLoading } = useRecipientStore();
  const { user } = useAuthStore();
  const { isOnline } = useNetworkStatus();

  // Fetch recipients when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchRecipients(user.id, isOnline);
      }
    }, [user?.id, isOnline])
  );

  const handleAddRecipient = () => {
    router.push('/add-recipient');
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 py-6 border-b border-gray-200">
          <Text className="text-3xl font-bold text-gray-900">Your Recipients</Text>
        </View>

        {/* Recipients List */}
        {recipients.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-gray-600 text-base text-center mb-2">
              No recipients yet
            </Text>
            <Text className="text-gray-500 text-sm text-center">
              Tap the + button to add your first recipient
            </Text>
          </View>
        ) : (
          <FlatList
            data={recipients}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="px-6 py-4 border-b border-gray-100">
                <Text className="text-lg font-semibold text-gray-900">
                  {item.name}
                </Text>
                <Text className="text-sm text-gray-600 mt-1">
                  {item.relationship}
                </Text>
                {item.hobbiesInterests.length > 0 && (
                  <View className="flex-row flex-wrap gap-2 mt-2">
                    {item.hobbiesInterests.slice(0, 3).map((interest, index) => (
                      <View
                        key={index}
                        className="bg-blue-100 rounded-full px-2 py-1"
                      >
                        <Text className="text-xs text-blue-800">{interest}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 80 }}
          />
        )}

        {/* Floating Action Button */}
        <Pressable
          onPress={handleAddRecipient}
          className="absolute bottom-6 right-6 bg-blue-500 rounded-full w-14 h-14 items-center justify-center shadow-lg"
          accessibilityLabel="Add recipient"
          accessibilityRole="button"
        >
          <Text className="text-white text-3xl font-light">+</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
