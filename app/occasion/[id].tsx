import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

/**
 * Placeholder screen for viewing occasion details.
 * Will be implemented in Story 2.8.
 */
export default function OccasionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center">
        <Pressable onPress={handleBack} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900">Occasion Detail</Text>
      </View>

      {/* Placeholder content */}
      <View className="flex-1 items-center justify-center p-8">
        <Ionicons name="calendar" size={64} color="#9CA3AF" />
        <Text className="text-xl font-semibold text-gray-900 text-center mt-4 mb-2">
          Coming Soon
        </Text>
        <Text className="text-base text-gray-600 text-center mb-6">
          Occasion detail view will be available in Story 2.8
        </Text>
        <Text className="text-sm text-gray-400 text-center mb-6">
          Occasion ID: {id}
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
