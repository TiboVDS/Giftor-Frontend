import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUpcomingOccasions } from '../../src/features/occasions/hooks/useUpcomingOccasions';
import { UpcomingOccasionCard } from '../../src/features/occasions/components/UpcomingOccasionCard';

const MAX_DISPLAYED_OCCASIONS = 10;

export default function HomeScreen() {
  const router = useRouter();
  const { upcomingOccasions, isLoading, isEmpty } = useUpcomingOccasions();

  const handleOccasionPress = (occasionId: string) => {
    router.push(`/occasion/${occasionId}`);
  };

  const handleNavigateToPeople = () => {
    router.push('/(tabs)/people');
  };

  // Limit displayed occasions
  const displayedOccasions = upcomingOccasions.slice(0, MAX_DISPLAYED_OCCASIONS);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <ScrollView className="flex-1">
        <View className="px-6 py-6">
          {/* Header */}
          <Text className="text-3xl font-bold text-gray-900 mb-6">
            Upcoming Occasions
          </Text>

          {/* Loading State */}
          {isLoading && (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="text-gray-500 mt-4">Loading occasions...</Text>
            </View>
          )}

          {/* Empty State */}
          {!isLoading && isEmpty && (
            <View className="py-12 items-center bg-white rounded-xl border border-gray-100">
              <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-600 text-base mt-4 text-center px-6">
                No upcoming occasions - add birthdays and events to get started
              </Text>
              <Pressable
                onPress={handleNavigateToPeople}
                className="mt-6 px-6 py-3 bg-blue-600 rounded-lg flex-row items-center"
                accessibilityLabel="Go to People tab"
                accessibilityRole="button"
              >
                <Ionicons name="people-outline" size={20} color="#FFFFFF" />
                <Text className="text-white font-semibold ml-2">View People</Text>
              </Pressable>
            </View>
          )}

          {/* Occasions List */}
          {!isLoading && !isEmpty && (
            <View>
              {displayedOccasions.map((data) => (
                <UpcomingOccasionCard
                  key={data.occasion.id}
                  occasion={data.occasion}
                  recipientName={data.recipientName}
                  giftIdeasCount={data.giftIdeasCount}
                  onPress={() => handleOccasionPress(data.occasion.id)}
                />
              ))}

              {/* Show more indicator if there are more occasions */}
              {upcomingOccasions.length > MAX_DISPLAYED_OCCASIONS && (
                <View className="py-4 items-center">
                  <Text className="text-gray-500 text-sm">
                    +{upcomingOccasions.length - MAX_DISPLAYED_OCCASIONS} more occasions
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
