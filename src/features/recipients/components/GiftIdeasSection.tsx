import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { EmptyState } from '../../../components/ui/EmptyState';
import { GiftIdeaCard } from '../../gift-ideas/components/GiftIdeaCard';
import { useGiftIdeaStore } from '../../gift-ideas/stores/giftIdeaStore';
import { useAuthStore } from '../../auth/stores/authStore';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';

export interface GiftIdeasSectionProps {
  /** Recipient ID to filter gift ideas */
  recipientId: string;
  /** Callback to trigger when data should be refreshed */
  onRefresh?: () => void;
}

/**
 * GiftIdeasSection component displays gift ideas for a specific recipient.
 * Shows empty state when no ideas, or list of GiftIdeaCards sorted by capture date (newest first).
 *
 * @example
 * <GiftIdeasSection recipientId={recipient.id} />
 */
export function GiftIdeasSection({ recipientId, onRefresh }: GiftIdeasSectionProps) {
  const router = useRouter();
  const { giftIdeas, isLoading, error, fetchGiftIdeas } = useGiftIdeaStore();
  const { user } = useAuthStore();
  const { isOnline } = useNetworkStatus();

  // Filter gift ideas for this recipient and sort by capturedAt (newest first)
  const recipientGiftIdeas = giftIdeas
    .filter(g => g.recipientId === recipientId)
    .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());

  // Fetch gift ideas on mount
  useEffect(() => {
    if (user?.id) {
      fetchGiftIdeas(user.id, isOnline);
    }
  }, [user?.id, isOnline]);

  // Handle "Add" button press
  const handleAddGiftIdea = () => {
    router.push(`/add-idea/${recipientId}`);
  };

  // Handle gift idea card press
  const handleGiftIdeaPress = (giftIdeaId: string) => {
    router.push(`/gift-idea/${giftIdeaId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <View className="mt-6 px-6">
        <SectionHeader
          title="Gift Ideas"
          actionLabel="Add"
          onAction={handleAddGiftIdea}
        />
        <View className="bg-gray-50 rounded-lg p-6 items-center">
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text className="text-gray-500 text-sm mt-2">Loading gift ideas...</Text>
        </View>
      </View>
    );
  }

  // Error state (section-level, doesn't fail whole screen)
  if (error) {
    return (
      <View className="mt-6 px-6">
        <SectionHeader
          title="Gift Ideas"
          actionLabel="Add"
          onAction={handleAddGiftIdea}
        />
        <View className="bg-red-50 rounded-lg p-4 flex-row items-center">
          <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
          <View className="flex-1 ml-3">
            <Text className="text-red-700 text-sm font-medium">
              Couldn't load gift ideas
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
        title="Gift Ideas"
        actionLabel="Add"
        onAction={handleAddGiftIdea}
      />

      {recipientGiftIdeas.length === 0 ? (
        <View className="bg-gray-50 rounded-lg py-8">
          <EmptyState
            title="No gift ideas yet"
            message="Capture inspiration when it strikes!"
            icon={<Ionicons name="gift-outline" size={40} color="#9CA3AF" />}
            actionLabel="Add Gift Idea"
            onAction={handleAddGiftIdea}
          />
        </View>
      ) : (
        <View>
          {recipientGiftIdeas.map(giftIdea => (
            <GiftIdeaCard
              key={giftIdea.id}
              giftIdea={giftIdea}
              onPress={() => handleGiftIdeaPress(giftIdea.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}
