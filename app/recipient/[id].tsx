import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRecipientStore } from '@/features/recipients/stores/recipientStore';
import { useOccasionStore } from '@/features/occasions/stores/occasionStore';
import { useGiftIdeaStore } from '@/features/gift-ideas/stores/giftIdeaStore';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { Image } from 'expo-image';
import { showConfirmDialog } from '@/components/ui/ConfirmDialog';
import { OccasionsSection } from '@/features/recipients/components/OccasionsSection';
import { GiftIdeasSection } from '@/features/recipients/components/GiftIdeasSection';

export default function RecipientDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get recipient from store
  const { recipients, deleteRecipient, fetchRecipients } = useRecipientStore();
  const { fetchOccasions } = useOccasionStore();
  const { fetchGiftIdeas } = useGiftIdeaStore();
  const { giftIdeas } = useGiftIdeaStore();
  const { isOnline } = useNetworkStatus();
  const { user } = useAuthStore();
  const recipient = recipients.find(r => r.id === id);

  // Get gift idea count for this recipient (for delete message)
  const giftIdeaCount = giftIdeas.filter(g => g.recipientId === id).length;

  // Refresh all data for this screen
  const refreshAllData = useCallback(async () => {
    if (user?.id) {
      await Promise.all([
        fetchRecipients(user.id, isOnline),
        fetchOccasions(user.id, isOnline),
        fetchGiftIdeas(user.id, isOnline),
      ]);
    }
  }, [user?.id, isOnline, fetchRecipients, fetchOccasions, fetchGiftIdeas]);

  // Refresh recipient data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadRecipient = async () => {
        if (user?.id) {
          setIsLoading(true);
          setError(null);
          await refreshAllData();
          setIsLoading(false);
        }
      };
      loadRecipient();
    }, [user?.id, refreshAllData])
  );

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshAllData();
    setIsRefreshing(false);
  }, [refreshAllData]);

  useEffect(() => {
    // Check if recipient exists after loading completes
    if (!isLoading && !recipient) {
      setError('Recipient not found');
    } else if (recipient) {
      console.log('📸 Recipient loaded:', {
        id: recipient.id,
        name: recipient.name,
        profilePictureUrl: recipient.profilePictureUrl,
        hasUrl: !!recipient.profilePictureUrl
      });
      setError(null);
    }
  }, [recipient, id, isLoading]);

  // Navigate back
  const handleBack = () => {
    router.back();
  };

  // Handle edit button press
  const handleEdit = () => {
    router.push(`/edit-recipient/${id}`);
  };

  // Handle delete button press
  const handleDelete = () => {
    if (!recipient || !id) return;

    // Build confirmation message based on gift idea count
    let message: string;
    if (giftIdeaCount === 0) {
      message = `This will permanently delete ${recipient.name}.`;
    } else if (giftIdeaCount > 10) {
      message = `This will delete ${giftIdeaCount} gift ideas. Are you sure?`;
    } else {
      message = `This will permanently delete ${recipient.name} and all ${giftIdeaCount} gift ideas for them. This cannot be undone.`;
    }

    // Show confirmation dialog
    showConfirmDialog({
      title: `Delete ${recipient.name}?`,
      message,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true,
      onConfirm: async () => {
        setIsDeleting(true);

        // Navigate back immediately to avoid "Recipient not found" flash
        router.back();

        try {
          // Delete recipient (optimistic UI with rollback)
          await deleteRecipient(id, isOnline);

          // Show success toast
          Alert.alert('Success', `✓ ${recipient.name} deleted`);
        } catch (error: any) {
          console.error('Failed to delete recipient:', error);

          // Show error (user is already on People list)
          Alert.alert(
            'Error',
            `Couldn't delete ${recipient.name}. Try again?`
          );
        } finally {
          setIsDeleting(false);
        }
      },
    });
  };

  // Get initials for placeholder avatar
  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Get consistent avatar color based on name
  const getAvatarColor = (name: string): string => {
    const colors = [
      '#3B82F6', // blue-500
      '#10B981', // green-500
      '#F59E0B', // amber-500
      '#EF4444', // red-500
      '#8B5CF6', // violet-500
      '#EC4899', // pink-500
      '#06B6D4', // cyan-500
      '#F97316', // orange-500
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Format date for display
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Not set';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-600 mt-4">Loading recipient...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state (recipient not found)
  if (error || !recipient) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
        {/* Header */}
        <View className="px-4 py-3 border-b border-gray-200 flex-row items-center">
          <Pressable onPress={handleBack} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text className="text-lg font-semibold text-gray-900">Recipient</Text>
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

  const avatarColor = getAvatarColor(recipient.name);
  const initials = getInitials(recipient.name);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      {/* Header with Back and Edit buttons */}
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <Pressable onPress={handleBack} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text className="text-lg font-semibold text-gray-900">
            {recipient.name}
          </Text>
        </View>

        <Pressable
          onPress={handleEdit}
          className="p-2"
          accessibilityLabel={`Edit ${recipient.name}`}
          accessibilityRole="button"
        >
          <Ionicons name="create-outline" size={24} color="#3B82F6" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
      >
        {/* Profile Section */}
        <View className="items-center py-6 px-6 border-b border-gray-100">
          {/* Profile Picture */}
          {recipient.profilePictureUrl ? (
            <Image
              source={{ uri: recipient.profilePictureUrl }}
              className="w-30 h-30 rounded-full"
              style={{ width: 120, height: 120, borderRadius: 60 }}
              contentFit="cover"
              onError={(error) => {
                console.error('Image load error:', error);
                console.log('Failed URL:', recipient.profilePictureUrl);
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', recipient.profilePictureUrl);
              }}
            />
          ) : (
            <View
              className="w-30 h-30 rounded-full items-center justify-center"
              style={{
                width: 120,
                height: 120,
                backgroundColor: avatarColor,
              }}
            >
              <Text className="text-white text-4xl font-bold">
                {initials}
              </Text>
            </View>
          )}

          {/* Name */}
          <Text className="text-2xl font-bold text-gray-900 mt-4">
            {recipient.name}
          </Text>

          {/* Relationship Badge */}
          <View className="bg-blue-100 px-3 py-1 rounded-full mt-2">
            <Text className="text-blue-700 font-medium text-sm">
              {recipient.relationship || 'Unknown'}
            </Text>
          </View>
        </View>

        {/* Details Section */}
        <View className="px-6 py-4">
          {/* Birthday */}
          <View className="flex-row items-start py-3 border-b border-gray-100">
            <Ionicons name="cake-outline" size={20} color="#6B7280" className="mr-3" />
            <View className="flex-1 ml-3">
              <Text className="text-sm font-medium text-gray-500 mb-1">
                Birthday
              </Text>
              <Text className="text-base text-gray-900">
                {formatDate(recipient.birthday)}
              </Text>
            </View>
          </View>

          {/* Anniversary */}
          <View className="flex-row items-start py-3 border-b border-gray-100">
            <Ionicons name="heart-outline" size={20} color="#6B7280" className="mr-3" />
            <View className="flex-1 ml-3">
              <Text className="text-sm font-medium text-gray-500 mb-1">
                Anniversary
              </Text>
              <Text className="text-base text-gray-900">
                {formatDate(recipient.anniversary)}
              </Text>
            </View>
          </View>

          {/* Interests */}
          {recipient.hobbiesInterests && recipient.hobbiesInterests.length > 0 && (
            <View className="py-3 border-b border-gray-100">
              <View className="flex-row items-center mb-2">
                <Ionicons name="star-outline" size={20} color="#6B7280" />
                <Text className="text-sm font-medium text-gray-500 ml-3">
                  Interests & Hobbies
                </Text>
              </View>
              <View className="flex-row flex-wrap mt-1">
                {recipient.hobbiesInterests.map((interest, index) => (
                  <View
                    key={index}
                    className="bg-gray-100 px-3 py-1 rounded-full mr-2 mb-2"
                  >
                    <Text className="text-gray-700 text-sm">{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Notes */}
          {recipient.notes && (
            <View className="py-3 border-b border-gray-100">
              <View className="flex-row items-center mb-2">
                <Ionicons name="document-text-outline" size={20} color="#6B7280" />
                <Text className="text-sm font-medium text-gray-500 ml-3">
                  Notes
                </Text>
              </View>
              <Text className="text-base text-gray-700 leading-6">
                {recipient.notes}
              </Text>
            </View>
          )}
        </View>

        {/* Occasions Section */}
        <OccasionsSection recipientId={id!} />

        {/* Gift Ideas Section */}
        <GiftIdeasSection recipientId={id!} />

        {/* Delete Button */}
        <View className="px-6 py-4 mb-8">
          <Pressable
            onPress={handleDelete}
            disabled={isDeleting}
            className={`border rounded-lg py-3 ${
              isDeleting ? 'border-gray-300 bg-gray-50' : 'border-red-500'
            }`}
            accessibilityLabel={`Delete ${recipient.name}`}
            accessibilityRole="button"
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Text className="text-red-500 text-center font-semibold text-base">
                Delete Recipient
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
