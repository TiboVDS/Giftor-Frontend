import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { EmptyState } from '../../../components/ui/EmptyState';
import { OccasionCard } from '../../occasions/components/OccasionCard';
import { useOccasionStore } from '../../occasions/stores/occasionStore';
import { useAuthStore } from '../../auth/stores/authStore';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';

export interface OccasionsSectionProps {
  /** Recipient ID to filter occasions */
  recipientId: string;
  /** Callback to trigger when data should be refreshed */
  onRefresh?: () => void;
}

/**
 * OccasionsSection component displays occasions for a specific recipient.
 * Shows empty state when no occasions, or list of OccasionCards when data is available.
 *
 * @example
 * <OccasionsSection recipientId={recipient.id} />
 */
export function OccasionsSection({ recipientId, onRefresh }: OccasionsSectionProps) {
  const router = useRouter();
  const { occasions, isLoading, error, fetchOccasions } = useOccasionStore();
  const { user } = useAuthStore();
  const { isOnline } = useNetworkStatus();

  // Filter occasions for this recipient
  const recipientOccasions = occasions.filter(o => o.recipientId === recipientId);

  // Fetch occasions on mount
  useEffect(() => {
    if (user?.id) {
      fetchOccasions(user.id, isOnline);
    }
  }, [user?.id, isOnline]);

  // Handle "Add" button press
  const handleAddOccasion = () => {
    router.push(`/add-occasion/${recipientId}`);
  };

  // Handle occasion card press
  const handleOccasionPress = (occasionId: string) => {
    router.push(`/occasion/${occasionId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <View className="mt-6 px-6">
        <SectionHeader
          title="Occasions"
          actionLabel="Add"
          onAction={handleAddOccasion}
        />
        <View className="bg-gray-50 rounded-lg p-6 items-center">
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text className="text-gray-500 text-sm mt-2">Loading occasions...</Text>
        </View>
      </View>
    );
  }

  // Error state (section-level, doesn't fail whole screen)
  if (error) {
    return (
      <View className="mt-6 px-6">
        <SectionHeader
          title="Occasions"
          actionLabel="Add"
          onAction={handleAddOccasion}
        />
        <View className="bg-red-50 rounded-lg p-4 flex-row items-center">
          <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
          <View className="flex-1 ml-3">
            <Text className="text-red-700 text-sm font-medium">
              Couldn't load occasions
            </Text>
            <Text className="text-red-600 text-xs mt-0.5">
              Pull to refresh and try again
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="mt-6 px-6">
      <SectionHeader
        title="Occasions"
        actionLabel="Add"
        onAction={handleAddOccasion}
      />

      {recipientOccasions.length === 0 ? (
        <View className="bg-gray-50 rounded-lg py-8">
          <EmptyState
            title="No occasions yet"
            message="Add birthdays, anniversaries, or custom occasions"
            icon={<Ionicons name="calendar-outline" size={40} color="#9CA3AF" />}
            actionLabel="Add Occasion"
            onAction={handleAddOccasion}
          />
        </View>
      ) : (
        <View>
          {recipientOccasions.map(occasion => (
            <OccasionCard
              key={occasion.id}
              occasion={occasion}
              onPress={() => handleOccasionPress(occasion.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}
