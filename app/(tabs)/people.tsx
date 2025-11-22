import { View, Text, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRecipientStore } from '@/features/recipients/stores/recipientStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { RecipientList } from '@/features/recipients/components/RecipientList';
import { RecipientSearchBar } from '@/features/recipients/components/RecipientSearchBar';
import { RecipientSortMenu } from '@/features/recipients/components/RecipientSortMenu';
import { EmptyState } from '@/components/ui/EmptyState';

export default function PeopleScreen() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Store selectors
  const {
    recipients,
    fetchRecipients,
    isLoading,
    error,
    filteredRecipients,
  } = useRecipientStore();

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

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    if (!user?.id) return;

    setIsRefreshing(true);
    try {
      await fetchRecipients(user.id, isOnline);
    } catch (err) {
      if (!isOnline) {
        Alert.alert(
          'Offline',
          "Could not refresh. You're viewing cached data."
        );
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Navigation to add recipient screen
  const handleAddRecipient = () => {
    router.push('/add-recipient');
  };

  // Navigation to recipient detail (placeholder for Story 2.5)
  const handleRecipientPress = (recipientId: string) => {
    const recipient = recipients.find(r => r.id === recipientId);
    // TODO: Replace with router.push(`/recipient/${recipientId}`) when Story 2.5 is complete
    Alert.alert(
      'Recipient Detail',
      `Opening detail for ${recipient?.name || 'recipient'}.\n\nRecipient detail screen coming in Story 2.5!`
    );
  };

  // Get gift idea count for a recipient (client-side calculation - MVP approach)
  const getGiftIdeaCount = (recipientId: string): number => {
    // TODO: Implement gift idea count from giftIdeaStore when available
    // For now, return 0 as gift ideas feature is in Epic 3
    return 0;
  };

  // Retry handler for error state
  const handleRetry = () => {
    if (user?.id) {
      fetchRecipients(user.id, isOnline);
    }
  };

  // Get filtered recipients
  const displayRecipients = filteredRecipients();

  // Loading state (skeleton cards)
  if (isLoading && recipients.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
        <View className="flex-1">
          {/* Header */}
          <View className="px-6 py-4 bg-white border-b border-gray-200 flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-gray-900">People</Text>
            <RecipientSortMenu />
          </View>

          {/* Search Bar */}
          <View className="px-4 py-3 bg-white border-b border-gray-200">
            <RecipientSearchBar />
          </View>

          {/* Loading Skeleton */}
          <View className="flex-1 items-center justify-center p-8">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-600 mt-4">Loading recipients...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && recipients.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
        <View className="flex-1">
          {/* Header */}
          <View className="px-6 py-4 bg-white border-b border-gray-200 flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-gray-900">People</Text>
            <RecipientSortMenu />
          </View>

          {/* Search Bar */}
          <View className="px-4 py-3 bg-white border-b border-gray-200">
            <RecipientSearchBar />
          </View>

          {/* Error State */}
          <View className="flex-1 items-center justify-center p-8">
            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
            <Text className="text-xl font-semibold text-gray-900 text-center mt-4 mb-2">
              Could not load recipients
            </Text>
            <Text className="text-base text-gray-600 text-center mb-6">
              Check your connection and try again.
            </Text>
            <Pressable
              onPress={handleRetry}
              className="bg-blue-500 rounded-lg px-6 py-3"
            >
              <Text className="text-white font-semibold text-base">Retry</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <View className="flex-1">
        {/* Header with Sort Button */}
        <View className="px-6 py-4 bg-white border-b border-gray-200 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-gray-900">People</Text>
          <RecipientSortMenu />
        </View>

        {/* Search Bar */}
        <View className="px-4 py-3 bg-white border-b border-gray-200">
          <RecipientSearchBar />
        </View>

        {/* Recipient List or Empty State */}
        {recipients.length === 0 ? (
          <EmptyState
            title="No recipients yet"
            message="Add people you give gifts to"
            icon={<Ionicons name="people-outline" size={64} color="#9CA3AF" />}
            actionLabel="Add Recipient"
            onAction={handleAddRecipient}
          />
        ) : displayRecipients.length === 0 ? (
          // No search results
          <View className="flex-1 items-center justify-center p-8">
            <Ionicons name="search-outline" size={64} color="#9CA3AF" />
            <Text className="text-xl font-semibold text-gray-900 text-center mt-4 mb-2">
              No results found
            </Text>
            <Text className="text-base text-gray-600 text-center">
              Try a different search term
            </Text>
          </View>
        ) : (
          <RecipientList
            recipients={displayRecipients}
            onRecipientPress={handleRecipientPress}
            getGiftIdeaCount={getGiftIdeaCount}
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        )}

        {/* Floating Action Button */}
        <Pressable
          onPress={handleAddRecipient}
          className="absolute bottom-6 right-6 bg-blue-500 rounded-full w-14 h-14 items-center justify-center shadow-lg"
          style={{
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          }}
          accessibilityLabel="Add recipient"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={28} color="white" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
